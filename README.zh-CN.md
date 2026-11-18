# BRICK WORLDS

**拼起来 · 拆开看 · 理解它**

一个独立的 3D 模块化积木系统探索项目。浏览可复用基础组件，以三维方式观察原创拼搭作品，显示标准化连接锚点，逐步拆解装配过程，并理解每个模型由哪些零件组成。

[101 种组件完整目录](docs/parts-index.md) · [组件系统规范](docs/component-system.md) · [连接锚点规范](docs/connection-anchors.md) · [自动吸附拼搭](docs/snap-builder.md) · [Technic 机械实验台](docs/technic-mechanics.md) · [层级装配与铰链系统](docs/hierarchy-assembly.md) · [通用约束图求解器](docs/constraint-graph.md) · [AI 拼搭 Agent](docs/ai-assembly-agent.md) · [系列 Skills](docs/skills-system.md) · [Agent 插件运行规范](docs/agent-plugin-runtime.md) · [V0.9 名义配合与插入检测](docs/clearance-v09.md) · [复杂物理世界架构](docs/physical-world-architecture.md) · [架构文档](docs/architecture.md) · [Agent 交接文档](docs/handoff/CURRENT.md)

> **非官方项目声明：** 本项目为独立的教育与三维可视化项目，与 LEGO Group 没有任何隶属、赞助、授权或认可关系。LEGO® 是 LEGO Group 的商标。本仓库使用原创程序化几何，不分发官方套装说明书、品牌标识、人仔 IP 或复制的第三方模型。

## V0.9 · 空心轴承、名义配合与装配路径检查

新增第 **101 个目录组件「8mm 机械轴承衬套」**，包含真正的贯穿孔几何、轴承外径／内孔接口。Constraint Lab 新增 **Sleeve Bearing & Wheel** 四零件案例，AI Agent 也可识别「装配一个轴承衬套、转轴和轮组」。

L2 验证现在能独立计算**同轴偏移、名义径向间隙、轴端实际啮合长度**；可选启动基于程序化网格三角面的接触候选筛查，以及对**明确已安装零件**执行离散插入轨迹检测。该能力可消除“轴位于梁孔内部而 OBB 报碰撞”的典型误报，但不能保证未采样区间、实体制造配合、完整三维碰撞或真实机械承载。

```bash
npm run world:pipeline -- --prompt "装配一个轴承衬套、转轴和轮组" --mesh
node scripts/inspect-bearing-wheel.mjs
node scripts/inspect-bearing-wheel.mjs --blocked
```

请阅读[完整验证规范与边界](docs/clearance-v09.md)。

## Agent-Native Skills 插件运行体系 · V0.8

已从静态 Skill 说明升级为 **可发现、可执行、可独立验证的 Agent 插件系统**。仓库 12 个正式 Skill 均拥有 `plugin.json`，Registry V2 维护能力 ID、依赖图、版本锁、执行就绪状态与最小权限。首批 8 个 Skill 通过固定的 Runner 提供真实业务入口，其余标为 **guidance-only**，不冒充物理求解器。

- **L0 需求：** `WorldSpec` 保留原始需求、轮数等硬约束，建筑和飞机输出子系统需求（六类），不伪造真实工程结论。
- **L1 几何：** 直接调用原有 Three.js 程序化模型生成真实几何，独立复核包围盒、组件 ID 与连接锚点。
- **L2 装配：** 调用现有固定、铰链、转轴、滑轨与闭环求解器，记录误差、限位、简化 OBB 碰撞提示与未运行的物理检查。
- **Agent 纠错：** 有限次尝试、记录可验证的差异与诊断；不自动删减用户六轮要求、提高容差或谎报动力学通过。
- **CLI / MCP：** 无需额外 LLM 后端，Codex、Pi、Claude 能调用同一核心工具。MCP 为本地受限 stdio 适配器，非完整认证的通用 MCP 服务。

```bash
npm install
npm run world:run -- registry
npm run world:pipeline -- --prompt "搭建一辆六轮火星探测车"
npm run world:pipeline -- --prompt "设计一栋10层建筑"
npm run world:mcp
npm run test:skills && npm test && npm run build
```

详细设计：[Agent 插件协议](docs/agent-plugin-runtime.md) · [Registry V2](.agents/skills/registry.json) · [L0/L1/L2 Schema](schemas/) · [Skills 系统](docs/skills-system.md)。

## AI 拼搭 Agent 与跨平台物理世界 Skills · V0.7

[**打开 AI 拼搭 Agent**](https://1998x-stack.github.io/LEGO-Worlds/#agent)，输入「**搭建一辆六轮火星探测车**」即可生成组件清单、连接图、关节关系、装配步骤与约束求解报告。第一版探测车概念装配由中央车体、两条机械纵梁、六个轮组和传感器舱组成，共 **10 个可见组件、9 条连接**，可以转入三维 Constraint Lab 检视。**六个轮组使用虚拟转轴接口，并未实现真实悬架、电机和越野动力学**。

当前采用可复现的**离线模板规划器**，不是调用云端大模型的无限制 CAD 生成服务。支持六轮探测车、四连杆、线性滑轨、转轴驱动四种路径；建筑物、飞机等请求先输出需求与物理验证清单，不伪造结构安全或适航性结论。

为未来大型物理世界建立了 **12 个领域 Skill**：系统架构、参数化几何、连接接口、通用约束、物理验证、建筑、航空、移动机器人、AI 装配规划、装配动画、资产质量和 Skill 治理。各自包含 `SKILL.md`、`references/`、`scripts/`、`assets/`；[AGENTS.md](AGENTS.md) 约束代码质量，`.codex/`、`.pi/`、`.claude/` 提供符合各平台发现机制的入口，并由 CI 进行校验。

```bash
npm install
npm run agent:plan -- "搭建一辆六轮火星探测车" > rover-plan.json
npm run agent:validate -- rover-plan.json
npm run test:skills
npm test
npm run build
```

技术说明：[AI 拼搭 Agent](docs/ai-assembly-agent.md) · [Skills 体系](docs/skills-system.md) · [正式技能源](.agents/skills/README.md)。

## 101 种基础组件

当前组件库包含 101 种有独立编号的组件定义，覆盖标准砖块、薄板与光滑板、斜坡与曲面、SNOT 连接件、Technic 机械结构、齿轮传动、轮组运动、建筑模块、自然装饰和特殊功能件。每个组件均有独立 ID、BW 编号、尺寸、几何类型、用途说明与连接接口分类。

## 连接锚点系统

101 种组件现在都具备程序化生成的连接锚点，包括凸点、底部接口、Technic 孔、连接销、轴、齿轮轴线、夹扣、横杆、球头、铰链轴和面板安装基准。锚点记录统一使用毫米坐标，并包含方向、尺寸、接口类型和兼容对象。

在模型详情窗口点击 **Show anchors**，可以显示三维锚点：蓝色代表公接口，橙色代表母接口，绿色代表中性定位基准。锚点会跟随零件旋转、爆炸视图和装配步骤变化。

当前阶段已经实现锚点生成、坐标变换、接口兼容性筛选及可视化，并新增面向标准凸点与底部接口的拖动吸附和基础实体碰撞检查；Technic、齿轮及铰链等复杂接口仍未开放通用自动吸附。部分装饰件、轮组和传动接口仍为示意基准，不能视为真实打印配合保证。详见[连接锚点规范](docs/connection-anchors.md)。

## Snap Builder Lab · 自动吸附拼搭工作台

首页新增 **Builder** 工作区：选择标准砖块、薄板、光滑板或 Jumper，点击添加后拖到已有零件附近。绿色半透明预览表示可以吸附，红色表示实体重叠，黄色表示没有找到合适的连接点。支持 90° 旋转、±3.2 mm 高度调节、撤销/重做、删除零件、JSON 装配关系保存与导入，以及 GLB 模型导出。

初期以固定的 2×6 薄板作为底座，仅对 stud/socket 凸点网格开放自动吸附，不能视为精确制造配合或机械强度保证。详见[自动吸附拼搭技术文档](docs/snap-builder.md)。

## Technic 机械实验台 · 梁孔、轴、齿轮与轮组

首页新增 **Mechanics**：支持从 8 mm 间距的 Technic 梁孔选择连接点，安装摩擦销、光滑销或十字轴；可沿轴安装齿轮及轮组，检查占用孔位、轴长度与齿轮名义啮合关系。提供三个演示：**双齿轮传动、轮轴总成、销钉连接架**。

支持拆解/重新合成动画、转速调整、齿轮反向旋转、连接关系图、撤销/重做、装配 JSON 方案导入导出及静态 GLB 导出。齿轮比来自齿数；这是运动学演示而非齿面接触、摩擦与动力学仿真。当前为选择孔位后安装的引导式交互，不是所有 Technic 零件的自由拖拽吸附。详见[机械连接系统设计](docs/technic-mechanics.md)。

## 层级装配与机械关节系统 · V0.5

首页新增 **Assembly** 三维实验台，直接查看三个原创演示：**双关节机械吊臂、双叶联动吊桥、双翼太阳能观测站**。系统将零件组织为父子刚体子总成，每个可旋转子总成都通过铰链锚点连接到父节点；父节点转动时，其下所有零件和关节同步移动。

可以拖动主铰链角度滑块，观察镜像联动的角度传播；选择并隔离子总成，打开锚点显示，播放自动生成的 **逐件拆解、重新装配** 动画，还可以点击步骤或拖动装配时间轴。支持版本化 JSON 姿态/关节配方导入导出与静态 GLB 导出。

装配步骤遵循父子依赖 DAG，动画路径属于可视化示意，**暂不保证物理上无碰撞或可实际拆卸**；系统也尚未实现真实动力学、完整闭环机构或多个父连接。详见[层级装配与关节规范](docs/hierarchy-assembly.md)。

## 通用机械约束图 · V0.6

新增 **Constraints** 三维实验台，将原本单一的父子树升级为可以存在多条连接和闭环的刚体图。可以自行添加目录中的零件，选择两端连接孔位或虚拟定位基准，创建 **固定、铰链、转轴、滑轨** 四种约束。系统采用阻尼最小二乘迭代调整未驱动的关节，检测闭环是否满足；当连接矛盾时会拒绝提交，并给出残差。非直接连接的零件之间还会进行 OBB 定向包围盒碰撞提示。

提供三个可操作案例：**四连杆闭环机构、直线滑轨移动平台、旋转轴与轮组**。可播放关节驱动、手动调整角度或位移、观察连线与碰撞，撤销/重做并导入导出可编辑的装配图 JSON，或导出当前状态的静态 GLB。

**边界：** 这是教育/可视化的运动学约束引擎。虚拟接口基准不意味着实际机械零件已通过尺寸匹配；碰撞只基于简化 OBB，不包括三角网格窄相、连续碰撞和受力仿真。详见[通用机械约束图技术文档](docs/constraint-graph.md)。

## 首期三个核心系列

| 系列 | 内容 | 首期作品 |
| --- | --- | --- |
| **01 · Brick System** | 标准砖块、薄板、光滑板、斜坡、偏移连接件 | 基础组件陈列台、口袋机器人 |
| **02 · Technic Mechanics** | 机械梁、连接销、轴、齿轮、轮组 | 双齿轮传动演示器、越野探测车 |
| **03 · Modular City** | 墙体、门窗、屋顶、街道家具、建筑模块 | 街角咖啡馆、运河电车站 |

此外还包含原创实验作品 **Clockwork Koi Garden · 发条锦鲤庭院**，将齿轮、池塘、锦鲤、荷叶、桥梁与灯笼组合成一个微缩庭院。

## 交互能力

- 鼠标或触屏旋转模型，滚轮或手势缩放。
- 0–100% 爆炸视图，查看零件空间关系。
- 按步骤逐层显示装配过程。
- 点击零件清单，在整体模型中高亮对应组件。
- 单独预览基础组件。
- 导出当前完整装配为 GLB。

## 本地运行

环境要求：Node.js 20.19+。

```bash
git clone https://github.com/1998x-stack/LEGO-Worlds.git
cd LEGO-Worlds
npm install
npm run dev
```

## 测试与构建

```bash
npm test
npm run build
npm run preview
```

## GitHub Pages

仓库已经包含 GitHub Actions Pages 构建与部署工作流，Vite 使用 `/LEGO-Worlds/` 作为部署基础路径。

预期地址：

https://1998x-stack.github.io/LEGO-Worlds/

**首次发布需要仓库所有者手动启用一次 Pages：**

1. 打开仓库 Settings。
2. 进入 Pages。
3. 在 Build and deployment 的 Source 中选择 **GitHub Actions**。
4. 保存后，重新运行 Actions 中的 **Verify and deploy GitHub Pages** 工作流。

当前 GitHub App 连接可以提交源代码和工作流，但不能替用户修改 Pages 仓库级设置；因此在完成上述一次性设置之前，构建可以通过，部署步骤仍会因 Pages 尚未启用而失败。

## 几何标准与边界

| 参数 | 名义参考值 |
| --- | ---: |
| 凸点中心间距 | 8 mm |
| 标准砖块本体高度 | 9.6 mm |
| 薄板本体高度 | 3.2 mm |
| 凸点直径 | 约 4.8 mm |
| 凸点高度 | 约 1.7 mm |

模型源数据以毫米为单位，Three.js 查看器在装配根节点统一换算为米。以上是简化的教育与可视化参考，并不构成真实零件互换、公差或 3D 打印配合保证。

任何可互锁的打印零件，都需要针对打印机、材料、层高、打印方向和配合对象进行实际公差测试。本项目不宣称机械强度、耐久性或安全认证。

## 仓库结构

```text
src/
  catalog.js          # 系列、组件目录与装配清单
  brick-system.js     # 可复用程序化零件几何
  connection-anchors.js # 锚点生成、坐标变换与接口兼容性
  snap-engine.js       # 吸附求解、碰撞校验、装配 JSON
  technic-engine.js    # 梁孔连接、键轴固定、齿轮传动
  hierarchy-engine.js # 层级刚体、关节与装配依赖
  constraint-graph.js # 多重连接、闭环求解和 OBB 碰撞提示
  ai-agent.js        # 自然语言意图、BOM、连接图、装配步骤
  constraint-lab.js   # 可视化连接图编辑与运动学驱动
  hierarchy-lab.js    # 三维铰链调节、拆解重装时间轴
  mechanics-lab.js     # 机械装配、拆解与运动学交互
  builder-lab.js       # Three.js 拖动拼搭工作台
  viewer.js           # Three.js 场景、爆炸视图与装配步骤
  main.js             # 首页、筛选、组件浏览与交互
  styles.css          # 积木主题视觉系统与响应式布局
docs/
  architecture.md
  component-system.md
  connection-anchors.md
  snap-builder.md
  technic-mechanics.md
  hierarchy-assembly.md
  constraint-graph.md
  ai-assembly-agent.md
  skills-system.md
  roadmap.md
tests/
  catalog.test.mjs
  connection-anchors.test.mjs
  snap-engine.test.mjs
  technic-engine.test.mjs
  hierarchy-engine.test.mjs
  constraint-graph.test.mjs
  ai-agent.test.mjs
.agents/skills/        # 12 个跨平台技能的正式源
.codex/skills/         # Codex 镜像入口
.claude/skills/        # Claude Code 入口
.pi/skills/            # Pi 路由技能
scripts/               # 自动校验与 Agent CLI
AGENTS.md              # 工程规范
.github/workflows/
  pages.yml
```

## 如何新增模型

1. 在 `src/brick-system.js` 中优先实现可复用零件类型。
2. 如果零件适合跨模型复用，在 `COMPONENTS` 中登记组件元数据。
3. 在 `MODELS` 中添加新模型，使用稳定的 kebab-case ID。
4. 为每个零件定义唯一 ID、名称、类型、颜色、位置和装配步骤。
5. 复杂结构可以为零件提供明确的 `explode` 偏移。
6. 执行 `npm test` 和 `npm run build`，再检查桌面与移动端的实际三维效果。

**模型应当解释它如何被拼出来，而不只是展示拼好的外观。**

## 许可证

MIT，详见 [LICENSE](LICENSE)。商标及第三方权利仍归各自权利人所有。
