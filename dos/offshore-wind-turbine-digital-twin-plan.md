# 海洋风力发电机数字孪生第一版计划

## Summary

在现有 Babylon.js WebGPU 海洋场景基础上，新增一个海上风力发电机 GLB 模型，并通过 WebSocket 实时接收真实风机 6DoF 数据，驱动整机根节点在海面中复刻位置和姿态。第一版目标是打通“模型加载 -> 数据接入 -> 姿态映射 -> 状态显示”的最小闭环。

## Key Changes

### 模型资源约定

- 新增固定模型路径：`src/assets/turbine/turbine.glb`。
- 场景启动时加载该 GLB，并挂到一个统一的 `TransformNode` 根节点，例如 `WindTurbineRoot`。
- 6DoF 数据只驱动整机根节点，模型内部机舱、叶片暂不单独驱动。

### WebSocket 接口

- 通过 URL 参数配置后台地址：`?ws=wss://example.com/turbine/6dof`。
- 若未提供 `ws` 参数，默认不连接真实后台，并在状态 UI 中显示 `offline`。
- 计划接收 JSON 对象格式：

```json
{
  "timestamp": 1710000000000,
  "x": 0,
  "y": 0,
  "z": 0,
  "roll": 0,
  "pitch": 0,
  "yaw": 0
}
```

- 单位：`x/y/z` 为米，`roll/pitch/yaw` 为角度。

### 坐标与姿态映射

- 后台工程坐标：`x=东向`、`y=北向`、`z=上`。
- Babylon 场景映射：`position.x = x`、`position.z = y`、`position.y = z`。
- 姿态使用欧拉角输入，前端转换为 Babylon `Quaternion` 后赋给风机根节点。
- 第一版采用轻量插值平滑：每帧从当前 transform 向最新目标 transform 插值，降低网络抖动。

### 场景集成

- 在 `src/scenes/ocean.ts` 的现有海洋场景中集成风机模型和实时更新逻辑。
- 新增一个小型状态面板或 lil-gui 信息项，显示 WebSocket 状态：`offline / connecting / connected / stale / disconnected / error`。
- 断连或超过设定时间未收到数据时，保持最后姿态，不回原点、不隐藏模型，并显示 stale/disconnected 状态。

## Interfaces

新增前端类型：

```ts
interface Turbine6DofMessage {
    timestamp?: number;
    x: number;
    y: number;
    z: number;
    roll: number;
    pitch: number;
    yaw: number;
}
```

新增运行时 URL 参数：

- `ws`: WebSocket 地址。
- 示例：`https://localhost:8080/?ws=ws://localhost:9001/turbine/6dof`

建议新增模块职责：

- `WindTurbine`：负责 GLB 加载、根节点创建、模型缩放/初始朝向、应用 6DoF transform。
- `TurbineTelemetryClient`：负责 WebSocket 连接、JSON 校验、连接状态、最新数据缓存。
- `ocean.ts`：只负责把上述对象接入场景生命周期和 render loop。

## Test Plan

- 构建校验：运行 `npm run build`，确认 TypeScript 和 webpack 编译通过。
- 本地运行：运行 dev server，访问 `https://localhost:8080/`，确认原海洋场景仍正常加载。
- 模型加载：将 `turbine.glb` 放入 `src/assets/turbine/` 后，确认风机出现在海面中。
- WebSocket 模拟：使用本地 mock WebSocket 服务周期性发送 JSON 6DoF 数据。
- 位置映射验证：后台 `z` 变化应表现为 Babylon 竖直高度变化。
- 姿态映射验证：`roll/pitch/yaw` 改变时整机根节点连续旋转。
- 断连场景：停止 mock 服务后，风机保持最后姿态，状态变为 disconnected 或 stale。
- 异常数据：发送缺字段、非数字字段、非法 JSON，前端应忽略该帧并保持上一帧有效姿态。

## Assumptions

- 第一版只做整机 6DoF 复刻，不实现叶片转速、偏航系统、发电功率、告警、历史回放。
- GLB 模型由用户提供，固定放在 `src/assets/turbine/turbine.glb`。
- 如果模型坐标轴或缩放与场景不匹配，第一版在 `WindTurbine` 中集中配置初始缩放、初始旋转和初始偏移。
- WebSocket 后台发送频率未知，前端按“最新目标姿态 + 每帧插值”的方式处理，不要求每条消息都逐帧可见。
