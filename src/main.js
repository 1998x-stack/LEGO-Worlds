import { SERIES, COMPONENTS, MODELS, MODEL_COUNT, COMPONENT_COUNT } from './catalog.js';
import { mountViewer, downloadAssemblyGlb } from './viewer.js';
import { getPartAnchors } from './connection-anchors.js';
import { mountBuilder } from './builder-lab.js';
import { isBuilderComponent } from './snap-engine.js';
import { mountMechanicsLab } from './mechanics-lab.js';
import { MECHANISM_PRESETS } from './technic-engine.js';
import { mountHierarchyLab } from './hierarchy-lab.js';
import { HIERARCHY_PRESETS } from './hierarchy-engine.js';
import { mountConstraintLab } from './constraint-lab.js';
import { GRAPH_PRESETS, GRAPH_CATALOG_IDS, graphPorts } from './constraint-graph.js';
import { AGENT_EXAMPLES, createAssemblyPlan } from './ai-agent.js';
import './styles.css';

const root = document.querySelector('#app');
const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const seriesName = id => SERIES.find(item => item.id === id)?.title || (id === 'creative-lab' ? 'Creative Lab' : id);
const seriesZh = id => SERIES.find(item => item.id === id)?.titleZh || '原创实验作品';

root.innerHTML = [
  '<header class="site-header">',
    '<a class="brand" href="#top" aria-label="Brick Worlds home">',
      '<span class="brand-mark"><i></i><i></i><i></i><i></i></span>',
      '<span class="brand-name">BRICK<span>WORLDS</span></span>',
      '<span class="brand-caption">OPEN BUILD SYSTEM</span>',
    '</a>',
    '<nav class="main-nav" aria-label="Main navigation">',
      '<a href="#series">Series</a><a href="#builds">Builds</a><a href="#components">Components</a><a href="#builder">Builder</a><a href="#mechanics">Mechanics</a><a href="#assembly">Assembly</a><a href="#constraints">Constraints</a><a href="#agent">AI Agent</a>',
      '<a class="nav-github" href="https://github.com/1998x-stack/LEGO-Worlds" target="_blank" rel="noopener noreferrer">GitHub ↗</a>',
    '</nav>',
    '<a class="header-cta" href="#builds">Explore builds <span>↗</span></a>',
    '<button class="mobile-menu" id="mobile-menu" aria-label="Toggle navigation" aria-expanded="false">☰</button>',
  '</header>',
  '<main>',
    '<section class="hero" id="top">',
      '<div class="hero-copy">',
        '<div class="eyebrow"><span class="eyebrow-dot"></span> A MODULAR WORLD / VOL. 01</div>',
        '<h1>Small pieces.<br/><em>Infinite</em> possibilities.</h1>',
        '<p class="hero-lead">从一颗凸点开始，理解一个完整的拼搭系统。探索基础组件、拆解原创作品，再从零组合属于你的三维世界。</p>',
        '<div class="hero-actions"><a class="button button-yellow" href="#builds">Explore the builds <span>↗</span></a><a class="text-link" href="#components">Browse components <span>↓</span></a></div>',
        '<div class="hero-footnote"><span class="status-pip"></span> ORIGINAL PROCEDURAL GEOMETRY <b>·</b> THREE.JS POWERED <b>·</b> UNOFFICIAL FAN PROJECT',
      '</div>',
      '<div class="hero-stage">',
        '<div class="stage-card">',
          '<div class="stage-card-top"><span>FEATURED BUILD / 001</span><span class="live-dot">● LIVE 3D</span></div>',
          '<canvas id="hero-canvas" aria-label="Interactive three-dimensional Clockwork Koi Garden model"></canvas>',
          '<div class="stage-card-bottom"><div><strong>Clockwork Koi Garden</strong><span>发条锦鲤庭院 · Creative Lab</span></div><button id="hero-open" class="round-arrow" aria-label="Inspect featured model">↗</button></div>',
          '<div class="stage-coordinate">X <b>+</b> Y <b>+</b> Z <b>+</b></div>',
        '</div>',
        '<div class="floating-note note-yellow"><span>8 mm</span><small>STUD PITCH</small></div>',
        '<div class="floating-note note-blue"><span>3D</span><small>ASSEMBLY VIEW</small></div>',
      '</div>',
      '<div class="hero-bottom-rule"><span>01 / EXPLORE THE SYSTEM</span><span>SCROLL TO BUILD ↓</span></div>',
    '</section>',
    '<section class="stats-strip" aria-label="Project highlights">',
      '<div><strong>' + MODEL_COUNT.toString().padStart(2, '0') + '</strong><span>ORIGINAL BUILDS</span></div>',
      '<div><strong>' + COMPONENT_COUNT.toString().padStart(2, '0') + '</strong><span>BASE COMPONENTS</span></div>',
      '<div><strong>08<span>mm</span></strong><span>STUD PITCH</span></div>',
      '<div><strong>∞</strong><span>WAYS TO RECOMBINE</span></div>',
    '</section>',
    '<section class="section series-section" id="series">',
      '<div class="section-heading"><div><div class="section-kicker">01 — THE BUILDING SYSTEM</div><h2>Three ways to <em>build a world.</em></h2></div><p>从基础几何到机械传动，再到完整城市。三个系列共享同一套可复用的组件思维。</p></div>',
      '<div class="series-grid" id="series-grid"></div>',
    '</section>',
    '<section class="section builds-section" id="builds">',
      '<div class="section-heading"><div><div class="section-kicker">02 — ASSEMBLY GALLERY</div><h2>Built piece <em>by piece.</em></h2></div><p>每个作品都可以进入三维查看器，旋转、缩放、选择零件，并通过爆炸视图理解装配关系。</p></div>',
      '<div class="catalog-toolbar"><div class="filter-row" id="series-filters"></div><label class="search-field"><span>⌕</span><input id="model-search" type="search" placeholder="Search builds..." aria-label="Search builds"/><kbd>/</kbd></label></div>',
      '<div class="model-grid" id="model-grid"></div>',
      '<div class="lab-banner"><div class="lab-orbit"><span></span><i></i><b></b></div><div class="lab-copy"><span class="lab-kicker">A LITTLE EXTRA / CREATIVE LAB</span><h3>Not just bricks.<br/><em>A whole tiny universe.</em></h3><p>Clockwork Koi Garden 是首个原创实验作品：把机械、自然与建筑组件组合成一座微缩庭院。</p></div><button class="button button-dark" id="lab-open">Explore the garden ↗</button></div>',
    '</section>',
    '<section class="components-section" id="components">',
      '<div class="section components-inner">',
        '<div class="section-heading"><div><div class="section-kicker">03 — THE COMPONENT LIBRARY</div><h2>Know your <em>pieces.</em></h2></div><p>基础组件不是孤立的模型，而是可被多个作品重复使用的构造语言。点击任意零件查看三维形态。</p></div>',
        '<div class="component-toolbar"><div><strong id="component-count">' + COMPONENT_COUNT + '</strong><span> COMPONENT TYPES</span></div><label class="search-field component-search"><span>⌕</span><input id="component-search" type="search" placeholder="Search ' + COMPONENTS.length + ' components..." aria-label="Search components"/><kbd>⌕</kbd></label></div><div class="family-filters" id="family-filters"></div>',
        '<div class="component-grid" id="component-grid"></div>',
      '</div>',
    '</section>',

    '<section class="section builder-section" id="builder">',
      '<div class="section-heading"><div><div class="section-kicker">04 — SNAP BUILDER LAB</div><h2>Snap it. <em>Build it.</em></h2></div><p>真实操作凸点/底部接口的连接关系：拖动零件靠近可用凸点，绿色预览表示可拼搭，红色表示碰撞。</p></div>',
      '<div class="builder-intro" id="builder-intro"><div><span>EARLY BUILDER / V0.3</span><h3>从一块底板，开始搭建你的作品。</h3><p>首批支持标准砖块、薄板、光滑板与 Jumper。可旋转、拆解、撤销、导入导出装配 JSON，也能导出 GLB。</p></div><button id="launch-builder" class="button button-yellow">Launch snap builder ↗</button></div>',
      '<div class="builder-workspace" id="builder-workspace" hidden>',
        '<div class="builder-stage"><div class="builder-stage-header"><span>LIVE / THREE.JS SNAP SOLVER</span><span>DRAG PIECES · ORBIT EMPTY SPACE</span></div><canvas id="builder-canvas" aria-label="Interactive drag and snap brick builder"></canvas><div class="builder-legend"><span><i class="ready"></i>可连接</span><span><i class="blocked"></i>碰撞</span><span><i class="near"></i>待对齐</span></div></div>',
        '<aside class="builder-sidebar">',
          '<div class="builder-metrics"><div><strong id="builder-piece-count">1</strong><span>PARTS</span></div><div><strong id="builder-link-count">0</strong><span>ANCHOR EDGES</span></div></div>',
          '<label class="builder-label" for="builder-part-picker">Choose a component / 选择零件</label>',
          '<select id="builder-part-picker" class="builder-part-picker" aria-label="Choose a component to add">' + COMPONENTS.filter(isBuilderComponent).map(c => '<option value="' + safe(c.id) + '">' + safe(c.zh) + ' · ' + safe(c.sizeLabel) + '</option>').join('') + '</select>',
          '<button class="builder-primary" id="builder-add">＋ Add selected part</button>',
          '<div class="builder-actions"><button id="builder-turn">↻ Rotate 90°</button><button id="builder-up">↑ Up 3.2mm</button><button id="builder-down">↓ Down 3.2mm</button><button id="builder-delete">× Delete selected</button></div>',
          '<div class="builder-actions"><button id="builder-undo">← Undo</button><button id="builder-redo">→ Redo</button><button id="builder-reset-camera">◎ Reset camera</button></div>',
          '<p class="builder-status" id="builder-status" role="status" aria-live="polite">点击添加零件，移动鼠标到已有积木上，然后点击确认。</p>',
          '<div class="builder-part-heading">ASSEMBLY / 零件列表</div><div class="builder-part-list" id="builder-parts"></div>',
          '<div class="builder-exports"><button id="builder-export-json">↓ Export JSON</button><button id="builder-import-json">↑ Import JSON</button><button id="builder-export-glb">↓ Export GLB</button><input type="file" accept=".json,application/json" id="builder-import-input" hidden/></div>',
          '<small class="builder-disclaimer">仅开放 stud ↔ socket 自动吸附；Technic、齿轮和球关节仍需专用配合检查。示意几何不代表真实零件公差。</small>',
        '</aside>',
      '</div>',
    '</section>',

    '<section class="section mechanics-section" id="mechanics">',
      '<div class="section-heading"><div><div class="section-kicker">05 — TECHNIC MECHANICS LAB</div><h2>Connect. <em>Transmit.</em></h2></div><p>销钉、机械梁、十字轴、贯通轮毂与齿轮的装配实验台。通过真实坐标约束理解机械结构和转动关系。</p></div>',
      '<div class="mechanics-hero" id="mechanics-hero"><div><span>TECHNIC ASSEMBLY / V0.4</span><h3>从一条梁，连接一个会转动的机械系统。</h3><p>点击梁孔选择位置，安装销钉或十字轴；再将齿轮与轮子安装到轴上。查看连接图、拆解动画和齿轮传动。</p></div><button class="button button-yellow" id="mechanics-launch">Open mechanics lab ↗</button></div>',
      '<div class="mechanics-workspace" id="mechanics-workspace" hidden>',
        '<div class="mechanics-stage"><div class="mechanics-stage-top"><span>LIVE MECHANICS / THREE.JS</span><span>CLICK A BEAM HOLE · ORBIT TO INSPECT</span></div><canvas id="mechanics-canvas" aria-label="Interactive Technic mechanical assembly and gear drive"></canvas><div class="mechanics-timeline"><button id="mechanics-disassemble">↗ Disassemble</button><input aria-label="Assembly explode progress" id="mechanics-explode" type="range" min="0" max="100" value="0"/><button id="mechanics-assemble">↘ Assemble</button></div><div class="mechanics-footnote">绿色圆环 = 可用梁孔 · 红色圆环 = 已占用 · 旋转是运动学示意，不是物理动力学求解</div></div>',
        '<aside class="mechanics-sidebar">',
          '<div class="mechanics-counters"><div><strong id="mechanics-parts-count">5</strong><span>PARTS</span></div><div><strong id="mechanics-joints-count">5</strong><span>JOINT EDGES</span></div></div>',
          '<label class="builder-label" for="mechanics-preset">Mechanism preset / 示例机械结构</label>',
          '<div class="mechanics-row"><select id="mechanics-preset" class="builder-part-picker">' + MECHANISM_PRESETS.map(p => '<option value="' + safe(p.id) + '">' + safe(p.zh) + ' / ' + safe(p.name) + '</option>').join('') + '</select><button id="mechanics-load">Load</button></div>',
          '<div class="mechanics-group"><label class="builder-label" for="mechanics-hole">1 · Select beam hole / 选择梁孔</label><select id="mechanics-hole" class="builder-part-picker"></select><label class="builder-label" for="mechanics-shaft-piece">2 · Insert pin or axle / 安装销钉或轴</label><select id="mechanics-shaft-piece" class="builder-part-picker"><option value="smooth-pin">光滑销钉 / Smooth pin</option><option value="friction-pin">摩擦销钉 / Friction pin</option><option value="axle-3">3L 十字轴</option><option value="axle-5">5L 十字轴</option></select><button class="mechanics-primary" id="mechanics-insert">+ Install into hole</button></div>',
          '<div class="mechanics-group"><label class="builder-label" for="mechanics-mount-shaft">3 · Choose installed axle / 选择轴</label><select id="mechanics-mount-shaft" class="builder-part-picker"></select><label class="builder-label" for="mechanics-accessory">4 · Mount an accessory / 安装轮组或齿轮</label><select id="mechanics-accessory" class="builder-part-picker"><option value="gear-16t">16T 齿轮</option><option value="gear-8t">8T 齿轮</option><option value="gear-24t">24T 齿轮</option><option value="wheel-medium">中型轮组</option><option value="wheel-compact">小型轮组</option></select><button class="mechanics-primary" id="mechanics-mount">+ Mount to axle</button></div>',
          '<div class="mechanics-drive"><button id="mechanics-play">▶ Drive</button><label class="builder-label" for="mechanics-speed">DRIVE SPEED · <span id="mechanics-rpm">15</span> RPM</label><input id="mechanics-speed" type="range" min="0" max="60" step="1" value="15"/><button id="mechanics-anchors">◎ Show anchors</button></div>',
          '<div class="mechanics-tools"><button id="mechanics-undo">← Undo</button><button id="mechanics-redo">→ Redo</button><button id="mechanics-remove">× Remove last</button><button id="mechanics-camera">◎ Reset view</button></div>',
          '<div role="status" aria-live="polite" class="mechanics-status" id="mechanics-status">加载机械示例后，可以观察齿轮传动。</div>',
          '<div class="mechanics-graph-heading">LIVE CONNECTION GRAPH / 连接关系</div><div class="mechanics-graph" id="mechanics-graph"></div>',
          '<div class="mechanics-tools"><button id="mechanics-export-json">↓ Export JSON</button><button id="mechanics-import-json">↑ Import JSON</button><button id="mechanics-export-glb">↓ Export GLB</button><input type="file" accept=".json,application/json" id="mechanics-import-file" hidden/></div>',
          '<small class="mechanics-disclaimer">仅模拟当前所支持的销孔、轴孔、键连接与两直齿轮反向运动。齿轮齿形为简化模型，尚未验证力矩、摩擦、公差和真实物理啮合。</small>',
        '</aside>',
      '</div>',
    '</section>',

    '<section class="section hierarchy-section" id="assembly">',
      '<div class="section-heading"><div><div class="section-kicker">06 — JOINTS & HIERARCHY / V0.5</div><h2>Move one joint. <em>Move a system.</em></h2></div><p>层级装配树、铰链约束传播、对称联动，以及自动生成的逐零件拆解和装配时间轴。</p></div>',
      '<div class="hierarchy-intro" id="hierarchy-intro"><div><span>NEW · HIERARCHICAL ASSEMBLY</span><h3>让机械结构真正理解自己的父子关系。</h3><p>三种原创机械结构：双关节吊臂、双叶联动吊桥、双翼太阳能观测站。调整任意主关节，整个子总成同步变换。</p></div><button id="hierarchy-launch" class="button button-yellow">Open assembly lab ↗</button></div>',
      '<div class="hierarchy-workspace" id="hierarchy-workspace" hidden>',
        '<div class="hierarchy-stage"><div class="hierarchy-stage-top"><span>REAL-TIME KINEMATICS / THREE.JS</span><span>ORBIT · ZOOM · CLICK TO SELECT SUBASSEMBLY</span></div><canvas id="hierarchy-canvas" aria-label="Interactive hierarchy and hinged assembly viewer"></canvas>',
          '<div class="hierarchy-timeline"><button id="hierarchy-disassemble">↗ Disassemble</button><input id="hierarchy-progress" type="range" min="0" max="1000" value="1000" aria-label="Assembly completion progress"/><button id="hierarchy-assemble">↘ Reassemble</button></div>',
          '<div class="hierarchy-controls"><button id="hierarchy-motor">▶ Joint motion</button><button id="hierarchy-reset-joints">↺ Home angles</button><button id="hierarchy-isolate">◉ Isolate</button><button id="hierarchy-anchors">◎ Anchors</button><button id="hierarchy-camera">◎ Camera</button></div>',
          '<div class="hierarchy-footnote">时间轴遵守装配依赖：先拆末端，再拆父节点；重新装配时顺序相反。箭头为示意装配路径，不代表已验证的无碰撞运动规划。</div>',
        '</div>',
        '<aside class="hierarchy-sidebar">',
          '<div class="hierarchy-stats"><div><strong id="hierarchy-parts">—</strong><span>PARTS</span></div><div><strong id="hierarchy-nodes">—</strong><span>SUBASSEMBLIES</span></div><div><strong id="hierarchy-steps">—</strong><span>BUILD STEPS</span></div></div>',
          '<label class="builder-label" for="hierarchy-preset">Choose mechanism / 示例装配</label>',
          '<div class="hierarchy-preset-row"><select class="builder-part-picker" id="hierarchy-preset">' + HIERARCHY_PRESETS.map(p => '<option value="' + safe(p.id) + '">' + safe(p.zh) + '</option>').join('') + '</select><button id="hierarchy-load">Load</button></div>',
          '<div class="hierarchy-small-heading">ASSEMBLY TREE · SUBASSEMBLIES</div><div id="hierarchy-tree" class="hierarchy-tree"></div>',
          '<div class="hierarchy-small-heading">HINGE CONSTRAINTS · 关节角度</div><div class="hierarchy-joints" id="hierarchy-joints"></div>',
          '<div role="status" aria-live="polite" class="hierarchy-status" id="hierarchy-status">点击启动实验台查看层级装配。</div>',
          '<div class="hierarchy-small-heading">AUTO-GENERATED BUILD SEQUENCE</div><div id="hierarchy-steps-list" class="hierarchy-steps-list"></div>',
          '<div class="hierarchy-exports"><button id="hierarchy-json">↓ Export JSON</button><button id="hierarchy-import">↑ Import JSON</button><button id="hierarchy-glb">↓ Export GLB</button><input id="hierarchy-file" type="file" accept=".json,application/json" hidden/></div>',
          '<small class="hierarchy-disclaimer">角度传播基于刚体层级与约束 DAG。当前铰链和运动路径是可视化简化模型，尚未进行齿面接触、间隙与全局碰撞检测。</small>',
        '</aside>',
      '</div>',
    '</section>',

    '<section class="section constraint-section" id="constraints">',
      '<div class="section-heading"><div><div class="section-kicker">07 — GENERAL CONSTRAINT GRAPH / V0.6</div><h2>Build beyond <em>a tree.</em></h2></div><p>让一个零件拥有多个连接：创建铰链、轴、滑轨和固定约束；求解闭环机构，并实时检查运动学残差和实体碰撞。</p></div>',
      '<div class="constraint-intro" id="constraint-intro"><div><span>NEW / GRAPH-BASED ASSEMBLY</span><h3>不止父子关系，而是完整的机械连接图。</h3><p>尝试四连杆闭环、滑动平台与旋转轴装配。选择两个零件及连接接口，即可添加新的关节边并检查是否可行。</p></div><button id="constraint-launch" class="button button-yellow">Open constraint lab ↗</button></div>',
      '<div class="constraint-workspace" id="constraint-workspace" hidden>',
        '<div class="constraint-stage"><div class="constraint-stage-top"><span>GRAPH KINEMATICS / THREE.JS</span><span>ROTATE TO INSPECT · CLICK PART TO SELECT</span></div><canvas id="constraint-canvas" aria-label="Interactive mechanical constraint graph assembly editor"></canvas>',
          '<div class="constraint-bar"><button id="constraint-motor">▶ Run motor</button><button id="constraint-gizmos">◎ Joint markers</button><button id="constraint-camera">↺ Reset view</button><button id="constraint-undo">← Undo</button><button id="constraint-redo">→ Redo</button></div>',
          '<div class="constraint-legend"><span><i class="hinge"></i>铰链</span><span><i class="shaft"></i>转轴</span><span><i class="slider"></i>滑轨</span><span><i class="fixed"></i>固定</span><span><i class="collision"></i>碰撞警告</span></div>',
          '<p class="constraint-caption">铰链/轴/滑轨基于名义连接坐标求解；金属件之间的模拟连接可能使用虚拟基准点，并不等于通过真实零件的配合公差验证。</p>',
        '</div>',
        '<aside class="constraint-sidebar">',
          '<div class="constraint-stats"><div><strong id="constraint-body-count">0</strong><span>BODIES</span></div><div><strong id="constraint-joint-count">0</strong><span>JOINTS</span></div><div><strong id="constraint-cycle-count">0</strong><span>LOOPS</span></div><div><strong id="constraint-error">0</strong><span>ERROR MM</span></div></div>',
          '<label class="builder-label" for="constraint-preset">Mechanism / 机构案例</label>',
          '<div class="constraint-row"><select class="builder-part-picker" id="constraint-preset">' + GRAPH_PRESETS.map(p => '<option value="' + safe(p.id) + '">' + safe(p.zh) + ' / ' + safe(p.name) + '</option>').join('') + '</select><button id="constraint-load">Load</button></div>',
          '<div class="constraint-heading">01 / ADD RIGID BODY · 创建新刚体</div>',
          '<div class="constraint-row"><select class="builder-part-picker" id="constraint-component">' + GRAPH_CATALOG_IDS.filter(id => COMPONENTS.some(c => c.id === id)).map(id => { const c = COMPONENTS.find(c => c.id === id); return '<option value="' + safe(id) + '">' + safe(c.zh) + ' · ' + safe(id) + '</option>'; }).join('') + '</select><button id="constraint-add-body">+ Body</button></div>',
          '<div class="constraint-row"><span class="constraint-selected" id="constraint-selected">Selected: —</span><button id="constraint-delete-body">× Delete selected</button></div>',
          '<div class="constraint-heading">02 / CONNECT INTERFACES · 建立约束</div>',
          '<div class="constraint-form"><label for="constraint-a">Body A / Port A</label><select class="builder-part-picker" id="constraint-a"></select><select class="builder-part-picker" id="constraint-port-a"></select><label for="constraint-b">Body B / Port B</label><select class="builder-part-picker" id="constraint-b"></select><select class="builder-part-picker" id="constraint-port-b"></select><label for="constraint-kind">Joint type / 关节类型</label><select class="builder-part-picker" id="constraint-kind"><option value="hinge">Hinge · 铰链</option><option value="shaft">Shaft · 转轴</option><option value="slider">Slider · 滑轨</option><option value="fixed">Fixed · 固定</option></select><label class="constraint-drive-check"><input type="checkbox" id="constraint-drive-new"/> Controlled target / 设为主动驱动</label><button id="constraint-connect" class="constraint-primary">+ Connect selected ports</button></div>',
          '<div class="constraint-heading">03 / JOINT GRAPH · 关节与驱动</div><div id="constraint-joint-list" class="constraint-joints"></div>',
          '<div class="constraint-heading">04 / SOLVER DIAGNOSTICS · 约束诊断</div>',
          '<div role="status" aria-live="polite" class="constraint-status" id="constraint-status">Loading...</div><div class="constraint-diagnostics" id="constraint-diagnostics"></div>',
          '<div class="constraint-exports"><button id="constraint-json">↓ Export JSON</button><button id="constraint-import">↑ Import JSON</button><button id="constraint-glb">↓ Export GLB</button><input type="file" accept=".json,application/json" id="constraint-file" hidden/></div>',
          '<small class="constraint-note">闭环约束通过数值迭代求解；碰撞检测使用简化刚体 OBB 包围盒，并跳过直接关节连接的相邻零件。不是精密机械仿真或碰撞自由装配规划。</small>',
        '</aside>',
      '</div>',
    '</section>',

    '<section class="section agent-section" id="agent">',
      '<div class="section-heading"><div><div class="section-kicker">08 — AI ASSEMBLY AGENT / V0.7</div><h2>Describe a world. <em>Compile a build.</em></h2></div><p>从自然语言需求生成组件清单、结构关系、关节参数和装配顺序，再由约束引擎独立验证。第一版采用可复现的离线蓝图规划器。</p></div>',
      '<div class="agent-workspace"><div class="agent-editor">',
        '<div class="agent-kicker">LOCAL BLUEPRINT AGENT · NO API KEY</div>',
        '<h3>你想搭建什么？</h3>',
        '<label for="agent-prompt" class="agent-label">Describe your assembly / 输入拼搭需求</label>',
        '<textarea id="agent-prompt" rows="4" maxlength="600" spellcheck="false" placeholder="例如：搭建一辆六轮火星探测车">搭建一辆六轮火星探测车</textarea>',
        '<div class="agent-examples">' + AGENT_EXAMPLES.map((e,i) => '<button data-agent-example="' + i + '">' + safe(e.prompt) + '</button>').join('') + '</div>',
        '<button class="agent-generate" id="agent-generate">✧ Generate & validate build</button>',
        '<p class="agent-caveat">此版本是具有自然语言入口的确定性规划引擎，不会调用外部大模型。未支持的建筑／飞机需求只生成工程需求检查项，不伪造装配或安全认证。</p>',
      '</div><div class="agent-results">',
        '<div class="agent-results-top"><strong>PLANNING PIPELINE</strong><span>INTENT → BOM → GRAPH → SOLVER → STEPS</span></div>',
        '<div id="agent-result" class="agent-result" aria-live="polite"><div class="agent-empty"><span>✦</span><h3>Ready to design.</h3><p>输入需求并点击生成。可用示例包括六轮火星探测车、四连杆、滑轨和轮轴机构。</p></div></div>',
        '<div class="agent-actions"><button id="agent-open-graph" disabled>◎ Open in 3D Constraint Lab</button><button id="agent-export" disabled>↓ Export plan JSON</button></div>',
      '</div></div>',
    '</section>',
    '<section class="dimensions-section">',
      '<div class="section dimensions-inner"><div><div class="section-kicker">04 — THE SHARED GRID</div><h2>One system.<br/><em>Consistent dimensions.</em></h2><p>用统一的名义尺寸组织零件，才能让组件跨作品复用。这里的尺寸用于教育与视觉建模参考，并非真实零件互换或打印配合保证。</p></div>',
        '<div class="dimension-cards">',
          '<div class="dimension-card"><span>01 / STUD PITCH</span><strong>8<span>mm</span></strong><small>凸点中心间距</small></div>',
          '<div class="dimension-card"><span>02 / BRICK HEIGHT</span><strong>9.6<span>mm</span></strong><small>标准砖块本体高度</small></div>',
          '<div class="dimension-card"><span>03 / PLATE HEIGHT</span><strong>3.2<span>mm</span></strong><small>薄板本体高度</small></div>',
        '</div>',
      '</div>',
    '</section>',
  '</main>',
  '<footer class="site-footer"><a class="footer-brand" href="#top">BRICK<span>WORLDS</span></a><p>Build it. Break it. Understand it.</p><div><a href="https://github.com/1998x-stack/LEGO-Worlds" target="_blank" rel="noopener noreferrer">GitHub ↗</a><span>Independent, unofficial project · 2026</span></div></footer>',
  '<div id="modal-root"></div>',
].join('');

const modelGrid = document.querySelector('#model-grid');
const componentGrid = document.querySelector('#component-grid');
const modalRoot = document.querySelector('#modal-root');
let activeSeries = 'all';
let activeFamily = 'All';
let componentSearchTerm = '';
let searchTerm = '';
let detailViewer = null;
let heroViewer = null;
let activeModal = null;
let builderInstance = null;
let mechanicsInstance = null;
let hierarchyInstance = null;
let constraintInstance = null;

function artMarkup(model) {
  return '<div class="model-art" style="--accent:' + safe(model.accent) + '">' +
    '<div class="art-grid"></div><div class="art-brick art-brick-a"></div><div class="art-brick art-brick-b"></div>' +
    '<div class="art-brick art-brick-c"></div><div class="art-brick art-brick-d"></div><div class="art-stud-row"><i></i><i></i><i></i></div>' +
    '<span class="art-index">BW / ' + safe(model.id.slice(0, 2).toUpperCase()) + '</span><span class="art-corner">↗</span></div>';
}

function renderSeries() {
  const host = document.querySelector('#series-grid');
  const cards = SERIES.map((series, index) => {
    const count = MODELS.filter(model => model.series === series.id).length;
    return '<button class="series-card" data-series="' + safe(series.id) + '" style="--series-color:' + safe(series.color) + '">' +
      '<div class="series-card-top"><span>' + series.number + ' / SERIES</span><span>0' + (index + 1) + '</span></div>' +
      '<div class="series-symbol symbol-' + safe(series.id) + '"><i></i><i></i><i></i><i></i><b></b></div>' +
      '<div class="series-card-bottom"><div><span>' + safe(series.titleZh) + '</span><strong>' + safe(series.title) + '</strong><small>' + safe(series.subtitle) + '</small></div>' +
      '<div class="series-count"><b>' + String(count).padStart(2, '0') + '</b><small>BUILDS</small></div></div><span class="series-card-arrow">↗</span></button>';
  });
  host.innerHTML = cards.join('');
}

function renderSeriesFilters() {
  const host = document.querySelector('#series-filters');
  const filters = [{ id: 'all', label: 'All builds' }, ...SERIES.map(item => ({ id: item.id, label: item.title })) , { id: 'creative-lab', label: 'Creative Lab' }];
  host.innerHTML = filters.map(item => '<button class="filter-chip ' + (activeSeries === item.id ? 'active' : '') + '" data-filter-series="' + safe(item.id) + '">' + safe(item.label) + '</button>').join('');
}

function modelCard(model) {
  const featured = model.featured ? '<span class="featured-tag">FEATURED</span>' : '';
  return '<button class="model-card" data-model-id="' + safe(model.id) + '">' +
    artMarkup(model) +
    '<div class="model-card-content"><div class="model-card-meta"><span>' + safe(seriesName(model.series)) + '</span>' + featured + '</div>' +
    '<h3>' + safe(model.title) + '</h3><div class="model-card-zh">' + safe(model.titleZh) + '</div>' +
    '<p>' + safe(model.subtitle) + '</p><div class="model-card-footer"><span>' + String(model.parts.length).padStart(2, '0') + ' NAMED PARTS</span><span>INSPECT ASSEMBLY ↗</span></div></div></button>';
}

function renderModels() {
  const filtered = MODELS.filter(model => {
    const seriesMatch = activeSeries === 'all' || model.series === activeSeries;
    const query = searchTerm.trim().toLowerCase();
    const textMatch = !query || [model.title, model.titleZh, model.description, model.subtitle, seriesName(model.series)].join(' ').toLowerCase().includes(query);
    return seriesMatch && textMatch;
  });
  modelGrid.innerHTML = filtered.length ? filtered.map(modelCard).join('') :
    '<div class="empty-state"><strong>No builds found.</strong><span>Try another search or series filter.</span></div>';
  renderSeriesFilters();
}

function renderFamilyFilters() {
  const families = ['All', ...new Set(COMPONENTS.map(item => item.family))];
  document.querySelector('#family-filters').innerHTML = families.map(family =>
    '<button class="family-chip ' + (activeFamily === family ? 'active' : '') + '" data-family="' + safe(family) + '">' + safe(family) + '</button>'
  ).join('');
}

function componentVisual(component) {
  return '<div class="component-visual type-' + safe(component.type) + '" style="--piece-color:' + safe(component.color) + '">' +
    '<div class="piece-body"></div><div class="piece-studs"><i></i><i></i><i></i><i></i></div></div>';
}

function renderComponents() {
  const query = componentSearchTerm.trim().toLowerCase();
  const filtered = COMPONENTS.filter(component => {
    const familyMatch = activeFamily === 'All' || component.family === activeFamily;
    const searchable = [component.code, component.id, component.name, component.zh, component.family, component.sizeLabel, component.dimensions, component.description, component.connectionProfile].join(' ').toLowerCase();
    return familyMatch && (!query || searchable.includes(query));
  });
  componentGrid.innerHTML = filtered.length ? filtered.map(component => '<button class="component-card" data-component-id="' + safe(component.id) + '">' +
    componentVisual(component) + '<div class="component-card-info"><span>' + safe(component.family.toUpperCase()) + ' / ' + safe(component.code) + '</span><strong>' + safe(component.name) + '</strong>' +
    '<small>' + safe(component.zh) + ' · ' + safe(component.sizeLabel) + '</small><p>' + safe(component.description) + '</p><div class="component-card-foot"><span>' + safe(component.dimensions) + '</span><b>VIEW 3D ↗</b></div></div></button>').join('') :
    '<div class="empty-state"><strong>No components found.</strong><span>Try another family or search term.</span></div>';
  document.querySelector('#component-count').textContent = filtered.length + ' / ' + COMPONENTS.length;
  renderFamilyFilters();
}

function componentAsModel(component) {
  let y = 0;
  if (component.type === 'brick' || component.type === 'slope') y = 4.8;
  else if (component.type === 'plate' || component.type === 'tile' || component.type === 'jumper') y = 1.6;
  else if (component.type === 'beam') y = 4;
  else if (component.type === 'wheel') y = component.size[0];
  return {
    id: component.id,
    slug: component.id,
    series: component.series,
    title: component.name,
    titleZh: component.zh,
    subtitle: component.family + ' / ' + component.code + ' / Component study',
    description: component.description + ' 名义尺寸：' + component.dimensions + '。接口分类：' + component.connectionProfile + '。此组件预览采用程序化示意几何。',
    accent: component.color,
    parts: [{ id: component.id, name: component.name, type: component.type, size: component.size, pos: [0, y, 0], color: component.color, step: 1, transparent: component.transparent }],
    steps: ['Inspect the component']
  };
}

function closeDetail() {
  if (detailViewer) {
    detailViewer.dispose();
    detailViewer = null;
  }
  activeModal = null;
  modalRoot.innerHTML = '';
  document.body.classList.remove('modal-open');
}

function openDetail(model) {
  closeDetail();
  const steps = model.steps || ['Inspect the component'];
  let currentStep = steps.length;
  let selectedPartId = null;
  const anchorCount = model.parts.reduce((total, part) => total + getPartAnchors(part).length, 0);
  const partsMarkup = model.parts.map((part, index) =>
    '<button class="part-row" data-part-id="' + safe(part.id) + '"><span class="part-row-index">' + String(index + 1).padStart(2, '0') + '</span>' +
    '<span class="part-row-main"><strong>' + safe(part.name) + '</strong><small>' + safe(part.type) + ' · STEP ' + safe(part.step || 1) + ' · ' + getPartAnchors(part).length + ' ANCHORS</small></span>' +
    '<span class="part-swatch" style="--swatch:' + safe(part.color) + '"></span></button>'
  ).join('');

  modalRoot.innerHTML = '<div class="modal-backdrop" id="detail-backdrop"><section class="detail-dialog" role="dialog" aria-modal="true" aria-labelledby="detail-title">' +
    '<div class="detail-topbar"><div><span class="detail-overline">ASSEMBLY INSPECTOR</span><span class="detail-id">' + safe(model.id.toUpperCase()) + '</span></div>' +
    '<button class="close-detail" id="close-detail" aria-label="Close detail">×</button></div>' +
    '<div class="detail-main"><div class="viewer-column"><div class="viewer-label"><span>LIVE 3D VIEW</span><span>DRAG TO ORBIT · SCROLL TO ZOOM</span></div>' +
    '<canvas id="detail-canvas" aria-label="Interactive model assembly viewer"></canvas>' +
    '<div class="viewer-bottom"><button id="reset-view">↺ Reset view</button><button id="toggle-anchors" aria-pressed="false" title="Blue: male · amber: female · green: neutral">◎ Show anchors</button><span>THREE.JS / MM → M</span><button id="export-glb">↓ Export GLB</button></div></div>' +
    '<aside class="detail-sidebar"><div class="detail-series">' + safe(seriesName(model.series)) + ' / ' + safe(seriesZh(model.series)) + '</div>' +
    '<h2 id="detail-title">' + safe(model.title) + '</h2><div class="detail-title-zh">' + safe(model.titleZh) + '</div><p class="detail-description">' + safe(model.description) + '</p>' +
    '<div class="detail-stats"><div><strong>' + String(model.parts.length).padStart(2, '0') + '</strong><span>PARTS</span></div><div><strong>' + String(steps.length).padStart(2, '0') + '</strong><span>STEPS</span></div><div><strong>' + String(anchorCount).padStart(2, '0') + '</strong><span>ANCHORS</span></div></div>' +
    '<div class="assembly-control"><div class="control-heading"><strong>Exploded view</strong><span id="explode-value">0%</span></div><input id="explode-range" type="range" min="0" max="100" value="0" aria-label="Exploded view amount"/><div class="range-labels"><span>ASSEMBLED</span><span>EXPLODED</span></div></div>' +
    '<div class="assembly-control step-control"><div class="control-heading"><strong>Build sequence</strong><span id="step-value">ALL / ' + String(steps.length).padStart(2, '0') + '</span></div><div class="step-progress" id="step-progress">' + steps.map((step, index) => '<i class=" ' + (index < currentStep ? 'done' : '') + '"></i>').join('') + '</div>' +
    '<div class="step-actions"><button id="step-prev" aria-label="Previous step">←</button><span id="step-name">Complete assembly</span><button id="step-next" aria-label="Next step">→</button></div><button class="show-all" id="show-all">Show complete model</button></div>' +
    '<div class="parts-heading"><strong>PART BREAKDOWN</strong><span>' + model.parts.length + ' COMPONENTS</span></div><div class="part-list">' + partsMarkup + '</div>' +
    '<div class="selected-part" id="selected-part"><span>SELECT A PART</span><strong>Explore the assembly</strong><p>点击零件列表中的任意部件，高亮查看它在整体结构中的位置。</p></div>' +
    '</aside></div></section></div>';

  document.body.classList.add('modal-open');
  activeModal = model;
  const canvas = modalRoot.querySelector('#detail-canvas');
  try {
    detailViewer = mountViewer(canvas, model);
  } catch (error) {
    canvas.replaceWith(Object.assign(document.createElement('div'), { className: 'viewer-error', textContent: '3D viewer unavailable in this browser.' }));
    console.error(error);
  }

  const updateStep = value => {
    currentStep = Math.max(1, Math.min(steps.length, value));
    detailViewer?.setStep(currentStep);
    modalRoot.querySelector('#step-value').textContent = String(currentStep).padStart(2, '0') + ' / ' + String(steps.length).padStart(2, '0');
    modalRoot.querySelector('#step-name').textContent = currentStep === steps.length ? 'Complete assembly' : steps[currentStep - 1];
    modalRoot.querySelector('#step-progress').innerHTML = steps.map((step, index) => '<i class="' + (index < currentStep ? 'done' : '') + '"></i>').join('');
    modalRoot.querySelectorAll('.part-row').forEach(row => {
      const part = model.parts.find(item => item.id === row.dataset.partId);
      row.classList.toggle('future-part', (part?.step || 1) > currentStep);
    });
  };

  modalRoot.querySelector('#close-detail').addEventListener('click', closeDetail);
  modalRoot.querySelector('#detail-backdrop').addEventListener('click', event => {
    if (event.target.id === 'detail-backdrop') closeDetail();
  });
  modalRoot.querySelector('#reset-view').addEventListener('click', () => detailViewer?.resetView());
  let anchorsVisible = false;
  modalRoot.querySelector('#toggle-anchors').addEventListener('click', event => {
    anchorsVisible = !anchorsVisible;
    detailViewer?.setAnchorsVisible(anchorsVisible);
    event.currentTarget.setAttribute('aria-pressed', String(anchorsVisible));
    event.currentTarget.textContent = anchorsVisible ? '◎ Hide anchors' : '◎ Show anchors';
  });
  modalRoot.querySelector('#explode-range').addEventListener('input', event => {
    const amount = Number(event.target.value);
    detailViewer?.setExplode(amount / 100);
    modalRoot.querySelector('#explode-value').textContent = amount + '%';
  });
  modalRoot.querySelector('#step-prev').addEventListener('click', () => updateStep(currentStep - 1));
  modalRoot.querySelector('#step-next').addEventListener('click', () => updateStep(currentStep + 1));
  modalRoot.querySelector('#show-all').addEventListener('click', () => updateStep(steps.length));
  modalRoot.querySelector('#export-glb').addEventListener('click', async event => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = 'Preparing…';
    try {
      await downloadAssemblyGlb(model);
      button.textContent = 'Exported ✓';
    } catch (error) {
      button.textContent = 'Export failed';
      console.error(error);
    } finally {
      setTimeout(() => { if (button.isConnected) { button.disabled = false; button.textContent = '↓ Export GLB'; } }, 1800);
    }
  });
  modalRoot.querySelectorAll('.part-row').forEach(row => row.addEventListener('click', () => {
    const part = model.parts.find(item => item.id === row.dataset.partId);
    selectedPartId = part?.id || null;
    detailViewer?.selectPart(selectedPartId);
    modalRoot.querySelectorAll('.part-row').forEach(item => item.classList.toggle('selected', item === row));
    const info = modalRoot.querySelector('#selected-part');
    const partAnchors = getPartAnchors(part);
    const anchorSummary = Object.entries(partAnchors.reduce((counts, anchor) => {
      counts[anchor.kind] = (counts[anchor.kind] || 0) + 1;
      return counts;
    }, {})).map(([kind, count]) => kind + ' ×' + count).join(' · ');
    info.innerHTML = '<span>SELECTED COMPONENT</span><strong>' + safe(part.name) + '</strong><p>' + safe(part.type.toUpperCase()) + ' · STEP ' + safe(part.step || 1) + ' · ' + safe(part.color) + ' · ' + partAnchors.length + ' ANCHORS</p><small>' + safe(anchorSummary) + '</small>';
  }));
  updateStep(currentStep);
}

renderSeries();
renderModels();
renderComponents();

document.querySelector('#series-grid').addEventListener('click', event => {
  const button = event.target.closest('[data-series]');
  if (!button) return;
  activeSeries = button.dataset.series;
  renderModels();
  document.querySelector('#builds').scrollIntoView({ behavior: 'smooth' });
});
document.querySelector('#series-filters').addEventListener('click', event => {
  const button = event.target.closest('[data-filter-series]');
  if (!button) return;
  activeSeries = button.dataset.filterSeries;
  renderModels();
});
document.querySelector('#model-grid').addEventListener('click', event => {
  const card = event.target.closest('[data-model-id]');
  if (!card) return;
  const model = MODELS.find(item => item.id === card.dataset.modelId);
  if (model) openDetail(model);
});
document.querySelector('#component-grid').addEventListener('click', event => {
  const card = event.target.closest('[data-component-id]');
  if (!card) return;
  const component = COMPONENTS.find(item => item.id === card.dataset.componentId);
  if (component) openDetail(componentAsModel(component));
});
document.querySelector('#family-filters').addEventListener('click', event => {
  const button = event.target.closest('[data-family]');
  if (!button) return;
  activeFamily = button.dataset.family;
  renderComponents();
});
document.querySelector('#model-search').addEventListener('input', event => {
  searchTerm = event.target.value;
  renderModels();
});
document.querySelector('#component-search').addEventListener('input', event => {
  componentSearchTerm = event.target.value;
  renderComponents();
});
document.querySelector('#hero-open').addEventListener('click', () => openDetail(MODELS.find(item => item.id === 'clockwork-koi-garden')));
document.querySelector('#lab-open').addEventListener('click', () => openDetail(MODELS.find(item => item.id === 'clockwork-koi-garden')));

document.querySelector('#launch-builder').addEventListener('click', () => {
  if (builderInstance) {
    document.querySelector('#builder-workspace').scrollIntoView({ behavior: 'smooth' });
    return;
  }
  const workspace = document.querySelector('#builder-workspace');
  workspace.hidden = false;
  const status = document.querySelector('#builder-status');
  const count = document.querySelector('#builder-piece-count');
  const links = document.querySelector('#builder-link-count');
  const partList = document.querySelector('#builder-parts');
  try {
    builderInstance = mountBuilder(document.querySelector('#builder-canvas'), COMPONENTS, state => {
      status.textContent = state.status;
      count.textContent = String(state.parts.length);
      links.textContent = String(state.connections.length);
      document.querySelector('#builder-undo').disabled = !state.canUndo;
      document.querySelector('#builder-redo').disabled = !state.canRedo;
      document.querySelector('#builder-delete').disabled = !state.selected || state.selected === 'foundation';
      partList.innerHTML = state.parts.map(part =>
        '<div class="builder-part-entry ' + (part.instanceId === state.selected ? 'selected' : '') + '">' +
        '<span class="builder-swatch" style="background:' + safe(part.color) + '"></span>' +
        '<strong>' + safe(part.name) + '</strong><small>' + safe(part.instanceId) + '</small></div>'
      ).join('');
    });
    document.querySelector('#builder-intro').hidden = true;
    const actionMap = {
      '#builder-add': () => builderInstance.add(document.querySelector('#builder-part-picker').value),
      '#builder-turn': () => builderInstance.turn(),
      '#builder-up': () => builderInstance.lift(1),
      '#builder-down': () => builderInstance.lift(-1),
      '#builder-delete': () => builderInstance.erase(),
      '#builder-undo': () => builderInstance.undo(),
      '#builder-redo': () => builderInstance.redo(),
      '#builder-reset-camera': () => builderInstance.resetCamera()
    };
    for (const [selector, callback] of Object.entries(actionMap)) {
      document.querySelector(selector).addEventListener('click', callback);
    }
    document.querySelector('#builder-export-json').addEventListener('click', () => {
      const documentData = builderInstance.getDocument();
      const blob = new Blob([JSON.stringify(documentData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'brick-worlds-assembly.json';
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    });
    document.querySelector('#builder-export-glb').addEventListener('click', async event => {
      const button = event.currentTarget;
      button.disabled = true;
      button.textContent = 'Exporting…';
      try {
        await downloadAssemblyGlb({
          title: 'My Brick Worlds Assembly', slug: 'brick-worlds-custom-build',
          parts: builderInstance.getParts().map((part, index) => ({
            ...part, id: part.instanceId, step: index + 1
          }))
        });
        status.textContent = 'GLB 已导出。注意：连接边关系保存在 JSON 中。';
      } catch (error) {
        console.error(error);
        status.textContent = 'GLB 导出失败，请检查浏览器控制台。';
      } finally {
        button.disabled = false;
        button.textContent = '↓ Export GLB';
      }
    });
    document.querySelector('#builder-import-json').addEventListener('click', () =>
      document.querySelector('#builder-import-input').click());
    document.querySelector('#builder-import-input').addEventListener('change', async event => {
      const input = event.currentTarget;
      const file = input.files?.[0];
      if (!file) return;
      try {
        if (file.size > 100000) throw new Error('File is too large (100 KB max)');
        builderInstance.importJSON(await file.text());
      } catch (error) {
        status.textContent = '导入失败：' + error.message;
      } finally {
        input.value = '';
      }
    });
  } catch (error) {
    status.textContent = 'WebGL Builder 无法启动：' + error.message;
    console.error(error);
  }
});

document.querySelector('#mechanics-launch').addEventListener('click', () => {
  if (mechanicsInstance) {
    document.querySelector('#mechanics-workspace').scrollIntoView({ behavior: 'smooth' });
    return;
  }
  const workspace = document.querySelector('#mechanics-workspace');
  workspace.hidden = false;
  const status = document.querySelector('#mechanics-status');
  const holes = document.querySelector('#mechanics-hole');
  const shafts = document.querySelector('#mechanics-mount-shaft');
  const graph = document.querySelector('#mechanics-graph');
  let previousHole = '0';
  let previousShaft = '';
  try {
    mechanicsInstance = mountMechanicsLab(document.querySelector('#mechanics-canvas'), COMPONENTS, snapshot => {
      status.textContent = snapshot.status;
      document.querySelector('#mechanics-parts-count').textContent = String(snapshot.parts.length);
      document.querySelector('#mechanics-joints-count').textContent = String(snapshot.connections.length);
      previousHole = String(snapshot.selection);
      holes.innerHTML = snapshot.holes.map(h =>
        '<option value="' + h.holeIndex + '"' + (h.occupied ? ' disabled' : '') + '>' +
        'Hole ' + (h.holeIndex + 1) + ' · X ' + h.position[0] + ' mm' +
        (h.occupied ? ' · OCCUPIED' : ' · FREE') + '</option>'
      ).join('');
      // Keep the clicked hole selected even if it is occupied; the engine
      // will reject a duplicate installation and explain the reason.
      holes.value = previousHole;
      const axles = snapshot.parts.filter(p => p.type === 'axle');
      previousShaft = shafts.value || previousShaft;
      shafts.innerHTML = axles.length ? axles.map(p =>
        '<option value="' + safe(p.instanceId) + '">' + safe(p.name) + ' · ' +
        safe(p.instanceId) + '</option>').join('') :
        '<option value="">Please install an axle first</option>';
      if (axles.some(p => p.instanceId === previousShaft)) shafts.value = previousShaft;
      graph.innerHTML = snapshot.connections.map(edge =>
        '<div class="mechanics-edge"><span class="mechanics-edge-kind">' + safe(edge.kind) + '</span>' +
        '<strong>' + safe(edge.from) + ' → ' + safe(edge.to) + '</strong><small>' +
        safe(edge.joint) + (edge.ratio !== undefined ? ' · ratio ' + edge.ratio.toFixed(2) : '') +
        '</small></div>'
      ).join('');
      document.querySelector('#mechanics-play').textContent = snapshot.playing ? 'Ⅱ Pause drive' : '▶ Drive';
      document.querySelector('#mechanics-explode').value = String(Math.round(snapshot.explosion * 100));
      document.querySelector('#mechanics-undo').disabled = !snapshot.canUndo;
      document.querySelector('#mechanics-redo').disabled = !snapshot.canRedo;
      document.querySelector('#mechanics-remove').disabled = snapshot.state.steps.length === 0;
    });
    document.querySelector('#mechanics-hero').hidden = true;
    const actions = {
      '#mechanics-load': () => mechanicsInstance.loadPreset(document.querySelector('#mechanics-preset').value),
      '#mechanics-insert': () => mechanicsInstance.addShaft(document.querySelector('#mechanics-shaft-piece').value,
        Number(document.querySelector('#mechanics-hole').value)),
      '#mechanics-mount': () => mechanicsInstance.addAccessory(
        document.querySelector('#mechanics-accessory').value,
        document.querySelector('#mechanics-mount-shaft').value),
      '#mechanics-play': () => mechanicsInstance.toggleDrive(),
      '#mechanics-assemble': () => mechanicsInstance.animateExplode(0),
      '#mechanics-disassemble': () => mechanicsInstance.animateExplode(1),
      '#mechanics-anchors': () => {
        const visible = mechanicsInstance.toggleAnchors();
        document.querySelector('#mechanics-anchors').textContent = visible ? '◎ Hide anchors' : '◎ Show anchors';
      },
      '#mechanics-undo': () => mechanicsInstance.undo(),
      '#mechanics-redo': () => mechanicsInstance.redo(),
      '#mechanics-remove': () => mechanicsInstance.deleteLast(),
      '#mechanics-camera': () => mechanicsInstance.resetCamera()
    };
    for (const [selector, action] of Object.entries(actions)) {
      document.querySelector(selector).addEventListener('click', action);
    }
    holes.addEventListener('change', event => mechanicsInstance.selectHole(Number(event.target.value)));
    document.querySelector('#mechanics-explode').addEventListener('input', event =>
      mechanicsInstance.setExplode(Number(event.target.value) / 100));
    document.querySelector('#mechanics-speed').addEventListener('input', event => {
      document.querySelector('#mechanics-rpm').textContent = event.target.value;
      mechanicsInstance.setSpeed(Number(event.target.value));
    });
    document.querySelector('#mechanics-export-json').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(mechanicsInstance.getDocument(), null, 2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'brick-worlds-technic-mechanism.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2500);
    });
    document.querySelector('#mechanics-import-json').addEventListener('click', () =>
      document.querySelector('#mechanics-import-file').click());
    document.querySelector('#mechanics-import-file').addEventListener('change', async event => {
      const input = event.currentTarget;
      const file = input.files?.[0];
      if (!file) return;
      try {
        if (file.size > 100000) throw new Error('Mechanism JSON must be under 100 KB');
        const data = JSON.parse(await file.text());
        if (!mechanicsInstance.loadJSON(data)) throw new Error('Mechanism recipe is incompatible');
      } catch (error) {
        status.textContent = '导入失败：' + error.message;
      } finally { input.value = ''; }
    });
    document.querySelector('#mechanics-export-glb').addEventListener('click', async event => {
      const button = event.currentTarget;
      button.disabled = true;
      try {
        await downloadAssemblyGlb({
          title: 'Technic Custom Assembly', slug: 'brick-worlds-technic-mechanism',
          parts: mechanicsInstance.getParts().map((p,index) => ({...p,id:p.instanceId,step:index+1}))
        });
        status.textContent = 'GLB 已导出；机械关节和传动图请使用 JSON 保存。';
      } catch (error) {
        console.error(error);
        status.textContent = 'GLB 导出失败：' + error.message;
      } finally { button.disabled = false; }
    });
  } catch (error) {
    status.textContent = 'Mechanics Lab 无法启动：' + error.message;
    console.error(error);
  }
});

document.querySelector('#hierarchy-launch').addEventListener('click', () => {
  if (hierarchyInstance) {
    document.querySelector('#hierarchy-workspace').scrollIntoView({behavior:'smooth'});
    return;
  }
  const workspace = document.querySelector('#hierarchy-workspace');
  workspace.hidden = false;
  const status = document.querySelector('#hierarchy-status');
  const tree = document.querySelector('#hierarchy-tree');
  const joints = document.querySelector('#hierarchy-joints');
  const steps = document.querySelector('#hierarchy-steps-list');
  let currentPreset = '';
  let selectedNode = '';
  try {
    hierarchyInstance = mountHierarchyLab(document.querySelector('#hierarchy-canvas'), COMPONENTS, snapshot => {
      status.textContent = snapshot.status;
      document.querySelector('#hierarchy-parts').textContent = String(snapshot.steps.length);
      document.querySelector('#hierarchy-nodes').textContent = String(snapshot.nodes.length);
      document.querySelector('#hierarchy-steps').textContent = String(snapshot.steps.length);
      document.querySelector('#hierarchy-progress').value = String(Math.round(snapshot.progress * 1000));
      document.querySelector('#hierarchy-motor').textContent = snapshot.motor ? 'Ⅱ Pause joints' : '▶ Joint motion';
      document.querySelector('#hierarchy-isolate').textContent = snapshot.isolated ? '◉ Show all' : '◉ Isolate';
      document.querySelector('#hierarchy-anchors').textContent = snapshot.anchors ? '◎ Hide anchors' : '◎ Anchors';
      if (snapshot.preset !== currentPreset) {
        currentPreset = snapshot.preset;
        document.querySelector('#hierarchy-preset').value = snapshot.preset;
        tree.innerHTML = snapshot.nodes.map(n =>
          '<button data-hierarchy-node="' + safe(n.id) + '" class="hierarchy-node">' +
            '<span>' + (n.parentId ? '↳' : '◇') + '</span><strong>' + safe(n.id) + '</strong><small>' +
            n.count + ' parts · ' + safe(n.type) + '</small></button>').join('');
        joints.innerHTML = snapshot.drivers.map(j =>
          '<label class="hierarchy-joint"><span><strong>' + safe(j.id) + '</strong><output data-angle-for="' + safe(j.id) + '"></output></span>' +
          '<input type="range" data-hinge-slider="' + safe(j.id) + '" min="' + j.limits[0] +
          '" max="' + j.limits[1] + '" step="1" value="' + j.angle + '"/></label>').join('') +
          snapshot.couplings.map(c => '<div class="hierarchy-coupling">↳ ' +
          safe(c.driven) + ' follows ' + safe(c.driver) + ' × ' + c.ratio + '</div>').join('');
        steps.innerHTML = snapshot.steps.map(s =>
          '<button class="hierarchy-step" data-hierarchy-step="' + s.step + '">' +
            '<span>' + String(s.step).padStart(2,'0') + '</span><strong title="' + safe(s.partId) + '">' +
            safe(s.componentZh || s.componentName || s.partId) + '</strong><small>' + safe(s.operationZh || s.nodeId) + '</small></button>').join('');
      }
      if (snapshot.selected !== selectedNode) selectedNode = snapshot.selected;
      tree.querySelectorAll('[data-hierarchy-node]').forEach(button => {
        button.classList.toggle('selected', button.dataset.hierarchyNode === snapshot.selected);
      });
      joints.querySelectorAll('[data-hinge-slider]').forEach(slider => {
        const value = snapshot.drivers.find(j => j.id === slider.dataset.hingeSlider)?.angle;
        if (value === undefined) return;
        if (document.activeElement !== slider) slider.value = String(value);
        const output = joints.querySelector('[data-angle-for="' + slider.dataset.hingeSlider + '"]');
        if (output) output.textContent = value.toFixed(1) + '°';
      });
      steps.querySelectorAll('[data-hierarchy-step]').forEach(button =>
        button.classList.toggle('assembled', Number(button.dataset.hierarchyStep) <=
          Math.round(snapshot.progress * snapshot.steps.length)));
    });
    document.querySelector('#hierarchy-intro').hidden = true;
    document.querySelector('#hierarchy-load').addEventListener('click', () =>
      hierarchyInstance.preset(document.querySelector('#hierarchy-preset').value));
    document.querySelector('#hierarchy-disassemble').addEventListener('click', () => hierarchyInstance.play(0));
    document.querySelector('#hierarchy-assemble').addEventListener('click', () => hierarchyInstance.play(1));
    document.querySelector('#hierarchy-progress').addEventListener('input', event =>
      hierarchyInstance.setProgress(Number(event.target.value) / 1000));
    document.querySelector('#hierarchy-motor').addEventListener('click', () => hierarchyInstance.toggleMotor());
    document.querySelector('#hierarchy-reset-joints').addEventListener('click', () => hierarchyInstance.resetJoints());
    document.querySelector('#hierarchy-isolate').addEventListener('click', () => hierarchyInstance.toggleIsolate());
    document.querySelector('#hierarchy-anchors').addEventListener('click', () => hierarchyInstance.toggleAnchors());
    document.querySelector('#hierarchy-camera').addEventListener('click', () => hierarchyInstance.resetCamera());
    tree.addEventListener('click', event => {
      const button = event.target.closest('[data-hierarchy-node]');
      if (button) hierarchyInstance.selectNode(button.dataset.hierarchyNode);
    });
    joints.addEventListener('input', event => {
      const slider = event.target.closest('[data-hinge-slider]');
      if (slider) hierarchyInstance.setAngle(slider.dataset.hingeSlider, Number(slider.value));
    });
    steps.addEventListener('click', event => {
      const button = event.target.closest('[data-hierarchy-step]');
      if (!button) return;
      const total = steps.querySelectorAll('[data-hierarchy-step]').length;
      hierarchyInstance.setProgress(Number(button.dataset.hierarchyStep) / total);
    });
    document.querySelector('#hierarchy-json').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(hierarchyInstance.getDocument(),null,2)],{type:'application/json'});
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url;link.download = 'brick-worlds-hierarchy.json';link.click();
      setTimeout(() => URL.revokeObjectURL(url),2500);
    });
    document.querySelector('#hierarchy-import').addEventListener('click', () =>
      document.querySelector('#hierarchy-file').click());
    document.querySelector('#hierarchy-file').addEventListener('change', async event => {
      const input = event.currentTarget, file = input.files?.[0];
      if (!file) return;
      try {
        if (file.size > 100000) throw new Error('File exceeds 100KB');
        hierarchyInstance.importRecipe(await file.text());
      } catch(error) {status.textContent = '导入失败：' + error.message;}
      finally {input.value='';}
    });
    document.querySelector('#hierarchy-glb').addEventListener('click', async event => {
      const button=event.currentTarget;button.disabled=true;
      try {
        await downloadAssemblyGlb({
          title:'Hierarchical Assembly',slug:'brick-worlds-hierarchy',
          parts:hierarchyInstance.getParts()
        });
        status.textContent='已导出当前姿态 GLB；层级约束与装配步骤请保留 JSON。';
      } catch(error) {console.error(error);status.textContent='GLB 导出失败：'+error.message;}
      finally {button.disabled=false;}
    });
  } catch(error) {
    status.textContent='Hierarchy Lab 启动失败：'+error.message;
    console.error(error);
  }
});

document.querySelector('#constraint-launch').addEventListener('click', () => {
  if (constraintInstance) {
    document.querySelector('#constraint-workspace').scrollIntoView({behavior:'smooth'});
    return;
  }
  document.querySelector('#constraint-workspace').hidden = false;
  const status = document.querySelector('#constraint-status');
  const bodyA = document.querySelector('#constraint-a');
  const bodyB = document.querySelector('#constraint-b');
  const portA = document.querySelector('#constraint-port-a');
  const portB = document.querySelector('#constraint-port-b');
  const joints = document.querySelector('#constraint-joint-list');
  let revision = -1;
  let currentGraph = null;
  function portOptions(bodySelector, portSelector, graph, keepValue) {
    const body = graph.bodies.find(b => b.id === bodySelector.value);
    if (!body) {portSelector.innerHTML='';return;}
    portSelector.innerHTML = graphPorts(body, COMPONENTS).map(p =>
      '<option value="' + safe(p.id) + '">' + safe(p.label) +
      (p.source === 'connection-anchor' ? ' · native' : ' · datum') + '</option>'
    ).join('');
    if ([...portSelector.options].some(option => option.value === keepValue))
      portSelector.value = keepValue;
  }
  function updateBodySelectors(graph) {
    const oldA=bodyA.value, oldB=bodyB.value;
    const oldPortA=portA.value, oldPortB=portB.value;
    const markup=graph.bodies.map(b => '<option value="' + safe(b.id) + '">' +
      safe(b.id) + ' · ' + safe(b.componentId) + '</option>').join('');
    bodyA.innerHTML=markup;bodyB.innerHTML=markup;
    bodyA.value=graph.bodies.some(b=>b.id===oldA)?oldA:graph.bodies[0].id;
    bodyB.value=graph.bodies.some(b=>b.id===oldB)?oldB:
      (graph.bodies[1]||graph.bodies[0]).id;
    portOptions(bodyA,portA,graph,oldPortA);
    portOptions(bodyB,portB,graph,oldPortB);
  }
  const kindLabel = {hinge:'铰链',shaft:'转轴',slider:'滑轨',fixed:'固定'};
  function rebuildJoints(graph) {
    joints.innerHTML = graph.joints.length ? graph.joints.map(j => {
      const isDrive = Boolean(j.controlled);
      const range=j.kind!=='fixed' ?
        '<div class="constraint-joint-control"><button data-drive-joint="' + safe(j.id) +
        '" class="' + (isDrive?'is-driven':'') + '">' + (isDrive?'DRIVE ON':'Set drive') +
        '</button><input type="range" data-graph-angle="' + safe(j.id) +
        '" min="' + j.limits[0] + '" max="' + j.limits[1] + '" step="1" value="' +
        j.value + '"' + (isDrive?'':' disabled') + '/><output data-graph-output="' +
        safe(j.id) + '"></output></div>' : '';
      return '<div class="constraint-joint-item"><div class="constraint-joint-title"><span class="constraint-kind '+
        safe(j.kind) + '">' + safe(kindLabel[j.kind]) + '</span><strong>' + safe(j.id) +
        '</strong><button data-remove-joint="' + safe(j.id) + '" aria-label="Remove joint">×</button></div>' +
        '<small>' + safe(j.a.bodyId) + ' / ' + safe(j.a.portId) + ' → ' +
        safe(j.b.bodyId) + ' / ' + safe(j.b.portId) + '</small>' + range + '</div>';
    }).join('') : '<p class="constraint-empty">暂无连接边。选择两个不同零件，设置接口并点击 Connect。</p>';
  }
  try {
    constraintInstance = mountConstraintLab(document.querySelector('#constraint-canvas'), COMPONENTS, snapshot => {
      currentGraph=snapshot.graph;
      const {graph,solution}=snapshot;
      document.querySelector('#constraint-body-count').textContent=String(graph.bodies.length);
      document.querySelector('#constraint-joint-count').textContent=String(graph.joints.length);
      document.querySelector('#constraint-cycle-count').textContent=String(solution.cycleCount);
      document.querySelector('#constraint-error').textContent=solution.closureErrorMm.toFixed(2);
      document.querySelector('#constraint-selected').textContent='Selected: ' + snapshot.selectedBody;
      document.querySelector('#constraint-delete-body').disabled=graph.bodies.length<2;
      document.querySelector('#constraint-motor').textContent=snapshot.motor?'Ⅱ Pause motor':'▶ Run motor';
      document.querySelector('#constraint-gizmos').textContent=snapshot.showJoints?'◎ Hide markers':'◎ Joint markers';
      document.querySelector('#constraint-undo').disabled=!snapshot.canUndo;
      document.querySelector('#constraint-redo').disabled=!snapshot.canRedo;
      status.textContent=snapshot.status;
      if (snapshot.revision !== revision) {
        revision=snapshot.revision;
        document.querySelector('#constraint-preset').value=
          GRAPH_PRESETS.some(p=>p.id===graph.id)?graph.id:'four-bar';
        updateBodySelectors(graph);
        rebuildJoints(graph);
      }
      const problem=solution.collisionPairs.length;
      const closure=solution.closures.filter(c=>c.residualMm>0.2);
      document.querySelector('#constraint-diagnostics').innerHTML =
        '<p><strong>Closure</strong> ' + solution.closureErrorMm.toFixed(3) +
        ' mm · ' + solution.iterations + ' iterations · ' + solution.cycleCount + ' closed loops</p>' +
        '<p><strong>Collisions</strong> ' + problem + ' proxy pairs' +
        (problem ? ' · ' + solution.collisionPairs.map(p =>
          safe(p.bodyA) + ' × ' + safe(p.bodyB)).join(', ') : ' · None') + '</p>' +
        (closure.length ? '<p><strong>Offending joints:</strong> ' +
          closure.map(c=>safe(c.jointId)).join(', ') + '</p>' : '');
      joints.querySelectorAll('[data-graph-output]').forEach(output => {
        const id=output.dataset.graphOutput;
        const joint=graph.joints.find(j=>j.id===id);
        const measured=solution.values[id];
        if(measured===undefined)return;
        output.textContent=measured.toFixed(1) + (joint.kind==='slider'?' mm':'°');
        const slider=joints.querySelector('[data-graph-angle="'+id+'"]');
        if(slider && document.activeElement!==slider)slider.value=String(measured);
      });
    });
    document.querySelector('#constraint-intro').hidden=true;
    document.querySelector('#constraint-a').addEventListener('change', () =>
      portOptions(bodyA,portA,currentGraph));
    document.querySelector('#constraint-b').addEventListener('change', () =>
      portOptions(bodyB,portB,currentGraph));
    document.querySelector('#constraint-load').addEventListener('click', () =>
      constraintInstance.loadPreset(document.querySelector('#constraint-preset').value));
    document.querySelector('#constraint-add-body').addEventListener('click', () =>
      constraintInstance.addBody(document.querySelector('#constraint-component').value));
    document.querySelector('#constraint-delete-body').addEventListener('click', () => {
      const selected=document.querySelector('#constraint-selected').textContent.replace('Selected: ','');
      constraintInstance.removeBody(selected);
    });
    document.querySelector('#constraint-connect').addEventListener('click', () => {
      constraintInstance.addJoint({
        bodyA:bodyA.value,portA:portA.value,bodyB:bodyB.value,portB:portB.value,
        kind:document.querySelector('#constraint-kind').value,
        controlled:document.querySelector('#constraint-drive-new').checked,value:0
      });
    });
    joints.addEventListener('click', event => {
      const remove=event.target.closest('[data-remove-joint]');
      if(remove) {constraintInstance.removeJoint(remove.dataset.removeJoint);return;}
      const driven=event.target.closest('[data-drive-joint]');
      if(driven)constraintInstance.toggleDriven(driven.dataset.driveJoint);
    });
    joints.addEventListener('input', event => {
      const slider=event.target.closest('[data-graph-angle]');
      if(slider)constraintInstance.setJointValue(slider.dataset.graphAngle,Number(slider.value));
    });
    const buttons={
      '#constraint-motor':()=>constraintInstance.toggleMotor(),
      '#constraint-gizmos':()=>constraintInstance.toggleGizmos(),
      '#constraint-camera':()=>constraintInstance.resetCamera(),
      '#constraint-undo':()=>constraintInstance.undo(),
      '#constraint-redo':()=>constraintInstance.redo()
    };
    for(const [selector,callback] of Object.entries(buttons))
      document.querySelector(selector).addEventListener('click',callback);
    document.querySelector('#constraint-json').addEventListener('click', () => {
      const blob=new Blob([JSON.stringify(constraintInstance.getDocument(),null,2)],
        {type:'application/json'});
      const url=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=url;link.download='brick-worlds-constraint-graph.json';link.click();
      setTimeout(()=>URL.revokeObjectURL(url),2500);
    });
    document.querySelector('#constraint-import').addEventListener('click', () =>
      document.querySelector('#constraint-file').click());
    document.querySelector('#constraint-file').addEventListener('change',async event=>{
      const input=event.currentTarget,file=input.files?.[0];
      if(!file)return;
      try{
        if(file.size>120000)throw new Error('File exceeds 120KB');
        constraintInstance.importJSON(await file.text());
      }catch(error){status.textContent='导入失败：'+error.message;}
      finally{input.value='';}
    });
    document.querySelector('#constraint-glb').addEventListener('click', async event=>{
      const button=event.currentTarget;button.disabled=true;
      try{
        await downloadAssemblyGlb({
          title:'Constraint Graph Assembly',slug:'brick-worlds-constraint-graph',
          parts:constraintInstance.getParts()
        });
        status.textContent='GLB 已导出当前姿态；可编辑连接图须使用 JSON。';
      }catch(error){console.error(error);status.textContent='GLB 导出失败：'+error.message;}
      finally{button.disabled=false;}
    });
  }catch(error){status.textContent='Constraint Lab 启动失败：'+error.message;console.error(error);}
});

let latestAgentPlan = null;
const agentPromptInput = document.querySelector('#agent-prompt');
const agentResult = document.querySelector('#agent-result');
document.querySelectorAll('[data-agent-example]').forEach(button =>
  button.addEventListener('click', () => {
    agentPromptInput.value = AGENT_EXAMPLES[Number(button.dataset.agentExample)].prompt;
    document.querySelector('#agent-generate').click();
  }));
document.querySelector('#agent-generate').addEventListener('click', () => {
  try {
    const plan = createAssemblyPlan(agentPromptInput.value, COMPONENTS);
    latestAgentPlan = plan;
    const supported = Boolean(plan.graph && plan.verification?.solverValid);
    document.querySelector('#agent-open-graph').disabled = !supported;
    document.querySelector('#agent-export').disabled = !supported;
    if (!supported) {
      agentResult.innerHTML =
        '<div class="agent-result-status"><span class="agent-result-tag">REQUIREMENTS ONLY</span>' +
        '<h3>' + safe(plan.request.domain) + '</h3><p>' + safe(plan.explanation) + '</p></div>' +
        '<div class="agent-result-section"><strong>需要先解决的工程问题</strong><ul>' +
        plan.nextActions.map(action=>'<li>'+safe(action)+'</li>').join('') + '</ul></div>';
      return;
    }
    const v = plan.verification;
    const fitFail = v.nominalFit?.status === 'FAIL';
    const proxyCount = v.collisionPairs.length;
    const statusLabel = fitFail ? 'NEEDS REVISION · NOMINAL FIT'
      : proxyCount ? 'KINEMATICS CHECKED · BROAD-PHASE PROXY WARN' : 'KINEMATICS CHECKED';
    const fitNote = v.nominalFit?.evaluated ? ' Nominal coaxial fit: ' + v.nominalFit.status + '.' : '';
    agentResult.innerHTML =
      '<div class="agent-result-status"><span class="agent-result-tag">' + statusLabel +
      '</span><h3>' + safe(plan.planName) + '</h3><p>' +
      safe(plan.explanation) + '</p></div>' +
      '<div class="agent-result-metrics"><div><strong>'+v.bodyCount+'</strong><span>PARTS</span></div>' +
      '<div><strong>'+v.jointCount+'</strong><span>JOINTS</span></div>' +
      '<div><strong>'+v.closureErrorMm.toFixed(3)+'</strong><span>ERROR MM</span></div>' +
      '<div><strong>'+proxyCount+'</strong><span>OBB PROXY</span></div></div>' +
      '<p class="agent-warning agent-proxy-note">OBB proxy = coarse broad-phase bounding-box overlap on non-adjacent parts; it is NOT a mesh-contact or fit result.' + fitNote + '</p>' +
      '<div class="agent-result-section"><strong>BOM · 组件清单</strong><div class="agent-bom">' +
      plan.bom.map(item=>'<div><b>'+safe(item.name)+'</b><small>'+safe(item.code||item.componentId)+'</small><span>×'+item.quantity+'</span></div>').join('')+
      '</div></div><div class="agent-result-section"><strong>JOINT GRAPH · 连接关系</strong><div class="agent-joints">' +
      plan.graph.joints.map(joint=>'<div><span>'+safe(joint.kind)+'</span>' +
      safe(joint.a.bodyId)+' → '+safe(joint.b.bodyId)+'</div>').join('')+
      '</div></div><div class="agent-result-section"><strong>ASSEMBLY SEQUENCE · 装配步骤</strong><div class="agent-steps">' +
      plan.assemblySteps.map(step=>'<div><span>'+String(step.step).padStart(2,'0')+'</span><b>' +
      safe(step.componentName||step.viaJointId)+'</b><small>'+safe(step.operation)+'</small></div>').join('')+
      '</div></div><div class="agent-result-section"><strong>VALIDATION GATES · 验证门槛</strong><div class="agent-checks">' +
      v.checklist.map(check=>{
        const state=check.status||(check.passed?'PASS':'NOT_RUN');
        const mark=state==='PASS'?'✓':state==='FAIL'?'✕':'○';
        const cls=state==='PASS'?'pass':state==='FAIL'?'fail':'pending';
        return '<div><span class="'+cls+'">'+mark+'</span>'+
          '<b>'+safe(check.id)+'</b><small>'+safe(check.detail)+'</small></div>';
      }).join('')+
      '</div></div><p class="agent-warning">'+v.warnings.map(safe).join(' · ')+'</p>';
  } catch(error) {
    latestAgentPlan = null;
    document.querySelector('#agent-open-graph').disabled = true;
    document.querySelector('#agent-export').disabled = true;
    agentResult.innerHTML='<div class="agent-result-status"><span class="agent-result-tag">NEEDS REVISION</span><h3>无法生成可验证装配</h3><p>'+
      safe(error.message)+'</p></div>';
  }
});
document.querySelector('#agent-open-graph').addEventListener('click', () => {
  if (!latestAgentPlan?.graph) return;
  if (!constraintInstance) document.querySelector('#constraint-launch').click();
  if (!constraintInstance) {
    agentResult.insertAdjacentHTML('afterbegin','<p class="agent-warning">3D 工作台尚未成功启动，请检查浏览器 WebGL 支持。</p>');
    return;
  }
  const accepted = constraintInstance.loadGraph(latestAgentPlan.graph);
  if (accepted) document.querySelector('#constraint-workspace').scrollIntoView({behavior:'smooth'});
});
document.querySelector('#agent-export').addEventListener('click', () => {
  if (!latestAgentPlan?.graph) return;
  const blob=new Blob([JSON.stringify(latestAgentPlan,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='brick-worlds-agent-plan.json';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),2500);
});

const mobileMenu = document.querySelector('#mobile-menu');
mobileMenu.addEventListener('click', () => {
  const nav = document.querySelector('.main-nav');
  const expanded = mobileMenu.getAttribute('aria-expanded') === 'true';
  mobileMenu.setAttribute('aria-expanded', String(!expanded));
  nav.classList.toggle('nav-open', !expanded);
});
document.querySelectorAll('.main-nav a').forEach(link => link.addEventListener('click', () => {
  document.querySelector('.main-nav').classList.remove('nav-open');
  mobileMenu.setAttribute('aria-expanded', 'false');
}));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && activeModal) closeDetail();
  if (event.key === '/' && !activeModal && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    document.querySelector('#model-search').focus();
  }
});

try {
  const featured = MODELS.find(item => item.id === 'clockwork-koi-garden');
  heroViewer = mountViewer(document.querySelector('#hero-canvas'), featured, { background: '#f4f1e8' });
  heroViewer.setExplode(0);
} catch (error) {
  document.querySelector('#hero-canvas').outerHTML = '<div class="viewer-error">3D preview requires WebGL.</div>';
  console.error(error);
}

window.addEventListener('beforeunload', () => {
  heroViewer?.dispose();
  detailViewer?.dispose();
  builderInstance?.dispose();
  mechanicsInstance?.dispose();
  hierarchyInstance?.dispose();
  constraintInstance?.dispose();
});
