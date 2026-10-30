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

const TILESET_COLUMNS = 8;
writeFileSync(
  resolve(ROOT, "public/town/tilesets/town.png"),
  encodePng(packTiles(PACKED, TILESET_COLUMNS)),
);
console.log(
  `wrote town.png (${PACKED.length} tiles, ${TILESET_COLUMNS} columns)`,
);
