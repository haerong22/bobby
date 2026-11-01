import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  archWindow,
  awning,
  BASE,
  beltCourse,
  brickRoof,
  Canvas,
  chimney,
  doubleDoor,
  drainpipe,
  gridWindow,
  groundShadow,
  parapet,
  plinth,
  potPlant,
  quoins,
  roofVent,
  shopFront,
  signBoard,
  steps,
  wallLamp,
  wallPanel,
  type Palette,
} from "./draw.mts";
import type { Bitmap } from "./png.mts";
import { encodePng } from "./png.mts";

/**
 * 건물 일곱 채를 직접 그린다. `npm run gen:buildings`
 *
 * 무료 에셋에는 용도가 드러나는 건물(학교·사무실·도서관…)이 없다. 그래서 직접 그린다.
 *
 * **덩치가 용도를 말한다.** 모양만 다르고 크기가 비슷하면 결국 비슷해 보인다.
 *
 *   회사    5x10  탑처럼 높다. 층수가 많고 커튼월이 반복된다
 *   학교    9x6   가장 넓다. 낮고 좌우로 길게 퍼진다
 *   도서관  7x6   넓고 중후하다. 박공과 기둥
 *   신문사  6x6   중간. 큰 간판과 전면 유리
 *   우체국  5x5   작은 관공서
 *   공방    5x4   낮고 넓은 작업장
 *   집      4x4   가장 작다
 *
 * 크기는 전부 16 의 배수여야 타일 격자에 맞는다. 스크립트가 검사한다.
 */

const pal = (over: Partial<Palette>): Palette => ({
  outline: BASE.outline,
  shadow: BASE.shadow,
  roofLight: 0xb07850,
  roofMid: 0x92603c,
  roofDark: 0x6e462e,
  roofDeep: 0x5c3a28,
  wallLight: 0xfaf4e6,
  wallMid: 0xeee4ce,
  wallDark: 0xd6c8ae,
  wallShade: 0xb9ab92,
  accent: 0x5a9e92,
  accentDark: 0x427c76,
  ...over,
});

/** 창을 가로로 고르게 벌려 놓을 x 좌표들. */
function spread(total: number, count: number, winW: number, margin: number) {
  const span = total - margin * 2;
  const gap = (span - count * winW) / (count - 1 || 1);
  return Array.from({ length: count }, (_, i) =>
    Math.round(margin + i * (winW + gap)),
  );
}

// ── 회사 : 5x10, 탑 ─────────────────────────────────────────────────────
function drawOffice(): Bitmap {
  const W = 80;
  const H = 160;
  const p = pal({
    roofLight: 0x7c8a9c, roofMid: 0x65738a, roofDark: 0x4d5a70, roofDeep: 0x3e4a5e,
    wallLight: 0xdfe6ee, wallMid: 0xc6d0dc, wallDark: 0xa6b2c2, wallShade: 0x8794a6,
    accent: 0x4f7a9e, accentDark: 0x365a78,
  });
  const c = new Canvas(W, H);

  // 옥상 설비와 안테나
  c.vLine(W / 2, 0, 12, p.outline);
  c.hLine(W / 2 - 3, 2, 7, p.outline);
  c.hLine(W / 2 - 2, 5, 5, p.outline);
  roofVent(c, p, 10, 8);
  roofVent(c, p, W - 18, 8);

  parapet(c, p, 0, 14, W, 12);

  const wallY = 26;
  const baseY = 150;
  wallPanel(c, p, 3, wallY, W - 6, baseY - wallY);
  plinth(c, p, 3, baseY - 8, W - 6);
  drainpipe(c, p, 5, wallY + 2, baseY - wallY - 10);
  drainpipe(c, p, W - 7, wallY + 2, baseY - wallY - 10);

  // 커튼월: 같은 창이 여러 층 반복되는 것이 고층 사무동의 핵심 신호.
  const cols = spread(W, 3, 16, 8);
  const FLOORS = 5;
  for (let floor = 0; floor < FLOORS; floor += 1) {
    const y = wallY + 8 + floor * 20;
    for (const x of cols) gridWindow(c, p, x, y, 16, 15);
    if (floor < FLOORS - 1) beltCourse(c, p, 3, y + 17, W - 6);
  }

  // 1층 로비
  const lobbyY = baseY - 22;
  shopFront(c, p, 6, lobbyY, 22, 22);
  shopFront(c, p, W - 28, lobbyY, 22, 22);
  doubleDoor(c, p, (W - 22) / 2, lobbyY, 22, 22);
  signBoard(c, p, (W - 34) / 2, wallY + 2, 34, 7, 4);

  groundShadow(c, p, 3, baseY, W - 6);
  return c.toBitmap();
}

// ── 학교 : 9x6, 가장 넓다 ───────────────────────────────────────────────
function drawSchool(): Bitmap {
  const W = 144;
  const H = 96;
  const p = pal({});
  const c = new Canvas(W, H);

  const towerW = 30;
  const towerX = (W - towerW) / 2;
  brickRoof(c, p, towerX, 0, towerW, 10);
  c.vLine(W / 2, -1, 3, p.outline);

  wallPanel(c, p, towerX + 2, 10, towerW - 4, 18);
  const clockY = 19;
  c.disc(W / 2, clockY, 7, p.wallLight);
  c.ring(W / 2, clockY, 7, p.outline);
  c.ring(W / 2, clockY, 6, p.wallDark);
  for (const [dx, dy] of [[0, -5], [0, 5], [-5, 0], [5, 0]] as const) {
    c.px(W / 2 + dx, clockY + dy, p.outline);
  }
  c.vLine(W / 2, clockY - 4, 5, p.outline);
  c.hLine(W / 2, clockY, 4, p.outline);

  brickRoof(c, p, 0, 24, W, 16);

  const wallY = 40;
  const baseY = 90;
  wallPanel(c, p, 3, wallY, W - 6, baseY - wallY);
  plinth(c, p, 3, 82, W - 6);
  drainpipe(c, p, 5, wallY + 2, 44);
  drainpipe(c, p, W - 7, wallY + 2, 44);
  beltCourse(c, p, 3, wallY + 32, W - 6);
  quoins(c, p, 4, wallY + 2, 40);
  quoins(c, p, W - 8, wallY + 2, 40);

  // 좌우 세 짝씩. 같은 창이 길게 늘어서는 것이 학교의 인상이다.
  const porchW = 34;
  const porchX = (W - porchW) / 2;
  for (const x of spread(porchX, 3, 14, 10)) gridWindow(c, p, x, wallY + 8, 14, 20);
  for (const x of spread(porchX, 3, 14, 10)) {
    gridWindow(c, p, W - x - 14, wallY + 8, 14, 20);
  }

  wallPanel(c, p, porchX, wallY - 2, porchW, baseY - wallY + 2);
  c.vLine(porchX - 1, wallY, 48, p.wallShade);
  signBoard(c, p, porchX + 4, wallY + 9, porchW - 8, 9, 5);
  wallLamp(c, p, porchX + 3, wallY + 21);
  wallLamp(c, p, porchX + porchW - 4, wallY + 21);
  doubleDoor(c, p, (W - 22) / 2, wallY + 24, 22, baseY - wallY - 24);
  steps(c, p, W / 2, baseY, 22);
  potPlant(c, p, porchX - 10, baseY - 10);
  potPlant(c, p, porchX + porchW + 4, baseY - 10);
  groundShadow(c, p, 3, baseY, W - 6);
  return c.toBitmap();
}

// ── 도서관 : 7x6 ────────────────────────────────────────────────────────
function drawLibrary(): Bitmap {
  const W = 112;
  const H = 96;
  const p = pal({
    roofLight: 0x8a7a96, roofMid: 0x6e5f7c, roofDark: 0x574a64, roofDeep: 0x443a50,
    wallLight: 0xf0ead8, wallMid: 0xded6c0, wallDark: 0xc0b69e, wallShade: 0x9e9480,
    accent: 0x8c6a4a, accentDark: 0x6b4e35,
  });
  const c = new Canvas(W, H);

  for (let i = 0; i < 12; i += 1) {
    c.hLine(W / 2 - 26 + i * 2, i, 52 - i * 4, i === 0 ? p.outline : p.roofMid);
  }
  c.outline(W / 2 - 26, 0, 52, 13, p.outline);

  brickRoof(c, p, 0, 12, W, 14);
  const wallY = 26;
  const baseY = 86;
  wallPanel(c, p, 3, wallY, W - 6, baseY - wallY);
  plinth(c, p, 3, 78, W - 6);
  quoins(c, p, 4, wallY + 2, 46);
  quoins(c, p, W - 8, wallY + 2, 46);

  for (const x of [8, 26, W - 40, W - 22]) archWindow(c, p, x, wallY + 8, 14, 28);

  for (const cx of [W / 2 - 18, W / 2 + 14]) {
    c.rect(cx, wallY + 4, 4, 52, p.wallLight);
    c.vLine(cx, wallY + 4, 52, p.wallDark);
    c.rect(cx - 1, wallY + 4, 6, 2, p.wallDark);
    c.rect(cx - 1, wallY + 54, 6, 2, p.wallDark);
    c.outline(cx - 1, wallY + 4, 6, 54, p.outline);
  }
  doubleDoor(c, p, (W - 22) / 2, wallY + 32, 22, baseY - wallY - 32);
  signBoard(c, p, (W - 30) / 2, wallY + 12, 30, 8, 4);
  potPlant(c, p, W / 2 - 30, baseY - 8);
  potPlant(c, p, W / 2 + 24, baseY - 8);

  steps(c, p, W / 2, baseY, 24);
  groundShadow(c, p, 3, baseY, W - 6);
  return c.toBitmap();
}

// ── 신문사 : 6x6 ────────────────────────────────────────────────────────
function drawPress(): Bitmap {
  const W = 96;
  const H = 96;
  const p = pal({
    roofLight: 0x6d7682, roofMid: 0x586069, roofDark: 0x454c55, roofDeep: 0x363c44,
    wallLight: 0xeeeae0, wallMid: 0xdad5c8, wallDark: 0xbab4a6, wallShade: 0x97917f,
    accent: 0x3f5a6b, accentDark: 0x2c4150,
  });
  const c = new Canvas(W, H);

  parapet(c, p, 0, 8, W, 12);
  const wallY = 20;
  const baseY = 86;
  wallPanel(c, p, 3, wallY, W - 6, baseY - wallY);
  plinth(c, p, 3, 78, W - 6);

  signBoard(c, p, 8, wallY + 3, W - 16, 14, 7);

  for (const x of spread(W, 3, 14, 10)) gridWindow(c, p, x, wallY + 22, 14, 16);
  beltCourse(c, p, 3, wallY + 42, W - 6);

  shopFront(c, p, 8, baseY - 20, 28, 20);
  shopFront(c, p, W - 36, baseY - 20, 28, 20);
  doubleDoor(c, p, (W - 20) / 2, baseY - 20, 20, 20);

  // 길가 신문 가판대
  c.rect(5, baseY - 14, 10, 12, p.accent);
  c.hLine(6, baseY - 13, 8, p.wallLight);
  c.rect(6, baseY - 10, 8, 6, p.wallMid);
  for (let i = 0; i < 3; i += 1) c.hLine(7, baseY - 9 + i * 2, 6, p.wallShade);
  c.outline(5, baseY - 14, 10, 12, p.outline);

  groundShadow(c, p, 3, baseY, W - 6);
  return c.toBitmap();
}

// ── 우체국 : 5x5 ────────────────────────────────────────────────────────
function drawPost(): Bitmap {
  const W = 80;
  const H = 80;
  const p = pal({
    roofLight: 0xb2574f, roofMid: 0x94443e, roofDark: 0x76352f, roofDeep: 0x5e2a25,
    wallLight: 0xfaf0dc, wallMid: 0xeadfc6, wallDark: 0xcdc0a4, wallShade: 0xa89c82,
    accent: 0xb2574f, accentDark: 0x8a3d37,
  });
  const c = new Canvas(W, H);

  brickRoof(c, p, 0, 6, W, 16);
  chimney(c, p, 12, 0, 7, 8);

  const wallY = 22;
  const baseY = 70;
  wallPanel(c, p, 3, wallY, W - 6, baseY - wallY);
  plinth(c, p, 3, 62, W - 6);
  drainpipe(c, p, 5, wallY + 2, 38);
  drainpipe(c, p, W - 7, wallY + 2, 38);

  for (const x of [8, W - 22]) gridWindow(c, p, x, wallY + 8, 14, 16);

  const doorW = 22;
  const doorX = (W - doorW) / 2;
  c.disc(W / 2, wallY + 20, doorW / 2, p.outline);
  c.rect(doorX, wallY + 20, doorW, 28, p.outline);
  c.disc(W / 2, wallY + 20, doorW / 2 - 1, p.wallDark);
  c.rect(doorX + 1, wallY + 20, doorW - 2, 27, p.wallDark);
  doubleDoor(c, p, doorX + 2, wallY + 22, doorW - 4, baseY - wallY - 22);
  signBoard(c, p, (W - 28) / 2, wallY + 2, 28, 8, 4);
  awning(c, p, (W - 30) / 2, wallY + 12, 30);

  // 우편함
  const boxX = W - 16;
  c.rect(boxX, baseY - 14, 9, 12, p.accent);
  c.hLine(boxX + 1, baseY - 13, 7, p.wallLight);
  c.rect(boxX + 2, baseY - 10, 5, 2, p.outline);
  c.outline(boxX, baseY - 14, 9, 12, p.outline);
  c.vLine(boxX + 4, baseY - 2, 4, p.outline);

  steps(c, p, W / 2, baseY, 20);
  groundShadow(c, p, 3, baseY, W - 6);
  return c.toBitmap();
}

// ── 공방 : 5x4, 낮고 넓은 작업장 ────────────────────────────────────────
function drawWorkshop(): Bitmap {
  const W = 80;
  const H = 64;
  const p = pal({
    roofLight: 0x8a7254, roofMid: 0x6f5a41, roofDark: 0x574633, roofDeep: 0x433628,
    wallLight: 0xe8d5b4, wallMid: 0xd4bf9c, wallDark: 0xb5a083, wallShade: 0x94806a,
    accent: 0x8c5a3c, accentDark: 0x6b422b,
  });
  const c = new Canvas(W, H);

  brickRoof(c, p, 0, 8, W, 14);
  chimney(c, p, 58, 0, 9, 10);
  for (const [x, y] of [[61, -2], [63, -5], [62, -8]] as const) {
    c.px(x, y, p.wallDark);
    c.px(x + 1, y, p.wallShade);
  }

  const wallY = 22;
  const baseY = 56;
  wallPanel(c, p, 3, wallY, W - 6, baseY - wallY);
  plinth(c, p, 3, 50, W - 6, 6);

  // 넓은 작업창
  shopFront(c, p, 7, wallY + 5, 32, 22);
  for (let i = 0; i < 3; i += 1) c.vLine(15 + i * 8, wallY + 6, 20, p.wallDark);

  // 매달린 나무 간판
  c.hLine(46, wallY + 3, 20, p.outline);
  c.vLine(50, wallY + 4, 4, p.outline);
  c.vLine(62, wallY + 4, 4, p.outline);
  c.rect(46, wallY + 8, 20, 10, BASE.wood);
  c.hLine(47, wallY + 9, 18, p.roofLight);
  c.outline(46, wallY + 8, 20, 10, p.outline);
  for (let i = 0; i < 3; i += 1) c.rect(50 + i * 5, wallY + 11, 2, 4, p.wallLight);

  doubleDoor(c, p, 46, wallY + 20, 20, baseY - wallY - 20);

  c.rect(4, baseY - 10, 10, 10, BASE.wood);
  c.outline(4, baseY - 10, 10, 10, p.outline);
  c.hLine(5, baseY - 6, 8, BASE.woodDark);

  groundShadow(c, p, 3, baseY, W - 6);
  return c.toBitmap();
}

// ── 집 : 4x4, 가장 작다 ─────────────────────────────────────────────────
function drawHome(): Bitmap {
  const W = 64;
  const H = 64;
  const p = pal({
    roofLight: 0xb2695c, roofMid: 0x95544a, roofDark: 0x77423a, roofDeep: 0x5e342e,
    wallLight: 0xfaf2e2, wallMid: 0xf0e4cf, wallDark: 0xd4c6ad, wallShade: 0xb0a287,
    accent: 0x5a9e92, accentDark: 0x427c76,
  });
  const c = new Canvas(W, H);

  for (let i = 0; i < 8; i += 1) {
    const inset = 8 - i;
    c.hLine(inset, i, W - inset * 2, i === 0 ? p.outline : p.roofLight);
  }
  brickRoof(c, p, 0, 8, W, 14);
  chimney(c, p, 46, 2, 7, 8);

  const wallY = 22;
  const baseY = 54;
  wallPanel(c, p, 4, wallY, W - 8, baseY - wallY);
  plinth(c, p, 4, 48, W - 8, 6);

  for (const x of [9, W - 23] as const) {
    gridWindow(c, p, x, wallY + 6, 14, 14);
    c.rect(x - 1, wallY + 21, 16, 5, BASE.wood);
    c.hLine(x - 1, wallY + 21, 16, p.roofLight);
    c.outline(x - 1, wallY + 21, 16, 5, p.outline);
    for (let i = 0; i < 4; i += 1) {
      c.px(x + 1 + i * 4, wallY + 20, 0x6ba665);
      c.px(x + 2 + i * 4, wallY + 19, 0xd96f84);
    }
  }

  const doorW = 14;
  const doorX = (W - doorW) / 2;
  c.rect(doorX, wallY + 12, doorW, baseY - wallY - 12, BASE.wood);
  c.hLine(doorX + 1, wallY + 13, doorW - 2, p.roofLight);
  c.outline(doorX, wallY + 12, doorW, baseY - wallY - 12, p.outline);
  c.rect(doorX + 4, wallY + 16, 6, 5, BASE.glass);
  c.outline(doorX + 3, wallY + 15, 8, 7, BASE.woodDark);
  c.px(doorX + doorW - 4, wallY + 26, p.wallLight);

  awning(c, p, doorX - 3, wallY + 8, 20, 5);
  potPlant(c, p, doorX - 11, baseY - 8);
  steps(c, p, W / 2, baseY, 14);
  groundShadow(c, p, 4, baseY, W - 8);
  return c.toBitmap();
}

// ── write ───────────────────────────────────────────────────────────────
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const BUILDINGS: Record<string, () => Bitmap> = {
  school: drawSchool,
  office: drawOffice,
  library: drawLibrary,
  post: drawPost,
  press: drawPress,
  workshop: drawWorkshop,
  home: drawHome,
};

for (const [id, draw] of Object.entries(BUILDINGS)) {
  const bitmap = draw();
  if (bitmap.width % 16 !== 0 || bitmap.height % 16 !== 0) {
    throw new Error(`${id}: ${bitmap.width}x${bitmap.height} 는 16 의 배수가 아니다`);
  }
  writeFileSync(resolve(ROOT, `public/town/buildings/${id}.png`), encodePng(bitmap));
  console.log(
    `wrote buildings/${id}.png  ${bitmap.width}x${bitmap.height} = ${bitmap.width / 16}x${bitmap.height / 16} 타일`,
  );
}
