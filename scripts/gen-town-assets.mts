/**
 * 지면 타일셋을 원본에서 파생해 만든다. `npm run gen:assets`
 *
 * Cozy Town Lite 의 19 타일에는 가로 차선·횡단보도만 있고 세로용이 없다.
 * 원본을 90 도 돌려 세로 변형을 덧붙인 시트를 만든다.
 *
 * 건물은 여기서 만들지 않는다 — `scripts/draw-buildings.mts` 가 직접 그린다.
 *
 * 원본: "Cozy Town Lite" by Spaceyyy (CC-BY 4.0). 파생물도 같은 라이선스를
 * 따르므로 출처 표기를 지우면 안 된다.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { Bitmap } from "./png.mts";
import { decodePng, encodePng } from "./png.mts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TILE = 16;

// ── 확장 타일셋 ──────────────────────────────────────────────────────────
/** 원본 시트에서 타일 하나를 꺼낸다. */
function cutTile(sheet: Bitmap, col: number, row: number): Bitmap {
  const pixels = new Uint8Array(TILE * TILE * 4);
  for (let y = 0; y < TILE; y += 1) {
    const from = ((row * TILE + y) * sheet.width + col * TILE) * 4;
    pixels.set(sheet.pixels.subarray(from, from + TILE * 4), y * TILE * 4);
  }
  return { width: TILE, height: TILE, pixels };
}

/** 시계 방향 90도. 가로 차선을 세로로 쓰려고 쓴다. */
function rotate90(tile: Bitmap): Bitmap {
  const pixels = new Uint8Array(tile.pixels.length);
  for (let y = 0; y < TILE; y += 1) {
    for (let x = 0; x < TILE; x += 1) {
      const from = (y * TILE + x) * 4;
      const to = (x * TILE + (TILE - 1 - y)) * 4;
      pixels.set(tile.pixels.subarray(from, from + 4), to);
    }
  }
  return { width: TILE, height: TILE, pixels };
}

function flipX(tile: Bitmap): Bitmap {
  const pixels = new Uint8Array(tile.pixels.length);
  for (let y = 0; y < TILE; y += 1) {
    for (let x = 0; x < TILE; x += 1) {
      const from = (y * TILE + x) * 4;
      const to = (y * TILE + (TILE - 1 - x)) * 4;
      pixels.set(tile.pixels.subarray(from, from + 4), to);
    }
  }
  return { width: TILE, height: TILE, pixels };
}

function flipY(tile: Bitmap): Bitmap {
  const pixels = new Uint8Array(tile.pixels.length);
  for (let y = 0; y < TILE; y += 1) {
    const from = y * TILE * 4;
    pixels.set(
      tile.pixels.subarray(from, from + TILE * 4),
      (TILE - 1 - y) * TILE * 4,
    );
  }
  return { width: TILE, height: TILE, pixels };
}

/** 타일 목록을 한 줄에 columns 개씩 배치한 시트로 합친다. */
function packTiles(tiles: Bitmap[], columns: number): Bitmap {
  const rows = Math.ceil(tiles.length / columns);
  const width = columns * TILE;
  const height = rows * TILE;
  const pixels = new Uint8Array(width * height * 4);

  tiles.forEach((tile, index) => {
    const cx = (index % columns) * TILE;
    const cy = Math.floor(index / columns) * TILE;
    for (let y = 0; y < TILE; y += 1) {
      const from = y * TILE * 4;
      const to = ((cy + y) * width + cx) * 4;
      pixels.set(tile.pixels.subarray(from, from + TILE * 4), to);
    }
  });

  return { width, height, pixels };
}

const source = decodePng(
  readFileSync(resolve(ROOT, "public/town/tilesets/cozy-street.png")),
);

/** 원본 시트의 (col,row). town-street-lite.json 의 이름과 같은 순서다. */
const SRC = {
  asphalt1: [0, 0],
  asphalt2: [1, 0],
  manhole: [2, 0],
  drain: [3, 0],
  lineEw: [4, 0],
  crosswalkEw: [5, 0],
  sidewalk: [6, 0],
  rampN: [7, 0],
  rampS: [0, 1],
  grass1: [1, 1],
  grass2: [2, 1],
  grass3: [3, 1],
  flowers1: [4, 1],
  flowers2: [5, 1],
  flowers3: [6, 1],
  sidewalkAsphaltS: [7, 1],
  sidewalkAsphaltN: [0, 2],
  grassSidewalkS: [1, 2],
  grassSidewalkN: [2, 2],
} as const;

const take = (name: keyof typeof SRC) =>
  cutTile(source, SRC[name][0], SRC[name][1]);

/**
 * 생성 시트의 타일 순서. `src/town/tiles.ts` 의 인덱스가 이 배열 순서를 그대로
 * 따르므로 **중간에 끼워 넣지 말고 뒤에 붙일 것.**
 */
const PACKED: Bitmap[] = [
  take("asphalt1"), //  0
  take("asphalt2"), //  1
  take("manhole"), //  2
  take("drain"), //  3
  take("lineEw"), //  4
  rotate90(take("lineEw")), //  5  세로 차선 (원본에 없어 생성)
  take("crosswalkEw"), //  6
  rotate90(take("crosswalkEw")), //  7  세로 횡단보도 (생성)
  take("sidewalk"), //  8
  take("grass1"), //  9
  take("grass2"), // 10
  take("grass3"), // 11
  take("flowers1"), // 12
  take("flowers2"), // 13
  take("flowers3"), // 14
  take("sidewalkAsphaltS"), // 15  보도가 위, 아스팔트가 아래
  take("sidewalkAsphaltN"), // 16  보도가 아래, 아스팔트가 위
  rotate90(take("sidewalkAsphaltN")), // 17  보도가 오른쪽 (생성)
  flipX(rotate90(take("sidewalkAsphaltN"))), // 18  보도가 왼쪽 (생성)
  take("grassSidewalkS"), // 19
  take("grassSidewalkN"), // 20
  rotate90(take("grassSidewalkN")), // 21
  flipX(rotate90(take("grassSidewalkN"))), // 22
  take("rampN"), // 23
  take("rampS"), // 24
  flipY(take("grass1")), // 25  잔디 변형 하나 더 (반복 티 줄이기)
];

// ── 직접 그려 붙이는 타일 ────────────────────────────────────────────────
/**
 * **원본에 없는 두 가지를 그려 넣는다.**
 *
 * 1. 흙 오솔길 — 원본의 순환은 아스팔트 하나뿐이라 마을이 격자로만 읽힌다.
 *    차가 다니는 길과 사람이 다니는 길을 나누면 격자가 풀린다.
 * 2. 잔디 변형 — 원본 잔디 세 장은 거의 같은 초록이라 넓게 깔면 단색 벌판이
 *    된다. 그늘 · 마른 풀 · 잡초로 톤을 벌린다.
 *
 * 색은 원본 잔디에서 뽑아 파생하므로 Cozy 팔레트를 벗어나지 않는다.
 */
const rnd = (x: number, y: number, seed = 0) => {
  const n = Math.sin((x + seed * 31.7) * 127.1 + (y + seed * 11.3) * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

const readPx = (tile: Bitmap, x: number, y: number) => {
  const i = (y * TILE + x) * 4;
  return [tile.pixels[i]!, tile.pixels[i + 1]!, tile.pixels[i + 2]!] as const;
};
const writePx = (tile: Bitmap, x: number, y: number, rgb: readonly number[]) => {
  if (x < 0 || y < 0 || x >= TILE || y >= TILE) return;
  const i = (y * TILE + x) * 4;
  tile.pixels[i] = rgb[0]!;
  tile.pixels[i + 1] = rgb[1]!;
  tile.pixels[i + 2] = rgb[2]!;
  tile.pixels[i + 3] = 255;
};
const clone = (tile: Bitmap): Bitmap => ({
  width: TILE,
  height: TILE,
  pixels: new Uint8Array(tile.pixels),
});
const shift = (rgb: readonly number[], mul: readonly number[]) =>
  rgb.map((v, i) => Math.max(0, Math.min(255, Math.round(v * mul[i]!))));

const GRASS = take("grass1");

/** 잔디를 색만 옮긴 변형. 디테일을 얹어 반복 티를 줄인다. */
function grassVariant(
  mul: readonly number[],
  speck: readonly number[] | null,
  seed: number,
): Bitmap {
  const tile = clone(GRASS);
  for (let y = 0; y < TILE; y += 1) {
    for (let x = 0; x < TILE; x += 1) {
      writePx(tile, x, y, shift(readPx(tile, x, y), mul));
    }
  }
  if (speck) {
    for (let y = 0; y < TILE; y += 1) {
      for (let x = 0; x < TILE; x += 1) {
        if (rnd(x, y, seed) > 0.93) writePx(tile, x, y, speck);
      }
    }
  }
  return tile;
}

const DIRT = {
  mid: [0xae, 0x8f, 0x66],
  light: [0xc6, 0xa9, 0x7f],
  dark: [0x8a, 0x71, 0x4f],
  stone: [0x9d, 0x92, 0x7e],
} as const;

/**
 * 흙길 오토타일. 마스크는 이웃 네 방향 (N=1 · E=2 · S=4 · W=8).
 *
 * 이어진 변은 타일 끝까지 흙을 채우고, 끊긴 변은 **들쭉날쭉한 경계**로 잔디에
 * 녹인다. 직선으로 자르면 길이 아니라 갈색 띠로 보인다.
 */
function dirtTile(mask: number): Bitmap {
  const tile = clone(GRASS);
  const open = (bit: number) => (mask & bit) !== 0;
  // 끊긴 변은 3~5px 들어오고, 그 양을 좌표마다 흔든다.
  const inset = (bit: number, along: number, seed: number) =>
    open(bit) ? 0 : 3 + Math.round(rnd(along, bit, seed) * 2);

  for (let y = 0; y < TILE; y += 1) {
    for (let x = 0; x < TILE; x += 1) {
      const n = inset(1, x, 1);
      const e = inset(2, y, 2);
      const s = inset(4, x, 3);
      const w = inset(8, y, 4);
      if (y < n || y >= TILE - s || x < w || x >= TILE - e) continue;

      const edge =
        y < n + 1 || y >= TILE - s - 1 || x < w + 1 || x >= TILE - e - 1;
      const r = rnd(x, y, 7);
      const tone = edge
        ? DIRT.dark
        : r > 0.93
          ? DIRT.stone
          : r > 0.6
            ? DIRT.light
            : DIRT.mid;
      writePx(tile, x, y, tone);
    }
  }
  return tile;
}

const DRAWN: Bitmap[] = [
  ...Array.from({ length: 16 }, (_, mask) => dirtTile(mask)), // 26..41
  grassVariant([0.8, 0.85, 0.78], null, 11), //  42 그늘진 잔디
  grassVariant([1.1, 1.04, 0.84], null, 12), //  43 마른 잔디
  grassVariant([1, 1, 1], [0x4d, 0x84, 0x50], 13), //  44 잡초가 돋은 잔디
  grassVariant([0.96, 0.98, 0.96], [0x9d, 0x92, 0x7e], 14), //  45 자갈 섞인 잔디
];

const TILESET_COLUMNS = 8;
const ALL = [...PACKED, ...DRAWN];
writeFileSync(
  resolve(ROOT, "public/town/tilesets/town.png"),
  encodePng(packTiles(ALL, TILESET_COLUMNS)),
);
console.log(
  `wrote town.png (${ALL.length} tiles = 원본 파생 ${PACKED.length} + 직접 그림 ${DRAWN.length}, ${TILESET_COLUMNS} columns)`,
);
