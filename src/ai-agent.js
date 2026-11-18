import {
  CONSTRAINT_GRAPH_VERSION,
  createConstraintPreset,
  graphPorts,
  solveConstraintGraph,
  validateConstraintGraph
} from './constraint-graph.js';

export const AGENT_PLAN_SCHEMA_VERSION = 1;
export const AGENT_GENERATOR = 'deterministic-local-planner';
export const AGENT_MAX_PROMPT_LENGTH = 600;

const numberWords = Object.freeze({ '六':6,'6':6,'四':4,'4':4,'八':8,'8':8,'两':2,'二':2,'2':2 });
const intentIds = Object.freeze(['mars-rover','four-bar','linear-carriage','shaft-drive']);

export const AGENT_EXAMPLES = Object.freeze([
  { prompt:'搭建一辆六轮火星探测车', intent:'mars-rover' },
  { prompt:'设计一个能运动的四连杆闭环机构', intent:'four-bar' },
  { prompt:'制作一个带滑轨的线性移动平台', intent:'linear-carriage' },
  { prompt:'设计轮轴驱动的机械装配', intent:'shaft-drive' }
]);

function safePrompt(raw) {
  if (typeof raw !== 'string' || !raw.trim() || raw.length > AGENT_MAX_PROMPT_LENGTH)
    throw new Error('Prompt must contain 1–600 characters');
  return raw.trim().replace(/\s+/g,' ');
}

export function interpretBuildRequest(raw) {
  const prompt = safePrompt(raw);
  const normalized = prompt.toLowerCase();
  const hasRover = /(火星|探测车|巡视车|rover|mars)/i.test(normalized) &&
    /(车|轮|rover|mars)/i.test(normalized);
  const explicitWheel = normalized.match(/([2468]|[六四八两二])\s*(?:个)?(?:轮|轮子|车轮|wheel)/i) ||
    normalized.match(/(?:six|four|eight|two)\s*(?:-|\s)?wheel/i);
  const explicitCount = explicitWheel ? ({
    six:6,four:4,eight:8,two:2,
    ...numberWords
  }[explicitWheel[1]?.toLowerCase()] ??
    ({six:6,four:4,eight:8,two:2})[explicitWheel[0].split(/\s/)[0]] ?? null) : null;

  if (hasRover) {
    return {
      intent:'mars-rover',domain:'robotics',prompt,
      constraints:{wheelCount:explicitCount ?? 6, environment:'educational-static-mars-rover'},
      mode:'template-grounded'
    };
  }
  if (/四连杆|four.bar|4.bar|linkage/i.test(normalized))
    return {intent:'four-bar',domain:'mechanisms',prompt,constraints:{loop:true},mode:'template-grounded'};
  if (/滑轨|滑块|直线移动|linear.slider|linear.carriage|sliding.platform|slide rail/i.test(normalized))
    return {intent:'linear-carriage',domain:'mechanisms',prompt,constraints:{joint:'prismatic'},mode:'template-grounded'};
  if (/转轴|轮轴|shaft.drive|rotating.axle|wheel.axle|轮组传动/i.test(normalized))
    return {intent:'shaft-drive',domain:'mechanisms',prompt,constraints:{joint:'revolute'},mode:'template-grounded'};
  if (/(飞机|客机|飞行器|aircraft|airplane|aeroplane|plane\b|flight)/i.test(normalized))
    return {intent:'future-aircraft',domain:'aerospace',prompt,mode:'requirements-only',
      constraints:{physicalCertificationRequired:true}};
  if (/(建筑|大楼|房屋|一栋楼|building|skyscraper|house\b|apartment)/i.test(normalized))
    return {intent:'future-building',domain:'built-environment',prompt,mode:'requirements-only',
      constraints:{physicalCertificationRequired:true}};
  return {intent:'unsupported',domain:'unknown',prompt,mode:'requirements-only',constraints:{}};
}

function b(id,componentId,pos=[0,0,0],grounded=false,name=id) {
  return {id,componentId,pos,rotation:[0,0,0],grounded,name};
}
function j(id,a,pa,c,pc,kind='fixed',controlled=false) {
  return {
    id,kind,
    a:{bodyId:a,portId:pa},b:{bodyId:c,portId:pc},
    value:0,limits:kind==='fixed'?[0,0]:kind==='slider'?[-50,50]:[-180,180],
    controlled
  };
}

// Conceptual six-wheel rover, deliberately split into a chassis crossmember,
// two longitudinal beams, six virtual wheel-axis joints, and a dome sensor.
// Beam face-hole datums are schematic: true axle bearings and suspension are
// not currently present and must not be inferred from this 3D preview.
export function createSixWheelRoverGraph() {
  const graph={
    id:'mars_rover_6w',
    name:'Six-Wheel Mars Rover Concept',
    zh:'六轮火星探测车（概念装配）',
    bodies:[
      b('chassis','plate-2x6',[0,0,0],true,'中央车体'),
      b('port_rail','beam-13',[0,0,0],false,'左侧纵梁'),
      b('starboard_rail','beam-13',[0,0,0],false,'右侧纵梁'),
      b('sensor_dome','dome-2x2',[0,0,0],false,'视觉传感器舱')
    ],
    joints:[
      j('port_rail_mount','chassis','front-z','port_rail','back-z'),
      j('starboard_rail_mount','chassis','back-z','starboard_rail','front-z'),
      j('sensor_mount','chassis','top-z','sensor_dome','bottom-z')
    ]
  };
  const stations=[2,6,10];
  for (const side of [
    {id:'port',beam:'port_rail',portPrefix:'front-hole:'},
    {id:'starboard',beam:'starboard_rail',portPrefix:'back-hole:'}
  ]) {
    for (let position=0;position<stations.length;position++) {
      const id='wheel_'+side.id+'_'+(position+1);
      graph.bodies.push(b(id,'wheel-medium',[0,0,0],false,
        (side.id==='port'?'左':'右')+'侧第'+(position+1)+'轮'));
      graph.joints.push(j('bearing_'+side.id+'_'+(position+1),
        side.beam,side.portPrefix+stations[position],
        id,'back-z','shaft',true));
    }
  }
  return graph;
}

function graphForIntent(request) {
  if (request.intent==='mars-rover') {
    if (request.constraints.wheelCount!==6)
      throw new Error('Current rover blueprint supports exactly six wheels, not '+request.constraints.wheelCount);
    return createSixWheelRoverGraph();
  }
  if (intentIds.includes(request.intent)) return createConstraintPreset(request.intent);
  throw new Error('No compiled physical assembly for intent '+request.intent);
}

function orderedAssemblySteps(graph,catalog) {
  const lookup=new Map(catalog.map(p=>[p.id,p]));
  const byId=new Map(graph.bodies.map(body=>[body.id,body]));
  const attached=new Set();
  const steps=[];
  const adjacency=new Map(graph.bodies.map(body=>[body.id,[]]));
  for(const edge of graph.joints){
    adjacency.get(edge.a.bodyId).push({edge,other:edge.b.bodyId});
    adjacency.get(edge.b.bodyId).push({edge,other:edge.a.bodyId});
  }
  const prioritized=[...graph.bodies].sort((a,c)=>Number(Boolean(c.grounded))-Number(Boolean(a.grounded)));
  for(const root of prioritized){
    if(attached.has(root.id))continue;
    attached.add(root.id);
    const queue=[{id:root.id,via:null,parent:null}];
    for(let i=0;i<queue.length;i++){
      const current=queue[i];
      const body=byId.get(current.id);
      const source=lookup.get(body.componentId);
      steps.push({
        step:steps.length+1,
        bodyId:body.id,componentId:body.componentId,
        componentName:source?.zh || source?.name || body.componentId,
        parentBodyId:current.parent,
        viaJointId:current.via,
        operation:current.via?'connect':'place',
        dependsOn:current.parent
          ? [steps.find(step=>step.bodyId===current.parent)?.step].filter(Boolean) : [],
        note:current.via
          ? 'Connect via '+current.via+'. Check anchor alignment and clearance.'
          : 'Place grounded or disconnected assembly reference.'
      });
      for(const {edge,other} of adjacency.get(current.id)){
        if(attached.has(other))continue;
        attached.add(other);
        queue.push({id:other,parent:current.id,via:edge.id});
      }
    }
  }
  const spanning=new Set(steps.map(step=>step.viaJointId).filter(Boolean));
  const closures=graph.joints.filter(edge=>!spanning.has(edge.id)).map(edge=>({
    step:steps.length+1,bodyId:null,componentId:null,
    operation:'close-loop',viaJointId:edge.id,
    dependsOn:[
      steps.find(s=>s.bodyId===edge.a.bodyId)?.step,
      steps.find(s=>s.bodyId===edge.b.bodyId)?.step
    ].filter(Boolean),
    note:'Validate this extra connection using numerical loop closure.'
  }));
  return [...steps,...closures.map((edge,i)=>({...edge,step:steps.length+i+1}))];
}

export function validateAgentGraph(graph,catalog,options={}) {
  validateConstraintGraph(graph,catalog);
  const solved=solveConstraintGraph(graph,catalog,{maxIterations:options.maxIterations??75});
  const checklist=[
    {id:'schema',passed:true,detail:'Catalog IDs, joint/port references and limits validated'},
    {id:'kinematics',passed:solved.valid,detail:'Closure residual '+solved.closureErrorMm.toFixed(4)+' mm'},
    {id:'collision-proxy',passed:solved.collisionPairs.length===0,
      detail:solved.collisionPairs.length+' nonadjacent oriented-box overlaps'},
    {id:'manufacturing-fit',passed:false,detail:'Not verified; missing physical tolerances, materials and joints'},
    {id:'dynamics',passed:false,detail:'Not simulated; no forces, gravity, torque or suspension'}
  ];
  return {
    graphSchemaVersion:CONSTRAINT_GRAPH_VERSION,
    solverValid:solved.valid,
    closureErrorMm:solved.closureErrorMm,
    collisionPairs:solved.collisionPairs,
    cycleCount:solved.cycleCount,
    connectedComponents:solved.connectedGroups.length,
    jointCount:graph.joints.length,
    bodyCount:graph.bodies.length,
    checklist,
    warnings:[
      ...(solved.collisionPairs.length?['Proxy collision warnings: review affected parts'] : []),
      'Visual and kinematic validation is not physical fit or manufacturability certification.',
      'Building structures and aircraft require separate discipline-specific engineering review.'
    ]
  };
}

export function createAssemblyPlan(raw,catalog) {
  const request=interpretBuildRequest(raw);
  if (request.mode!=='template-grounded') {
    return {
      schemaVersion:AGENT_PLAN_SCHEMA_VERSION,generator:AGENT_GENERATOR,
      status:'requirements-only',request,graph:null,bom:[],assemblySteps:[],
      verification:null,
      nextActions:request.domain==='aerospace'
        ? ['Define conceptual airframe geometry and systems','Obtain flight loads, control and aero requirements','Do not infer flightworthiness from a visual model']
        : request.domain==='built-environment'
          ? ['Define site, occupancy, grid and geometry','Obtain structural, fire, energy and code requirements','Do not infer structural safety from visualization']
          : ['Use a supported sample: six-wheel Mars rover, four-bar linkage, linear carriage or shaft drive'],
      explanation:'The request is not covered by a verified template; no 3D mechanical graph was fabricated.'
    };
  }
  const graph=graphForIntent(request);
  const verification=validateAgentGraph(graph,catalog);
  if (!verification.solverValid) throw new Error('Generated graph failed kinematic validation');
  const count=new Map();
  for(const body of graph.bodies) count.set(body.componentId,(count.get(body.componentId)||0)+1);
  const lookup=new Map(catalog.map(p=>[p.id,p]));
  const bom=[...count.entries()].map(([componentId,quantity])=>({
    componentId,quantity,name:lookup.get(componentId)?.zh||componentId,
    code:lookup.get(componentId)?.code||null,
    purpose:'conceptual-procedural-geometry'
  }));
  return {
    schemaVersion:AGENT_PLAN_SCHEMA_VERSION,generator:AGENT_GENERATOR,
    status:verification.collisionPairs.length?'kinematic-with-warnings':'kinematic-validated-concept',
    request,planName:graph.zh||graph.name||graph.id,
    graph,bom,assemblySteps:orderedAssemblySteps(graph,catalog),
    verification,capability:{
      geometry:'procedural-placeholder',
      constraints:'checked-by-constraint-graph',
      collision:'nonadjacent-OBB-proxy',
      dynamics:'not-run',
      structural:'not-run',
      manufacturing:'not-certified'
    },
    explanation:'A reproducible local blueprint matched this natural-language request. This is not an LLM-generated free-form design.'
  };
}

export function validateGeneratedPlan(document,catalog) {
  if(!document||document.schemaVersion!==AGENT_PLAN_SCHEMA_VERSION||
     document.generator!==AGENT_GENERATOR||!document.graph)
    throw new Error('Invalid agent plan version, generator or graph');
  const checked=validateAgentGraph(document.graph,catalog);
  if(!checked.solverValid)throw new Error('Imported plan cannot satisfy constraints');
  const rebuilt=orderedAssemblySteps(document.graph,catalog);
  const lookup=new Map(catalog.map(c=>[c.id,c]));
  const count=new Map();
  document.graph.bodies.forEach(b=>count.set(b.componentId,(count.get(b.componentId)||0)+1));
  return {
    ...document,assemblySteps:rebuilt,
    bom:[...count].map(([componentId,quantity])=>({
      componentId,quantity,name:lookup.get(componentId)?.zh||componentId,
      code:lookup.get(componentId)?.code||null,
      purpose:'conceptual-procedural-geometry'
    })),
    verification:checked,
    status:checked.collisionPairs.length?'kinematic-with-warnings':'kinematic-validated-concept'
  };
}
