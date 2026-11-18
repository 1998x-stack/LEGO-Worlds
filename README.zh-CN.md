# BRICK WORLDS

**拼起来 · 拆开看 · 理解它**

一个独立的 3D 模块化积木系统探索项目。浏览可复用基础组件，以三维方式观察原创拼搭作品，显示标准化连接锚点，逐步拆解装配过程，并理解每个模型由哪些零件组成。

[100 种组件完整目录](docs/parts-index.md) · [组件系统规范](docs/component-system.md) · [连接锚点规范](docs/connection-anchors.md) · [自动吸附拼搭](docs/snap-builder.md) · [Technic 机械实验台](docs/technic-mechanics.md) · [层级装配与铰链系统](docs/hierarchy-assembly.md) · [通用约束图求解器](docs/constraint-graph.md) · [架构文档](docs/architecture.md)

> **非官方项目声明：** 本项目为独立的教育与三维可视化项目，与 LEGO Group 没有任何隶属、赞助、授权或认可关系。LEGO® 是 LEGO Group 的商标。本仓库使用原创程序化几何，不分发官方套装说明书、品牌标识、人仔 IP 或复制的第三方模型。

## 100 种基础组件

首期组件库包含 100 种有独立编号的组件定义，覆盖标准砖块、薄板与光滑板、斜坡与曲面、SNOT 连接件、Technic 机械结构、齿轮传动、轮组运动、建筑模块、自然装饰和特殊功能件。每个组件均有独立 ID、BW 编号、尺寸、几何类型、用途说明与连接接口分类。

## 连接锚点系统

100 种组件现在都具备程序化生成的连接锚点，包括凸点、底部接口、Technic 孔、连接销、轴、齿轮轴线、夹扣、横杆、球头、铰链轴和面板安装基准。锚点记录统一使用毫米坐标，并包含方向、尺寸、接口类型和兼容对象。

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
  roadmap.md
tests/
  catalog.test.mjs
  connection-anchors.test.mjs
  snap-engine.test.mjs
  technic-engine.test.mjs
  hierarchy-engine.test.mjs
  constraint-graph.test.mjs
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
