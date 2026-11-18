import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createPart } from './brick-system.js';
import {
  BUILDER_MAX_PARTS, isBuilderComponent, findSnapCandidate, collectConnections,
  serializeBuild, parseBuild
} from './snap-engine.js';

function disposeGeometry(object) {
  object.traverse(node => {
    node.geometry?.dispose();
    const materials = node.material ? (Array.isArray(node.material) ? node.material : [node.material]) : [];
    materials.forEach(material => material.dispose());
  });
}

function freshPart(entry, instanceId, pos = [0, 8, 0]) {
  return {
    id: entry.id, componentId: entry.id, instanceId,
    name: entry.name, type: entry.type, color: entry.color,
    size: [...entry.size], pos: [...pos], rotation: [0, 0, 0]
  };
}

const copyParts = parts => parts.map(part => ({
  ...part, pos: [...part.pos], rotation: [...part.rotation], size: [...part.size]
}));

function partHeight(entry) {
  return entry.type === 'brick' ? 9.6 : 3.2;
}

export function mountBuilder(canvas, catalog, onChange = () => {}) {
  const permitted = catalog.filter(isBuilderComponent);
  const lookup = new Map(permitted.map(item => [item.id, item]));
  const initial = lookup.get('plate-2x6');
  if (!initial) throw new Error('Builder foundation component is unavailable');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#f5f2e9');
  scene.add(new THREE.HemisphereLight(0xffffff, 0x88877e, 2.0));
  const light = new THREE.DirectionalLight(0xffffff, 2.6);
  light.position.set(0.2, 0.45, 0.3);
  scene.add(light);
  const grid = new THREE.GridHelper(0.48, 30, 0xb5aba0, 0xd6d0c6);
  grid.position.y = -0.0005;
  scene.add(grid);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.002, 5);
  camera.position.set(0.15, 0.17, 0.23);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.018, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.9;
  controls.minDistance = 0.055;
  controls.maxDistance = 0.75;
  controls.update();

  const model = new THREE.Group();
  model.scale.setScalar(0.001);
  scene.add(model);
  const raycaster = new THREE.Raycaster();
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const pointer = new THREE.Vector2();
  const scratch = new THREE.Vector3();
  const objects = new Map();
  let parts = [freshPart(initial, 'foundation', [0, 1.6, 0])];
  let ghost = null;
  let pending = null;
  let dragging = null;
  let selected = null;
  let candidate = null;
  let status = '选择一个零件，点击「添加」并移动鼠标到模型上开始吸附。';
  let history = [];
  let redoHistory = [];
  let seq = 1;
  let disposed = false;
  let frame = 0;
  let hover = null;
  let layerOffset = 0;

  function announce() {
    onChange({
      parts: copyParts(parts),
      connections: collectConnections(parts),
      selected,
      pending: Boolean(pending),
      status,
      candidate: candidate?.candidate || null,
      canUndo: history.length > 0,
      canRedo: redoHistory.length > 0
    });
  }

  function addObject(spec) {
    const obj = createPart(spec);
    obj.userData.instanceId = spec.instanceId;
    model.add(obj);
    objects.set(spec.instanceId, obj);
    return obj;
  }

  function redraw() {
    for (const obj of objects.values()) {
      model.remove(obj);
      disposeGeometry(obj);
    }
    objects.clear();
    for (const spec of parts) addObject(spec);
    announce();
  }

  function discardGhost() {
    if (!ghost) return;
    model.remove(ghost);
    disposeGeometry(ghost);
    ghost = null;
  }

  function setGhost(spec) {
    discardGhost();
    ghost = createPart(spec);
    ghost.traverse(node => {
      if (!node.isMesh) return;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach(material => {
        material.transparent = true;
        material.opacity = 0.65;
        material.depthWrite = false;
      });
    });
    model.add(ghost);
  }

  function tintGhost(state) {
    if (!ghost) return;
    const tint = state === 'ready' ? '#18a568' : state === 'blocked' ? '#e0524d' : '#e6a735';
    ghost.traverse(node => {
      if (!node.isMesh) return;
      (Array.isArray(node.material) ? node.material : [node.material]).forEach(mat => {
        if (mat.emissive) {
          mat.emissive.set(tint);
          mat.emissiveIntensity = 0.55;
        }
      });
    });
  }

  function checkpoint() {
    history.push(copyParts(parts));
    if (history.length > 50) history.shift();
    redoHistory = [];
  }

  function refreshPreview() {
    if (!pending) return;
    candidate = findSnapCandidate(pending.spec, parts.filter(item => item.instanceId !== pending.spec.instanceId), {
      maxDistanceMm: 13
    });
    if (candidate.status === 'ready') {
      ghost.position.fromArray(candidate.candidate.transform.pos);
      ghost.rotation.set(...candidate.candidate.transform.rotation);
      status = '绿色：接口已匹配，点击或松开鼠标确认连接。';
    } else {
      ghost.position.fromArray(pending.spec.pos);
      ghost.rotation.set(...pending.spec.rotation);
      status = candidate.status === 'blocked'
        ? '红色：该位置与已有积木发生实体碰撞，请换个位置。'
        : '黄色：附近没有满足条件的凸点/底部接口。';
    }
    tintGhost(candidate.status);
    announce();
  }

  function add(componentId) {
    const entry = lookup.get(componentId);
    if (!entry) {
      status = '当前自动吸附仅支持标准砖块、薄板、光滑板和偏移板。';
      announce();
      return false;
    }
    if (parts.length >= BUILDER_MAX_PARTS) {
      status = '已达到 64 个零件的演示上限。';
      announce();
      return false;
    }
    cancel();
    const spec = freshPart(entry, 'piece_' + seq++, [0, 1.6 + (partHeight(entry) + 3.2) / 2, 0]);
    pending = { spec, kind: 'new' };
    layerOffset = 0;
    setGhost(spec);
    refreshPreview();
    return true;
  }

  function cancel() {
    if (dragging?.kind === 'move') {
      const obj = objects.get(dragging.spec.instanceId);
      if (obj) obj.visible = true;
    }
    discardGhost();
    pending = null;
    dragging = null;
    candidate = null;
    hover = null;
    controls.enabled = true;
    announce();
  }

  function moveGhostTo(event) {
    if (!pending || !ghost) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1,
      -((event.clientY - rect.top) / rect.height * 2 - 1));
    raycaster.setFromCamera(pointer, camera);
    const visibleObjects = [...objects.values()].filter(obj =>
      obj.visible && obj.userData.instanceId !== pending.spec.instanceId
    );
    const intersections = raycaster.intersectObjects(visibleObjects, true);
    hover = null;
    if (intersections.length) {
      let parent = intersections[0].object;
      while (parent && !parent.userData.instanceId) parent = parent.parent;
      hover = parts.find(p => p.instanceId === parent?.userData.instanceId) || null;
    }

    if (raycaster.ray.intersectPlane(ground, scratch)) {
      const x = Math.round((scratch.x * 1000) / 8) * 8;
      const z = Math.round((scratch.z * 1000) / 8) * 8;
      const half = partHeight(pending.spec) / 2;
      const baseY = hover ? hover.pos[1] + partHeight(hover) / 2 : 0;
      pending.spec.pos = [x, baseY + half + layerOffset, z];
      refreshPreview();
    }
  }

  function getHit(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1,
      -((event.clientY - rect.top) / rect.height * 2 - 1));
    raycaster.setFromCamera(pointer, camera);
    const intersections = raycaster.intersectObjects([...objects.values()].filter(obj => obj.visible), true);
    for (const hit of intersections) {
      let current = hit.object;
      while (current && !current.userData.instanceId) current = current.parent;
      if (current?.userData.instanceId) return current.userData.instanceId;
    }
    return null;
  }

  function onPointerDown(event) {
    if (event.button !== 0) return;
    if (pending?.kind === 'new') {
      dragging = { kind: 'new', x: event.clientX, y: event.clientY, moved: true };
      controls.enabled = false;
      canvas.setPointerCapture(event.pointerId);
      moveGhostTo(event);
      return;
    }
    const id = getHit(event);
    if (!id) {
      selected = null;
      announce();
      return;
    }
    selected = id;
    if (id === 'foundation') {
      status = '底板是固定基座。请选择其他零件拖动或删除。';
      announce();
      return;
    }
    const spec = parts.find(item => item.instanceId === id);
    if (!spec) return;
    pending = { spec: { ...spec, pos: [...spec.pos], rotation: [...spec.rotation] }, kind: 'move' };
    dragging = { kind: 'move', spec, x: event.clientX, y: event.clientY, moved: false };
    objects.get(id).visible = false;
    setGhost(pending.spec);
    controls.enabled = false;
    canvas.setPointerCapture(event.pointerId);
    moveGhostTo(event);
  }

  function onPointerMove(event) {
    if (dragging) {
      const delta = Math.hypot(event.clientX - dragging.x, event.clientY - dragging.y);
      if (delta > 3) dragging.moved = true;
    }
    if (pending) moveGhostTo(event);
  }

  function onPointerUp(event) {
    if (!dragging) return;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    const wasMoving = dragging.kind === 'move';
    const moved = dragging.moved;
    const spec = pending?.spec;
    const snap = candidate;
    if (snap?.status === 'ready' && (!wasMoving || moved)) {
      checkpoint();
      const committed = { ...spec, pos: [...snap.candidate.transform.pos], rotation: [...snap.candidate.transform.rotation] };
      if (wasMoving) parts = parts.map(item => item.instanceId === committed.instanceId ? committed : item);
      else parts.push(committed);
      selected = committed.instanceId;
      status = '吸附成功：已更新连接关系图。';
      discardGhost();
      pending = null;
      dragging = null;
      candidate = null;
      controls.enabled = true;
      redraw();
      return;
    }
    if (wasMoving) {
      objects.get(spec.instanceId).visible = true;
      pending = null;
      discardGhost();
      status = moved ? '无有效吸附位置，已恢复原来的位置。' : '已选中零件；拖动可调整位置。';
    } else {
      status = '未找到有效连接；调整角度或移动到其他凸点位置。';
    }
    dragging = null;
    controls.enabled = true;
    candidate = null;
    announce();
  }

  function turn() {
    if (!pending) {
      status = '先添加或拖动一个零件，再点击旋转。';
      announce();
      return;
    }
    pending.spec.rotation[1] = (pending.spec.rotation[1] + Math.PI / 2) % (Math.PI * 2);
    refreshPreview();
  }

  function lift(delta) {
    if (!pending) {
      status = '先添加零件，再调整高度。';
      announce();
      return;
    }
    layerOffset = THREE.MathUtils.clamp(layerOffset + delta * 3.2, -19.2, 38.4);
    pending.spec.pos[1] += delta * 3.2;
    refreshPreview();
  }

  function erase() {
    if (!selected || selected === 'foundation') return;
    cancel();
    checkpoint();
    parts = parts.filter(part => part.instanceId !== selected);
    selected = null;
    status = '已删除选中零件并重新计算连接关系。';
    redraw();
  }

  function undo() {
    if (!history.length) return;
    cancel();
    redoHistory.push(copyParts(parts));
    parts = history.pop();
    selected = null;
    status = '已撤销上一步操作。';
    redraw();
  }

  function redo() {
    if (!redoHistory.length) return;
    cancel();
    history.push(copyParts(parts));
    parts = redoHistory.pop();
    selected = null;
    status = '已重做上一步操作。';
    redraw();
  }

  function importJSON(value) {
    const decoded = typeof value === 'string' ? JSON.parse(value) : value;
    const restored = parseBuild(decoded, permitted);
    cancel();
    checkpoint();
    parts = restored;
    selected = null;
    seq = Math.max(seq, restored.length + 2, ...restored.map(part => {
      const match = /^piece_(\d+)$/.exec(part.instanceId);
      return match ? Number(match[1]) + 1 : 1;
    }));
    status = '导入成功，所有连接关系已重新验证并计算。';
    redraw();
  }

  const onCancel = event => {
    if (event.key === 'Escape' && pending) cancel();
  };

  function resize() {
    if (disposed) return;
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  const onDown = event => onPointerDown(event);
  const onMove = event => onPointerMove(event);
  const onUp = event => onPointerUp(event);
  const onLostCapture = () => {
    if (dragging) {
      status = '拖动已取消；未提交任何连接。';
      cancel();
    }
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onLostCapture);
  window.addEventListener('keydown', onCancel);

  function animate() {
    if (disposed) return;
    controls.update();
    renderer.render(scene, camera);
    frame = requestAnimationFrame(animate);
  }

  redraw();
  resize();
  animate();

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    window.removeEventListener('keydown', onCancel);
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('pointercancel', onLostCapture);
    controls.dispose();
    discardGhost();
    for (const object of objects.values()) disposeGeometry(object);
    grid.geometry.dispose();
    grid.material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }

  return {
    add, cancel, turn, lift, erase, undo, redo,
    importJSON,
    getDocument: () => serializeBuild(parts),
    getParts: () => copyParts(parts),
    resetCamera() {
      camera.position.set(0.15, 0.17, 0.23);
      controls.target.set(0, 0.018, 0);
      controls.update();
    },
    dispose
  };
}
