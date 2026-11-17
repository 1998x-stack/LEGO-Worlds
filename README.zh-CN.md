# BRICK WORLDS

**拼起来 · 拆开看 · 理解它**

一个独立的 3D 模块化积木系统探索项目。浏览可复用基础组件，以三维方式观察原创拼搭作品，逐步拆解装配过程，并理解每个模型由哪些零件组成。

> **非官方项目声明：** 本项目为独立的教育与三维可视化项目，与 LEGO Group 没有任何隶属、赞助、授权或认可关系。LEGO® 是 LEGO Group 的商标。本仓库使用原创程序化几何，不分发官方套装说明书、品牌标识、人仔 IP 或复制的第三方模型。

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
  viewer.js           # Three.js 场景、爆炸视图与装配步骤
  main.js             # 首页、筛选、组件浏览与交互
  styles.css          # 积木主题视觉系统与响应式布局
docs/
  architecture.md
  component-system.md
  roadmap.md
tests/
  catalog.test.mjs
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
