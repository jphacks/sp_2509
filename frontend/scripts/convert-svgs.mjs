import fs from 'fs';
import path from 'path';
import pkg from 'svg-path-parser';
const { parseSVG, makeAbsolute } = pkg;
import sharp from 'sharp'; // sharp をインポート

// --- 設定項目 ---

// SVGファイルが格納されているフォルダのパス
const SVG_DIR = path.join(process.cwd(), 'src/assets/svg');

// 自動生成されるTypeScriptファイルの出力パス
const TS_OUTPUT_FILE = path.join(process.cwd(), 'src/lib/generated-shapes.ts');

// PNG画像の出力先フォルダパス
const PNG_OUTPUT_DIR = path.join(process.cwd(), 'public/images/Recommend');

// 3次ベジェ曲線をサンプリングする点の数。大きいほど滑らかに。
const SAMPLES_PER_CURVE = 20;

// アプリの描画キャンバスの中心座標 (draw/page.tsx の設計に合わせる)
const TARGET_CENTER_X = 175.0;
const TARGET_CENTER_Y = 175.0;

// ターゲットとする図形のおおよそのサイズ（ピクセル）
const TARGET_SIZE = 210.0;

// --- ベクトル演算ヘルパー ---
const vec = (x, y) => ({ x, y });
const add = (v1, v2) => vec(v1.x + v2.x, v1.y + v2.y);
const mul = (v, s) => vec(v.x * s, v.y * s);

// --- 3次ベジェ曲線 (Cubic Bezier) の計算 ---
function cubicBezier(p0, p1, p2, p3, t) {
  const t_ = 1 - t;
  return add(
    add(mul(p0, t_ * t_ * t_), mul(p1, 3 * t_ * t_ * t)),
    add(mul(p2, 3 * t_ * t * t), mul(p3, t * t * t))
  );
}

// --- SVGパスデータ(d属性)の解析 ---
function parseSvgPath(pathData) {
  const segments = [];
  let currentSegmentPoints = [];
  let currentPos = vec(0, 0);
  const commands = makeAbsolute(parseSVG(pathData));

  for (const cmd of commands) {
    if (cmd.code === 'M') {
      if (currentSegmentPoints.length > 0) segments.push(currentSegmentPoints);
      currentPos = vec(cmd.x, cmd.y);
      currentSegmentPoints = [currentPos];
    } else if (cmd.code === 'L') {
      currentPos = vec(cmd.x, cmd.y);
      currentSegmentPoints.push(currentPos);
    } else if (cmd.code === 'H') {
      currentPos = vec(cmd.x, currentPos.y);
      currentSegmentPoints.push(currentPos);
    } else if (cmd.code === 'V') {
      currentPos = vec(currentPos.x, cmd.y);
      currentSegmentPoints.push(currentPos);
    } else if (cmd.code === 'C') {
      const p0 = currentPos;
      const p1 = vec(cmd.x1, cmd.y1);
      const p2 = vec(cmd.x2, cmd.y2);
      const p3 = vec(cmd.x, cmd.y);
      for (let i = 1; i <= SAMPLES_PER_CURVE; i++) {
        const t = i / SAMPLES_PER_CURVE;
        currentSegmentPoints.push(cubicBezier(p0, p1, p2, p3, t));
      }
      currentPos = p3;
    } else if (cmd.code === 'Z') {
      if (currentSegmentPoints.length > 0) {
        currentSegmentPoints.push(currentSegmentPoints[0]);
      }
    }
  }
  if (currentSegmentPoints.length > 0) segments.push(currentSegmentPoints);
  return segments.flat();
}

// --- 点群のスケーリングと中央揃え ---
function scaleAndCenter(allPoints) {
  if (allPoints.length === 0) return [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  allPoints.forEach(p => {
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
  });
  const svgWidth = maxX - minX; const svgHeight = maxY - minY;
  let scale = 1.0;
  if (svgWidth > 0 && svgHeight > 0) {
    scale = TARGET_SIZE / Math.max(svgWidth, svgHeight);
  }
  const scaledWidth = svgWidth * scale; const scaledHeight = svgHeight * scale;
  const offsetX = TARGET_CENTER_X - (scaledWidth / 2);
  const offsetY = TARGET_CENTER_Y - (scaledHeight / 2);
  return allPoints.map(p => ({
    x: parseFloat(((p.x - minX) * scale + offsetX).toFixed(2)),
    y: parseFloat(((p.y - minY) * scale + offsetY).toFixed(2)),
  }));
}

// --- メイン実行処理 ---
async function convertSvgs() {
  console.log('Converting SVG shapes...');
  
  const tsOutputDir = path.dirname(TS_OUTPUT_FILE);
  if (!fs.existsSync(tsOutputDir)) fs.mkdirSync(tsOutputDir, { recursive: true });
  
  if (!fs.existsSync(PNG_OUTPUT_DIR)) fs.mkdirSync(PNG_OUTPUT_DIR, { recursive: true });

  let tsOutputContent = `// このファイルは "scripts/convert-svgs.mjs" によって自動生成されました。
// 手動で編集しないでください。
/* eslint-disable */
import type { Point } from '@/types/types';

`;

  try {
    const files = fs.readdirSync(SVG_DIR);
    
    // Promise.all を使ってすべてのファイル変換を並列処理
    const results = await Promise.all(files.map(async (file) => {
      if (!file.endsWith('.svg')) return null;

      const baseName = path.basename(file, '.svg');
      const filePath = path.join(SVG_DIR, file);
      const svgContent = fs.readFileSync(filePath, 'utf-8');
      
      // --- 1. 点群(TS)への変換 ---
      const pathMatch = svgContent.match(/d="([^"]+)"/);
      if (!pathMatch || !pathMatch[1]) {
        console.warn(`Skipping ${file}: No <path d="..."> found.`);
        return null;
      }
      const pathData = pathMatch[1];
      const rawPoints = parseSvgPath(pathData);
      const finalPoints = scaleAndCenter(rawPoints);
      const shapeName = baseName.replace(/[^a-zA-Z0-9]/g, '_') + 'Shape';
      
      // --- 2. PNGへの変換 (1:1比率) ---
      try {
        const pngFileName = `${baseName}.png`; // 例: heart.png
        const pngOutputPath = path.join(PNG_OUTPUT_DIR, pngFileName);

        // ★ SVGのメタデータを読み込んで最大辺を取得
        const metadata = await sharp(filePath).metadata();
        // metadata.width や height が取れない場合を考慮し、デフォルト値(125)も設定
        const size = Math.max(metadata.width || 125, metadata.height || 125);

        await sharp(filePath)
          .resize(size, size, { // ★ resize オプションを追加
            fit: 'contain', // 縦横比を維持してボックスに収める
            background: { r: 0, g: 0, b: 0, alpha: 0 } // 余白は透明にする
          })
          .png() // PNG形式に変換
          .toFile(pngOutputPath); // 指定パスに保存
          
        console.log(`[PNG] Generated 1:1: public/images/Recommend/${pngFileName}`);
        
      } catch (pngErr) {
        console.error(`Error converting ${file} to PNG:`, pngErr);
      }
      
      // --- TSコンテンツを返す ---
      return { shapeName, finalPoints };
    }));

    // ★ 並列処理の結果をまとめてTSファイルに書き込む
    // (filter(Boolean) でエラーのあったファイル(null)を除外)
    for (const result of results) {
      if (result) {
         tsOutputContent += `export const ${result.shapeName}: Point[] = ${JSON.stringify(result.finalPoints, null, 2)};\n\n`;
      }
    }

    fs.writeFileSync(TS_OUTPUT_FILE, tsOutputContent);
    console.log(`[TS] Generated: ${TS_OUTPUT_FILE}`);
    
  } catch (err) {
    console.error('Error reading SVG directory:', err);
    process.exit(1); // エラーで終了
  }
}

// スクリプト実行
convertSvgs().catch(err => {
  console.error('Failed to convert SVGs:', err);
  process.exit(1);
});