import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type Locale = 'en' | 'zh';

const translations: Record<Locale, Record<string, string>> = {
  en: {
    'app.title': 'Keycap 3D',
    'app.subtitle': 'Visualize custom keyboard layouts with global textures.',
    'app.parameters': 'Parameters',
    'export.as': 'Export as {format}',
    'export.format': 'Export {format}',
    'kle.title': 'KLE JSON',
    'keycap.title': 'Keycap Settings',
    'keycap.profile': 'Profile',
    'keycap.color': 'Keycap Color',
    'keycap.gapX': 'Key Gap X',
    'keycap.gapY': 'Key Gap Y',
    'keycap.height': 'Height Above Case',
    'case.title': 'Keyboard Case',
    'case.shadows': 'Shadows',
    'case.baseColor': 'Base Color',
    'case.topBevel': 'Top Edge Bevel',
    'case.bottomBevel': 'Bottom Edge Bevel',
    'case.sideBevel': 'Side Edge Bevel',
    'case.topCorner': 'Top Corner Radius',
    'case.bottomCorner': 'Bottom Corner Radius',
    'label.title': 'Label Settings',
    'label.show': 'Show Labels',
    'label.position': 'Position',
    'label.font': 'Font',
    'label.fillColor': 'Fill Color',
    'label.strokeColor': 'Stroke Color',
    'label.strokeWidth': 'Stroke Width',
    'label.pos.topLeft': 'Top Left',
    'label.pos.topCenter': 'Top Center',
    'label.pos.topRight': 'Top Right',
    'label.pos.midLeft': 'Mid Left',
    'label.pos.midCenter': 'Mid Center',
    'label.pos.midRight': 'Mid Right',
    'label.pos.botLeft': 'Bot Left',
    'label.pos.botCenter': 'Bot Center',
    'label.pos.botRight': 'Bot Right',
    'label.pos.frontLeft': 'Front Left',
    'label.pos.frontCenter': 'Front Center',
    'label.pos.frontRight': 'Front Right',
    'texture.title': 'Global Texture',
    'texture.upload': 'Upload Image',
    'texture.remove': 'Remove',
    'texture.adjustments': 'Adjustments',
    'texture.scale': 'Scale',
    'texture.offsetX': 'Offset X',
    'texture.offsetY': 'Offset Y',
    'texture.aspectRatio': 'Aspect Ratio',
    'texture.rotation': 'Rotation',
    'texture.keycapOpacity': 'Keycap Opacity',
    'texture.baseOpacity': 'Base Plate Opacity',
    'texture.outOfBounds': 'Out of Bounds Mode',
    'texture.mapping': 'Texture Mapping',
    'oob.clamp': 'Clamp to Edge',
    'oob.transparent': 'Transparent',
    'oob.repeat': 'Repeat',
    'oob.mirror': 'Mirror Repeat',
    'mapping.fitted': 'Fitted (No Overlap)',
    'mapping.unfolded': 'Unfolded (Overlap)',
    'mapping.projected': 'Planar (Smear)',
    'mapping.perKey': 'Per-Keycap',
    'instructions.mobile': 'Touch to rotate \u2022 Pinch to zoom',
    'instructions.desktop': 'Left click to rotate \u2022 Right click to pan \u2022 Scroll to zoom',
  },
  zh: {
    'app.title': '键帽 3D',
    'app.subtitle': '可视化自定义键盘布局，支持全局贴图。',
    'app.parameters': '参数设置',
    'export.as': '导出为 {format}',
    'export.format': '导出 {format}',
    'kle.title': '配列JSON',
    'keycap.title': '键帽设置',
    'keycap.profile': '键帽外形',
    'keycap.color': '键帽颜色',
    'keycap.gapX': '水平间距',
    'keycap.gapY': '垂直间距',
    'keycap.height': '键帽高度',
    'case.title': '键盘外壳',
    'case.shadows': '阴影',
    'case.baseColor': '底座颜色',
    'case.topBevel': '上边缘倒角',
    'case.bottomBevel': '下边缘倒角',
    'case.sideBevel': '侧边缘倒角',
    'case.topCorner': '上圆角半径',
    'case.bottomCorner': '下圆角半径',
    'label.title': '标签设置',
    'label.show': '显示标签',
    'label.position': '位置',
    'label.font': '字体',
    'label.fillColor': '填充颜色',
    'label.strokeColor': '描边颜色',
    'label.strokeWidth': '描边宽度',
    'label.pos.topLeft': '左上',
    'label.pos.topCenter': '上中',
    'label.pos.topRight': '右上',
    'label.pos.midLeft': '左中',
    'label.pos.midCenter': '正中',
    'label.pos.midRight': '右中',
    'label.pos.botLeft': '左下',
    'label.pos.botCenter': '下中',
    'label.pos.botRight': '右下',
    'label.pos.frontLeft': '前左',
    'label.pos.frontCenter': '前中',
    'label.pos.frontRight': '前右',
    'texture.title': '全局贴图',
    'texture.upload': '上传图片',
    'texture.remove': '移除',
    'texture.adjustments': '调整参数',
    'texture.scale': '缩放',
    'texture.offsetX': 'X 偏移',
    'texture.offsetY': 'Y 偏移',
    'texture.aspectRatio': '长宽比',
    'texture.rotation': '旋转',
    'texture.keycapOpacity': '键帽透明度',
    'texture.baseOpacity': '底座透明度',
    'texture.outOfBounds': '越界模式',
    'texture.mapping': '贴图映射',
    'oob.clamp': '边缘拉伸',
    'oob.transparent': '透明',
    'oob.repeat': '重复',
    'oob.mirror': '镜像重复',
    'mapping.fitted': '适配（无重叠）',
    'mapping.unfolded': '展开（有重叠）',
    'mapping.projected': '平面投影',
    'mapping.perKey': '逐键',
    'instructions.mobile': '触摸旋转 \u2022 双指缩放',
    'instructions.desktop': '左键旋转 \u2022 右键平移 \u2022 滚轮缩放',
  },
};

function detectLocale(): Locale {
  try {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith('zh')) return 'zh';
  } catch {}
  return 'en';
}

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(detectLocale);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    let str = translations[locale]?.[key] ?? translations['en']?.[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(`{${k}}`, String(v));
      }
    }
    return str;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
