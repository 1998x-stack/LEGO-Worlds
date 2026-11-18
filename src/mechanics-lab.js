import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createPart } from './brick-system.js';
import { createAnchorDebugGroup, getPartAnchors } from './connection-anchors.js';
import {
  MECHANISM_PRESETS, createMechanism, createMechanismPreset,
  availableHoles, mountShaft, mountAccessory, mechanismGraph,
  mechanismAngles, exportMechanism, replayMechanism
} from './technic-engine.js';

function release(object) {
  object.traverse(node => {
    node.geometry?.dispose();
    if (node.material) {
      (Array.isArray(node.material) ? node.material : [node.material]).forEach(material => material.dispose());
    }
  });
}

export function mountMechanicsLab(canvas, catalog, onChange = () => {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#edeff2');
  scene.add(new THREE.HemisphereLight(0xffffff, 0x768496, 2.0));
  const key = new THREE.DirectionalLight('#fff8ee', 3.1);
  key.position.set(0.4, 0.8, 0.9);
  scene.add(key);
  const fill = new THREE.DirectionalLight('#c8e4ff', 1.4);
  fill.position.set(-0.5, -0.3, 0.6);
  scene.add(fill);

  const root = new THREE.Group();
  root.scale.setScalar(0.001);
  scene.add(root);
  const grid = new THREE.GridHelper(0.23, 22, '#a9b5c4', '#d4dbe1');
  grid.rotation.x = Math.PI / 2;
  grid.position.z = -0.017;
  scene.add(grid);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.002, 5);
  const home = new THREE.Vector3(0.1, 0.09, 0.2);
  camera.position.copy(home);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, 0.004);
  controls.enableDamping = true;
  controls.dampingFactor = 0.085;
  controls.minDistance = 0.035;
  controls.maxDistance = 0.7;
  controls.update();

  let state = createMechanismPreset(catalog);
  let preset = 'dual-gears';
  let selection = 0;
  let showAnchors = false;
  let playing = false;
  let speedRpm = 15;
  let rotationAngle = 0;
  let explosion = 0;
  let tween = null;
  let status = '双齿轮传动已装配。点击 ▶ Drive，观察反向旋转；点击孔位可添加销钉或轴。';
  let undoStack = [];
  let redoStack = [];
  let disposed = false;
  let frame = 0;
  let lastTime = 0;
  let seq = 1;
  const nodes = new Map();
  let holeMarker = null;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function emit() {
    onChange({
      state, preset, selection,
      parts: state.parts.map(part => ({...part, pos: [...part.pos]})),
      holes: availableHoles(state),
      connections: mechanismGraph(state),
      playing, speedRpm, explosion, status,
      canUndo: undoStack.length > 0, canRedo: redoStack.length > 0
    });
  }

  function purge() {
    while (root.children.length) {
      const child = root.children[0];
      root.remove(child);
      release(child);
    }
    nodes.clear();
    holeMarker = null;
  }

  function refreshHoleMarker() {
    const hole = availableHoles(state)[selection];
    if (!holeMarker || !hole) return;
    holeMarker.position.set(hole.position[0], hole.position[1],
      Number(state.parts[0].size[1]) / 2 + 0.7);
    const material = holeMarker.material;
    material.color.set(hole.occupied ? '#ec7357' : '#28d29d');
  }

  function buildScene() {
    purge();
    for (const spec of state.parts) {
      const obj = createPart(spec);
      obj.userData.instanceId = spec.instanceId;
      const debug = createAnchorDebugGroup(getPartAnchors(spec), {
        markerRadiusMm: 0.75, normalLengthMm: 3
      });
      debug.visible = showAnchors;
      obj.add(debug);
      root.add(obj);
      nodes.set(spec.instanceId, obj);
    }
    holeMarker = new THREE.Mesh(
      new THREE.TorusGeometry(3, 0.45, 8, 32),
      new THREE.MeshBasicMaterial({ color: '#28d29d', depthTest: false })
    );
    holeMarker.renderOrder = 1100;
    root.add(holeMarker);
    refreshHoleMarker();
    updateTransforms();
    emit();
  }

  function updateTransforms() {
    const angles = mechanismAngles(state, rotationAngle);
    for (const spec of state.parts) {
      const object = nodes.get(spec.instanceId);
      if (!object) continue;
      object.position.fromArray(spec.pos);
      const displacement = spec.type === 'beam' ? 0 :
        spec.type === 'pin' || spec.type === 'axle' ? 17 : 37;
      object.position.z += displacement * explosion;
      object.rotation.set(...spec.rotation);
      object.rotation.z += angles[spec.instanceId] || 0;
    }
    refreshHoleMarker();
  }

  function transact(operation, successMessage) {
    try {
      const next = operation();
      undoStack.push(exportMechanism(state));
      if (undoStack.length > 45) undoStack.shift();
      redoStack = [];
      state = next;
      status = successMessage;
      rotationAngle = 0;
      explosion = 0;
      tween = null;
      playing = false;
      buildScene();
      return true;
    } catch (error) {
      status = error.message;
      emit();
      return false;
    }
  }

  function loadPreset(id) {
    return transact(() => createMechanismPreset(catalog, id), '装配完成：' +
      (MECHANISM_PRESETS.find(p => p.id === id)?.zh || id)) && (preset = id, emit(), true);
  }

  function addShaft(componentId, holeIndex = selection) {
    return transact(() => {
      const next = mountShaft(state, catalog, {
        componentId, holeIndex, instanceId: 'tech_' + seq++
      });
      return next;
    }, '已将连接销/轴按锚点安装到机械梁孔。');
  }

  function addAccessory(componentId, shaftInstanceId) {
    return transact(() => mountAccessory(state, catalog, {
      componentId, shaftInstanceId, instanceId: 'tech_' + seq++
    }), '已将零件套入轴线；传动连接关系已刷新。');
  }

  function deleteLast() {
    if (!state.steps.length) {
      status = '没有可拆除的机械零件。';
      emit();
      return false;
    }
    return transact(() => replayMechanism(catalog, {
      schemaVersion: 1, baseBeamId: state.baseBeamId,
      steps: state.steps.slice(0, -1)
    }), '已按装配顺序拆除最后一个零件。');
  }

  function undo() {
    if (!undoStack.length) return;
    redoStack.push(exportMechanism(state));
    state = replayMechanism(catalog, undoStack.pop());
    status = '已撤销上一步机械装配。';
    rotationAngle = 0; playing = false;
    buildScene();
  }

  function redo() {
    if (!redoStack.length) return;
    undoStack.push(exportMechanism(state));
    state = replayMechanism(catalog, redoStack.pop());
    status = '已重做机械装配。';
    rotationAngle = 0; playing = false;
    buildScene();
  }

  function loadJSON(document) {
    return transact(() => replayMechanism(catalog, document), 'JSON 导入成功；装配规则已重新校验。');
  }

  function selectHole(index) {
    const n = Number(index);
    if (!Number.isInteger(n) || n < 0 || n >= availableHoles(state).length) return;
    selection = n;
    refreshHoleMarker();
    status = '已选中梁孔 ' + (n + 1) + '，可安装销钉或轴。';
    emit();
  }

  function animateExplode(to) {
    tween = {
      from: explosion, to: THREE.MathUtils.clamp(Number(to), 0, 1),
      startedAt: performance.now(), duration: 850
    };
    status = to >= 0.5 ? '演示拆解：沿轴线移出销钉、轴与轮组。' : '演示合成：按连接轴线重新装配。';
    emit();
  }

  function setExplode(t) {
    tween = null;
    explosion = THREE.MathUtils.clamp(Number(t) || 0, 0, 1);
    updateTransforms();
    emit();
  }

  function toggleDrive() {
    playing = !playing;
    if (playing && explosion > 0) {
      explosion = 0;
      tween = null;
    }
    status = playing ? '机械传动演示运行中（仅运动学示意，非力学仿真）。' : '传动演示已暂停。';
    emit();
    return playing;
  }

  function setSpeed(rpm) {
    speedRpm = THREE.MathUtils.clamp(Number(rpm) || 0, 0, 120);
    emit();
  }

  function toggleAnchors() {
    showAnchors = !showAnchors;
    for (const object of nodes.values()) {
      const helper = object.children.find(c => c.name === 'connection-anchor-debug');
      if (helper) helper.visible = showAnchors;
    }
    emit();
    return showAnchors;
  }

  function onClick(event) {
    if (disposed || event.button !== 0) return;
    const beam = nodes.get('beam');
    if (!beam) return;
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1,
      -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(beam, true).filter(hit =>
      !hit.object.name.includes('anchor') && hit.object !== holeMarker
    );
    if (!hits.length) return;
    const local = beam.worldToLocal(hits[0].point.clone());
    const holes = availableHoles(state);
    const best = holes.map(hole => ({
      index: hole.holeIndex,
      distance: Math.hypot(local.x - hole.position[0], local.y - hole.position[1])
    })).sort((a,b) => a.distance - b.distance)[0];
    if (best && best.distance <= 6) selectHole(best.index);
  }
  canvas.addEventListener('click', onClick);

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

  function animate(time) {
    if (disposed) return;
    const dt = Math.min(0.05, Math.max(0, (time - lastTime) / 1000 || 0));
    lastTime = time;
    controls.update();
    if (playing) rotationAngle += dt * (speedRpm / 60) * Math.PI * 2;
    if (tween) {
      const t = THREE.MathUtils.clamp((time - tween.startedAt) / tween.duration, 0, 1);
      const smooth = t * t * (3 - 2 * t);
      explosion = tween.from + (tween.to - tween.from) * smooth;
      if (t >= 1) {
        tween = null;
        emit();
      }
    }
    updateTransforms();
    renderer.render(scene,camera);
    frame = requestAnimationFrame(animate);
  }

  function resetCamera() {
    camera.position.copy(home);
    controls.target.set(0,0,0.004);
    controls.update();
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    canvas.removeEventListener('click', onClick);
    observer.disconnect();
    controls.dispose();
    purge();
    grid.geometry.dispose();
    grid.material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }

  buildScene();
  resize();
  frame = requestAnimationFrame(animate);
  return {
    loadPreset, addShaft, addAccessory, deleteLast, undo, redo, loadJSON,
    selectHole, animateExplode, setExplode, toggleDrive, setSpeed,
    toggleAnchors, resetCamera, dispose,
    getDocument: () => exportMechanism(state),
    getParts: () => state.parts.map(p => ({...p, pos: [...p.pos], rotation: [...p.rotation]}))
  };
}
