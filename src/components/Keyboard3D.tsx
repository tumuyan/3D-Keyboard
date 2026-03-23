import React, { useRef, useMemo, useLayoutEffect, Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Text } from '@react-three/drei';
import * as THREE from 'three';

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

// Parse KLE JSON
export function parseKLE(kleString: string, keyGapX: number = 0, keyGapY: number = 0) {
  let data;
  try {
    data = new Function("return " + kleString)();
  } catch (e) {
    throw new Error("Invalid KLE format");
  }

  const keys: any[] = [];
  let currentX = 0;
  let currentY = 0;
  let rowIndex = 0;
  let defaultProps = { w: 1, h: 1, x: 0, y: 0 };

  data.forEach((row: any) => {
    if (Array.isArray(row)) {
      let props = { ...defaultProps };
      row.forEach((item: any) => {
        if (typeof item === 'object') {
          if (item.w) props.w = item.w;
          if (item.h) props.h = item.h;
          if (item.x) currentX += item.x;
          if (item.y) currentY += item.y;
        } else if (typeof item === 'string') {
          keys.push({
            label: item,
            x: currentX,
            y: currentY,
            w: props.w,
            h: props.h,
            rowIndex
          });
          currentX += props.w;
          props = { ...defaultProps };
        }
      });
      currentY += 1;
      currentX = 0;
      rowIndex++;
    }
  });

  let maxX = 0;
  let maxY = 0;
  keys.forEach(k => {
    const physicalX = k.x * (1 + keyGapX);
    const physicalW = k.w + (k.w - 1) * keyGapX;
    if (physicalX + physicalW > maxX) maxX = physicalX + physicalW;
    
    const physicalY = k.y * (1 + keyGapY);
    const physicalH = k.h + (k.h - 1) * keyGapY;
    if (physicalY + physicalH > maxY) maxY = physicalY + physicalH;
  });

  return { keys, width: maxX, height: maxY };
}

function Keycap({ 
  keyData, keyboardWidth, keyboardHeight, texture, profile, 
  showLabels, labelPosition, textureOpacity,
  labelColor, labelOutlineColor, labelOutlineWidth, fontUrl, keycapColor, keyGapX, keyGapY,
  outOfBoundsMode, textureMapping, imageAspect, heightAboveCase
}: any) {
  const geometry = useMemo(() => {
    const { w, h, rowIndex } = keyData;
    const prof = PROFILES[profile] || PROFILES.OEM;
    const { height, topScale, scoopType, tilt } = prof;
    
    const physicalW = w + (w - 1) * keyGapX;
    const physicalH = h + (h - 1) * keyGapY;
    
    // Base size for geometry generation (max 1u)
    const baseW = Math.min(w, 1);
    const baseH = Math.min(h, 1);
    
    const width = Math.max(0.1, baseW);
    const depth = Math.max(0.1, baseH);
    
    const stretchX = Math.max(0, physicalW - baseW);
    const stretchZ = Math.max(0, physicalH - baseH);
    
    const shape = new THREE.Shape();
    const r = 0.1;
    shape.moveTo(-width/2 + r, -depth/2);
    shape.lineTo(width/2 - r, -depth/2);
    shape.quadraticCurveTo(width/2, -depth/2, width/2, -depth/2 + r);
    shape.lineTo(width/2, depth/2 - r);
    shape.quadraticCurveTo(width/2, depth/2, width/2 - r, depth/2);
    shape.lineTo(-width/2 + r, depth/2);
    shape.quadraticCurveTo(-width/2, depth/2, -width/2, depth/2 - r);
    shape.lineTo(-width/2, -depth/2 + r);
    shape.quadraticCurveTo(-width/2, -depth/2, -width/2 + r, -depth/2);

    const extrudeSettings = {
      depth: height,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04,
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.rotateX(Math.PI / 2);
    geom.translate(0, height, 0);

    geom.computeVertexNormals();
    
    const pos = geom.attributes.position;
    const norm = geom.attributes.normal;
    const uv = geom.attributes.uv;

    for (let i = 0; i < pos.count; i++) {
      let vx = pos.getX(i);
      let vy = pos.getY(i);
      let vz = pos.getZ(i);
      const nx = norm.getX(i);
      const nz = norm.getZ(i);
      
      const ny = vy / height;
      
      // Taper
      const scale = 1 - (1 - topScale) * ny;
      let vxTapered = vx * scale;  // 用于几何
      let vzTapered = vz * scale;
      
      // Scoop
      if (ny > 0.5) {
        const scoopAmount = scoopType === 'spherical' 
          ? Math.max(0, 0.15 - (vxTapered*vxTapered + vzTapered*vzTapered)*0.08)
          : Math.max(0, 0.15 - Math.abs(vzTapered)*0.1);
          
        vy -= scoopAmount * (ny - 0.5) * 2;
      }
      
      // 9-slice stretch
      if (stretchX > 0) {
        if (vxTapered > 0.001) vxTapered += stretchX / 2;
        else if (vxTapered < -0.001) vxTapered -= stretchX / 2;
      }
      
      if (stretchZ > 0) {
        if (vzTapered > 0.001) vzTapered += stretchZ / 2;
        else if (vzTapered < -0.001) vzTapered -= stretchZ / 2;
      }
      
      // Tilt (apply after stretch for continuous slope on tall keys)
      if (ny > 0.5 && tilt) {
        const rowTilts = [8, 4, 0, -4, -8, -8];
        const angle = (rowTilts[Math.min(rowIndex, 5)] || 0) * Math.PI / 180;
        vy += vzTapered * Math.tan(angle);
      }
      
      pos.setXYZ(i, vxTapered, vy, vzTapered);
      
      // 5-Face UV Mapping
      const physicalX = keyData.x * (1 + keyGapX);
      const physicalY = keyData.y * (1 + keyGapY);
      
      // UV 计算使用的宽度/高度（考虑 stretch）
      const uvW = physicalW;
      const uvH = physicalH;
      
      let u = 0;
      let v = 0;
      
      if (textureMapping === 'projected') {
        // 投影模式：侧面会被"涂抹"到顶面位置
        const uWorld = physicalX + uvW / 2 + vxTapered;
        const vWorld = physicalY + uvH / 2 + vzTapered;
        u = uWorld / keyboardWidth;
        v = 1.0 - (vWorld / keyboardHeight);
      } else if (textureMapping === 'per-key') {
        // 每键独立模式：每个键帽显示完整贴图，保持图片原始长宽比
        const drop = height - vy;
        let localU = vxTapered + nx * drop * 0.6;
        let localV = vzTapered + nz * drop * 0.6;
        
        // 计算几何边界（底面尺寸 + 侧面展开）
        const sideExpand = height * 0.6;
        const boundU = uvW / 2 + sideExpand;
        const boundV = uvH / 2 + sideExpand;
        
        // 图片的实际长宽比
        const imgAsp = imageAspect || 1;
        
        // 计算缩放因子，保证 UV 在 [0, 1] 范围内，同时保持贴图长宽比
        // scaleU >= 2 * boundU (保证 u 在 [0, 1])
        // scaleV >= 2 * boundV (保证 v 在 [0, 1])
        // scaleU / scaleV = imgAsp (保持贴图长宽比)
        const scaleV = 2 * Math.max(boundV, boundU / imgAsp);
        const scaleU = imgAsp * scaleV;
        
        // UV 坐标映射：几何空间 -> UV 空间
        u = localU / scaleU + 0.5;
        v = 0.5 - localV / scaleV;
      } else if (textureMapping === 'fitted') {
        // 无重叠模式：每个按键 UV 范围恰好匹配其物理占用空间
        const drop = height - vy;
        // 使用实际几何位置
        let localU = vxTapered + nx * drop * 0.6;
        let localV = vzTapered + nz * drop * 0.6;
        
        // 侧面展开范围
        const maxLocalU = uvW / 2 + height * 0.6;
        const maxLocalV = uvH / 2 + height * 0.6;
        
        // 目标：按键实际占用空间（含间隙）
        const targetMaxU = (uvW + keyGapX) / 2;
        const targetMaxV = (uvH + keyGapY) / 2;
        
        // 将侧面展开压缩到目标空间
        localU = localU * (targetMaxU / maxLocalU);
        localV = localV * (targetMaxV / maxLocalV);
        
        const uWorld = physicalX + uvW / 2 + localU;
        const vWorld = physicalY + uvH / 2 + localV;
        u = uWorld / keyboardWidth;
        v = 1.0 - (vWorld / keyboardHeight);
      } else {
        // unfolded (default): 全局连续，侧面展开
        const drop = height - vy;
        // 使用 taper 后的坐标进行 stretch 感知
        let uWorld = physicalX + uvW / 2 + vxTapered + nx * drop * 0.6;
        let vWorld = physicalY + uvH / 2 + vzTapered + nz * drop * 0.6;
        u = uWorld / keyboardWidth;
        v = 1.0 - (vWorld / keyboardHeight);
      }
      
      uv.setXY(i, u, v);
    }
    
    uv.needsUpdate = true;
    geom.computeVertexNormals();
    return geom;
  }, [keyData, keyboardWidth, keyboardHeight, profile, keyGapX, keyGapY, textureMapping, imageAspect]);

  const physicalX = keyData.x * (1 + keyGapX);
  const physicalY = keyData.y * (1 + keyGapY);
  const physicalW = keyData.w + (keyData.w - 1) * keyGapX;
  const physicalH = keyData.h + (keyData.h - 1) * keyGapY;
  
  const posX = physicalX + physicalW / 2 - keyboardWidth / 2;
  const posZ = physicalY + physicalH / 2 - keyboardHeight / 2;

  const { pos: labelPos, rot: labelRot } = useMemo(() => {
    const prof = PROFILES[profile] || PROFILES.OEM;
    const w = physicalW;
    const h = physicalH;
    const padX = w/2 - 0.2;
    const padZ = h/2 - 0.2;
    
    let vx = 0;
    let vz = 0;
    let isFront = false;
    
    switch(labelPosition) {
      case 'top-left': vx = -padX; vz = -padZ; break;
      case 'top-center': vx = 0; vz = -padZ; break;
      case 'top-right': vx = padX; vz = -padZ; break;
      case 'mid-left': vx = -padX; vz = 0; break;
      case 'mid-center': vx = 0; vz = 0; break;
      case 'mid-right': vx = padX; vz = 0; break;
      case 'bot-left': vx = -padX; vz = padZ; break;
      case 'bot-center': vx = 0; vz = padZ; break;
      case 'bot-right': vx = padX; vz = padZ; break;
      case 'front-left': vx = -padX; vz = h/2; isFront = true; break;
      case 'front-center': vx = 0; vz = h/2; isFront = true; break;
      case 'front-right': vx = padX; vz = h/2; isFront = true; break;
      default: vx = -padX; vz = -padZ; break;
    }
    
    if (isFront) {
      const baseDepth = Math.max(0.1, Math.min(keyData.h, 1));
      const dz = (baseDepth/2) * (1 - prof.topScale);
      const dy = prof.height;
      const angle = Math.atan2(dz, dy);
      
      const scale = 1 - (1 - prof.topScale) * 0.5;
      const frontY = prof.height / 2;
      const frontZ = (baseDepth/2 + 0.04) * scale + 0.02;
      
      return {
        pos: [vx, frontY, frontZ],
        rot: [-angle, 0, 0]
      };
    }
    
    let angle = 0;
    if (prof.tilt) {
      const rowTilts = [8, 4, 0, -4, -8, -8];
      angle = (rowTilts[Math.min(keyData.rowIndex, 5)] || 0) * Math.PI / 180;
    }
    
    const raycaster = new THREE.Raycaster(
      new THREE.Vector3(vx, prof.height + 1, vz),
      new THREE.Vector3(0, -1, 0)
    );
    const tempMesh = new THREE.Mesh(geometry);
    tempMesh.updateMatrixWorld();
    const intersects = raycaster.intersectObject(tempMesh);
    
    let vy = prof.height + 0.04;
    if (intersects.length > 0) {
      vy = intersects[0].point.y;
    } else {
      const scoopAmount = prof.scoopType === 'spherical' 
        ? Math.max(0, 0.15 - (vx*vx + vz*vz)*0.08)
        : Math.max(0, 0.15 - Math.abs(vz)*0.1);
      vy -= scoopAmount;
      if (prof.tilt) {
        vy += vz * Math.tan(angle);
      }
    }
    
    return {
      pos: [vx, vy + 0.01, vz],
      rot: [-Math.PI / 2 - angle, 0, 0]
    };
  }, [profile, physicalW, physicalH, labelPosition, keyData.h, keyData.rowIndex, geometry]);

  const getLabelAnchor = () => {
    switch(labelPosition) {
      case 'top-left': return { anchorX: 'left', anchorY: 'top' };
      case 'top-center': return { anchorX: 'center', anchorY: 'top' };
      case 'top-right': return { anchorX: 'right', anchorY: 'top' };
      case 'mid-left': return { anchorX: 'left', anchorY: 'middle' };
      case 'mid-center': return { anchorX: 'center', anchorY: 'middle' };
      case 'mid-right': return { anchorX: 'right', anchorY: 'middle' };
      case 'bot-left': return { anchorX: 'left', anchorY: 'bottom' };
      case 'bot-center': return { anchorX: 'center', anchorY: 'bottom' };
      case 'bot-right': return { anchorX: 'right', anchorY: 'bottom' };
      case 'front-left': return { anchorX: 'left', anchorY: 'middle' };
      case 'front-center': return { anchorX: 'center', anchorY: 'middle' };
      case 'front-right': return { anchorX: 'right', anchorY: 'middle' };
      default: return { anchorX: 'left', anchorY: 'top' };
    }
  };

  const labelAnchor = getLabelAnchor();

  return (
    <mesh position={[posX, heightAboveCase, posZ]} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial 
        key={`${texture ? texture.uuid : 'no-tex'}-${textureOpacity}-${outOfBoundsMode}-${textureMapping}`}
        map={(textureOpacity > 0 && texture) ? texture : null} 
        color={keycapColor}
        roughness={0.6}
        metalness={0.1}
        transparent={textureOpacity < 1}
        opacity={textureOpacity > 0 ? textureOpacity : 1}
        customProgramCacheKey={() => outOfBoundsMode}
        onBeforeCompile={(shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            `#include <map_fragment>`,
            `
            #ifdef USE_MAP
              vec4 texelColor = texture2D( map, vMapUv );
              
              bool outOfBounds = vMapUv.x < 0.0 || vMapUv.x > 1.0 || vMapUv.y < 0.0 || vMapUv.y > 1.0;
              
              ${outOfBoundsMode === 'transparent' ? `
              if (outOfBounds) {
                texelColor = vec4(0.0);
              }
              ` : ''}
              
              diffuseColor.rgb = mix(diffuseColor.rgb, texelColor.rgb, texelColor.a);
            #endif
            `
          );
        }}
      />
      {showLabels && keyData.label && (
        <Suspense fallback={null}>
          <Text
            position={labelPos as any}
            rotation={labelRot as any}
            fontSize={0.15}
            color={labelColor}
            font={fontUrl}
            anchorX={labelAnchor.anchorX as any}
            anchorY={labelAnchor.anchorY as any}
            outlineWidth={labelOutlineWidth}
            outlineColor={labelOutlineColor}
          >
            {keyData.label}
          </Text>
        </Suspense>
      )}
    </mesh>
  );
}

function BasePlate({ width, height, texture, baseOpacity, baseColor, keyGapX, keyGapY, topBevel, bottomBevel, sideBevel, topRadius, bottomRadius, outOfBoundsMode, textureMapping }: any) {
  const geometry = useMemo(() => {
    const W = width + 0.5;
    const H = height + 0.5;
    const T = 0.4; // Case thickness

    const M = 24; // vertical segments
    const N = 12; // corner segments
    const ptsPerLevel = 4 * (N + 1);
    
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    // Helper to get inset at height y
    const getInset = (B, y) => {
      if (B <= 0.001) return 0;
      const startY = T/2 - B;
      if (y <= startY) return 0;
      const dy = y - startY;
      return B - Math.sqrt(Math.max(0, B*B - dy*dy));
    };

    // Generate perimeters
    const perimeters = [];
    for (let j = 0; j <= M; j++) {
      // Non-linear y distribution to concentrate points near the top bevel
      // using a sine curve to cluster points near the top
      const t = Math.sin((j / M) * (Math.PI / 2));
      const y = -T/2 + t * T;
      
      const iTop = getInset(topBevel, y);
      const iBot = getInset(bottomBevel, y);
      const iSide = getInset(sideBevel, y);

      const minX = -W/2 + iSide;
      const maxX = W/2 - iSide;
      const minZ = -H/2 + iTop;
      const maxZ = H/2 - iBot;

      let rTop = Math.max(0.001, topRadius - Math.max(iSide, iTop));
      let rBot = Math.max(0.001, bottomRadius - Math.max(iSide, iBot));

      rTop = Math.min(rTop, (maxX - minX)/2.01, (maxZ - minZ)/2.01);
      rBot = Math.min(rBot, (maxX - minX)/2.01, (maxZ - minZ)/2.01);

      const pts = [];
      
      // Top-Right
      let cx = maxX - rTop; let cz = minZ + rTop;
      for(let i=0; i<=N; i++) {
        const a = -Math.PI/2 + (i/N)*Math.PI/2;
        pts.push([cx + rTop*Math.cos(a), cz + rTop*Math.sin(a)]);
      }
      // Bottom-Right
      cx = maxX - rBot; cz = maxZ - rBot;
      for(let i=0; i<=N; i++) {
        const a = 0 + (i/N)*Math.PI/2;
        pts.push([cx + rBot*Math.cos(a), cz + rBot*Math.sin(a)]);
      }
      // Bottom-Left
      cx = minX + rBot; cz = maxZ - rBot;
      for(let i=0; i<=N; i++) {
        const a = Math.PI/2 + (i/N)*Math.PI/2;
        pts.push([cx + rBot*Math.cos(a), cz + rBot*Math.sin(a)]);
      }
      // Top-Left
      cx = minX + rTop; cz = minZ + rTop;
      for(let i=0; i<=N; i++) {
        const a = Math.PI + (i/N)*Math.PI/2;
        pts.push([cx + rTop*Math.cos(a), cz + rTop*Math.sin(a)]);
      }
      perimeters.push(pts);
    }

    // Add vertices for sides
    for (let j = 0; j <= M; j++) {
      const t = Math.sin((j / M) * (Math.PI / 2));
      const y = -T/2 + t * T;
      const pts = perimeters[j];
      
      for (let i = 0; i < pts.length; i++) {
        const vx = pts[i][0];
        const vz = pts[i][1];
        positions.push(vx, y, vz);
        
        let uWorld = vx + width / 2;
        let vWorld = vz + height / 2;
        
        if (textureMapping !== 'projected') {
          const drop = T/2 - y;
          const len = Math.sqrt(vx*vx + vz*vz);
          const nx = len > 0 ? vx / len : 0;
          const nz = len > 0 ? vz / len : 0;
          
          uWorld += nx * drop * 0.6;
          vWorld += nz * drop * 0.6;
        }
        
        uvs.push(uWorld / width, 1.0 - (vWorld / height));
      }
      // Duplicate first point to close the geometry seam
      const vx = pts[0][0];
      const vz = pts[0][1];
      positions.push(vx, y, vz);
      
      let uWorld = vx + width / 2;
      let vWorld = vz + height / 2;
      
      if (textureMapping !== 'projected') {
        const drop = T/2 - y;
        const len = Math.sqrt(vx*vx + vz*vz);
        const nx = len > 0 ? vx / len : 0;
        const nz = len > 0 ? vz / len : 0;
        uWorld += nx * drop * 0.6;
        vWorld += nz * drop * 0.6;
      }
      
      uvs.push(uWorld / width, 1.0 - (vWorld / height));
    }

    const vertsPerLevel = ptsPerLevel + 1;

    // Side indices
    for (let j = 0; j < M; j++) {
      for (let i = 0; i < ptsPerLevel; i++) {
        const p1 = j * vertsPerLevel + i;
        const p2 = j * vertsPerLevel + i + 1;
        const p3 = (j + 1) * vertsPerLevel + i;
        const p4 = (j + 1) * vertsPerLevel + i + 1;

        indices.push(p1, p3, p2);
        indices.push(p2, p3, p4);
      }
    }

    // Top cap
    const topCenterIdx = positions.length / 3;
    positions.push(0, T/2, 0);
    uvs.push(0.5, 0.5); // Center UV
    
    // Top cap perimeter vertices
    const topStartIdx = positions.length / 3;
    const topPts = perimeters[M];
    for (let i = 0; i < topPts.length; i++) {
      const vx = topPts[i][0];
      const vz = topPts[i][1];
      positions.push(vx, T/2, vz);
      // Map UVs to match global keyboard coordinates
      const u = (vx + width / 2) / width;
      const v = 1.0 - ((vz + height / 2) / height);
      uvs.push(u, v);
    }
    
    for (let i = 0; i < topPts.length; i++) {
      const p1 = topStartIdx + i;
      const p2 = topStartIdx + ((i + 1) % topPts.length);
      indices.push(p1, topCenterIdx, p2);
    }

    // Bottom cap
    const botCenterIdx = positions.length / 3;
    positions.push(0, -T/2, 0);
    uvs.push(0.5, 0.5);
    
    const botStartIdx = positions.length / 3;
    const botPts = perimeters[0];
    for (let i = 0; i < botPts.length; i++) {
      const vx = botPts[i][0];
      const vz = botPts[i][1];
      positions.push(vx, -T/2, vz);
      
      let uWorld = vx + width / 2;
      let vWorld = vz + height / 2;
      
      if (textureMapping !== 'projected') {
        const drop = T;
        const len = Math.sqrt(vx*vx + vz*vz);
        const nx = len > 0 ? vx / len : 0;
        const nz = len > 0 ? vz / len : 0;
        uWorld += nx * drop * 0.6;
        vWorld += nz * drop * 0.6;
      }
      
      uvs.push(uWorld / width, 1.0 - (vWorld / height));
    }

    for (let i = 0; i < botPts.length; i++) {
      const p1 = botStartIdx + i;
      const p2 = botStartIdx + ((i + 1) % botPts.length);
      indices.push(p1, p2, botCenterIdx);
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    return geom;
  }, [width, height, keyGapX, keyGapY, topBevel, bottomBevel, sideBevel, topRadius, bottomRadius, textureMapping]);

  return (
    <mesh position={[0, -0.2, 0]} geometry={geometry} receiveShadow>
      <meshStandardMaterial 
        key={`${texture ? texture.uuid : 'no-tex'}-${baseOpacity}-${outOfBoundsMode}-${textureMapping}`}
        map={(baseOpacity > 0 && texture) ? texture : null} 
        color={baseColor} 
        roughness={0.8} 
        transparent={baseOpacity < 1}
        opacity={baseOpacity > 0 ? baseOpacity : 1}
        customProgramCacheKey={() => outOfBoundsMode}
        onBeforeCompile={(shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            `#include <map_fragment>`,
            `
            #ifdef USE_MAP
              vec4 texelColor = texture2D( map, vMapUv );
              
              bool outOfBounds = vMapUv.x < 0.0 || vMapUv.x > 1.0 || vMapUv.y < 0.0 || vMapUv.y > 1.0;
              
              ${outOfBoundsMode === 'transparent' ? `
              if (outOfBounds) {
                texelColor = vec4(0.0);
              }
              ` : ''}
              
              diffuseColor.rgb = mix(diffuseColor.rgb, texelColor.rgb, texelColor.a);
            #endif
            `
          );
        }}
      />
    </mesh>
  );
}

export function KeyboardScene({ 
  kleData, textureUrl, canvasRef,
  textureScale = 1, textureOffsetX = 0, textureOffsetY = 0, textureAspect = 1, textureRotation = 0,
  textureOpacity = 1, baseOpacity = 1, outOfBoundsMode = 'clamp', textureMapping = 'projected',
  showLabels = true, labelPosition = 'top-left', profile = 'OEM',
  labelColor = '#334155', labelOutlineColor = '#000000', labelOutlineWidth = 0, fontUrl = FONTS['Inter'], keycapColor = '#e2e8f0', baseColor = '#cbd5e1', keyGapX = 0.1, keyGapY = 0.1,
  caseTopEdgeBevel = 0.3, caseBottomEdgeBevel = 0.3, caseSideEdgeBevel = 0.01, caseTopCornerRadius = 0.05, caseBottomCornerRadius = 0.05,
  keycapHeightAboveCase = 0.02
}: any) {
  const { keys, width, height } = useMemo(() => {
    try {
      return parseKLE(kleData, keyGapX, keyGapY);
    } catch (e) {
      console.error(e);
      return { keys: [], width: 1, height: 1 };
    }
  }, [kleData, keyGapX, keyGapY]);

  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [imageAspect, setImageAspect] = useState(1);

  useEffect(() => {
    if (!textureUrl) {
      setTexture(null);
      setImageAspect(1);
      return;
    }
    
    const loader = new THREE.TextureLoader();
    loader.load(
      textureUrl, 
      (loadedTex) => {
        loadedTex.colorSpace = THREE.SRGBColorSpace;
        setTexture(loadedTex);
        // 自动检测图片长宽比
        if (loadedTex.image) {
          const img = loadedTex.image as HTMLImageElement;
          const aspect = (img.width || 1) / (img.height || 1);
          setImageAspect(aspect);
        }
      },
      undefined,
      (err) => {
        console.error("Error loading texture:", err);
      }
    );
  }, [textureUrl]);

  useLayoutEffect(() => {
    if (texture) {
      if (texture.image) {
        const img = texture.image as HTMLImageElement;
        const imgWidth = img.width || 1;
        const imgHeight = img.height || 1;
        const imgAspect = imgWidth / imgHeight;
        const kbAspect = width / height;
        
        let coverScaleX = 1;
        let coverScaleY = 1;
        
        if (imgAspect > kbAspect) {
          coverScaleX = kbAspect / imgAspect;
        } else {
          coverScaleY = imgAspect / kbAspect;
        }
        
        // (coverScale no longer used – textureAspect replaces it)
        
        // Build transformation matrix
        // At textureAspect = 1, the image appears at its natural proportions
        // (no compression/stretching). textureAspect then applies additional
        // horizontal stretch. The image may extend beyond the keyboard.
        
        const s = 1 / textureScale;
        const radians = textureRotation * Math.PI / 180;
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        
        let a, b, c, d;
        if (textureMapping === 'per-key') {
          // Per-key: UV already handles image aspect ratio via imageAspect
          // Corrected rotation uses imageAspect (per-key UV space is imageAspect-aware)
          const imgAsp = imageAspect || 1;
          const aRot = s * cos;
          const bRot = -s * sin / imgAsp;
          const cRot = s * sin * imgAsp;
          const dRot = s * cos;
          a = textureAspect * aRot;
          b = textureAspect * bRot;
          c = cRot;
          d = dRot;
        } else {
          // Non-per-key: isotropic rotation in physical space expressed in UV coordinates
          // textureAspect = 1 → no distortion, texture may extend beyond keyboard
          const kbAspect = width / height;
          const imgAsp = imageAspect || 1;
          const baseUScale = kbAspect / imgAsp;
          // Physical-space rotation in UV coords requires aspect correction:
          //   a uses baseUScale (horizontal scale for image fitting)
          //   b divides by imgAsp (not baseUScale) so rotation stays isotropic
          //   c multiplies by kbAspect (vertical-to-horizontal conversion)
          //   d = cos (vertical scale = 1)
          a = textureAspect * baseUScale * s * cos;
          b = -textureAspect * s * sin / imgAsp;
          c = kbAspect * s * sin;
          d = s * cos;
        }
        
        // Rotate around center (0.5, 0.5), then apply offset
        const tx = 0.5 - textureOffsetX - 0.5 * (a + b);
        const ty = 0.5 + textureOffsetY - 0.5 * (c + d);
        
        texture.matrix.set(a, b, tx, c, d, ty, 0, 0, 1);
          
        texture.matrixAutoUpdate = false;
      }
      
      // Handle repeat vs clamp
      let wrapMode = THREE.ClampToEdgeWrapping;
      if (outOfBoundsMode === 'repeat') {
        wrapMode = THREE.RepeatWrapping;
      } else if (outOfBoundsMode === 'mirror') {
        wrapMode = THREE.MirroredRepeatWrapping;
      }
      
      texture.wrapS = wrapMode;
      texture.wrapT = wrapMode;
      
      texture.needsUpdate = true;
    }
  }, [texture, width, height, textureScale, textureOffsetX, textureOffsetY, textureAspect, textureRotation, outOfBoundsMode, textureMapping, imageAspect]);

  return (
    <Canvas 
      ref={canvasRef}
      camera={{ position: [0, 8, 5], fov: 45 }}
      shadows
      gl={{ preserveDrawingBuffer: true }}
    >
      <color attach="background" args={['#f8fafc']} />
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1.2} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
      />
      
      <Suspense fallback={null}>
        <group position={[0, 0, 0]}>
          <BasePlate 
            width={width} 
            height={height} 
            texture={texture} 
            baseOpacity={baseOpacity} 
            baseColor={baseColor} 
            keyGapX={keyGapX}
            keyGapY={keyGapY}
            topBevel={caseTopEdgeBevel}
            bottomBevel={caseBottomEdgeBevel}
            sideBevel={caseSideEdgeBevel}
            topRadius={caseTopCornerRadius}
            bottomRadius={caseBottomCornerRadius}
            outOfBoundsMode={outOfBoundsMode}
            textureMapping={textureMapping}
          />

          {keys.map((k, i) => (
            <Keycap 
              key={i} 
              keyData={k} 
              keyboardWidth={width} 
              keyboardHeight={height} 
              texture={texture}
              profile={profile}
              showLabels={showLabels}
              labelPosition={labelPosition}
              textureOpacity={textureOpacity}
              labelColor={labelColor}
              labelOutlineColor={labelOutlineColor}
              labelOutlineWidth={labelOutlineWidth}
              fontUrl={fontUrl}
              keycapColor={keycapColor}
              keyGapX={keyGapX}
              keyGapY={keyGapY}
              outOfBoundsMode={outOfBoundsMode}
              textureMapping={textureMapping}
              imageAspect={imageAspect}
              heightAboveCase={keycapHeightAboveCase}
            />
          ))}
        </group>

        <ContactShadows position={[0, -0.2, 0]} opacity={0.4} scale={20} blur={2} far={4} />
      </Suspense>
      <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2 - 0.1} />
    </Canvas>
  );
}
