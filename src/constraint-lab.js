import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createPart } from './brick-system.js';
import {
  GRAPH_PRESETS, createConstraintPreset, graphPorts, portById,
  solveConstraintGraph, appendGraphBody, appendGraphJoint, removeGraphJoint,
  exportConstraintGraph, importConstraintGraph
} from './constraint-graph.js';

function disposeTree(root) {
  root.traverse(node => {
    node.geometry?.dispose();
    if (node.material) {
      (Array.isArray(node.material) ? node.material : [node.material])
        .forEach(material => material.dispose());
    }
  });
}
const poseMatrix = pose => new THREE.Matrix4().compose(
  new THREE.Vector3(...pose.pos),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(...pose.rotation, 'XYZ')),
  new THREE.Vector3(1,1,1)
);
const localMatrix = port => new THREE.Matrix4().compose(
  new THREE.Vector3(...port.position),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(...port.rotation,'XYZ')),
  new THREE.Vector3(1,1,1)
);
const COLORS = { fixed:'#69778a',hinge:'#e0a82d',shaft:'#318fbd',slider:'#1b9e76' };

export function mountConstraintLab(canvas,catalog,onChange=()=>{}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#edf2f1');
  scene.add(new THREE.HemisphereLight('#ffffff','#879ca3',2.1));
  const sun = new THREE.DirectionalLight('#fff5e5',2.9);
  sun.position.set(0.5,0.8,0.35);
  scene.add(sun);
  const grid = new THREE.GridHelper(.42,42,'#c3cdcd','#dbe2e0');
  grid.position.y = -0.038;
  scene.add(grid);
  const root = new THREE.Group();
  root.scale.setScalar(.001);
  scene.add(root);
  const jointLayer = new THREE.Group();
  root.add(jointLayer);
  const camera = new THREE.PerspectiveCamera(42,1,.002,6);
  const cameraHome = new THREE.Vector3(.18,.15,.25);
  camera.position.copy(cameraHome);
  const renderer = new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const controls = new OrbitControls(camera,canvas);
  controls.target.set(0,.012,0);
  controls.minDistance = .05;
  controls.maxDistance = 1.4;
  controls.enableDamping = true;
  controls.update();

  const lookup = new Map(catalog.map(c=>[c.id,c]));
  const objects = new Map();
  let graph = createConstraintPreset('four-bar');
  let solution = solveConstraintGraph(graph,catalog);
  let warm = {...solution.values};
  let status = '四连杆闭环已完成求解。拖动驱动角度即可观察约束传播。';
  let selectedBody = 'ground';
  let showJoints = true;
  let motor = false;
  let motorPhase = 0;
  let driveId = 'drive';
  let revision = 1;
  let history = [], redoHistory = [];
  let disposed = false, frame = 0, lastTime = 0, lastEmit = 0, lastSolve = 0;
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();

  function snapshot() {
    return {
      graph,solution,status,selectedBody,showJoints,motor,driveId,revision,
      canUndo:history.length>0,canRedo:redoHistory.length>0
    };
  }
  function emit() { onChange(snapshot()); }
  function updateScene() {
    const collisions = new Set(solution.collisionPairs.flatMap(p=>[p.bodyA,p.bodyB]));
    for(const body of graph.bodies){
      const obj=objects.get(body.id);
      if(!obj) continue;
      const pose=solution.poses[body.id];
      obj.position.fromArray(pose.pos);
      obj.rotation.set(...pose.rotation);
      obj.traverse(node=>{
        if(!node.isMesh || !node.material) return;
        const materials=Array.isArray(node.material)?node.material:[node.material];
        for(const mat of materials) if(mat.emissive){
          mat.emissive.set(collisions.has(body.id)?'#dc514d':
            body.id===selectedBody?'#249d91':'#000000');
          mat.emissiveIntensity = collisions.has(body.id) ? 0.47 :
            body.id === selectedBody ? 0.19 : 0;
        }
      });
    }
    if(jointLayer.visible){
      // Joint gizmos are rebuilt only from their positions, not on every frame.
      for(const marker of jointLayer.children){
        const joint=graph.joints.find(j=>j.id===marker.userData.jointId);
        if(!joint)continue;
        const body=graph.bodies.find(b=>b.id===joint.a.bodyId);
        const port=portById(body,joint.a.portId,catalog);
        const pose=solution.poses[body.id];
        const world=poseMatrix(pose).multiply(localMatrix(port));
        marker.position.setFromMatrixPosition(world);
        marker.quaternion.setFromRotationMatrix(new THREE.Matrix4().extractRotation(world));
      }
    }
  }

  function renderGizmos() {
    while(jointLayer.children.length){
      const obj=jointLayer.children[0];
      jointLayer.remove(obj);
      disposeTree(obj);
    }
    for(const joint of graph.joints){
      const material = new THREE.MeshBasicMaterial({
        color:COLORS[joint.kind],side:THREE.DoubleSide,depthTest:false,
        transparent:true,opacity:.9
      });
      const torus = new THREE.Mesh(new THREE.TorusGeometry(3.45,.55,7,26),material);
      torus.name='graph-joint-gizmo';
      torus.renderOrder=1100;
      torus.userData.jointId=joint.id;
      jointLayer.add(torus);
    }
    jointLayer.visible=showJoints;
  }

  function renderParts() {
    for(const obj of objects.values()){
      root.remove(obj);disposeTree(obj);
    }
    objects.clear();
    for(const body of graph.bodies){
      const component=lookup.get(body.componentId);
      const obj=createPart({
        ...component,id:body.id,name:body.id,
        pos:[0,0,0],rotation:[0,0,0]
      });
      obj.userData.bodyId=body.id;
      root.add(obj);
      objects.set(body.id,obj);
    }
    renderGizmos();
    updateScene();
  }

  function solveAt(values={},maxIterations=55) {
    const merged={...warm,...values};
    const candidate=solveConstraintGraph(graph,catalog,{
      values:merged,maxIterations,closureToleranceMm:.7
    });
    if(candidate.valid){
      solution=candidate;
      warm={...candidate.values};
      updateScene();
    }
    return candidate;
  }

  function resetModel(next,message) {
    graph=next;
    solution=solveConstraintGraph(graph,catalog);
    if(!solution.valid)throw new Error('Graph does not satisfy loop constraints');
    warm={...solution.values};
    selectedBody=graph.bodies[0].id;
    driveId=graph.joints.find(j=>j.controlled)?.id||graph.joints.find(j=>j.kind!=='fixed')?.id||'';
    motor=false;motorPhase=0;revision++;
    status=message;
    renderParts();emit();
  }

  function transaction(work,message) {
    try{
      const next=work();
      const result=solveConstraintGraph(next,catalog,{maxIterations:75});
      if(!result.valid)throw new Error('Constraint loop cannot close: residual '+result.closureErrorMm.toFixed(2)+' mm');
      history.push(structuredClone(graph));
      if(history.length>30)history.shift();
      redoHistory=[];
      resetModel(next,message);
      return true;
    }catch(error){status=error.message;emit();return false;}
  }
  function loadPreset(id) {
    return transaction(()=>createConstraintPreset(id),
      '已载入：'+(GRAPH_PRESETS.find(p=>p.id===id)?.zh||id));
  }
  function loadGraph(proposed) {
    return transaction(() => importConstraintGraph({
      schemaVersion:1,units:'mm',graph:proposed
    },catalog),'已接收 Agent 生成的连接图；所有约束和端口已重新验证。');
  }
  function addBody(componentId) {
    return transaction(()=>appendGraphBody(graph,componentId,catalog),
      '已创建独立零件；选择两个零件的接口以建立新的装配约束。');
  }
  function removeBody(id) {
    if(graph.bodies.length<=1){
      status='必须保留至少一个装配刚体';emit();return false;
    }
    return transaction(()=>{
      const next=structuredClone(graph);
      next.bodies=next.bodies.filter(b=>b.id!==id);
      next.joints=next.joints.filter(j=>j.a.bodyId!==id&&j.b.bodyId!==id);
      return next;
    },'已删除刚体及其关联连接，连接图已重新求解。');
  }
  function addJoint(input) {
    return transaction(()=>appendGraphJoint(graph,input,catalog,{maxIterations:85}),
      '已建立'+input.kind+'连接；装配图与闭环约束已重新计算。');
  }
  function removeJoint(id) {
    return transaction(()=>removeGraphJoint(graph,id,catalog),
      '已删除连接，原有刚体重新归属各自装配分量。');
  }
  function toggleDriven(id) {
    return transaction(()=>{
      const next=structuredClone(graph),joint=next.joints.find(j=>j.id===id);
      if(!joint||joint.kind==='fixed')throw new Error('Only moving joints can be driven');
      joint.controlled=!joint.controlled;
      if(!joint.controlled)joint.value=solution.values[id];
      return next;
    },'已更新关节驱动模式；闭环约束重新验证。');
  }
  function setJointValue(id,value) {
    const joint=graph.joints.find(j=>j.id===id);
    if(!joint || !joint.controlled || joint.kind==='fixed')return false;
    const next=Number(value);
    if(!Number.isFinite(next))return false;
    const old=joint.value;
    joint.value=clamp(next,...joint.limits);
    const candidate=solveAt({[id]:joint.value},60);
    if(!candidate.valid){
      joint.value=old;
      status='运动受闭环约束限制：残差 '+candidate.closureErrorMm.toFixed(2)+' mm';
      emit();return false;
    }
    status=solution.collisionPairs.length
      ? '运动约束满足，但检测到 '+solution.collisionPairs.length+' 组零件碰撞警告。'
      : '约束已求解；闭环位置误差 '+solution.closureErrorMm.toFixed(3)+' mm';
    driveId=id;
    emit();return true;
  }
  function selectBody(id) {
    if(!graph.bodies.some(b=>b.id===id))return;
    selectedBody=id;updateScene();emit();
  }
  function toggleGizmos(){
    showJoints=!showJoints;jointLayer.visible=showJoints;emit();return showJoints;
  }
  function toggleMotor(){
    const joint=graph.joints.find(j=>j.id===driveId&&j.controlled&&j.kind!=='fixed')
      ||graph.joints.find(j=>j.controlled&&j.kind!=='fixed');
    if(!joint){
      status='请先将一个可运动关节设为 Drive，才能播放连续运动。';emit();return false;
    }
    driveId=joint.id;
    motor=!motor;motorPhase=0;
    status=motor?'闭环约束运动演示中（运动学求解，无受力仿真）。':'运动演示已暂停。';
    emit();return motor;
  }
  function undo() {
    if(!history.length)return;
    redoHistory.push(structuredClone(graph));
    try {resetModel(history.pop(),'已撤销约束图编辑。');}
    catch(error){status=error.message;emit();}
  }
  function redo() {
    if(!redoHistory.length)return;
    history.push(structuredClone(graph));
    try {resetModel(redoHistory.pop(),'已重做约束图编辑。');}
    catch(error){status=error.message;emit();}
  }
  function importJSON(raw){
    try{
      const parsed=typeof raw==='string'?JSON.parse(raw):raw;
      const next=importConstraintGraph(parsed,catalog);
      return transaction(()=>next,'装配图导入成功，所有连接与闭环条件已重新验证。');
    }catch(error){status='导入失败：'+error.message;emit();return false;}
  }
  function onClick(event){
    if(event.button!==0)return;
    const box=canvas.getBoundingClientRect();
    pointer.set((event.clientX-box.left)/box.width*2-1,
      -((event.clientY-box.top)/box.height*2-1));
    raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObjects([...objects.values()],true);
    const hit=hits.find(x=>!x.object.isInstancedMesh);
    if(!hit)return;
    let object=hit.object;
    while(object&&!object.userData.bodyId)object=object.parent;
    if(object?.userData.bodyId)selectBody(object.userData.bodyId);
  }
  canvas.addEventListener('click',onClick);
  function resize(){
    if(disposed)return;
    const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  const observer=new ResizeObserver(resize);observer.observe(canvas);
  function animate(time=0){
    if(disposed)return;
    const dt=lastTime?Math.min(.05,Math.max(0,(time-lastTime)/1000)):0;
    lastTime=time;controls.update();
    if(motor&&time-lastSolve>45){
      lastSolve=time;motorPhase+=dt;
      const joint=graph.joints.find(j=>j.id===driveId);
      if(joint){
        const [lo,hi]=joint.limits;
        const center=(lo+hi)/2;
        const amplitude=Math.min((hi-lo)/2,joint.kind==='slider'?22:35);
        const proposed=center+amplitude*Math.sin(motorPhase*1.45);
        const candidate=solveAt({[joint.id]:proposed},32);
        if(candidate.valid){
          joint.value=proposed;
          status=solution.collisionPairs.length
            ? '运动中：'+solution.collisionPairs.length+' 组定向包围盒碰撞警告'
            : '闭环约束运行中 · '+solution.closureErrorMm.toFixed(3)+' mm';
        }else{
          motor=false;
          status='机构到达不可行闭环姿态，已停止驱动。';
        }
        if(time-lastEmit>130){lastEmit=time;emit();}
      }
    }
    renderer.render(scene,camera);
    frame=requestAnimationFrame(animate);
  }
  function resetCamera(){
    camera.position.copy(cameraHome);
    controls.target.set(0,.012,0);
    controls.update();
  }
  renderParts();emit();resize();frame=requestAnimationFrame(animate);
  return {
    loadPreset,loadGraph,addBody,removeBody,addJoint,removeJoint,
    toggleDriven,setJointValue,selectBody,toggleGizmos,toggleMotor,
    undo,redo,importJSON,resetCamera,
    getDocument:()=>exportConstraintGraph(graph,catalog),
    getParts:()=>graph.bodies.map((body,index)=>{
      const c=lookup.get(body.componentId),pose=solution.poses[body.id];
      return {
        ...c,id:body.id,name:body.name||body.id,
        pos:[...pose.pos],rotation:[...pose.rotation],step:index+1
      };
    }),
    dispose(){
      if(disposed)return;
      disposed=true;cancelAnimationFrame(frame);observer.disconnect();
      canvas.removeEventListener('click',onClick);controls.dispose();
      for(const obj of objects.values()){root.remove(obj);disposeTree(obj);}
      objects.clear();
      while(jointLayer.children.length){
        const obj=jointLayer.children[0];jointLayer.remove(obj);disposeTree(obj);
      }
      grid.geometry.dispose();grid.material.dispose();
      renderer.dispose();renderer.forceContextLoss();
    }
  };
}
