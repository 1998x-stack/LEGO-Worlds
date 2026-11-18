// L0-only domain blueprints. These produce traceable system requirements,
// never synthetic FEM, CFD, structural safety or airworthiness claims.
const domains=Object.freeze({
  'built-environment':{
    systems:[
      ['site','site-and-terrain',['survey','georeference','foundation-conditions']],
      ['architecture','spatial-architecture',['occupancy','floor-plan','envelope']],
      ['structure','structural-frame',['materials','load-cases','seismic-wind']],
      ['services','MEP-services',['electrical','plumbing','HVAC']],
      ['life-safety','life-safety',['fire','egress','accessibility']],
      ['operations','asset-and-operations',['maintenance','energy','environment']]
    ],
    unresolved:[
      'Applicable building codes and jurisdiction',
      'Ground conditions, occupancy, structural loads and structural engineer approval',
      'Fire protection, egress, accessibility and MEP design reviews'
    ]
  },
  aerospace:{
    systems:[
      ['airframe','airframe-geometry',['fuselage','wings','empennage']],
      ['propulsion','propulsion-and-energy',['engine','fuel','thermal']],
      ['flight-controls','actuation-and-control',['control-surfaces','actuators','control-laws']],
      ['aerodynamics','aerodynamic-evidence',['airfoils','operating-envelope','CFD-or-test']],
      ['landing-gear','ground-support',['gear','braking','fatigue']],
      ['avionics','avionics-and-safety',['instrumentation','power','fault-tolerance']]
    ],
    unresolved:[
      'Mass/inertia, operating and flight envelopes, and structural load cases',
      'Validated aerodynamics/propulsion/flight controls and environmental testing',
      'Qualified engineering review and applicable airworthiness approvals'
    ]
  }
});

export function domainL0Systems(domain) {
  const config=domains[domain];
  if(!config)return {subsystems:[],unresolved:[]};
  return {
    subsystems:config.systems.map(([id,kind,requirements])=>({
      id,kind,requirements:[...requirements],
      readiness:'requirements-only'
    })),
    unresolved:[...config.unresolved]
  };
}

export function listDomainAdapters() {
  return Object.keys(domains).map(id=>({
    id,level:'L0',
    canGenerateGeometry:false,
    canSolveKinematics:false,
    physicalCertification:false,
    subsystemCount:domains[id].systems.length
  }));
}
