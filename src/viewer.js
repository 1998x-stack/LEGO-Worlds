import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { buildAssembly } from './brick-system.js';
import { createAnchorDebugGroup, getPartAnchors } from './connection-anchors.js';

function disposeObject(object) {
  object.traverse(node => {
    node.geometry?.dispose();
    if (node.material) {
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach(material => material.dispose());
    }
  });
}

export function mountViewer(canvas, model, options = {}) {
  const interactive = options.interactive !== false;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(options.background || '#f4f1e8');

  const hemisphere = new THREE.HemisphereLight(0xffffff, 0x8a8173, 2.0);
  scene.add(hemisphere);
  const key = new THREE.DirectionalLight(0xffffff, 2.7);
  key.position.set(3.5, 5.5, 4.5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xc5e4ff, 1.0);
  fill.position.set(-4, 2.5, -3);
  scene.add(fill);

  const assembly = buildAssembly(model);
  const object = assembly.root;
  object.scale.setScalar(0.001);
  scene.add(object);

  const bounds = new THREE.Box3().setFromObject(object);
  const anchorDebugGroups = [];
  assembly.parts.forEach((part, index) => {
    const helper = createAnchorDebugGroup(getPartAnchors(model.parts[index] || {}));
    helper.visible = false;
    part.add(helper);
    anchorDebugGroups.push(helper);
  });
  const center = bounds.getCenter(new THREE.Vector3());
  const dimensions = bounds.getSize(new THREE.Vector3());
  const diameter = Math.max(dimensions.length(), 0.14);

  const grid = new THREE.GridHelper(Math.max(0.28, diameter * 1.9), 28, 0xb7ad9a, 0xd8d1c4);
  grid.position.y = Math.max(-0.001, bounds.min.y - 0.001);
  grid.material.transparent = true;
  grid.material.opacity = 0.42;
  scene.add(grid);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.001, Math.max(10, diameter * 30));
  const homePosition = center.clone().add(new THREE.Vector3(diameter * 1.35, diameter * 1.05, diameter * 1.65));
  camera.position.copy(homePosition);
  camera.lookAt(center);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(options.background || '#f4f1e8', 1);

  let controls = null;
  if (interactive) {
    controls = new OrbitControls(camera, canvas);
    controls.target.copy(center);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.minDistance = diameter * 0.45;
    controls.maxDistance = diameter * 5.5;
    controls.maxPolarAngle = Math.PI * 0.92;
    controls.update();
  }

  let disposed = false;
  let frame = 0;
  let selected = null;

  function render() {
    if (!disposed) renderer.render(scene, camera);
  }

  function setAnchorsVisible(visible) {
    const nextVisible = Boolean(visible);
    for (const helper of anchorDebugGroups) helper.visible = nextVisible;
    render();
    return nextVisible;
  }

  function resize() {
    if (disposed) return;
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  function animate() {
    if (disposed) return;
    controls?.update();
    renderer.render(scene, camera);
    frame = requestAnimationFrame(animate);
  }

  resize();
  if (interactive) animate();

  function setExplode(amount) {
    const t = THREE.MathUtils.clamp(Number(amount) || 0, 0, 1);
    for (const part of assembly.parts) {
      const base = part.userData.basePosition;
      const offset = part.userData.explodeOffset;
      part.position.copy(base).addScaledVector(offset, t);
    }
    render();
  }

  function setStep(step) {
    const visibleStep = Number(step);
    for (const part of assembly.parts) {
      part.visible = !Number.isFinite(visibleStep) || part.userData.step <= visibleStep;
    }
    if (selected && !selected.visible) selectPart(null);
    render();
  }

  function selectPart(id) {
    if (selected) {
      selected.traverse(node => {
        if (node.material && node.userData.originalEmissive) {
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          materials.forEach((mat, index) => {
            const original = node.userData.originalEmissive[index];
            if (original && mat.emissive) mat.emissive.copy(original);
            if (mat.emissiveIntensity !== undefined) mat.emissiveIntensity = 0.05;
          });
        }
      });
    }
    selected = id ? assembly.parts.find(part => part.userData.partId === id) || null : null;
    if (selected) {
      selected.traverse(node => {
        if (!node.material) return;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        node.userData.originalEmissive = materials.map(mat => mat.emissive ? mat.emissive.clone() : new THREE.Color(0x000000));
        materials.forEach(mat => {
          if (mat.emissive) {
            mat.emissive.set('#ffcf00');
            mat.emissiveIntensity = 0.48;
          }
        });
      });
    }
    render();
  }

  function resetView() {
    camera.position.copy(homePosition);
    controls?.target.copy(center);
    controls?.update();
    render();
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    controls?.dispose();
    disposeObject(object);
    grid.geometry.dispose();
    if (Array.isArray(grid.material)) grid.material.forEach(mat => mat.dispose());
    else grid.material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }

  return {
    object,
    parts: assembly.parts,
    setExplode,
    setStep,
    selectPart,
    setAnchorsVisible,
    resetView,
    dispose
  };
}

export async function downloadAssemblyGlb(model) {
  const assembly = buildAssembly(model);
  assembly.root.scale.setScalar(0.001);
  const exporter = new GLTFExporter();
  try {
    const data = await exporter.parseAsync(assembly.root, { binary: true, onlyVisible: true });
    const blob = new Blob([data], { type: 'model/gltf-binary' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = model.slug + '.glb';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 20000);
  } finally {
    disposeObject(assembly.root);
  }
}
