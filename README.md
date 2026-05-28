# OceanDemo 本地开发说明

## 项目简介

本项目是一个基于 Babylon.js 和 WebGPU 的海洋渲染演示项目，核心目标是通过 GPU 计算着色器模拟和渲染动态海面效果。项目包含 FFT 海浪生成、海面材质、天空盒、浮力物体、GUI 参数调节和相关调试工具。

该项目来源于 `Popov72/OceanDemo`，原项目是对 Unity FFT-Ocean 示例的 Babylon.js WebGPU 移植版本。当前本地目录可作为后续修改、实验和二次开发的基础。

## 技术栈

- TypeScript
- Babylon.js 5.x
- WebGPU
- WGSL 计算着色器
- webpack / webpack-dev-server
- lil-gui 参数面板

## 环境要求

建议环境：

- Node.js 18 或更高版本
- npm
- 支持 WebGPU 的浏览器，例如新版 Chrome 或 Edge
- 支持 WebGPU 的显卡驱动和系统图形环境

注意：如果浏览器或显卡环境不支持 WebGPU，项目会回退到 Babylon.js 的普通 `Engine`，但海洋计算相关效果可能无法完整呈现。

本项目当前固定使用 Babylon.js `5.28.0`。不要直接把 `@babylonjs/*` 依赖升级到较新的 5.x 版本，否则可能触发旧示例代码和新版 WebGPU 引擎之间的兼容问题。

## 安装依赖

在项目根目录执行：

```powershell
npm install
```

如果 PowerShell 因执行策略拦截 `npm.ps1`，可以改用：

```powershell
cmd /c npm install
```

项目中的 `.npmrc` 已设置：

```ini
legacy-peer-deps = true
fund = false
package-lock = false
```

因此安装依赖时不会生成 `package-lock.json`。

## 本地运行

最简单方式是双击项目根目录中的：

```text
start-ocean-demo.bat
```

该脚本会自动切换到项目目录，检查 `node` / `npm`，在缺少 `node_modules` 时自动执行 `npm install`。启动前会生成本地 HTTPS 自签名证书，并检查 `8080` 端口。如果该端口已被旧服务占用，会先结束占用进程，然后重新启动开发服务器。

脚本会使用 HTTPS 和 `--host 0.0.0.0` 启动 webpack-dev-server，因此同一局域网内的其他设备也可以访问页面。

启动开发服务器：

```powershell
npm start
```

如果 PowerShell 拦截 npm 命令，可以使用：

```powershell
cmd /c npm start
```

默认访问地址：

```text
https://localhost:8080
```

局域网访问地址格式：

```text
https://本机局域网IP:8080
```

例如：

```text
https://192.168.1.23:8080
```

一键启动脚本会自动打印当前机器检测到的局域网 IPv4 地址。若其他设备无法访问，请确认：

- 两台设备在同一局域网
- Windows 防火墙允许 Node.js 访问专用网络
- 浏览器访问的是脚本打印出的 IPv4 地址，不是 `localhost`

注意：WebGPU 需要安全上下文。`start-ocean-demo.bat` 会生成 `certs/ocean-demo-local.key` 和 `certs/ocean-demo-local.crt` 供开发服务器使用，并导出 `certs/ocean-demo-local.cer` 给客户端信任。

局域网客户端第一次访问前，建议复制这些文件到客户端机器：

```text
certs/ocean-demo-local.cer
install-ocean-demo-cert-client.bat
open-ocean-demo-client.bat
```

先运行 `install-ocean-demo-cert-client.bat` 安装证书到当前用户的受信任根证书存储，再运行 `open-ocean-demo-client.bat` 输入服务端 IP 打开页面。

如果 `8080` 端口已被旧的 OceanDemo 开发服务器占用，一键启动脚本会先结束占用进程再启动。手动执行 `npm start` 时，如果遇到 `EADDRINUSE`，请先关闭旧的开发服务器窗口，或改用 `start-ocean-demo.bat`。

项目的 webpack 配置会尝试打开 Chrome，并传入 `--enable-unsafe-webgpu` 参数。若浏览器没有自动打开，请手动访问上面的地址。

如果页面已经打开但仍显示旧错误，建议执行一次强制刷新：

```text
Ctrl + F5
```

开发服务器支持热更新，但 WebGPU shader 管线失败后，浏览器中可能残留旧的失败状态，强制刷新可以重新创建 GPU 设备和渲染管线。

运行时操作：

- 点击渲染区域后可获得键盘焦点
- `WASD` 控制移动
- `F8` 显示或隐藏 GUI 面板

## 构建发布

执行生产构建：

```powershell
npm run build
```

如果 PowerShell 拦截 npm 命令，可以使用：

```powershell
cmd /c npm run build
```

构建产物输出到：

```text
dist/
```

构建时可能出现资源体积相关 warning，这是因为项目包含较大的 `.glb`、`.hdr`、`.exr` 和海洋场景脚本资源，属于当前演示项目的正常情况。

## 目录结构

```text
OceanDemo/
├── dist/                 # 构建产物目录
├── node_modules/         # npm 依赖目录
├── src/
│   ├── assets/
│   │   ├── environment/  # 环境贴图资源
│   │   └── ocean/        # 海洋纹理、模型、WGSL 着色器资源
│   ├── scenes/
│   │   ├── tools/        # 计算、调试、序列化和数学工具
│   │   ├── buoyancy.ts   # 浮力逻辑
│   │   ├── fft.ts        # FFT 计算流程
│   │   ├── ocean.ts      # 主海洋场景
│   │   ├── oceanGeometry.ts
│   │   ├── oceanGui.ts
│   │   ├── oceanMaterial.ts
│   │   ├── skyBox.ts
│   │   ├── wavesCascade.ts
│   │   ├── wavesGenerator.ts
│   │   └── wavesSettings.ts
│   ├── createScene.ts    # 场景模块加载入口
│   ├── index.html        # 页面模板
│   └── index.ts          # Babylon.js 初始化入口
├── package.json          # 项目脚本和依赖声明
├── tsconfig.json         # TypeScript 配置
└── webpack.config.js     # webpack 构建和开发服务器配置
```

## 开发说明

项目入口位于 `src/index.ts`。启动时会根据 URL 查询参数加载场景模块：

```text
?scene=模块名
```

如果没有传入 `scene` 参数，则由 `src/createScene.ts` 决定默认加载的场景。

海洋核心逻辑主要位于 `src/scenes/`：

- `ocean.ts` 负责组织主场景
- `wavesGenerator.ts`、`wavesCascade.ts`、`fft.ts` 负责波浪数据生成和频域计算
- `oceanMaterial.ts` 负责海面材质
- `oceanGeometry.ts` 负责海面网格
- `buoyancy.ts` 负责漂浮物体的浮力表现
- `oceanGui.ts` 负责 GUI 参数调节

WGSL 计算着色器位于：

```text
src/assets/ocean/*.wgsl
```

如果需要修改海浪算法，通常需要同时关注 TypeScript 侧的数据流和 WGSL 侧的计算逻辑。

## WebGPU 兼容说明

结论：如果页面 UI 已加载，但海浪三维场景不显示，优先检查浏览器控制台中的第一条 WebGPU 错误。

当前项目使用旧版 Babylon.js `5.28.0`。新版浏览器的 WebGPU 校验更严格，旧版 Babylon.js 通过 `twgsl` 转译出的部分 WGSL 可能触发如下错误：

```text
textureSampleBias must only be called from uniform control flow
Invalid ShaderModule
Invalid RenderPipeline
Invalid CommandBuffer
```

真正的根因通常是第一条 `textureSampleBias` 错误。后面的 `Invalid RenderPipeline`、`Invalid CommandBuffer` 都是渲染管线创建失败后的连锁错误。

本地 `src/index.ts` 已加入兼容补丁：在创建 `WebGPUEngine` 前修补 `WebGPUTintWASM.prototype.convertSpirV2WGSL`，让旧版 Babylon.js 以新版方式关闭 `derivative_uniformity` 诊断，并在 WGSL 前加入：

```wgsl
diagnostic(off, derivative_uniformity);
```

同时，补丁会把旧版 `twgsl` 生成的：

```wgsl
textureSampleBias(...)
```

替换为：

```wgsl
textureSampleLevel(...)
```

原因是 `textureSampleBias` 属于隐式导数采样，新版浏览器会要求它只能出现在 uniform control flow 中；显式 LOD 采样可以避开这类 uniformity 校验。

因此正常情况下不需要手动修改 Babylon.js 的 `node_modules` 文件。

## 常见问题

### npm 命令在 PowerShell 中无法运行

结论：使用 `cmd /c npm ...` 运行即可。

原因是 Windows PowerShell 的执行策略可能会阻止 `npm.ps1`。例如：

```powershell
cmd /c npm install
cmd /c npm start
cmd /c npm run build
```

### 页面打开但没有完整海洋效果

结论：优先检查浏览器和显卡是否支持 WebGPU。

原因是该项目依赖 WebGPU 和计算着色器。建议使用新版 Chrome 或 Edge，并确认浏览器 WebGPU 功能可用。

### 局域网其他机器提示 WebGPU / compute shaders 不可用

结论：最常见原因不是显卡不支持，而是客户端没有信任服务端的 HTTPS 自签名证书，Chrome 没有把页面当作安全上下文，因此禁用了 WebGPU。

原因是 WebGPU 只能在安全上下文中使用。本机的 `localhost` 是例外；局域网访问应使用 HTTPS，并且证书需要被客户端信任。

处理步骤：

1. 确认服务端已运行 `start-ocean-demo.bat`。
2. 把 `certs/ocean-demo-local.cer`、`install-ocean-demo-cert-client.bat`、`open-ocean-demo-client.bat` 复制到客户端机器。
3. 在客户端运行 `install-ocean-demo-cert-client.bat`。
4. 重启 Chrome。
5. 运行 `open-ocean-demo-client.bat`，输入服务端 IP，例如 `192.168.1.23`。

如果仍无效，检查客户端 Chrome 地址栏是否显示证书可信，以及客户端机器是否支持 WebGPU。

### 页面 UI 加载了，但海浪三维场景一直没有加载

结论：这通常是 WebGPU shader 编译失败，不是 DOM 或 GUI 加载失败。

原因是 GUI 是普通页面 UI，而海浪场景依赖 Babylon.js WebGPU 渲染管线。只要某个 shader 模块创建失败，画布中的三维场景就可能一直为空。

排查步骤：

1. 打开浏览器开发者工具，查看 Console 中第一条 WebGPU 错误。
2. 如果看到 `textureSampleBias must only be called from uniform control flow`，确认当前代码包含 `src/index.ts` 中的 WebGPU uniformity 兼容补丁。
3. 强制刷新页面：`Ctrl + F5`。
4. 重新运行构建确认代码没有 TypeScript 或打包错误：

```powershell
cmd /c npm run build
```

如果第一条错误不是 `textureSampleBias`，应优先按新的第一条错误继续排查，不要只看后续大量重复的 `Invalid RenderPipeline` 或 `Invalid CommandBuffer`。

### 构建时出现资源体积 warning

结论：这是当前项目资源规模导致的 warning，不代表构建失败。

原因是项目包含大型船只模型、浮标模型、HDR/EXR 贴图和较大的场景脚本。

### TypeScript 报 WebGPU feature 类型错误

结论：这是旧示例代码和当前 TypeScript WebGPU 类型定义之间的兼容问题。

原因是某些 WebGPU feature 字符串在当前类型定义中不一定完整声明。当前本地代码已对 `src/index.ts` 中的 `requiredFeatures` 做了类型兼容处理，以保证构建能够通过。

## 最近更新（UI/UX 深度重构与视觉升级）

项目已完成了一次全面的 UI/UX 深度重构与视觉升级，成果包括：

1. **视觉风格升级（经典暗黑霓虹磨砂玻璃）**：全量回归了以荧光青蓝（`#00f2fe`）、荧光亮绿（`#00f5a0`）和信标红（`#ff3366`）为核心点缀的暗黑毛玻璃风格，提供高级的景深感与夜间科幻体验。
2. **左右对称双侧面板大屏**：左侧面板展示环境及风机运行数据，右侧面板展示风机运动姿态数据与末 12 位高精经纬度，结构更符合现代化工业大屏需求。
3. **高逼真三维冰透试管压载舱**：将水位计重构为三支悬空冰透圆底试管水位槽。实现了船体简谐晃动下压载水在重力约束下的差分互补自流物理计算，并配有极光信标红点平滑升降。
4. **15组手绘高精 inline SVG 图标**：重绘了所有传感器和姿态指标的图标，实现 100% 物理意义对齐（如风速、风向、发电机功率、叶轮转速、缆绳张力等），杜绝了图标与数据不匹配问题。
5. **单次黄金加载 Preloader 机制**：重构了加载逻辑，让 30MB 模型彻底载入与 WebGPU 首帧绘制瞬间完美无缝对接，首帧加载完毕后 preloader 遮罩平滑淡出并销毁，彻底消除“二次加载”和进入场景时的黑屏体验。
