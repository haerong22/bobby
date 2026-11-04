import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { BASE, Canvas, noise } from "./draw.mts";
import type { Bitmap } from "./png.mts";
import { encodePng } from "./png.mts";

/**
 * 거리 소품을 직접 그린다. `npm run gen:props`
 *
 * Cozy 팩에는 나무가 없다. 가로수 없는 도시는 보도가 베이지 벌판처럼 보여서
 * 직접 그려 넣는다. 마감 규칙은 건물과 같다 — 테두리, 위에서 오는 빛, 바닥 그림자.
 */

const LEAF = {
  light: 0x8fc46a,
  mid: 0x6ba665,
  dark: 0x4d8450,
  deep: 0x3a6640,
} as const;

const TRUNK = {
  light: 0xa07850,
  mid: 0x7d5a3c,
  dark: 0x5c4229,
} as const;

interface Blob {
  x: number;
  y: number;
  r: number;
}

/**
 * 잎 덩어리. 원들의 합집합을 구해 **바깥 윤곽만** 두른다.
 *
 * 1. 마스크를 만들고 가장자리를 잡음으로 흩는다
 * 2. 속을 채우고 빛 방향에 따라 명암을 올린다
 * 3. 마스크 경계에 닿은 픽셀만 테두리로 칠한다
 */
function canopy(
  c: Canvas,
  w: number,
  h: number,
  blobs: readonly Blob[],
  light: { lightX: number; lightY: number; seed: number },
) {
  const mask: boolean[] = new Array(w * h).fill(false);
  const at = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] === true;

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      let inside = false;
      for (const b of blobs) {
        const d = Math.hypot(x - b.x, y - b.y);
        if (d <= b.r - 1.5) {
          inside = true;
          break;
        }
        if (d <= b.r) {
          // 가장자리는 잡음으로 들쭉날쭉하게
          if (noise(x + light.seed * 37, y + light.seed * 11) > 0.35) {
            inside = true;
            break;
          }
        }
      }
      if (inside) mask[y * w + x] = true;
    }
  }

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (!at(x, y)) continue;
      const d = (x - light.lightX) * 0.5 + (y - light.lightY) * 0.8;
      const tone =
        d < -2 ? LEAF.light : d > 14 ? LEAF.deep : d > 7 ? LEAF.dark : LEAF.mid;
      c.px(x, y, tone);
    }
  }

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (!at(x, y)) continue;
      const edge =
        !at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1) || !at(x, y + 1);
      if (edge) c.px(x, y, BASE.outline);
    }
  }
}

/** 바닥 그림자. 소품이 떠 보이지 않게 한다. */
function baseShadow(c: Canvas, cx: number, y: number, rx: number) {
  for (let x = -rx; x <= rx; x += 1) {
    const h = Math.round(Math.sqrt(1 - (x / rx) ** 2) * 2);
    for (let dy = 0; dy < h; dy += 1) c.px(cx + x, y + dy, 0x9a9480);
  }
}

/**
 * 가로수. 32x48 (2x3 타일).
 *
 * 수관을 원 세 개로 겹쳐 덩어리를 만들고, 빛을 왼쪽 위에서 받게 명암을 준다.
 * 잎은 잡음으로 가장자리를 흩어 윤곽이 너무 매끈하지 않게 한다.
 */
function drawTree(seed: number): Bitmap {
  const W = 32;
  const H = 48;
  const c = new Canvas(W, H);
  const cx = W / 2;

  baseShadow(c, cx, 44, 9);

  // 줄기
  c.rect(cx - 2, 28, 4, 16, TRUNK.mid);
  c.vLine(cx - 2, 28, 16, TRUNK.light);
  c.vLine(cx + 1, 28, 16, TRUNK.dark);
  c.outline(cx - 3, 28, 6, 16, BASE.outline);
  c.rect(cx - 3, 42, 6, 2, TRUNK.dark);
  // 뿌리 쪽으로 벌어지는 선
  c.px(cx - 4, 42, TRUNK.dark);
  c.px(cx + 3, 42, TRUNK.dark);

  // 수관. 원 세 개의 **합집합**으로 덩어리를 만든다 — 원마다 테두리를 그리면
  // 겹친 자리에 선이 남아 "원 세 개" 로 보인다.
  canopy(
    c,
    W,
    H,
    [
      { x: cx, y: 18, r: 12 },
      { x: cx - 7, y: 22, r: 8 },
      { x: cx + 7, y: 22, r: 8 },
    ],
    { lightX: cx - 6, lightY: 12, seed },
  );

  return c.toBitmap();
}

/** 작은 관목. 16x16. 공원 바닥을 채운다. */
function drawBush(): Bitmap {
  const c = new Canvas(16, 16);
  baseShadow(c, 8, 13, 6);
  canopy(
    c,
    16,
    16,
    [
      { x: 8, y: 8, r: 6 },
      { x: 4, y: 10, r: 4 },
      { x: 12, y: 10, r: 4 },
    ],
    { lightX: 4, lightY: 5, seed: 3 },
  );
  return c.toBitmap();
}

/** 가로수 보호 틀. 보도에 나무가 그냥 솟아 있으면 어색하다. */
function drawTreeGrate(): Bitmap {
  const c = new Canvas(16, 16);
  c.rect(2, 5, 12, 8, 0x8a8172);
  c.hLine(2, 5, 12, 0xa79d8c);
  c.outline(2, 5, 12, 8, BASE.outline);
  for (let i = 1; i < 4; i += 1) c.vLine(2 + i * 3, 6, 6, 0x6f6758);
  c.hLine(3, 9, 10, 0x6f6758);
  return c.toBitmap();
}

/** 타원 채우기. 분수 수반처럼 동그란 것에 쓴다. */
function ellipse(
  c: Canvas,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: number,
) {
  for (let y = -ry; y <= ry; y += 1) {
    for (let x = -rx; x <= rx; x += 1) {
      if ((x / rx) ** 2 + (y / ry) ** 2 <= 1) c.px(cx + x, cy + y, color);
    }
  }
}

/**
 * 분수. 48x48 (3x3 타일).
 *
 * 광장 한가운데 놓는다. **마을에는 초점이 하나는 있어야 한다** — 없으면 아무리
 * 채워도 "건물이 흩어진 벌판" 으로 보인다.
 */
function drawFountain(): Bitmap {
  const c = new Canvas(48, 48);
  const STONE = { light: 0xeae3d2, mid: 0xc9c0aa, dark: 0x9b9380 } as const;
  const WATER = { light: 0xb6e0f0, mid: 0x74b6d8, dark: 0x4a87ad } as const;
  const cx = 24;
  const cy = 33;

  baseShadow(c, cx, 45, 20);

  // 아래 수반
  ellipse(c, cx, cy, 21, 12, BASE.outline);
  ellipse(c, cx, cy, 20, 11, STONE.mid);
  ellipse(c, cx, cy - 1, 20, 10, STONE.light);
  ellipse(c, cx, cy + 2, 20, 8, STONE.dark);
  ellipse(c, cx, cy, 16, 8, BASE.outline);
  ellipse(c, cx, cy, 15, 7, WATER.dark);
  ellipse(c, cx, cy - 1, 15, 6, WATER.mid);
  ellipse(c, cx, cy - 2, 13, 4, WATER.light);

  // 가운데 기둥과 윗 수반
  c.rect(cx - 3, cy - 14, 7, 14, STONE.mid);
  c.vLine(cx - 3, cy - 14, 14, STONE.light);
  c.vLine(cx + 2, cy - 14, 14, STONE.dark);
  c.outline(cx - 3, cy - 14, 7, 14, BASE.outline);
  ellipse(c, cx, cy - 15, 11, 5, BASE.outline);
  ellipse(c, cx, cy - 15, 10, 4, STONE.light);
  ellipse(c, cx, cy - 15, 7, 2, WATER.mid);
  c.rect(cx - 1, cy - 24, 3, 8, STONE.light);
  c.outline(cx - 1, cy - 24, 3, 8, BASE.outline);

  // 뿜어 나와 떨어지는 물줄기
  for (const [dx, top, len] of [
    [-8, cy - 13, 9],
    [8, cy - 13, 9],
    [0, cy - 28, 5],
  ] as const) {
    c.vLine(cx + dx, top, len, WATER.light);
    c.px(cx + dx - 1, top + 1, WATER.mid);
    c.px(cx + dx + 1, top + 2, WATER.mid);
  }
  return c.toBitmap();
}

/**
 * 생울타리. 16x16.
 *
 * **좌우에는 테두리를 두르지 않는다.** 관목처럼 덩어리 함수로 그렸더니 타일마다
 * 사방에 테두리가 생겨, 한 줄로 이어 붙이면 울타리가 아니라 낱개 상자가 줄지어
 * 선 것으로 보였다. 윗선만 울퉁불퉁하게 두고 좌우는 타일 끝까지 채워야 옆
 * 타일과 이어져 한 줄의 울타리가 된다.
 */
function drawHedge(): Bitmap {
  const c = new Canvas(16, 16);
  baseShadow(c, 8, 14, 8);
  for (let x = 0; x < 16; x += 1) {
    const top = noise(x * 13, 3) > 0.55 ? 4 : 5;
    for (let y = top; y <= 13; y += 1) {
      const d = (x - 3) * 0.25 + (y - top) * 1.1;
      c.px(x, y, d < 2 ? LEAF.light : d > 7 ? LEAF.dark : LEAF.mid);
    }
    c.px(x, top, BASE.outline);
    c.px(x, 13, BASE.outline);
    if (noise(x * 7, 11) > 0.82) c.px(x, top + 3, LEAF.light);
  }
  return c.toBitmap();
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PROPS: Record<string, Bitmap> = {
  "tree-a": drawTree(1),
  "tree-b": drawTree(5),
  bush: drawBush(),
  "tree-grate": drawTreeGrate(),
  fountain: drawFountain(),
  hedge: drawHedge(),
};

for (const [name, bitmap] of Object.entries(PROPS)) {
  writeFileSync(resolve(ROOT, `public/town/props/${name}.png`), encodePng(bitmap));
  console.log(`wrote props/${name}.png  ${bitmap.width}x${bitmap.height}`);
}
