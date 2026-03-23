# Keycap 3D Visualizer 技术参考文档

## 项目概览

| 层级 | 技术 | 用途 |
|------|------|------|
| UI 框架 | React 19 | 组件架构 |
| 3D 引擎 | Three.js (@react-three/fiber + drei) | 3D 场景渲染 |
| 样式 | Tailwind CSS v4 | UI 样式 |
| 构建工具 | Vite 6 | 开发服务器 & 打包 |
| 类型系统 | TypeScript 5.8 | 类型安全 |
| 布局格式 | KLE JSON | 键盘布局输入 |

## 文件结构

```
src/
├── main.tsx                 # React 入口
├── index.css                # Tailwind 导入
├── App.tsx                  # 主 UI（左侧设置面板 + 右侧 3D 视图）
└── components/
    └── Keyboard3D.tsx       # 核心 3D 渲染引擎（~850 行）
```

## 核心模块

### 1. KLE 解析器 (`parseKLE`)

解析 [Keyboard Layout Editor](http://www.keyboard-layout-editor.com/) JSON 格式。

**输入**: KLE JSON 字符串 + 键间隙参数
**输出**: `{ keys: KeyData[], width: number, height: number }`

每个按键的物理尺寸计算：
```
physicalW = w + (w - 1) * keyGapX
physicalH = h + (h - 1) * keyGapY
```

### 2. 键帽几何体 (`Keycap`)

程序化生成键帽 3D 几何体，管线如下：

```
圆角矩形 Shape → ExtrudeGeometry → 旋转/平移
  → Taper（顶面收窄）
  → Scoop（顶面凹槽：cylindrical / spherical）
  → 9-Slice Stretch（>1u 按键扩展）
  → Row Tilt（行倾斜：仅顶面以上）
  → UV 映射
```

**参数配置表（Profile）**:

| Profile | Height | TopScale | Scoop | Tilt |
|---------|--------|----------|-------|------|
| OEM     | 0.45   | 0.70     | 圆柱  | ✓    |
| Cherry  | 0.35   | 0.70     | 圆柱  | ✓    |
| SA      | 0.60   | 0.60     | 球面  | ✓    |
| DSA     | 0.30   | 0.70     | 球面  | ✗    |
| XDA     | 0.30   | 0.80     | 球面  | ✗    |
| KAT     | 0.45   | 0.65     | 球面  | ✓    |

行倾斜角度: `[8°, 4°, 0°, -4°, -8°, -8°]`

#### 9-Slice Stretch

对于大于 1u 的按键，仅拉伸 `|x| > 0.001` 的顶点（中间行/列），保持边角不变形：

```
if (vxTapered > 0.001)  vxTapered += stretchX / 2
if (vxTapered < -0.001) vxTapered -= stretchX / 2
```

### 3. 键盘外壳 (`BasePlate`)

程序化生成带倒角和圆角的键盘外壳。

**几何参数**:
- 外壳宽度 = 键盘宽度 + 0.5（每侧 0.25 边距）
- 外壳厚度 T = 0.4
- 垂直分段 M = 24，角分段 N = 12

**倒角计算**: 使用圆形弧线内切，`getInset(B, y)` 计算在高度 y 处的内缩量：

```javascript
if (y <= startY) return 0;                    // 倒角以下无内缩
return B - sqrt(B² - (y - startY)²);          // 圆弧内缩
```

**Y 轴分布**: 使用正弦曲线 `t = sin(j/M * π/2)` 在顶部区域集中更多分段点。

**几何结构**:
- 侧面：24 层周长，每层 52 个点（4 角 × 13） + 1 闭合点
- 顶盖：扇形三角化（中心点 → 周长顶点）
- 底盖：扇形三角化（中心点 → 周长底点）

### 4. 文字标签系统

使用 `@react-three/drei` 的 `<Text>` 组件，通过射线投射（Raycaster）计算标签在键帽表面的精确位置。

**12 个标签位置**:

| 位置 | 描述 | Anchor |
|------|------|--------|
| top-left/center/right | 顶面 3×3 网格 | left/center × top/middle/bottom |
| mid-left/center/right | | |
| bot-left/center/right | | |
| front-left/center/right | 前面（侧面下部） | left/center × middle |

前面标签位置使用解析计算（基于 taper 角度），顶面标签使用射线投射。

## 纹理映射系统

### UV 映射模式

提供 4 种 UV 映射策略：

#### 4.1 Projected（平面投影）

```
u = uWorld / keyboardWidth
v = 1 - (vWorld / keyboardHeight)
```

侧面 UV 坐标与顶面相同（按顶面位置"涂抹"），适合俯视角度。

#### 4.2 Unfolded（全局展开）

```
uWorld = physicalX + uvW/2 + vxTapered + nx * drop * 0.6
vWorld = physicalY + uvH/2 + vzTapered + nz * drop * 0.6
```

侧面沿法线方向展开 `drop * 0.6` 的距离，保持纹理连续性。

#### 4.3 Fitted（无重叠）

与 Unfolded 相同的侧面展开方式，但将展开区域压缩回按键的物理占用空间内，避免相邻按键 UV 重叠。

#### 4.4 Per-Key（每键独立）

每个键帽显示完整贴图，自动保持图片原始长宽比：

```javascript
const scaleV = 2 * Math.max(boundV, boundU / imgAsp);
const scaleU = imgAsp * scaleV;
u = localU / scaleU + 0.5;
v = 0.5 - localV / scaleV;
```

### 纹理变换矩阵

通过 `THREE.Texture.matrix` 实现 2D 仿射变换，控制贴图的缩放、旋转、偏移和长宽比。

#### 非 Per-Key 模式

```
a = textureAspect × (kbAspect / imgAsp) × s × cos(θ)
b = -textureAspect × s × sin(θ) / imgAsp
c = kbAspect × s × sin(θ)
d = s × cos(θ)
tx = 0.5 - offsetX - 0.5 × (a + b)
ty = 0.5 + offsetY - 0.5 × (c + d)
```

其中 `s = 1 / textureScale`，`baseUScale = kbAspect / imgAsp`。

**核心设计**: `textureAspect = 1` 时图片以原始比例呈现（无压缩/拉伸），旋转在物理空间中保持各向同性。

**数学推导** — 旋转无变形条件:

UV 空间 [0,1]×[0,1] 映射到物理空间 [0, kbW]×[0, kbH]，因此 1 单位 U = kbW 物理单位，1 单位 V = kbH 物理单位。物理空间中各向同性旋转矩阵（转换为 UV 坐标后）：

```
R_uv = | cos        -sin/kbAspect |
       | kbAspect×sin    cos       |
```

在此基础上叠加图片宽高比校正和 textureAspect：
- `a` 使用 `baseUScale` 做水平缩放（使图片以原始比例适配键盘宽度）
- `b` 除以 `imgAsp`（而非 `baseUScale`），保证旋转轴的缩放一致
- `c` 乘以 `kbAspect`，将物理空间的垂直分量正确转换回 UV 坐标

当 `θ = 0` 时矩阵退化为 `a = textureAspect × baseUScale × s, b = 0, c = 0, d = s`，与无旋转时行为一致。

#### Per-Key 模式

使用 `imageAspect` 进行修正旋转（因为 per-key UV 空间已内置 imageAspect 校正）：

```
aRot = s × cos(θ)
bRot = -s × sin(θ) / imgAsp
cRot = s × sin(θ) × imgAsp
dRot = s × cos(θ)
a = textureAspect × aRot
b = textureAspect × bRot
```

### Out of Bounds 处理

通过自定义 GLSL 片段着色器实现：

```glsl
bool outOfBounds = vMapUv.x < 0.0 || vMapUv.x > 1.0 ||
                   vMapUv.y < 0.0 || vMapUv.y > 1.0;
if (outOfBounds) texelColor = vec4(0.0);  // transparent 模式
```

| 模式 | WrapS/WrapT | 着色器行为 |
|------|-------------|------------|
| Clamp | ClampToEdge | 边缘像素延伸 |
| Transparent | ClampToEdge | 越界区域透明 |
| Repeat | RepeatWrapping | 纹理平铺 |
| Mirror | MirroredRepeatWrapping | 纹理镜像平铺 |

### 自动图片宽高比检测

加载纹理时自动检测：

```javascript
const aspect = (img.width || 1) / (img.height || 1);
setImageAspect(aspect);
```

`imageAspect` 用于 per-key UV 计算和非 per-key 模式的纹理矩阵基准校正。

## UI 设置面板

### 设置项一览

| 类别 | 参数 | 范围 | 默认值 |
|------|------|------|--------|
| **键帽** | Profile | OEM/Cherry/SA/DSA/XDA/KAT | OEM |
| | Keycap Color | 颜色选择器 | #e2e8f0 |
| | Key Gap X/Y | 0 ~ 0.3 | 0.1 |
| | Height Above Case | 0 ~ 0.5 | 0.02 |
| **外壳** | Base Color | 颜色选择器 | #cbd5e1 |
| | Top/Bottom/Side Bevel | 0 ~ 0.4 | 0.3 / 0.3 / 0.01 |
| | Top/Bottom Corner Radius | 0 ~ 0.5 | 0.05 |
| **标签** | Show Labels | 开关 | true |
| | Position | 12 选项 | top-left |
| | Font | 5 种 | Inter |
| | Fill/Stroke Color | 颜色选择器 | #334155 / #000 |
| | Stroke Width | 0 ~ 0.05 | 0 |
| **纹理** | Scale | 0.1 ~ 3 | 1 |
| | Offset X/Y | -1 ~ 1 | 0 |
| | Aspect Ratio | 0.5 ~ 2 | 1 |
| | Rotation | 0 ~ 360° | 0 |
| | Keycap Opacity | 0 ~ 1 | 1 |
| | Base Plate Opacity | 0 ~ 1 | 1 |
| | Out of Bounds | clamp/transparent/repeat/mirror | clamp |
| | Texture Mapping | fitted/unfolded/projected/per-key | projected |

## 3D 场景

- **相机**: 位置 `[0, 8, 5]`，FOV 45°
- **光照**: 环境光 0.6 + 方向光 1.2（带阴影）
- **阴影**: 2048×2048 shadow map + ContactShadows
- **控制器**: OrbitControls，极角限制 `0 ~ π/2 - 0.1`（不能看到键盘底部）
- **导出**: 通过 `canvas.toDataURL('image/png')` 导出 PNG
