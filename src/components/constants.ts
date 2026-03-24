export const PROFILES: Record<string, any> = {
  OEM: { height: 0.45, topScale: 0.7, scoopType: 'cylindrical', tilt: true },
  Cherry: { height: 0.35, topScale: 0.7, scoopType: 'cylindrical', tilt: true },
  SA: { height: 0.6, topScale: 0.6, scoopType: 'spherical', tilt: true },
  DSA: { height: 0.3, topScale: 0.7, scoopType: 'spherical', tilt: false },
  XDA: { height: 0.3, topScale: 0.8, scoopType: 'spherical', tilt: false },
  KAT: { height: 0.45, topScale: 0.65, scoopType: 'spherical', tilt: true },
};

export const FONTS: Record<string, string> = {
  'Inter': 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/files/inter-latin-400-normal.woff',
  'Roboto': 'https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-400-normal.woff',
  'JetBrains Mono': 'https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5.0.17/files/jetbrains-mono-latin-400-normal.woff',
  'Playfair Display': 'https://cdn.jsdelivr.net/npm/@fontsource/playfair-display@5.0.8/files/playfair-display-latin-400-normal.woff',
  'Comic Sans MS': 'https://cdn.jsdelivr.net/npm/@fontsource/comic-neue@5.0.8/files/comic-neue-latin-400-normal.woff'
};
