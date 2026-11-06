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

/**
 * 자동차.
 *
 * 마을은 **섞인 시점**이다 — 건물은 정면도, 지면은 위에서 내려다본 것, 사람은
 * 앞을 본다. 차도 그 중간으로 그린다: 지붕이 보이되 옆면과 바퀴도 같이 보이는
 * 비스듬한 각도. 완전한 평면도로 그리면 지붕만 보여 건물 옆에서 겉돈다.
 *
 * 가로 도로용은 한 장만 그리고 반대 방향은 `setFlipX` 로 뒤집는다. 세로 도로는
 * 앞뒤가 달라서 두 장을 따로 그린다.
 */
function carSide(body: number, bodyDark: number, bodyLight: number): Bitmap {
  const c = new Canvas(32, 18);
  const GLASS = 0x6f88a0;
  const GLASS_LIGHT = 0xa9c0d4;
  const TYRE = 0x2b2724;

  baseShadow(c, 16, 16, 14);

  // 바퀴가 차체보다 먼저 — 차체가 위를 덮어야 묻힌 것처럼 보인다
  for (const wx of [5, 21]) {
    c.rect(wx, 11, 6, 5, TYRE);
    c.hLine(wx + 1, 12, 4, 0x4a4440);
    c.outline(wx, 11, 6, 5, BASE.outline);
  }

  // 차체
  c.rect(1, 6, 30, 7, body);
  c.hLine(2, 6, 28, bodyLight);
  c.hLine(2, 12, 28, bodyDark);
  c.outline(1, 6, 30, 7, BASE.outline);

  // 지붕과 유리
  c.rect(8, 1, 15, 6, body);
  c.hLine(9, 1, 13, bodyLight);
  c.outline(8, 1, 15, 6, BASE.outline);
  c.rect(10, 3, 5, 3, GLASS);
  c.hLine(10, 3, 5, GLASS_LIGHT);
  c.rect(17, 3, 4, 3, GLASS);
  c.hLine(17, 3, 4, GLASS_LIGHT);

  // 앞은 오른쪽 — 전조등과 후미등
  c.rect(29, 8, 2, 2, BASE.lamp);
  c.rect(1, 8, 2, 2, 0xc0493c);
  c.px(16, 9, bodyDark);
  return c.toBitmap();
}

function carFacing(
  body: number,
  bodyDark: number,
  bodyLight: number,
  facing: "up" | "down",
): Bitmap {
  const c = new Canvas(18, 32);
  const GLASS = 0x6f88a0;
  const GLASS_LIGHT = 0xa9c0d4;
  const TYRE = 0x2b2724;

  baseShadow(c, 9, 30, 8);

  // 바퀴는 차체 **밖으로** 나와야 보인다. 차체 폭 안에 넣으면 1px 만 남는다.
  for (const wy of [6, 21]) {
    for (const wx of [0, 15]) {
      c.rect(wx, wy, 3, 6, TYRE);
      c.outline(wx, wy, 3, 6, BASE.outline);
    }
  }

  c.rect(3, 2, 12, 28, body);
  c.vLine(4, 3, 26, bodyLight);
  c.vLine(13, 3, 26, bodyDark);
  c.outline(3, 2, 12, 28, BASE.outline);

  // 지붕
  c.rect(4, 11, 10, 10, body);
  c.vLine(5, 12, 8, bodyLight);
  c.outline(4, 11, 10, 10, BASE.outline);

  // 앞유리는 진행 방향 쪽, 뒷유리는 반대쪽
  const front = facing === "down" ? 22 : 6;
  const back = facing === "down" ? 7 : 23;
  c.rect(5, front, 8, 4, GLASS);
  c.hLine(5, front, 8, GLASS_LIGHT);
  c.rect(6, back, 6, 3, GLASS);

  // 전조등은 진행 방향 끝, 후미등은 반대쪽 끝
  const headY = facing === "down" ? 28 : 2;
  const tailY = facing === "down" ? 2 : 28;
  for (const lx of [4, 11]) {
    c.rect(lx, headY, 3, 2, BASE.lamp);
    c.outline(lx, headY, 3, 2, BASE.outline);
    c.rect(lx, tailY, 3, 2, 0xc0493c);
  }
  return c.toBitmap();
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PROPS: Record<string, Bitmap> = {
  // 색을 여러 벌 그려 둔다 — 한 바퀴 돌 때마다 다른 차가 들어오게 하려면
  // 고를 수 있는 벌이 있어야 한다.
  "car-red": carSide(0xc0493c, 0x8d3028, 0xd9705f),
  "car-blue": carSide(0x4a7aa8, 0x335a80, 0x76a3cb),
  "car-cream": carSide(0xe4d9bf, 0xb4a88c, 0xf5efdd),
  "car-olive": carSide(0x6f8d6a, 0x4f6a4b, 0x95b08d),
  "car-amber": carSide(0xd9a441, 0xa87a2c, 0xeec36e),
  "car-down-amber": carFacing(0xd9a441, 0xa87a2c, 0xeec36e, "down"),
  "car-down-blue": carFacing(0x4a7aa8, 0x335a80, 0x76a3cb, "down"),
  "car-down-cream": carFacing(0xe4d9bf, 0xb4a88c, 0xf5efdd, "down"),
  "car-up-olive": carFacing(0x6f8d6a, 0x4f6a4b, 0x95b08d, "up"),
  "car-up-red": carFacing(0xc0493c, 0x8d3028, 0xd9705f, "up"),
  "car-up-cream": carFacing(0xe4d9bf, 0xb4a88c, 0xf5efdd, "up"),
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
