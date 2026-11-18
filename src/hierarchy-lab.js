import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createPart } from './brick-system.js';
import { createAnchorDebugGroup, getPartAnchors } from './connection-anchors.js';
import {
  HIERARCHY_PRESETS, createHierarchyPreset, validateHierarchy,
  evaluateHierarchy, assemblyFrame, createAssemblySequence,
  exportHierarchyRecipe, importHierarchyRecipe, resolveJointAngles
} from './hierarchy-engine.js';

function disposeGroup(root) {
  root.traverse(child => {
    child.geometry?.dispose();
    if (child.material) {
      (Array.isArray(child.material) ? child.material : [child.material]).forEach(m => m.dispose());
    }
  });
}

export function mountHierarchyLab(canvas, catalog, onChange = () => {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#edf0ed');
  scene.add(new THREE.HemisphereLight('#ffffff', '#8a999b', 2));
  const light = new THREE.DirectionalLight('#fff9ed', 3);
  light.position.set(1, 2, 3);
  scene.add(light);

  const root = new THREE.Group();
  root.scale.setScalar(0.001);
  scene.add(root);
  const grid = new THREE.GridHelper(0.28, 28, '#adb6b9', '#d2d9da');
  grid.position.y = -0.045;
  scene.add(grid);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.002, 5);
  const homeCamera = new THREE.Vector3(0.16, 0.13, 0.22);
  camera.position.copy(homeCamera);
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.007, 0);
  controls.enableDamping = true;
  controls.minDistance = 0.045;
  controls.maxDistance = 0.65;
  controls.update();

  const lookup = new Map(catalog.map(item => [item.id, item]));
  let document = createHierarchyPreset();
  let inputs = {};
  let progress = 1, selected = 'base', isolated = false, anchors = false;
  let motor = false, motorTime = 0, direction = 0;
  let from = 1, to = 1, started = 0, duration = 1;
  let status = '可调整关节角度，观察层级约束传播和逐件装配动画。';
  let disposed = false, frame = 0, last = 0, lastEmit = 0;
  const objects = new Map();

  const drivers = () => {
    const followers = new Set(document.couplings.map(c => c.driven));
    return document.nodes.filter(n => n.joint?.type === 'revolute' && !followers.has(n.id));
  };
  function emit() {
    const solved = resolveJointAngles(document, inputs);
    onChange({
      title: document.zh || document.title, preset: document.id, status,
      nodes: document.nodes.map(node => ({
        id: node.id, parentId: node.parentId, count: node.parts.length,
        angle: solved[node.id] ?? 0, type: node.joint?.type || 'root'
      })),
      drivers: drivers().map(node => ({
        id: node.id, angle: solved[node.id], limits: [...node.joint.limitsDeg]
      })),
      couplings: document.couplings.map(c => ({...c})),
      steps: createAssemblySequence(document, catalog),
      progress, selected, isolated, anchors, motor, playing: direction !== 0
    });
  }
  function draw() {
    const frameState = assemblyFrame(document, catalog, inputs, progress);
    for(const item of frameState.visible) {
      const obj = objects.get(item.instanceId);
      if(!obj) continue;
      obj.visible = item.visible && (!isolated || item.nodeId === selected);
      obj.position.fromArray(item.pos);
      obj.rotation.set(...item.rotation);
      const isSelected = item.nodeId === selected;
      obj.traverse(child => {
        if(child.isMesh && !child.isInstancedMesh && child.material?.emissive) {
          child.material.emissive.set(isSelected ? '#188f8b' : '#000000');
          child.material.emissiveIntensity = isSelected ? 0.15 : 0;
        }
      });
    }
  }
  function rebuild() {
    validateHierarchy(document, catalog);
    for(const obj of objects.values()) { root.remove(obj); disposeGroup(obj); }
    objects.clear();
    for(const node of document.nodes) for(const item of node.parts) {
      const source = lookup.get(item.componentId);
      const obj = createPart({...source, id:item.instanceId, name:item.instanceId,
        pos:[0,0,0], rotation:[0,0,0]});
      obj.userData.nodeId = node.id;
      obj.userData.partId = item.instanceId;
      const debug = createAnchorDebugGroup(getPartAnchors(source),{
        markerRadiusMm:0.75, normalLengthMm:3.5
      });
      debug.visible = anchors;
      obj.add(debug);
      root.add(obj);
      objects.set(item.instanceId,obj);
    }
    draw();
    emit();
  }
  function preset(id) {
    try {
      const next=createHierarchyPreset(id);
      validateHierarchy(next,catalog);
      document=next;inputs={};progress=1;direction=0;motor=false;
      selected=document.nodes[0].id;isolated=false;
      status='已载入层级装配：'+(document.zh||document.title);
      rebuild();return true;
    } catch(error) { status=error.message;emit();return false; }
  }
  function setAngle(id, value) {
    const node=drivers().find(n=>n.id===id);
    if(!node || !Number.isFinite(Number(value))) return false;
    const [minimum,maximum]=node.joint.limitsDeg;
    const next={...inputs,[id]:THREE.MathUtils.clamp(Number(value),minimum,maximum)};
    try {
      resolveJointAngles(document,next);
      inputs=next;motor=false;
      status='关节 '+id+' 已更新，子装配约束同步传播。';
      draw();emit();return true;
    } catch(error) {status=error.message;emit();return false;}
  }
  function selectNode(id) {
    if(!document.nodes.some(n=>n.id===id)) return;
    selected=id;draw();status='选中子总成：'+id;emit();
  }
  function toggleIsolate() {isolated=!isolated;draw();emit();return isolated;}
  function toggleAnchors() {
    anchors=!anchors;
    for(const obj of objects.values()) {
      const debug=obj.children.find(n=>n.name==='connection-anchor-debug');
      if(debug) debug.visible=anchors;
    }
    emit();return anchors;
  }
  function setProgress(t) {
    progress=THREE.MathUtils.clamp(Number(t)||0,0,1);
    direction=0;motor=false;draw();emit();
  }
  function play(target) {
    const dest=THREE.MathUtils.clamp(Number(target),0,1);
    motor=false;
    if(Math.abs(dest-progress)<1e-6) progress=dest===1?0:1;
    from=progress;to=dest;started=performance.now();
    duration=Math.max(.5,Math.abs(dest-from)*document.nodes.reduce((n,node)=>n+node.parts.length*.44,0));
    direction=to>=from?1:-1;
    status=direction>0?'逐零件重新装配中…':'按依赖逆序拆解中…';
    emit();
  }
  function toggleMotor() {
    motor=!motor;direction=0;progress=1;motorTime=0;
    status=motor?'联动关节运动学演示运行中':'联动关节演示暂停';
    emit();return motor;
  }
  function resetJoints() {inputs={};motor=false;draw();emit();}
  function importRecipe(input) {
    try {
      const result=importHierarchyRecipe(typeof input==='string'?JSON.parse(input):input,catalog);
      document=result.document;inputs=result.inputs;progress=1;motor=false;direction=0;
      selected=document.nodes[0].id;isolated=false;
      status='装配导入成功；关节联动和部件数据已重新验证。';
      rebuild();return true;
    } catch(error) {status='导入失败：'+error.message;emit();return false;}
  }
  const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2();
  function onClick(event) {
    if(event.button!==0) return;
    const box=canvas.getBoundingClientRect();
    pointer.set((event.clientX-box.left)/box.width*2-1,
      -((event.clientY-box.top)/box.height*2-1));
    raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObjects([...objects.values()].filter(o=>o.visible),true);
    const hit=hits.find(h=>!h.object.isInstancedMesh && !h.object.name.includes('anchor'));
    if(!hit) return;
    let obj=hit.object;
    while(obj&&!obj.userData.partId) obj=obj.parent;
    if(obj?.userData.nodeId) selectNode(obj.userData.nodeId);
  }
  canvas.addEventListener('click',onClick);
  function resize() {
    if(disposed) return;
    const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  const observer=new ResizeObserver(resize);
  observer.observe(canvas);
  function animate(now=0) {
    if(disposed) return;
    const dt=last?Math.min(.05,Math.max(0,(now-last)/1000)):0;
    last=now;controls.update();
    let changed=false;
    if(direction) {
      const t=THREE.MathUtils.clamp((now-started)/(duration*1000),0,1);
      progress=from+(to-from)*t;changed=true;
      if(t>=1) {progress=to;direction=0;status=to===1?'装配完成':'逆序拆解完成';emit();}
    }
    if(motor) {
      motorTime+=dt;
      const node=drivers()[0];
      if(node) {
        const [minimum,maximum]=node.joint.limitsDeg;
        const midpoint=(minimum+maximum)/2;
        const amplitude=Math.min((maximum-minimum)/2,32);
        const proposed={...inputs,[node.id]:midpoint+amplitude*Math.sin(motorTime*1.25)};
        try {resolveJointAngles(document,proposed);inputs=proposed;changed=true;}
        catch {motor=false;status='联动约束超限，运动已停止';emit();}
      }
    }
    if(changed) {draw();if(now-lastEmit>160){lastEmit=now;emit();}}
    renderer.render(scene,camera);frame=requestAnimationFrame(animate);
  }
  rebuild();resize();frame=requestAnimationFrame(animate);
  return {
    preset,setAngle,selectNode,toggleIsolate,toggleAnchors,setProgress,play,
    toggleMotor,resetJoints,importRecipe,
    getDocument:()=>exportHierarchyRecipe(document,inputs),
    getParts:()=>evaluateHierarchy(document,catalog,inputs).parts.map((p,i)=>({
      ...p,id:p.instanceId,step:i+1,pos:[...p.pos],rotation:[...p.rotation]
    })),
    resetCamera(){camera.position.copy(homeCamera);controls.target.set(0,.007,0);controls.update();},
    dispose(){
      if(disposed)return;
      disposed=true;cancelAnimationFrame(frame);observer.disconnect();
      canvas.removeEventListener('click',onClick);controls.dispose();
      for(const obj of objects.values()){root.remove(obj);disposeGroup(obj);}
      objects.clear();grid.geometry.dispose();grid.material.dispose();
      renderer.dispose();renderer.forceContextLoss();
    }
  };
}
