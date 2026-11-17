const part = (id, name, type, pos, color, size = [], step = 1, extra = {}) => ({
  id, name, type, pos, color, size, step, ...extra
});

export const SERIES = [
  { id: 'brick-system', number: '01', title: 'Brick System', titleZh: '基础积木系统', subtitle: 'The language of every build', description: '从标准砖块、薄板到 SNOT 侧向连接，理解积木系统的几何语法。', color: '#efc62e', count: '12+ components' },
  { id: 'technic-mechanics', number: '02', title: 'Technic Mechanics', titleZh: '机械传动系统', subtitle: 'Make structures move', description: '用机械梁、销、轴和齿轮搭建真实可理解的机械结构。', color: '#2877c7', count: 'Motion & gears' },
  { id: 'modular-city', number: '03', title: 'Modular City', titleZh: '模块化城市', subtitle: 'Build a place, one module at a time', description: '把墙体、门窗、屋顶、街道家具组织成可复用的城市模块。', color: '#e45a46', count: 'Architecture kits' }
];

export const COMPONENTS = [
  { id: 'brick-2x4', name: '2 × 4 Brick', zh: '标准砖块', family: 'Bricks', sizeLabel: '2 × 4 studs', dimensions: '15.8 × 31.8 × 9.6 mm', description: '最经典的标准砖块，用于建立主体体量。', type: 'brick', size: [2, 4], color: '#d71920', series: 'brick-system' },
  { id: 'brick-2x2', name: '2 × 2 Brick', zh: '方形砖块', family: 'Bricks', sizeLabel: '2 × 2 studs', dimensions: '15.8 × 15.8 × 9.6 mm', description: '紧凑的方形连接单元。', type: 'brick', size: [2, 2], color: '#0055bf', series: 'brick-system' },
  { id: 'brick-1x2', name: '1 × 2 Brick', zh: '窄砖块', family: 'Bricks', sizeLabel: '1 × 2 studs', dimensions: '7.8 × 15.8 × 9.6 mm', description: '适合细节、边缘与交错砌筑。', type: 'brick', size: [1, 2], color: '#ffcf00', series: 'brick-system' },
  { id: 'brick-1x1', name: '1 × 1 Brick', zh: '单凸点砖块', family: 'Bricks', sizeLabel: '1 × 1 stud', dimensions: '7.8 × 7.8 × 9.6 mm', description: '最小的标准砖块单元。', type: 'brick', size: [1, 1], color: '#237a45', series: 'brick-system' },
  { id: 'plate-2x4', name: '2 × 4 Plate', zh: '薄板', family: 'Plates', sizeLabel: '2 × 4 studs', dimensions: '15.8 × 31.8 × 3.2 mm', description: '高度为标准砖块三分之一的薄型结构件。', type: 'plate', size: [2, 4], color: '#0055bf', series: 'brick-system' },
  { id: 'tile-2x2', name: '2 × 2 Tile', zh: '光滑板', family: 'Tiles', sizeLabel: '2 × 2 studs', dimensions: '15.8 × 15.8 × 3.2 mm', description: '无顶部凸点，用于平滑表面与装饰。', type: 'tile', size: [2, 2], color: '#f4f0e6', series: 'brick-system' },
  { id: 'slope-2x2', name: '2 × 2 Slope', zh: '斜坡砖', family: 'Slopes', sizeLabel: '2 × 2 studs', dimensions: '15.8 × 15.8 × 9.6 mm', description: '构造屋顶、车头和倾斜外壳。', type: 'slope', size: [2, 2], color: '#ffcf00', series: 'brick-system' },
  { id: 'jumper-1x2', name: '1 × 2 Jumper', zh: '偏移连接板', family: 'Connectors', sizeLabel: '1 × 2 studs', dimensions: '7.8 × 15.8 × 3.2 mm', description: '单凸点偏移连接，为非整格布局提供自由度。', type: 'jumper', size: [1, 2], color: '#e45a46', series: 'brick-system' },
  { id: 'technic-beam-5', name: 'Technic Beam 5', zh: '五孔机械梁', family: 'Technic', sizeLabel: '5-hole beam', dimensions: '40 × 7.8 × 7.8 mm', description: '沿标准孔距排列的结构梁。', type: 'beam', size: [5], color: '#303941', series: 'technic-mechanics' },
  { id: 'technic-pin', name: 'Technic Pin', zh: '连接销', family: 'Technic', sizeLabel: '1.5 modules', dimensions: '12 mm nominal', description: '连接机械梁与框架；示意模型不模拟真实摩擦等级。', type: 'pin', size: [12], color: '#202a32', series: 'technic-mechanics' },
  { id: 'technic-axle', name: 'Technic Axle', zh: '十字轴', family: 'Technic', sizeLabel: '5 modules', dimensions: '40 mm nominal', description: '传递旋转运动并支撑齿轮。', type: 'axle', size: [40], color: '#555e68', series: 'technic-mechanics' },
  { id: 'gear-16t', name: '16-tooth Gear', zh: '16 齿齿轮', family: 'Gears', sizeLabel: '16 teeth', dimensions: '18 mm visual diameter', description: '用于演示啮合与传动比的程序化齿轮。', type: 'gear', size: [8, 16, 3.2], color: '#f4a62a', series: 'technic-mechanics' },
  { id: 'wheel-small', name: 'Compact Wheel', zh: '紧凑轮组', family: 'Motion', sizeLabel: 'Ø 20 mm', dimensions: '20 × 7 mm', description: '橡胶轮胎与独立轮毂组成的示意轮组。', type: 'wheel', size: [10, 7], color: '#222a30', series: 'technic-mechanics' },
  { id: 'window-module', name: 'Window Module', zh: '窗户模块', family: 'Architecture', sizeLabel: '3 × 3 module', dimensions: '28 × 28 × 4 mm', description: '框架与半透明窗片构成的可复用建筑接口。', type: 'window', size: [28, 28, 4], color: '#f4f0e6', series: 'modular-city' },
  { id: 'door-module', name: 'Door Module', zh: '门模块', family: 'Architecture', sizeLabel: '2 × 5 module', dimensions: '18 × 44 × 4 mm', description: '带观察窗与把手的建筑入口模块。', type: 'door', size: [18, 44, 4], color: '#b76b3f', series: 'modular-city' },
  { id: 'wall-panel', name: 'Wall Panel', zh: '墙体面板', family: 'Architecture', sizeLabel: '6 × 3 module', dimensions: '48 × 24 × 4 mm', description: '用作模块化建筑墙面、隔断与立面。', type: 'panel', size: [48, 24, 4], color: '#f0d7a8', series: 'modular-city' },
  { id: 'leaf-element', name: 'Leaf Element', zh: '植物叶片', family: 'Nature', sizeLabel: 'organic detail', dimensions: '20 mm visual length', description: '为城市街景与创意场景增加有机形态。', type: 'leaf', size: [20], color: '#398653', series: 'modular-city' },
  { id: 'clear-panel', name: 'Transparent Panel', zh: '透明面板', family: 'Architecture', sizeLabel: 'custom module', dimensions: '40 × 28 × 2 mm', description: '用于温室、车窗与展示罩的透明结构。', type: 'panel', size: [40, 28, 2], color: '#8ed7df', series: 'modular-city', transparent: true }
];

export const MODELS = [
  {
    id: 'component-atlas', slug: 'component-atlas', series: 'brick-system', kind: 'component-kit',
    title: 'The Component Atlas', titleZh: '基础组件陈列台',
    subtitle: 'A small vocabulary for a big world',
    description: '把基础砖块、薄板、光滑板、斜坡、偏移连接件与机械零件放在同一张展示台上。选择任意零件，查看它的形状、尺寸和用途。',
    accent: '#efc62e', partCount: 13, featured: true,
    steps: ['准备展示底板', '摆放基础砖块', '加入表面与连接件', '加入机械组件'],
    parts: [
      part('atlas-base', 'Display base · 14 × 10', 'plate', [0, 1.6, 0], '#d9d4c8', [14, 10], 1, { explode: [0, -4, 0] }),
      part('atlas-brick-2x4', '2 × 4 standard brick', 'brick', [-40, 9.7, -28], '#d71920', [2, 4], 2),
      part('atlas-brick-2x2', '2 × 2 square brick', 'brick', [-8, 9.7, -28], '#0055bf', [2, 2], 2),
      part('atlas-brick-1x2', '1 × 2 narrow brick', 'brick', [20, 9.7, -28], '#ffcf00', [1, 2], 2),
      part('atlas-brick-1x1', '1 × 1 single stud brick', 'brick', [48, 9.7, -28], '#237a45', [1, 1], 2),
      part('atlas-plate', '2 × 4 plate', 'plate', [-40, 6.5, 0], '#2877c7', [2, 4], 3),
      part('atlas-tile', '2 × 2 smooth tile', 'tile', [-8, 6.5, 0], '#f4f0e6', [2, 2], 3),
      part('atlas-slope', '2 × 2 slope', 'slope', [20, 9.7, 0], '#ffcf00', [2, 2], 3),
      part('atlas-jumper', '1 × 2 jumper plate', 'jumper', [48, 6.5, 0], '#e45a46', [1, 2], 3),
      part('atlas-beam', '5-hole Technic beam', 'beam', [-40, 8.8, 28], '#303941', [5], 4),
      part('atlas-gear', '16-tooth gear', 'gear', [-8, 6.5, 28], '#f4a62a', [8, 16, 3.2], 4),
      part('atlas-pin', 'Technic connector pin', 'pin', [20, 4.9, 28], '#202a32', [14], 4),
      part('atlas-wheel', 'Compact wheel', 'wheel', [48, 15.9, 28], '#252d34', [10, 6], 4)
    ]
  },
  {
    id: 'pocket-bot', slug: 'pocket-bot', series: 'brick-system', kind: 'assembly',
    title: 'Pocket Bot', titleZh: '口袋机器人',
    subtitle: 'A friendly build from simple pieces',
    description: '一个由标准砖块、薄板、光滑面板和小型圆柱件拼出的桌面机器人。装配步骤从脚部、躯干到头部逐层展开。',
    accent: '#e45a46', partCount: 15,
    steps: ['搭建脚部与双腿', '连接躯干和肩部', '安装双臂与胸前面板', '装上头部、眼睛与天线'],
    parts: [
      part('bot-foot-left', 'Left foot plate', 'plate', [-10, 1.6, 0], '#0055bf', [2, 2], 1),
      part('bot-foot-right', 'Right foot plate', 'plate', [10, 1.6, 0], '#0055bf', [2, 2], 1),
      part('bot-leg-left', 'Left leg brick', 'brick', [-10, 9.7, 0], '#e6e2d8', [1, 2], 1),
      part('bot-leg-right', 'Right leg brick', 'brick', [10, 9.7, 0], '#e6e2d8', [1, 2], 1),
      part('bot-hip', 'Hip connector', 'plate', [0, 14.5, 0], '#303941', [3, 2], 2),
      part('bot-torso', 'Main torso brick', 'brick', [0, 24.1, 0], '#ffcf00', [2, 3], 2),
      part('bot-shoulder-left', 'Left shoulder', 'brick', [-12, 24.1, 0], '#e45a46', [1, 2], 2),
      part('bot-shoulder-right', 'Right shoulder', 'brick', [12, 24.1, 0], '#e45a46', [1, 2], 2),
      part('bot-arm-left', 'Left arm', 'brick', [-20, 14.5, 0], '#0055bf', [1, 2], 3, { rotation: [0, 0, -0.12] }),
      part('bot-arm-right', 'Right arm', 'brick', [20, 14.5, 0], '#0055bf', [1, 2], 3, { rotation: [0, 0, 0.12] }),
      part('bot-hand-left', 'Left hand', 'cylinder', [-20, 7.8, 0], '#f4a62a', [3.2, 5], 3),
      part('bot-hand-right', 'Right hand', 'cylinder', [20, 7.8, 0], '#f4a62a', [3.2, 5], 3),
      part('bot-head', 'Head brick', 'brick', [0, 40, 0], '#f4f0e6', [2, 2], 4),
      part('bot-face', 'Face tile', 'tile', [0, 40, 8.2], '#303941', [2, 2], 4),
      part('bot-antenna', 'Signal antenna', 'pin', [0, 49, 0], '#e45a46', [12], 4)
    ]
  },
  {
    id: 'gearbox-explorer', slug: 'gearbox-explorer', series: 'technic-mechanics', kind: 'mechanism',
    title: 'Gearbox Explorer', titleZh: '双齿轮传动演示器',
    subtitle: 'See the relationship between gears and axles',
    description: '开放式机械框架展示一对啮合齿轮、贯穿轴、连接销与摇柄。它是结构示意模型，不模拟真实摩擦、负载或精确传动公差。',
    accent: '#2877c7', partCount: 13,
    steps: ['搭建两侧机械梁框架', '安装横向支撑与连接销', '穿入双轴并安装齿轮', '装上输入摇柄'],
    parts: [
      part('gearbox-beam-front', 'Front 7-hole beam', 'beam', [0, 4, -24], '#303941', [7], 1),
      part('gearbox-beam-back', 'Rear 7-hole beam', 'beam', [0, 4, 24], '#303941', [7], 1),
      part('gearbox-upright-left', 'Left upright beam', 'beam', [-24, 16, 0], '#303941', [5], 2, { rotation: [0, 0, Math.PI / 2] }),
      part('gearbox-upright-right', 'Right upright beam', 'beam', [24, 16, 0], '#303941', [5], 2, { rotation: [0, 0, Math.PI / 2] }),
      part('gearbox-cross-top', 'Top cross member', 'beam', [0, 28, 0], '#4b5963', [7], 2),
      part('gearbox-pin-a', 'Frame pin A', 'pin', [-24, 4, -24], '#202a32', [12], 2),
      part('gearbox-pin-b', 'Frame pin B', 'pin', [24, 4, 24], '#202a32', [12], 2),
      part('gearbox-axle-a', 'Input axle', 'axle', [-9, 16, 0], '#606b75', [52], 3),
      part('gearbox-axle-b', 'Output axle', 'axle', [9, 16, 0], '#606b75', [52], 3),
      part('gearbox-gear-a', 'Input 16-tooth gear', 'gear', [-9, 16, 0], '#f4a62a', [8, 16, 3.2], 3),
      part('gearbox-gear-b', 'Output 16-tooth gear', 'gear', [9, 16, 0], '#e45a46', [8, 16, 3.2], 3),
      part('gearbox-spacer', 'Axle spacer', 'cylinder', [-9, 16, 29], '#d7dce0', [4, 3], 4),
      part('gearbox-crank', 'Input crank handle', 'beam', [-9, 25, 31], '#ffcf00', [3], 4, { rotation: [0, 0, Math.PI / 2] })
    ]
  },
  {
    id: 'trail-rover', slug: 'trail-rover', series: 'technic-mechanics', kind: 'vehicle',
    title: 'Trail Rover', titleZh: '越野探测车',
    subtitle: 'A compact chassis with four driven-looking wheels',
    description: '用机械梁搭出底盘，再组合轴、轮组、驾驶舱和探测设备。传动结构用于视觉讲解，未实现真实电机或转向功能。',
    accent: '#2877c7', partCount: 17,
    steps: ['拼出矩形底盘', '安装前后轴与四个轮组', '搭建驾驶舱和挡风窗', '添加车顶设备与前保险杠'],
    parts: [
      part('rover-side-left', 'Left chassis beam', 'beam', [0, 6, -20], '#303941', [9], 1),
      part('rover-side-right', 'Right chassis beam', 'beam', [0, 6, 20], '#303941', [9], 1),
      part('rover-cross-front', 'Front cross beam', 'beam', [-28, 6, 0], '#4b5963', [5], 1, { rotation: [0, Math.PI / 2, 0] }),
      part('rover-cross-back', 'Rear cross beam', 'beam', [28, 6, 0], '#4b5963', [5], 1, { rotation: [0, Math.PI / 2, 0] }),
      part('rover-axle-front', 'Front axle', 'axle', [-28, 8, 0], '#737d86', [58], 2),
      part('rover-axle-back', 'Rear axle', 'axle', [28, 8, 0], '#737d86', [58], 2),
      part('rover-wheel-fl', 'Front left wheel', 'wheel', [-28, 8, -30], '#252d34', [11, 7], 2),
      part('rover-wheel-fr', 'Front right wheel', 'wheel', [-28, 8, 30], '#252d34', [11, 7], 2),
      part('rover-wheel-rl', 'Rear left wheel', 'wheel', [28, 8, -30], '#252d34', [11, 7], 2),
      part('rover-wheel-rr', 'Rear right wheel', 'wheel', [28, 8, 30], '#252d34', [11, 7], 2),
      part('rover-deck', 'Central deck plate', 'plate', [0, 11, 0], '#ffcf00', [6, 5], 3),
      part('rover-cabin', 'Cabin body', 'brick', [0, 22, -4], '#e45a46', [3, 2], 3),
      part('rover-windshield', 'Front windscreen', 'panel', [-12, 23, 4], '#8ed7df', [2, 22, 26], 3, { transparent: true }),
      part('rover-roof', 'Cabin roof', 'plate', [0, 29, -4], '#f4f0e6', [3, 2], 4),
      part('rover-sensor', 'Roof sensor mast', 'pin', [0, 37, -4], '#303941', [14], 4),
      part('rover-sensor-head', 'Sensor head', 'cylinder', [0, 45, -4], '#2877c7', [5, 8], 4),
      part('rover-bumper', 'Front bumper', 'beam', [-40, 7, 0], '#d7dce0', [5], 4, { rotation: [0, Math.PI / 2, 0] })
    ]
  },
  {
    id: 'corner-cafe', slug: 'corner-cafe', series: 'modular-city', kind: 'architecture',
    title: 'Corner Café', titleZh: '转角街角咖啡馆',
    subtitle: 'A tiny place with a complete street-facing façade',
    description: '从底板、墙体、门窗到遮阳棚和屋顶，展示模块化建筑如何分层搭建。内部包含柜台与座位，适合作为后续城市街区的基础单元。',
    accent: '#e45a46', partCount: 18,
    steps: ['铺设地基与地面', '竖起后墙和两侧墙体', '安装门窗、柜台与遮阳棚', '封顶并添加招牌和街道细节'],
    parts: [
      part('cafe-base', '12 × 10 foundation plate', 'plate', [0, 1.6, 0], '#d7dce0', [12, 10], 1),
      part('cafe-floor', 'Interior floor tile', 'tile', [0, 4.9, -2], '#e7d8bd', [10, 8], 1),
      part('cafe-back-wall', 'Rear wall panel', 'panel', [0, 31, -36], '#f0d7a8', [88, 48, 4], 2),
      part('cafe-left-wall', 'Left wall panel', 'panel', [-44, 31, 0], '#f0d7a8', [4, 48, 72], 2),
      part('cafe-right-wall', 'Right wall panel', 'panel', [44, 31, 0], '#f0d7a8', [4, 48, 72], 2),
      part('cafe-front-pier-left', 'Front façade pier left', 'brick', [-34, 31, 36], '#f0d7a8', [1, 6], 2),
      part('cafe-front-pier-right', 'Front façade pier right', 'brick', [34, 31, 36], '#f0d7a8', [1, 6], 2),
      part('cafe-window', 'Large front window', 'window', [-13, 31, 38], '#f4f0e6', [30, 32, 4], 3),
      part('cafe-door', 'Entry door', 'door', [27, 29, 38], '#b76b3f', [18, 44, 4], 3),
      part('cafe-counter', 'Service counter', 'panel', [-5, 16, -10], '#b76b3f', [42, 18, 12], 3),
      part('cafe-awning-red', 'Striped awning red', 'panel', [-13, 52, 41], '#e45a46', [32, 8, 12], 3),
      part('cafe-awning-cream', 'Striped awning cream', 'panel', [13, 52, 41], '#f4f0e6', [20, 8, 12], 3),
      part('cafe-roof', 'Flat roof plate', 'plate', [0, 56.5, 0], '#2877c7', [12, 10], 4),
      part('cafe-sign', 'Coffee sign board', 'panel', [0, 61, 42], '#ffcf00', [38, 12, 3], 4),
      part('cafe-sign-post', 'Sign support', 'panel', [0, 54, 39], '#303941', [3, 12, 3], 4),
      part('cafe-table', 'Outdoor café table', 'cylinder', [-26, 9, 52], '#b76b3f', [9, 3], 4),
      part('cafe-table-leg', 'Table pedestal', 'cylinder', [-26, 4, 52], '#303941', [2, 10], 4),
      part('cafe-plant', 'Street planter', 'leaf', [28, 8, 52], '#398653', [18], 4)
    ]
  },
  {
    id: 'canal-tram-stop', slug: 'canal-tram-stop', series: 'modular-city', kind: 'street-furniture',
    title: 'Canal Tram Stop', titleZh: '运河电车站',
    subtitle: 'A repeatable street module for a growing city',
    description: '平台、站棚、顶盖、长椅、站牌和轨道边界组成一套可复制的交通设施模块。可与其他城市模型拼接成完整街区。',
    accent: '#e45a46', partCount: 15,
    steps: ['铺设站台底板', '安装立柱与长椅', '架设顶棚和站牌', '铺设轨道边界与照明'],
    parts: [
      part('tram-base', 'Platform foundation', 'plate', [0, 1.6, 0], '#d7dce0', [12, 8], 1),
      part('tram-platform', 'Platform surface', 'tile', [0, 4.9, 0], '#e8e1d4', [10, 6], 1),
      part('tram-post-left', 'Shelter post left', 'panel', [-30, 20, -8], '#303941', [4, 34, 4], 2),
      part('tram-post-right', 'Shelter post right', 'panel', [30, 20, -8], '#303941', [4, 34, 4], 2),
      part('tram-back-panel', 'Wind screen', 'panel', [0, 21, -24], '#8ed7df', [56, 34, 2], 2, { transparent: true }),
      part('tram-roof', 'Shelter roof', 'plate', [0, 39, -8], '#2877c7', [10, 4], 3),
      part('tram-bench-seat', 'Bench seat', 'panel', [0, 12, 8], '#b76b3f', [42, 4, 8], 3),
      part('tram-bench-back', 'Bench back', 'panel', [0, 19, 12], '#b76b3f', [42, 12, 4], 3),
      part('tram-route-post', 'Route information post', 'panel', [-20, 23, 20], '#303941', [3, 32, 3], 3),
      part('tram-route-sign', 'Route sign', 'panel', [-20, 39, 20], '#ffcf00', [18, 14, 2], 3),
      part('tram-lamp-post', 'Street lamp post', 'cylinder', [38, 25, 18], '#303941', [2, 42], 4),
      part('tram-lamp-head', 'Lamp head', 'sphere', [38, 47, 18], '#ffcf00', [5, 3, 5], 4),
      part('tram-track-left', 'Left track rail', 'beam', [0, 3, 42], '#606b75', [10], 4),
      part('tram-track-right', 'Right track rail', 'beam', [0, 3, 52], '#606b75', [10], 4),
      part('tram-planter', 'Platform planter', 'leaf', [38, 8, -18], '#398653', [18], 4)
    ]
  },
  {
    id: 'clockwork-koi-garden', slug: 'clockwork-koi-garden', series: 'creative-lab', kind: 'original-showcase',
    title: 'Clockwork Koi Garden', titleZh: '发条锦鲤庭院',
    subtitle: 'A tiny mechanical garden with a moving-world feeling',
    description: '原创创意拼搭：把深蓝水池、金色齿轮、两尾锦鲤、荷叶、木桥和灯笼组合成一个微缩庭院。每个元素都可以单独拆解与重新组合。',
    accent: '#16a6a0', partCount: 20, featured: true,
    steps: ['搭建水池底座与池沿', '安装齿轮装饰和木桥', '放入锦鲤与荷叶', '竖起灯笼与庭院细节'],
    parts: [
      part('koi-base', 'Pond foundation plate', 'plate', [0, 1.6, 0], '#163b63', [10, 8], 1),
      part('koi-water', 'Water surface', 'panel', [0, 5, 0], '#2b8fbb', [72, 2, 56], 1, { transparent: true }),
      part('koi-rim', 'Pond rim ring', 'ring', [0, 7, 0], '#e5b84b', [34, 3], 1),
      part('koi-gear-left', 'Left clockwork gear', 'gear', [-39, 8, -22], '#e5b84b', [8, 16, 3.2], 2),
      part('koi-gear-right', 'Right clockwork gear', 'gear', [39, 8, 22], '#e5b84b', [8, 16, 3.2], 2),
      part('koi-bridge-deck', 'Bridge deck', 'plate', [0, 13, 0], '#b76b3f', [2, 7], 2, { rotation: [0, 0, Math.PI / 2] }),
      part('koi-bridge-rail-left', 'Bridge rail left', 'beam', [0, 21, -8], '#e6d2a8', [7], 2),
      part('koi-bridge-rail-right', 'Bridge rail right', 'beam', [0, 21, 8], '#e6d2a8', [7], 2),
      part('koi-fish-one-body', 'Koi one · body', 'sphere', [-12, 11, -10], '#f4f0e6', [13, 4, 5], 3, { rotation: [0, 0, 0.18] }),
      part('koi-fish-one-head', 'Koi one · head', 'sphere', [-22, 11, -10], '#e45a46', [5, 3.8, 4.8], 3),
      part('koi-fish-one-tail', 'Koi one · tail', 'slope', [1, 11, -10], '#e45a46', [1, 1], 3, { rotation: [0, 0, Math.PI / 2] }),
      part('koi-fish-two-body', 'Koi two · body', 'sphere', [14, 11, 12], '#ffcf00', [12, 3.5, 4.5], 3, { rotation: [0, 0, -0.22] }),
      part('koi-fish-two-head', 'Koi two · head', 'sphere', [24, 11, 12], '#f4f0e6', [4.5, 3.4, 4.2], 3),
      part('koi-lily-left', 'Lily pad left', 'leaf', [-28, 9, 14], '#398653', [20], 3),
      part('koi-lily-right', 'Lily pad right', 'leaf', [27, 9, -18], '#398653', [18], 3),
      part('koi-flower', 'Lotus flower', 'sphere', [27, 12, -18], '#f0a6b5', [5, 2.5, 5], 3),
      part('koi-lantern-post', 'Lantern post', 'cylinder', [-44, 20, 32], '#303941', [2, 28], 4),
      part('koi-lantern', 'Lantern shade', 'dome', [-44, 36, 32], '#ffcf00', [7], 4),
      part('koi-lantern-glow', 'Lantern glass', 'sphere', [-44, 29, 32], '#f7d98b', [4, 5, 4], 4),
      part('koi-bonsai', 'Garden bonsai', 'leaf', [43, 11, -30], '#237a45', [22], 4)
    ]
  }
];

export const MODEL_COUNT = MODELS.length;
export const COMPONENT_COUNT = COMPONENTS.length;
