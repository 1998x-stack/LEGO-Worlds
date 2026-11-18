const part = (id, name, type, pos, color, size = [], step = 1, extra = {}) => ({
  id, name, type, pos, color, size, step, ...extra
});

export const SERIES = [
  { id: 'brick-system', number: '01', title: 'Brick System', titleZh: '基础积木系统', subtitle: 'The language of every build', description: '从标准砖块、薄板到 SNOT 侧向连接，理解积木系统的几何语法。', color: '#efc62e', count: '12+ components' },
  { id: 'technic-mechanics', number: '02', title: 'Technic Mechanics', titleZh: '机械传动系统', subtitle: 'Make structures move', description: '用机械梁、销、轴和齿轮搭建真实可理解的机械结构。', color: '#2877c7', count: 'Motion & gears' },
  { id: 'modular-city', number: '03', title: 'Modular City', titleZh: '模块化城市', subtitle: 'Build a place, one module at a time', description: '把墙体、门窗、屋顶、街道家具组织成可复用的城市模块。', color: '#e45a46', count: 'Architecture kits' }
];

export const COMPONENTS = [
  {
    "id": "brick-1x1",
    "code": "BW-BR-001",
    "name": "1 × 1 Brick",
    "zh": "1×1 基础砖",
    "family": "Bricks",
    "type": "brick",
    "size": [
      1,
      1
    ],
    "sizeLabel": "1 × 1 studs",
    "dimensions": "7.8 × 7.8 × 9.6 mm",
    "description": "标准凸点砖块，用于主体结构、墙体、柱体与错缝连接。",
    "color": "#d71920",
    "series": "brick-system",
    "connectionProfile": "stud-grid-8mm"
  },
  {
    "id": "brick-1x2",
    "code": "BW-BR-002",
    "name": "1 × 2 Brick",
    "zh": "1×2 基础砖",
    "family": "Bricks",
    "type": "brick",
    "size": [
      1,
      2
    ],
    "sizeLabel": "1 × 2 studs",
    "dimensions": "7.8 × 15.8 × 9.6 mm",
    "description": "标准凸点砖块，用于主体结构、墙体、柱体与错缝连接。",
    "color": "#d71920",
    "series": "brick-system",
    "connectionProfile": "stud-grid-8mm"
  },
  {
    "id": "brick-1x3",
    "code": "BW-BR-003",
    "name": "1 × 3 Brick",
    "zh": "1×3 基础砖",
    "family": "Bricks",
    "type": "brick",
    "size": [
      1,
      3
    ],
    "sizeLabel": "1 × 3 studs",
    "dimensions": "7.8 × 23.8 × 9.6 mm",
    "description": "标准凸点砖块，用于主体结构、墙体、柱体与错缝连接。",
    "color": "#d71920",
    "series": "brick-system",
    "connectionProfile": "stud-grid-8mm"
  },
  {
    "id": "brick-1x4",
    "code": "BW-BR-004",
    "name": "1 × 4 Brick",
    "zh": "1×4 基础砖",
    "family": "Bricks",
    "type": "brick",
    "size": [
      1,
      4
    ],
    "sizeLabel": "1 × 4 studs",
    "dimensions": "7.8 × 31.8 × 9.6 mm",
    "description": "标准凸点砖块，用于主体结构、墙体、柱体与错缝连接。",
    "color": "#d71920",
    "series": "brick-system",
    "connectionProfile": "stud-grid-8mm"
  },
  {
    "id": "brick-1x6",
    "code": "BW-BR-005",
    "name": "1 × 6 Brick",
    "zh": "1×6 基础砖",
    "family": "Bricks",
    "type": "brick",
    "size": [
      1,
      6
    ],
    "sizeLabel": "1 × 6 studs",
    "dimensions": "7.8 × 47.8 × 9.6 mm",
    "description": "标准凸点砖块，用于主体结构、墙体、柱体与错缝连接。",
    "color": "#d71920",
    "series": "brick-system",
    "connectionProfile": "stud-grid-8mm"
  },
  {
    "id": "brick-1x8",
    "code": "BW-BR-006",
    "name": "1 × 8 Brick",
    "zh": "1×8 基础砖",
    "family": "Bricks",
    "type": "brick",
    "size": [
      1,
      8
    ],
    "sizeLabel": "1 × 8 studs",
    "dimensions": "7.8 × 63.8 × 9.6 mm",
    "description": "标准凸点砖块，用于主体结构、墙体、柱体与错缝连接。",
    "color": "#d71920",
    "series": "brick-system",
    "connectionProfile": "stud-grid-8mm"
  },
  {
    "id": "brick-2x2",
    "code": "BW-BR-007",
    "name": "2 × 2 Brick",
    "zh": "2×2 基础砖",
    "family": "Bricks",
    "type": "brick",
    "size": [
      2,
      2
    ],
    "sizeLabel": "2 × 2 studs",
    "dimensions": "15.8 × 15.8 × 9.6 mm",
    "description": "标准凸点砖块，用于主体结构、墙体、柱体与错缝连接。",
    "color": "#d71920",
    "series": "brick-system",
    "connectionProfile": "stud-grid-8mm"
  },
  {
    "id": "brick-2x3",
    "code": "BW-BR-008",
    "name": "2 × 3 Brick",
    "zh": "2×3 基础砖",
    "family": "Bricks",
    "type": "brick",
    "size": [
      2,
      3
    ],
    "sizeLabel": "2 × 3 studs",
    "dimensions": "15.8 × 23.8 × 9.6 mm",
    "description": "标准凸点砖块，用于主体结构、墙体、柱体与错缝连接。",
    "color": "#d71920",
    "series": "brick-system",
    "connectionProfile": "stud-grid-8mm"
  },
  {
    "id": "brick-2x4",
    "code": "BW-BR-009",
    "name": "2 × 4 Brick",
    "zh": "2×4 基础砖",
    "family": "Bricks",
    "type": "brick",
    "size": [
      2,
      4
    ],
    "sizeLabel": "2 × 4 studs",
    "dimensions": "15.8 × 31.8 × 9.6 mm",
    "description": "标准凸点砖块，用于主体结构、墙体、柱体与错缝连接。",
    "color": "#d71920",
    "series": "brick-system",
    "connectionProfile": "stud-grid-8mm"
  },
  {
    "id": "brick-2x6",
    "code": "BW-BR-010",
    "name": "2 × 6 Brick",
    "zh": "2×6 基础砖",
    "family": "Bricks",
    "type": "brick",
    "size": [
      2,
      6
    ],
    "sizeLabel": "2 × 6 studs",
    "dimensions": "15.8 × 47.8 × 9.6 mm",
    "description": "标准凸点砖块，用于主体结构、墙体、柱体与错缝连接。",
    "color": "#d71920",
    "series": "brick-system",
    "connectionProfile": "stud-grid-8mm"
  },
  {
    "id": "brick-2x8",
    "code": "BW-BR-011",
    "name": "2 × 8 Brick",
    "zh": "2×8 基础砖",
    "family": "Bricks",
    "type": "brick",
    "size": [
      2,
      8
    ],
    "sizeLabel": "2 × 8 studs",
    "dimensions": "15.8 × 63.8 × 9.6 mm",
    "description": "标准凸点砖块，用于主体结构、墙体、柱体与错缝连接。",
    "color": "#d71920",
    "series": "brick-system",
    "connectionProfile": "stud-grid-8mm"
  },
  {
    "id": "brick-3x2",
    "code": "BW-BR-012",
    "name": "3 × 2 Brick",
    "zh": "3×2 基础砖",
    "family": "Bricks",
    "type": "brick",
    "size": [
      3,
      2
    ],
    "sizeLabel": "3 × 2 studs",
    "dimensions": "23.8 × 15.8 × 9.6 mm",
    "description": "标准凸点砖块，用于主体结构、墙体、柱体与错缝连接。",
    "color": "#d71920",
    "series": "brick-system",
    "connectionProfile": "stud-grid-8mm"
  },
  {
    "id": "brick-4x4",
    "code": "BW-BR-013",
    "name": "4 × 4 Brick",
    "zh": "4×4 基础砖",
    "family": "Bricks",
    "type": "brick",
    "size": [
      4,
      4
    ],
    "sizeLabel": "4 × 4 studs",
    "dimensions": "31.8 × 31.8 × 9.6 mm",
    "description": "标准凸点砖块，用于主体结构、墙体、柱体与错缝连接。",
    "color": "#d71920",
    "series": "brick-system",
    "connectionProfile": "stud-grid-8mm"
  },
  {
    "id": "round-brick-1x1",
    "code": "BW-BR-014",
    "name": "1 × 1 Round Brick",
    "zh": "1×1 圆砖",
    "family": "Bricks",
    "type": "cylinder",
    "size": [
      4,
      9.6
    ],
    "sizeLabel": "Ø 8 × 9.6 mm",
    "dimensions": "Ø 8 × 9.6 mm",
    "description": "圆柱形砖块，可作为灯柱、管道与圆形细节。",
    "color": "#f4a62a",
    "series": "brick-system",
    "connectionProfile": "stud-grid-8mm"
  },
  {
    "id": "round-brick-2x2",
    "code": "BW-BR-015",
    "name": "2 × 2 Round Brick",
    "zh": "2×2 圆柱砖",
    "family": "Bricks",
    "type": "cylinder",
    "size": [
      7.8,
      9.6
    ],
    "sizeLabel": "Ø 15.6 × 9.6 mm",
    "dimensions": "Ø 15.6 × 9.6 mm",
    "description": "宽圆柱体块，适合塔柱和机械外壳。",
    "color": "#2877c7",
    "series": "brick-system",
    "connectionProfile": "stud-grid-8mm"
  },
  {
    "id": "plate-1x1",
    "code": "BW-PT-001",
    "name": "1 × 1 Plate",
    "zh": "1×1 薄板",
    "family": "Plates & Tiles",
    "type": "plate",
    "size": [
      1,
      1
    ],
    "sizeLabel": "1 × 1 studs",
    "dimensions": "7.8 × 7.8 × 3.2 mm",
    "description": "薄型连接件，可跨接砖块、锁定结构并微调高度。",
    "color": "#2877c7",
    "series": "brick-system",
    "connectionProfile": "stud-grid-8mm"
  },
  {
    "id": "plate-1x2",
    "code": "BW-PT-002",
    "name": "1 × 2 Plate",
    "zh": "1×2 薄板",
    "family": "Plates & Tiles",
    "type": "plate",
    "size": [
      1,
      2
    ],
    "sizeLabel": "1 × 2 studs",
    "dimensions": "7.8 × 15.8 × 3.2 mm",
    "description": "薄型连接件，可跨接砖块、锁定结构并微调高度。",
    "color": "#2877c7",
    "series": "brick-system",
    "connectionProfile": "stud-grid-8mm"
  },
  {
    "id": "plate-1x3",
    "code": "BW-PT-003",
    "name": "1 × 3 Plate",
    "zh": "1×3 薄板",
    "family": "Plates & Tiles",
    "type": "plate",
    "size": [
      1,
      3
    ],
    "sizeLabel": "1 × 3 studs",
    "dimensions": "7.8 × 23.8 × 3.2 mm",
    "description": "薄型连接件，可跨接砖块、锁定结构并微调高度。",
    "color": "#2877c7",
    "series": "brick-system",
    "connectionProfile": "stud-grid-8mm"
  },
  {
    "id": "plate-1x4",
    "code": "BW-PT-004",
    "name": "1 × 4 Plate",
    "zh": "1×4 薄板",
    "family": "Plates & Tiles",
    "type": "plate",
    "size": [
      1,
      4
    ],
    "sizeLabel": "1 × 4 studs",
    "dimensions": "7.8 × 31.8 × 3.2 mm",
    "description": "薄型连接件，可跨接砖块、锁定结构并微调高度。",
    "color": "#2877c7",
    "series": "brick-system",
    "connectionProfile": "stud-grid-8mm"
  },
  {
    "id": "plate-2x2",
    "code": "BW-PT-005",
    "name": "2 × 2 Plate",
    "zh": "2×2 薄板",
    "family": "Plates & Tiles",
    "type": "plate",
    "size": [
      2,
      2
    ],
    "sizeLabel": "2 × 2 studs",
    "dimensions": "15.8 × 15.8 × 3.2 mm",
    "description": "薄型连接件，可跨接砖块、锁定结构并微调高度。",
    "color": "#2877c7",
    "series": "brick-system",
    "connectionProfile": "stud-grid-8mm"
  },
  {
    "id": "plate-2x4",
    "code": "BW-PT-006",
    "name": "2 × 4 Plate",
    "zh": "2×4 薄板",
    "family": "Plates & Tiles",
    "type": "plate",
    "size": [
      2,
      4
    ],
    "sizeLabel": "2 × 4 studs",
    "dimensions": "15.8 × 31.8 × 3.2 mm",
    "description": "薄型连接件，可跨接砖块、锁定结构并微调高度。",
    "color": "#2877c7",
    "series": "brick-system",
    "connectionProfile": "stud-grid-8mm"
  },
  {
    "id": "plate-2x6",
    "code": "BW-PT-007",
    "name": "2 × 6 Plate",
    "zh": "2×6 薄板",
    "family": "Plates & Tiles",
    "type": "plate",
    "size": [
      2,
      6
    ],
    "sizeLabel": "2 × 6 studs",
    "dimensions": "15.8 × 47.8 × 3.2 mm",
    "description": "薄型连接件，可跨接砖块、锁定结构并微调高度。",
    "color": "#2877c7",
    "series": "brick-system",
    "connectionProfile": "stud-grid-8mm"
  },
  {
    "id": "tile-1x2",
    "code": "BW-PT-008",
    "name": "1 × 2 Tile",
    "zh": "1×2 光滑板",
    "family": "Plates & Tiles",
    "type": "tile",
    "size": [
      1,
      2
    ],
    "sizeLabel": "1 × 2 smooth",
    "dimensions": "7.8 × 15.8 × 3.2 mm",
    "description": "无凸点表面件，用于饰面、地板和干净的外观。",
    "color": "#f4f0e6",
    "series": "brick-system",
    "connectionProfile": "stud-grid-8mm"
  },
  {
    "id": "tile-2x2",
    "code": "BW-PT-009",
    "name": "2 × 2 Tile",
    "zh": "2×2 光滑板",
    "family": "Plates & Tiles",
    "type": "tile",
    "size": [
      2,
      2
    ],
    "sizeLabel": "2 × 2 smooth",
    "dimensions": "15.8 × 15.8 × 3.2 mm",
    "description": "方形平滑饰面，适合面板和标识区域。",
    "color": "#303941",
    "series": "brick-system",
    "connectionProfile": "stud-grid-8mm"
  },
  {
    "id": "tile-2x4",
    "code": "BW-PT-010",
    "name": "2 × 4 Tile",
    "zh": "2×4 光滑板",
    "family": "Plates & Tiles",
    "type": "tile",
    "size": [
      2,
      4
    ],
    "sizeLabel": "2 × 4 smooth",
    "dimensions": "15.8 × 31.8 × 3.2 mm",
    "description": "较大面积的无凸点饰面。",
    "color": "#8ed7df",
    "series": "brick-system",
    "connectionProfile": "stud-grid-8mm"
  },
  {
    "id": "jumper-1x2",
    "code": "BW-PT-011",
    "name": "1 × 2 Jumper",
    "zh": "1×2 偏移薄板",
    "family": "Plates & Tiles",
    "type": "jumper",
    "size": [
      1,
      2
    ],
    "sizeLabel": "1 × 2 / 1 stud",
    "dimensions": "7.8 × 15.8 × 3.2 mm",
    "description": "单凸点偏移连接件，用于半格位置调整。",
    "color": "#e45a46",
    "series": "brick-system",
    "connectionProfile": "stud-grid-8mm"
  },
  {
    "id": "jumper-2x2",
    "code": "BW-PT-012",
    "name": "2 × 2 Jumper",
    "zh": "2×2 单凸点薄板",
    "family": "Plates & Tiles",
    "type": "jumper",
    "size": [
      2,
      2
    ],
    "sizeLabel": "2 × 2 / 1 stud",
    "dimensions": "15.8 × 15.8 × 3.2 mm",
    "description": "宽底面中心单凸点连接件。",
    "color": "#f4a62a",
    "series": "brick-system",
    "connectionProfile": "stud-grid-8mm"
  },
  {
    "id": "slope-33-1x2",
    "code": "BW-CV-001",
    "name": "33° Slope 1 × 2",
    "zh": "33度斜坡砖",
    "family": "Slopes & Curves",
    "type": "slope",
    "size": [
      1,
      2
    ],
    "sizeLabel": "1 × 2 / 33°",
    "dimensions": "7.8 × 15.8 × 9.6 mm",
    "description": "低角度斜面，用于车身过渡和屋顶边缘。",
    "color": "#d71920",
    "series": "brick-system",
    "connectionProfile": "angled-surface-8mm"
  },
  {
    "id": "slope-45-2x2",
    "code": "BW-CV-002",
    "name": "45° Slope 2 × 2",
    "zh": "45度斜坡砖",
    "family": "Slopes & Curves",
    "type": "slope",
    "size": [
      2,
      2
    ],
    "sizeLabel": "2 × 2 / 45°",
    "dimensions": "15.8 × 15.8 × 9.6 mm",
    "description": "标准斜面，用于屋顶、车头和外壳过渡。",
    "color": "#0055bf",
    "series": "brick-system",
    "connectionProfile": "angled-surface-8mm"
  },
  {
    "id": "slope-45-2x4",
    "code": "BW-CV-003",
    "name": "45° Slope 2 × 4",
    "zh": "2×4 长斜坡",
    "family": "Slopes & Curves",
    "type": "slope",
    "size": [
      2,
      4
    ],
    "sizeLabel": "2 × 4 / 45°",
    "dimensions": "15.8 × 31.8 × 9.6 mm",
    "description": "加长斜面，适合连续车身和屋顶。",
    "color": "#ffcf00",
    "series": "brick-system",
    "connectionProfile": "angled-surface-8mm"
  },
  {
    "id": "inverted-slope-2x2",
    "code": "BW-CV-004",
    "name": "Inverted Slope 2 × 2",
    "zh": "倒置斜坡砖",
    "family": "Slopes & Curves",
    "type": "inverted-slope",
    "size": [
      2,
      2
    ],
    "sizeLabel": "2 × 2 inverted",
    "dimensions": "15.8 × 15.8 × 9.6 mm",
    "description": "反向斜面，用于底部收边、檐口和凹形轮廓。",
    "color": "#237a45",
    "series": "brick-system",
    "connectionProfile": "angled-surface-8mm"
  },
  {
    "id": "curved-slope-2x2",
    "code": "BW-CV-005",
    "name": "Curved Slope 2 × 2",
    "zh": "2×2 弧面斜坡",
    "family": "Slopes & Curves",
    "type": "curved-slope",
    "size": [
      2,
      2
    ],
    "sizeLabel": "2 × 2 curved",
    "dimensions": "15.8 × 15.8 × 9.6 mm",
    "description": "弧形顶面过渡，避免外壳出现生硬折角。",
    "color": "#e45a46",
    "series": "brick-system",
    "connectionProfile": "angled-surface-8mm"
  },
  {
    "id": "curved-slope-2x4",
    "code": "BW-CV-006",
    "name": "Curved Slope 2 × 4",
    "zh": "2×4 长弧面斜坡",
    "family": "Slopes & Curves",
    "type": "curved-slope",
    "size": [
      2,
      4
    ],
    "sizeLabel": "2 × 4 curved",
    "dimensions": "15.8 × 31.8 × 9.6 mm",
    "description": "长弧面结构，用于车顶、机舱和建筑檐口。",
    "color": "#f4a62a",
    "series": "brick-system",
    "connectionProfile": "angled-surface-8mm"
  },
  {
    "id": "curved-tile-2x2",
    "code": "BW-CV-007",
    "name": "Curved Tile 2 × 2",
    "zh": "2×2 弧面光滑板",
    "family": "Slopes & Curves",
    "type": "curved-tile",
    "size": [
      2,
      2
    ],
    "sizeLabel": "2 × 2 curved tile",
    "dimensions": "15.8 × 15.8 × 3.2 mm",
    "description": "薄型弧面饰件，用于圆润外壳和装饰曲线。",
    "color": "#8ed7df",
    "series": "brick-system",
    "connectionProfile": "angled-surface-8mm"
  },
  {
    "id": "arch-1x4",
    "code": "BW-CV-008",
    "name": "Arch 1 × 4",
    "zh": "1×4 拱门",
    "family": "Slopes & Curves",
    "type": "arch",
    "size": [
      32,
      24,
      4,
      4
    ],
    "sizeLabel": "1 × 4 arch",
    "dimensions": "32 × 24 × 4 mm",
    "description": "开口拱形结构，可作为门洞、桥洞和窗洞。",
    "color": "#f0d7a8",
    "series": "brick-system",
    "connectionProfile": "angled-surface-8mm"
  },
  {
    "id": "arch-1x6",
    "code": "BW-CV-009",
    "name": "Arch 1 × 6",
    "zh": "1×6 宽拱门",
    "family": "Slopes & Curves",
    "type": "arch",
    "size": [
      48,
      30,
      4,
      5
    ],
    "sizeLabel": "1 × 6 arch",
    "dimensions": "48 × 30 × 4 mm",
    "description": "宽跨度拱形结构，适合城市建筑和桥梁。",
    "color": "#b76b3f",
    "series": "brick-system",
    "connectionProfile": "angled-surface-8mm"
  },
  {
    "id": "dome-2x2",
    "code": "BW-CV-010",
    "name": "Dome 2 × 2",
    "zh": "2×2 半球顶",
    "family": "Slopes & Curves",
    "type": "dome",
    "size": [
      8
    ],
    "sizeLabel": "Ø 16 mm",
    "dimensions": "Ø 16 mm",
    "description": "半球形装饰件，可用于灯罩、塔顶和设备外壳。",
    "color": "#ffcf00",
    "series": "brick-system",
    "connectionProfile": "angled-surface-8mm"
  },
  {
    "id": "cone-1x1",
    "code": "BW-CV-011",
    "name": "Cone 1 × 1",
    "zh": "圆锥件",
    "family": "Slopes & Curves",
    "type": "cone",
    "size": [
      4,
      9.6
    ],
    "sizeLabel": "Ø 8 × 9.6 mm",
    "dimensions": "Ø 8 × 9.6 mm",
    "description": "尖顶几何件，适合天线、塔尖与机械端头。",
    "color": "#2877c7",
    "series": "brick-system",
    "connectionProfile": "angled-surface-8mm"
  },
  {
    "id": "wedge-2x3",
    "code": "BW-CV-012",
    "name": "Wedge 2 × 3",
    "zh": "2×3 楔形件",
    "family": "Slopes & Curves",
    "type": "wedge",
    "size": [
      2,
      3
    ],
    "sizeLabel": "2 × 3 wedge",
    "dimensions": "15.8 × 23.8 × 9.6 mm",
    "description": "非对称楔形轮廓，用于机翼、船头和斜向外壳。",
    "color": "#e45a46",
    "series": "brick-system",
    "connectionProfile": "angled-surface-8mm"
  },
  {
    "id": "side-stud-bracket",
    "code": "BW-CN-001",
    "name": "Side-stud Bracket",
    "zh": "侧凸点连接支架",
    "family": "Connectors & SNOT",
    "type": "bracket",
    "size": [
      16,
      16,
      8,
      3
    ],
    "sizeLabel": "16 × 16 / 3 mm wall",
    "dimensions": "16 × 16 × 8 mm",
    "description": "将连接面转向侧面，实现 SNOT 侧向拼搭。",
    "color": "#d71920",
    "series": "brick-system",
    "connectionProfile": "multi-axis-stud-clip-hinge"
  },
  {
    "id": "headlight-brick",
    "code": "BW-CN-002",
    "name": "Headlight Bracket",
    "zh": "灯砖式侧向支架",
    "family": "Connectors & SNOT",
    "type": "bracket",
    "size": [
      8,
      16,
      8,
      3
    ],
    "sizeLabel": "8 × 16 / 3 mm wall",
    "dimensions": "8 × 16 × 8 mm",
    "description": "小型直角支架，用于侧面饰板和凸点转向。",
    "color": "#f4a62a",
    "series": "brick-system",
    "connectionProfile": "multi-axis-stud-clip-hinge"
  },
  {
    "id": "plate-bracket-1x2",
    "code": "BW-CN-003",
    "name": "Plate Bracket 1 × 2",
    "zh": "1×2 薄板支架",
    "family": "Connectors & SNOT",
    "type": "bracket",
    "size": [
      16,
      8,
      8,
      3
    ],
    "sizeLabel": "16 × 8 / 3 mm wall",
    "dimensions": "16 × 8 × 8 mm",
    "description": "薄型 L 形连接件，用于立面和底板连接。",
    "color": "#2877c7",
    "series": "brick-system",
    "connectionProfile": "multi-axis-stud-clip-hinge"
  },
  {
    "id": "clip-1x1",
    "code": "BW-CN-004",
    "name": "Clip 1 × 1",
    "zh": "单点夹扣",
    "family": "Connectors & SNOT",
    "type": "clip",
    "size": [
      7,
      8,
      3
    ],
    "sizeLabel": "7 mm opening",
    "dimensions": "7 × 8 × 3 mm",
    "description": "夹持横杆或圆轴的 C 形连接接口。",
    "color": "#303941",
    "series": "brick-system",
    "connectionProfile": "multi-axis-stud-clip-hinge"
  },
  {
    "id": "bar-4",
    "code": "BW-CN-005",
    "name": "Bar 4L",
    "zh": "四模块横杆",
    "family": "Connectors & SNOT",
    "type": "bar",
    "size": [
      32,
      2
    ],
    "sizeLabel": "32 × Ø 4 mm",
    "dimensions": "32 × Ø 4 mm",
    "description": "标准横杆示意件，可与夹扣、扶手和附件连接。",
    "color": "#b7c1c9",
    "series": "brick-system",
    "connectionProfile": "multi-axis-stud-clip-hinge"
  },
  {
    "id": "hinge-1x2",
    "code": "BW-CN-006",
    "name": "Hinge 1 × 2",
    "zh": "1×2 铰链",
    "family": "Connectors & SNOT",
    "type": "hinge",
    "size": [
      16,
      10,
      4
    ],
    "sizeLabel": "16 mm hinge axis",
    "dimensions": "16 × 10 × 4 mm",
    "description": "双叶铰链结构，用于翻盖、门板和活动面。",
    "color": "#e45a46",
    "series": "brick-system",
    "connectionProfile": "multi-axis-stud-clip-hinge"
  },
  {
    "id": "hinge-1x4",
    "code": "BW-CN-007",
    "name": "Hinge 1 × 4",
    "zh": "1×4 长铰链",
    "family": "Connectors & SNOT",
    "type": "hinge",
    "size": [
      32,
      12,
      4
    ],
    "sizeLabel": "32 mm hinge axis",
    "dimensions": "32 × 12 × 4 mm",
    "description": "加长铰链结构，可支撑较宽活动面。",
    "color": "#606b75",
    "series": "brick-system",
    "connectionProfile": "multi-axis-stud-clip-hinge"
  },
  {
    "id": "ball-joint",
    "code": "BW-CN-008",
    "name": "Ball Joint",
    "zh": "球形关节",
    "family": "Connectors & SNOT",
    "type": "connector",
    "size": [
      14,
      2.8
    ],
    "sizeLabel": "Ø 5.6 ball",
    "dimensions": "14 × Ø 5.6 mm",
    "description": "球头连接示意件，用于多方向活动关节。",
    "color": "#f4a62a",
    "series": "brick-system",
    "connectionProfile": "multi-axis-stud-clip-hinge"
  },
  {
    "id": "socket-joint",
    "code": "BW-CN-009",
    "name": "Socket Joint",
    "zh": "球窝关节",
    "family": "Connectors & SNOT",
    "type": "connector",
    "size": [
      12,
      3
    ],
    "sizeLabel": "Ø 6 socket",
    "dimensions": "12 × Ø 6 mm",
    "description": "球窝连接示意件，用于机械臂和可调支架。",
    "color": "#2877c7",
    "series": "brick-system",
    "connectionProfile": "multi-axis-stud-clip-hinge"
  },
  {
    "id": "pin-connector",
    "code": "BW-CN-010",
    "name": "Pin Connector Block",
    "zh": "双孔连接块",
    "family": "Connectors & SNOT",
    "type": "connector",
    "size": [
      18,
      3
    ],
    "sizeLabel": "18 mm connector",
    "dimensions": "18 × 8 × 8 mm",
    "description": "连接销式双端连接块，用于机械结构过渡。",
    "color": "#303941",
    "series": "brick-system",
    "connectionProfile": "multi-axis-stud-clip-hinge"
  },
  {
    "id": "axle-connector",
    "code": "BW-CN-011",
    "name": "Axle Connector",
    "zh": "十字轴连接套",
    "family": "Connectors & SNOT",
    "type": "connector",
    "size": [
      16,
      3
    ],
    "sizeLabel": "16 mm axle connector",
    "dimensions": "16 × Ø 8 mm",
    "description": "十字轴向连接套，用于轴与轴的延长连接。",
    "color": "#d71920",
    "series": "brick-system",
    "connectionProfile": "multi-axis-stud-clip-hinge"
  },
  {
    "id": "corner-plate",
    "code": "BW-CN-012",
    "name": "Corner Plate",
    "zh": "直角连接板",
    "family": "Connectors & SNOT",
    "type": "corner",
    "size": [
      24,
      24,
      4,
      3
    ],
    "sizeLabel": "24 × 24 L plate",
    "dimensions": "24 × 24 × 4 mm",
    "description": "L 形平面连接件，用于底板转角和墙体固定。",
    "color": "#237a45",
    "series": "brick-system",
    "connectionProfile": "multi-axis-stud-clip-hinge"
  },
  {
    "id": "beam-3",
    "code": "BW-TC-001",
    "name": "Technic Beam 3",
    "zh": "3孔机械梁",
    "family": "Technic Structure",
    "type": "beam",
    "size": [
      3,
      7.8
    ],
    "sizeLabel": "3 holes",
    "dimensions": "24 × 7.8 × 7.8 mm",
    "description": "穿孔结构梁，用于机械框架、底盘和摇臂。",
    "color": "#303941",
    "series": "technic-mechanics",
    "connectionProfile": "technic-hole-8mm-axle-cross"
  },
  {
    "id": "beam-5",
    "code": "BW-TC-002",
    "name": "Technic Beam 5",
    "zh": "5孔机械梁",
    "family": "Technic Structure",
    "type": "beam",
    "size": [
      5,
      7.8
    ],
    "sizeLabel": "5 holes",
    "dimensions": "40 × 7.8 × 7.8 mm",
    "description": "穿孔结构梁，用于机械框架、底盘和摇臂。",
    "color": "#303941",
    "series": "technic-mechanics",
    "connectionProfile": "technic-hole-8mm-axle-cross"
  },
  {
    "id": "beam-7",
    "code": "BW-TC-003",
    "name": "Technic Beam 7",
    "zh": "7孔机械梁",
    "family": "Technic Structure",
    "type": "beam",
    "size": [
      7,
      7.8
    ],
    "sizeLabel": "7 holes",
    "dimensions": "56 × 7.8 × 7.8 mm",
    "description": "穿孔结构梁，用于机械框架、底盘和摇臂。",
    "color": "#303941",
    "series": "technic-mechanics",
    "connectionProfile": "technic-hole-8mm-axle-cross"
  },
  {
    "id": "beam-9",
    "code": "BW-TC-004",
    "name": "Technic Beam 9",
    "zh": "9孔机械梁",
    "family": "Technic Structure",
    "type": "beam",
    "size": [
      9,
      7.8
    ],
    "sizeLabel": "9 holes",
    "dimensions": "72 × 7.8 × 7.8 mm",
    "description": "穿孔结构梁，用于机械框架、底盘和摇臂。",
    "color": "#303941",
    "series": "technic-mechanics",
    "connectionProfile": "technic-hole-8mm-axle-cross"
  },
  {
    "id": "beam-11",
    "code": "BW-TC-005",
    "name": "Technic Beam 11",
    "zh": "11孔机械梁",
    "family": "Technic Structure",
    "type": "beam",
    "size": [
      11,
      7.8
    ],
    "sizeLabel": "11 holes",
    "dimensions": "88 × 7.8 × 7.8 mm",
    "description": "穿孔结构梁，用于机械框架、底盘和摇臂。",
    "color": "#303941",
    "series": "technic-mechanics",
    "connectionProfile": "technic-hole-8mm-axle-cross"
  },
  {
    "id": "beam-13",
    "code": "BW-TC-006",
    "name": "Technic Beam 13",
    "zh": "13孔机械梁",
    "family": "Technic Structure",
    "type": "beam",
    "size": [
      13,
      7.8
    ],
    "sizeLabel": "13 holes",
    "dimensions": "104 × 7.8 × 7.8 mm",
    "description": "穿孔结构梁，用于机械框架、底盘和摇臂。",
    "color": "#303941",
    "series": "technic-mechanics",
    "connectionProfile": "technic-hole-8mm-axle-cross"
  },
  {
    "id": "thin-liftarm-5",
    "code": "BW-TC-007",
    "name": "Thin Liftarm 5",
    "zh": "五孔薄机械梁",
    "family": "Technic Structure",
    "type": "beam",
    "size": [
      5,
      4
    ],
    "sizeLabel": "5 holes / thin",
    "dimensions": "40 × 7.8 × 4 mm",
    "description": "薄型穿孔梁，用于空间受限的连接层。",
    "color": "#2877c7",
    "series": "technic-mechanics",
    "connectionProfile": "technic-hole-8mm-axle-cross"
  },
  {
    "id": "thick-liftarm-5",
    "code": "BW-TC-008",
    "name": "Thick Liftarm 5",
    "zh": "五孔厚机械梁",
    "family": "Technic Structure",
    "type": "beam",
    "size": [
      5,
      10
    ],
    "sizeLabel": "5 holes / reinforced",
    "dimensions": "40 × 7.8 × 10 mm",
    "description": "加厚梁示意件，适合表现更强的结构截面。",
    "color": "#303941",
    "series": "technic-mechanics",
    "connectionProfile": "technic-hole-8mm-axle-cross"
  },
  {
    "id": "angle-beam-3x5",
    "code": "BW-TC-009",
    "name": "Angle Beam 3 × 5",
    "zh": "3×5 直角机械梁",
    "family": "Technic Structure",
    "type": "angle-beam",
    "size": [
      3,
      5
    ],
    "sizeLabel": "3 × 5 holes",
    "dimensions": "40 × 40 × 7.8 mm",
    "description": "L 形穿孔梁，用于底盘转角与空间框架。",
    "color": "#e45a46",
    "series": "technic-mechanics",
    "connectionProfile": "technic-hole-8mm-axle-cross"
  },
  {
    "id": "triangle-frame",
    "code": "BW-TC-010",
    "name": "Triangle Frame",
    "zh": "三角框架",
    "family": "Technic Structure",
    "type": "frame",
    "size": [
      40,
      34,
      8,
      5
    ],
    "sizeLabel": "40 × 34 frame",
    "dimensions": "40 × 34 × 8 mm",
    "description": "三角加强框架的可视化示意，便于讲解三角稳定结构。",
    "color": "#4b5963",
    "series": "technic-mechanics",
    "connectionProfile": "technic-hole-8mm-axle-cross"
  },
  {
    "id": "friction-pin",
    "code": "BW-TC-011",
    "name": "Friction Pin",
    "zh": "摩擦连接销示意",
    "family": "Technic Structure",
    "type": "pin",
    "size": [
      12
    ],
    "sizeLabel": "12 mm friction pin",
    "dimensions": "12 mm nominal",
    "description": "带环形摩擦纹理的连接销示意件，不模拟真实摩擦等级。",
    "color": "#202a32",
    "series": "technic-mechanics",
    "connectionProfile": "technic-hole-8mm-axle-cross"
  },
  {
    "id": "smooth-pin",
    "code": "BW-TC-012",
    "name": "Smooth Pin",
    "zh": "光滑连接销",
    "family": "Technic Structure",
    "type": "pin",
    "size": [
      12
    ],
    "sizeLabel": "12 mm smooth pin",
    "dimensions": "12 mm nominal",
    "description": "光滑连接销示意件，适合表达可转动连接。",
    "color": "#8b969f",
    "series": "technic-mechanics",
    "connectionProfile": "technic-hole-8mm-axle-cross"
  },
  {
    "id": "axle-3",
    "code": "BW-TC-013",
    "name": "Cross Axle 3",
    "zh": "三模块十字轴",
    "family": "Technic Structure",
    "type": "axle",
    "size": [
      24
    ],
    "sizeLabel": "3 modules",
    "dimensions": "24 mm nominal",
    "description": "短十字轴，用于齿轮、轮毂和摇柄连接。",
    "color": "#606b75",
    "series": "technic-mechanics",
    "connectionProfile": "technic-hole-8mm-axle-cross"
  },
  {
    "id": "axle-5",
    "code": "BW-TC-014",
    "name": "Cross Axle 5",
    "zh": "五模块十字轴",
    "family": "Technic Structure",
    "type": "axle",
    "size": [
      40
    ],
    "sizeLabel": "5 modules",
    "dimensions": "40 mm nominal",
    "description": "中长度十字轴，用于传递旋转运动。",
    "color": "#303941",
    "series": "technic-mechanics",
    "connectionProfile": "technic-hole-8mm-axle-cross"
  },
  {
    "id": "half-bushing",
    "code": "BW-TC-015",
    "name": "Half Bushing",
    "zh": "半宽轴套",
    "family": "Technic Structure",
    "type": "bushing",
    "size": [
      4,
      2.2,
      2
    ],
    "sizeLabel": "4 / 2.2 / 2 mm",
    "dimensions": "Ø 8 × 2 mm",
    "description": "用于轴向限位的环形套筒示意件。",
    "color": "#f4a62a",
    "series": "technic-mechanics",
    "connectionProfile": "technic-hole-8mm-axle-cross"
  },
  {
    "id": "gear-8t",
    "code": "BW-GR-001",
    "name": "8-tooth Gear",
    "zh": "8齿齿轮",
    "family": "Gears & Transmission",
    "type": "gear",
    "size": [
      4.5,
      8,
      3.2
    ],
    "sizeLabel": "8 teeth",
    "dimensions": "Ø 9 × 3.2 mm",
    "description": "程序化齿轮盘，用于演示齿数、啮合与传动比。",
    "color": "#f4a62a",
    "series": "technic-mechanics",
    "connectionProfile": "axle-cross-gear-mesh"
  },
  {
    "id": "gear-12t",
    "code": "BW-GR-002",
    "name": "12-tooth Gear",
    "zh": "12齿齿轮",
    "family": "Gears & Transmission",
    "type": "gear",
    "size": [
      6,
      12,
      3.2
    ],
    "sizeLabel": "12 teeth",
    "dimensions": "Ø 12 × 3.2 mm",
    "description": "程序化齿轮盘，用于演示齿数、啮合与传动比。",
    "color": "#f4a62a",
    "series": "technic-mechanics",
    "connectionProfile": "axle-cross-gear-mesh"
  },
  {
    "id": "gear-16t",
    "code": "BW-GR-003",
    "name": "16-tooth Gear",
    "zh": "16齿齿轮",
    "family": "Gears & Transmission",
    "type": "gear",
    "size": [
      8,
      16,
      3.2
    ],
    "sizeLabel": "16 teeth",
    "dimensions": "Ø 16 × 3.2 mm",
    "description": "程序化齿轮盘，用于演示齿数、啮合与传动比。",
    "color": "#f4a62a",
    "series": "technic-mechanics",
    "connectionProfile": "axle-cross-gear-mesh"
  },
  {
    "id": "gear-20t",
    "code": "BW-GR-004",
    "name": "20-tooth Gear",
    "zh": "20齿齿轮",
    "family": "Gears & Transmission",
    "type": "gear",
    "size": [
      10,
      20,
      4
    ],
    "sizeLabel": "20 teeth",
    "dimensions": "Ø 20 × 4 mm",
    "description": "程序化齿轮盘，用于演示齿数、啮合与传动比。",
    "color": "#f4a62a",
    "series": "technic-mechanics",
    "connectionProfile": "axle-cross-gear-mesh"
  },
  {
    "id": "gear-24t",
    "code": "BW-GR-005",
    "name": "24-tooth Gear",
    "zh": "24齿齿轮",
    "family": "Gears & Transmission",
    "type": "gear",
    "size": [
      12,
      24,
      4
    ],
    "sizeLabel": "24 teeth",
    "dimensions": "Ø 24 × 4 mm",
    "description": "程序化齿轮盘，用于演示齿数、啮合与传动比。",
    "color": "#f4a62a",
    "series": "technic-mechanics",
    "connectionProfile": "axle-cross-gear-mesh"
  },
  {
    "id": "worm-gear",
    "code": "BW-GR-006",
    "name": "Worm Gear",
    "zh": "蜗杆",
    "family": "Gears & Transmission",
    "type": "worm-gear",
    "size": [
      4,
      24,
      4
    ],
    "sizeLabel": "Ø 8 × 24 mm",
    "dimensions": "Ø 8 × 24 mm",
    "description": "螺旋齿杆示意件，用于解释蜗杆传动结构。",
    "color": "#b7c1c9",
    "series": "technic-mechanics",
    "connectionProfile": "axle-cross-gear-mesh"
  },
  {
    "id": "rack-gear",
    "code": "BW-GR-007",
    "name": "Rack Gear",
    "zh": "齿条",
    "family": "Gears & Transmission",
    "type": "rack-gear",
    "size": [
      48,
      10,
      3
    ],
    "sizeLabel": "48 mm rack",
    "dimensions": "48 × 10 × 3 mm",
    "description": "直线齿条，将旋转运动转换为直线运动的示意件。",
    "color": "#e45a46",
    "series": "technic-mechanics",
    "connectionProfile": "axle-cross-gear-mesh"
  },
  {
    "id": "bevel-gear-12t",
    "code": "BW-GR-008",
    "name": "12-tooth Bevel Gear",
    "zh": "12齿锥齿轮",
    "family": "Gears & Transmission",
    "type": "bevel-gear",
    "size": [
      8,
      12,
      4
    ],
    "sizeLabel": "12 bevel teeth",
    "dimensions": "Ø 16 × 4 mm",
    "description": "锥形齿面示意件，用于改变传动轴方向。",
    "color": "#f4a62a",
    "series": "technic-mechanics",
    "connectionProfile": "axle-cross-gear-mesh"
  },
  {
    "id": "turntable-small",
    "code": "BW-GR-009",
    "name": "Compact Turntable",
    "zh": "小型转盘轴承",
    "family": "Gears & Transmission",
    "type": "turntable",
    "size": [
      16,
      5
    ],
    "sizeLabel": "Ø 32 turntable",
    "dimensions": "Ø 32 × 5 mm",
    "description": "上下层可相对旋转的转盘结构示意。",
    "color": "#2877c7",
    "series": "technic-mechanics",
    "connectionProfile": "axle-cross-gear-mesh"
  },
  {
    "id": "differential-case",
    "code": "BW-GR-010",
    "name": "Differential Case",
    "zh": "差速器壳体",
    "family": "Gears & Transmission",
    "type": "differential",
    "size": [
      12,
      18
    ],
    "sizeLabel": "Ø 24 differential",
    "dimensions": "Ø 24 × 18 mm",
    "description": "差速器外壳与横向输出轴示意，用于车辆传动教学。",
    "color": "#303941",
    "series": "technic-mechanics",
    "connectionProfile": "axle-cross-gear-mesh"
  },
  {
    "id": "wheel-compact",
    "code": "BW-WH-001",
    "name": "Compact Wheel",
    "zh": "紧凑轮组",
    "family": "Wheels & Motion",
    "type": "wheel",
    "size": [
      10,
      7
    ],
    "sizeLabel": "Ø 20 × 7 mm",
    "dimensions": "Ø 20 × 7 mm",
    "description": "小型轮胎与轮毂组合，适合机器人和轻型车辆。",
    "color": "#252d34",
    "series": "technic-mechanics",
    "connectionProfile": "axle-cross-rolling-track"
  },
  {
    "id": "wheel-medium",
    "code": "BW-WH-002",
    "name": "Medium Wheel",
    "zh": "中型轮组",
    "family": "Wheels & Motion",
    "type": "wheel",
    "size": [
      14,
      8
    ],
    "sizeLabel": "Ø 28 × 8 mm",
    "dimensions": "Ø 28 × 8 mm",
    "description": "中型轮组，适合越野车和移动底盘。",
    "color": "#252d34",
    "series": "technic-mechanics",
    "connectionProfile": "axle-cross-rolling-track"
  },
  {
    "id": "wheel-large",
    "code": "BW-WH-003",
    "name": "Large Wheel",
    "zh": "大型轮组",
    "family": "Wheels & Motion",
    "type": "wheel",
    "size": [
      18,
      10
    ],
    "sizeLabel": "Ø 36 × 10 mm",
    "dimensions": "Ø 36 × 10 mm",
    "description": "大直径轮组，用于重型载具和工程车辆。",
    "color": "#202a32",
    "series": "technic-mechanics",
    "connectionProfile": "axle-cross-rolling-track"
  },
  {
    "id": "tire-offroad",
    "code": "BW-WH-004",
    "name": "Off-road Tire",
    "zh": "越野胎",
    "family": "Wheels & Motion",
    "type": "wheel",
    "size": [
      16,
      10
    ],
    "sizeLabel": "Ø 32 / treaded",
    "dimensions": "Ø 32 × 10 mm",
    "description": "带粗犷胎面视觉纹理的越野轮胎示意件。",
    "color": "#171d22",
    "series": "technic-mechanics",
    "connectionProfile": "axle-cross-rolling-track"
  },
  {
    "id": "tire-slick",
    "code": "BW-WH-005",
    "name": "Slick Tire",
    "zh": "光头胎",
    "family": "Wheels & Motion",
    "type": "wheel",
    "size": [
      14,
      9
    ],
    "sizeLabel": "Ø 28 / smooth",
    "dimensions": "Ø 28 × 9 mm",
    "description": "平滑胎面轮胎，用于赛车和高速载具展示。",
    "color": "#20262c",
    "series": "technic-mechanics",
    "connectionProfile": "axle-cross-rolling-track"
  },
  {
    "id": "wheel-hub",
    "code": "BW-WH-006",
    "name": "Wheel Hub",
    "zh": "轮毂",
    "family": "Wheels & Motion",
    "type": "wheel",
    "size": [
      9,
      7
    ],
    "sizeLabel": "Ø 18 hub",
    "dimensions": "Ø 18 × 7 mm",
    "description": "独立轮毂件，可用于拆解轮胎与轴连接关系。",
    "color": "#b7c1c9",
    "series": "technic-mechanics",
    "connectionProfile": "axle-cross-rolling-track"
  },
  {
    "id": "track-link",
    "code": "BW-WH-007",
    "name": "Track Link",
    "zh": "履带单节",
    "family": "Wheels & Motion",
    "type": "track",
    "size": [
      5,
      20,
      8,
      1
    ],
    "sizeLabel": "20 mm link",
    "dimensions": "20 × 8 × 5 mm",
    "description": "单节履带板示意，表现履带的重复链节结构。",
    "color": "#606b75",
    "series": "technic-mechanics",
    "connectionProfile": "axle-cross-rolling-track"
  },
  {
    "id": "track-unit",
    "code": "BW-WH-008",
    "name": "Track Unit",
    "zh": "履带总成",
    "family": "Wheels & Motion",
    "type": "track",
    "size": [
      8,
      28,
      8,
      18
    ],
    "sizeLabel": "28 mm wheel spacing",
    "dimensions": "56 × 24 × 8 mm",
    "description": "由两端轮和多节链板组成的短履带总成。",
    "color": "#303941",
    "series": "technic-mechanics",
    "connectionProfile": "axle-cross-rolling-track"
  },
  {
    "id": "wall-panel",
    "code": "BW-AR-001",
    "name": "Wall Panel",
    "zh": "墙体面板",
    "family": "Architecture",
    "type": "panel",
    "size": [
      48,
      24,
      4
    ],
    "sizeLabel": "48 × 24 panel",
    "dimensions": "48 × 24 × 4 mm",
    "description": "模块化墙体基础面板，可与门窗和转角构件组合。",
    "color": "#f0d7a8",
    "series": "modular-city",
    "connectionProfile": "panel-edge-stud-grid"
  },
  {
    "id": "window-frame",
    "code": "BW-AR-002",
    "name": "Window Frame",
    "zh": "窗框模块",
    "family": "Architecture",
    "type": "window",
    "size": [
      28,
      28,
      4
    ],
    "sizeLabel": "28 × 28 window",
    "dimensions": "28 × 28 × 4 mm",
    "description": "带横竖分隔框和透明窗片的建筑模块。",
    "color": "#f4f0e6",
    "series": "modular-city",
    "connectionProfile": "panel-edge-stud-grid"
  },
  {
    "id": "door-panel",
    "code": "BW-AR-003",
    "name": "Door Panel",
    "zh": "门板模块",
    "family": "Architecture",
    "type": "door",
    "size": [
      18,
      44,
      4
    ],
    "sizeLabel": "18 × 44 door",
    "dimensions": "18 × 44 × 4 mm",
    "description": "带观察窗和把手的入口门板。",
    "color": "#b76b3f",
    "series": "modular-city",
    "connectionProfile": "panel-edge-stud-grid"
  },
  {
    "id": "arch-window",
    "code": "BW-AR-004",
    "name": "Arched Window",
    "zh": "拱形窗模块",
    "family": "Architecture",
    "type": "arch",
    "size": [
      32,
      32,
      4,
      4
    ],
    "sizeLabel": "32 × 32 arch",
    "dimensions": "32 × 32 × 4 mm",
    "description": "拱形开口窗洞，用于古典立面与街景。",
    "color": "#8ed7df",
    "series": "modular-city",
    "connectionProfile": "panel-edge-stud-grid"
  },
  {
    "id": "roof-tile",
    "code": "BW-AR-005",
    "name": "Roof Tile",
    "zh": "屋顶瓦片",
    "family": "Architecture",
    "type": "slope",
    "size": [
      2,
      4
    ],
    "sizeLabel": "2 × 4 slope tile",
    "dimensions": "15.8 × 31.8 × 9.6 mm",
    "description": "重复铺设形成屋顶坡面和檐口。",
    "color": "#e45a46",
    "series": "modular-city",
    "connectionProfile": "panel-edge-stud-grid"
  },
  {
    "id": "column",
    "code": "BW-AR-006",
    "name": "Architectural Column",
    "zh": "建筑立柱",
    "family": "Architecture",
    "type": "cylinder",
    "size": [
      4,
      48
    ],
    "sizeLabel": "Ø 8 × 48 mm",
    "dimensions": "Ø 8 × 48 mm",
    "description": "竖向圆柱支撑件，用于柱廊、站棚与立面细节。",
    "color": "#f0d7a8",
    "series": "modular-city",
    "connectionProfile": "panel-edge-stud-grid"
  },
  {
    "id": "railing",
    "code": "BW-AR-007",
    "name": "Railing Beam",
    "zh": "栏杆横梁",
    "family": "Architecture",
    "type": "beam",
    "size": [
      5,
      4
    ],
    "sizeLabel": "40 × 4 rail",
    "dimensions": "40 × 4 × 4 mm",
    "description": "细型横梁，用于阳台、平台与楼梯护栏。",
    "color": "#303941",
    "series": "modular-city",
    "connectionProfile": "panel-edge-stud-grid"
  },
  {
    "id": "balcony-floor",
    "code": "BW-AR-008",
    "name": "Balcony Floor",
    "zh": "阳台平台",
    "family": "Architecture",
    "type": "panel",
    "size": [
      40,
      4,
      24
    ],
    "sizeLabel": "40 × 24 floor",
    "dimensions": "40 × 4 × 24 mm",
    "description": "薄型外挑平台，可与栏杆和墙体组合。",
    "color": "#2877c7",
    "series": "modular-city",
    "connectionProfile": "panel-edge-stud-grid"
  },
  {
    "id": "leaf-sprig",
    "code": "BW-NT-001",
    "name": "Leaf Sprig",
    "zh": "枝叶",
    "family": "Nature",
    "type": "leaf",
    "size": [
      20
    ],
    "sizeLabel": "20 mm leaf",
    "dimensions": "20 mm visual length",
    "description": "叶片与茎组合的自然装饰件，可重复布置成灌木。",
    "color": "#398653",
    "series": "modular-city",
    "connectionProfile": "decorative-anchor"
  },
  {
    "id": "flower",
    "code": "BW-NT-002",
    "name": "Flower",
    "zh": "花朵",
    "family": "Nature",
    "type": "flower",
    "size": [
      5,
      18
    ],
    "sizeLabel": "Ø 10 / 18 mm stem",
    "dimensions": "Ø 10 × 18 mm",
    "description": "由花瓣、花心和茎组成的独立植物装饰件。",
    "color": "#e98fa8",
    "series": "modular-city",
    "connectionProfile": "decorative-anchor"
  },
  {
    "id": "tree-trunk",
    "code": "BW-NT-003",
    "name": "Tree Trunk",
    "zh": "树干",
    "family": "Nature",
    "type": "tree-trunk",
    "size": [
      34,
      5
    ],
    "sizeLabel": "34 mm trunk",
    "dimensions": "Ø 10 × 34 mm",
    "description": "带分叉枝干的树木骨架，可承载叶冠组件。",
    "color": "#8a5b3d",
    "series": "modular-city",
    "connectionProfile": "decorative-anchor"
  },
  {
    "id": "rock",
    "code": "BW-NT-004",
    "name": "Rock Element",
    "zh": "岩石",
    "family": "Nature",
    "type": "rock",
    "size": [
      10
    ],
    "sizeLabel": "Ø 20 mm",
    "dimensions": "20 mm visual diameter",
    "description": "低多边形岩石体块，用于地形、庭院和自然场景。",
    "color": "#92958f",
    "series": "modular-city",
    "connectionProfile": "decorative-anchor"
  },
  {
    "id": "spring",
    "code": "BW-SP-001",
    "name": "Spring Element",
    "zh": "弹簧件",
    "family": "Special",
    "type": "spring",
    "size": [
      4,
      24,
      5
    ],
    "sizeLabel": "Ø 8 × 24 mm",
    "dimensions": "Ø 8 × 24 mm",
    "description": "螺旋弹簧示意件，用于悬挂、缓冲和机械结构展示。",
    "color": "#b7c1c9",
    "series": "brick-system",
    "connectionProfile": "special-purpose-interface"
  },
  {
    "id": "transparent-shell",
    "code": "BW-SP-002",
    "name": "Transparent Shell",
    "zh": "透明半球罩",
    "family": "Special",
    "type": "transparent-shell",
    "size": [
      14
    ],
    "sizeLabel": "Ø 28 mm",
    "dimensions": "Ø 28 mm",
    "description": "半透明保护罩，可用于座舱、展示罩和灯具。",
    "color": "#8ed7df",
    "series": "brick-system",
    "connectionProfile": "special-purpose-interface"
  },
  {
    "id": "light-brick",
    "code": "BW-SP-003",
    "name": "Light Brick",
    "zh": "发光砖块",
    "family": "Special",
    "type": "light-brick",
    "size": [
      2,
      2
    ],
    "sizeLabel": "2 × 2 light module",
    "dimensions": "15.8 × 15.8 × 9.6 mm",
    "description": "带透明灯罩的砖块示意件，用于灯塔、信号灯和设备。",
    "color": "#f4a62a",
    "series": "brick-system",
    "connectionProfile": "special-purpose-interface"
  },
  {
    "id": "grille-panel",
    "code": "BW-SP-004",
    "name": "Grille Panel",
    "zh": "格栅面板",
    "family": "Special",
    "type": "grille",
    "size": [
      40,
      24,
      3,
      7
    ],
    "sizeLabel": "40 × 24 / 7 slats",
    "dimensions": "40 × 24 × 3 mm",
    "description": "带平行格栅的面板，用于通风口、机械罩和建筑装饰。",
    "color": "#606b75",
    "series": "brick-system",
    "connectionProfile": "special-purpose-interface"
  },
  {
    "id": "bearing-sleeve-8mm",
    "code": "BW-TC-021",
    "name": "Technic Sleeve Bearing · 8 mm",
    "zh": "8mm 机械轴承衬套",
    "family": "Technic",
    "type": "bearing",
    "size": [
      4.68,
      3.9,
      7.6
    ],
    "sizeLabel": "Ø4.68 / Ø3.9 / 7.6 mm",
    "dimensions": "Outer Ø4.68 × bore Ø3.9 × width 7.6 mm",
    "description": "适用于机械梁孔的空心轴承衬套候选；仅说明名义几何间隙，未经材料、强度和打印配合认证。",
    "color": "#c8bda5",
    "series": "technic-mechanics",
    "connectionProfile": "nominal-axial-bearing"
  }
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
      part('bot-antenna', 'Signal antenna', 'pin', [0, 49, 0], '#e45a46', [12], 4, { rotation: [Math.PI / 2, 0, 0] })
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
      part('rover-windshield', 'Front windscreen', 'panel', [0, 23, 5], '#8ed7df', [26, 22, 2], 3, { transparent: true }),
      part('rover-roof', 'Cabin roof', 'plate', [0, 29, -4], '#f4f0e6', [3, 2], 4),
      part('rover-sensor', 'Roof sensor mast', 'pin', [0, 37, -4], '#303941', [14], 4, { rotation: [Math.PI / 2, 0, 0] }),
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
      part('cafe-front-pier-left', 'Front façade pier left', 'panel', [-34, 31, 36], '#f0d7a8', [8, 48, 4], 2),
      part('cafe-front-pier-right', 'Front façade pier right', 'panel', [34, 31, 36], '#f0d7a8', [8, 48, 4], 2),
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
      part('koi-bridge-deck', 'Bridge deck', 'plate', [0, 13, 0], '#b76b3f', [2, 7], 2),
      part('koi-bridge-rail-left', 'Bridge rail left', 'beam', [0, 21, -8], '#e6d2a8', [7], 2, { rotation: [0, Math.PI / 2, 0] }),
      part('koi-bridge-rail-right', 'Bridge rail right', 'beam', [0, 21, 8], '#e6d2a8', [7], 2, { rotation: [0, Math.PI / 2, 0] }),
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
