import { SERIES, COMPONENTS, MODELS, MODEL_COUNT, COMPONENT_COUNT } from './catalog.js';
import { mountViewer, downloadAssemblyGlb } from './viewer.js';
import { getPartAnchors } from './connection-anchors.js';
import { mountBuilder } from './builder-lab.js';
import { isBuilderComponent } from './snap-engine.js';
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
      '<a href="#series">Series</a><a href="#builds">Builds</a><a href="#components">Components</a><a href="#builder">Builder</a>',
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
        '<div class="component-toolbar"><div><strong id="component-count">' + COMPONENT_COUNT + '</strong><span> COMPONENT TYPES</span></div><label class="search-field component-search"><span>⌕</span><input id="component-search" type="search" placeholder="Search 100 components..." aria-label="Search components"/><kbd>⌕</kbd></label></div><div class="family-filters" id="family-filters"></div>',
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
});
