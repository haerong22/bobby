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
 * 무료 에셋에는 용도가 드러나는 건물(학교·사무실·도서관…)이 없다. 색이나 크기만
 * 바꾸면 결국 같은 가게의 변형이라, 건물마다 **용도 신호**를 다르게 넣어 그린다.
 *
 *   학교   시계탑 · 격자로 늘어선 창 · 중앙 현관
 *   회사   평지붕 · 유리 커튼월 격자 · 로비
 *   도서관 아치 창 · 기둥 · 박공
 *   우체국 아치 입구 · 우편함 · 차양
 *   신문사 큰 간판 · 1층 전면 유리 · 가판대
 *   공방   굴뚝 · 큰 작업창 · 나무 간판
 *   집     박공지붕 · 굴뚝 · 화단
 *
 * 크기는 전부 16 의 배수여야 타일 격자에 맞는다.
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

// ── 학교 ────────────────────────────────────────────────────────────────
function drawSchool(): Bitmap {
  const W = 112;
  const H = 96;
  const p = pal({});
  const c = new Canvas(W, H);

  const towerW = 28;
  const towerX = (W - towerW) / 2;
  brickRoof(c, p, towerX, 0, towerW, 10);
  c.vLine(W / 2, -1, 3, p.outline);

  const towerH = 18;
  wallPanel(c, p, towerX + 2, 10, towerW - 4, towerH);
  const clockY = 10 + 9;
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
  const wallH = 50;
  wallPanel(c, p, 3, wallY, W - 6, wallH);
  plinth(c, p, 3, 82, W - 6);
  drainpipe(c, p, 5, wallY + 2, wallH - 4);
  drainpipe(c, p, W - 7, wallY + 2, wallH - 4);

  beltCourse(c, p, 3, wallY + 32, W - 6);
  quoins(c, p, 4, wallY + 2, 40);
  quoins(c, p, W - 8, wallY + 2, 40);
  for (const x of [10, 30, W - 44, W - 24]) gridWindow(c, p, x, wallY + 8, 14, 20);

  const porchW = 34;
  const porchX = (W - porchW) / 2;
  wallPanel(c, p, porchX, wallY - 2, porchW, 92 - wallY + 2 - 2);
  c.vLine(porchX - 1, wallY, 48, p.wallShade);

  signBoard(c, p, porchX + 4, wallY + 9, porchW - 8, 9, 5);
  wallLamp(c, p, porchX + 3, wallY + 21);
  wallLamp(c, p, porchX + porchW - 4, wallY + 21);
  doubleDoor(c, p, (W - 22) / 2, wallY + 24, 22, 90 - wallY - 24);
  steps(c, p, W / 2, 90, 22);
  potPlant(c, p, porchX - 10, 80);
  potPlant(c, p, porchX + porchW + 4, 80);
  groundShadow(c, p, 3, 90, W - 6);
  return c.toBitmap();
}

// ── 회사 ────────────────────────────────────────────────────────────────
function drawOffice(): Bitmap {
  const W = 96;
  const H = 96;
  const p = pal({
    roofLight: 0x7c8a9c, roofMid: 0x65738a, roofDark: 0x4d5a70, roofDeep: 0x3e4a5e,
    wallLight: 0xdfe6ee, wallMid: 0xc6d0dc, wallDark: 0xa6b2c2, wallShade: 0x8794a6,
    accent: 0x4f7a9e, accentDark: 0x365a78,
  });
  const c = new Canvas(W, H);

  roofVent(c, p, 18, 4);
  roofVent(c, p, 62, 4);
  c.vLine(40, 0, 10, p.outline);
  c.hLine(37, 0, 7, p.outline);
  parapet(c, p, 0, 10, W, 14);
  const wallY = 24;
  wallPanel(c, p, 3, wallY, W - 6, 62);
  plinth(c, p, 3, 78, W - 6);
  drainpipe(c, p, 5, wallY + 2, 56);
  drainpipe(c, p, W - 7, wallY + 2, 56);

  // 유리 커튼월. 같은 창이 격자로 빽빽한 게 사무동 신호다.
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      gridWindow(c, p, 8 + col * 21, wallY + 6 + row * 24, 14, 17);
    }
  }

  beltCourse(c, p, 3, wallY + 28, W - 6);
  beltCourse(c, p, 3, wallY + 44, W - 6);
  // 1층 로비 유리와 회전문 자리
  const lobbyY = 70;
  shopFront(c, p, 8, lobbyY, 30, 16);
  shopFront(c, p, W - 38, lobbyY, 30, 16);
  doubleDoor(c, p, (W - 20) / 2, lobbyY, 20, 16);
  signBoard(c, p, (W - 36) / 2, wallY + 2, 36, 7, 4);

  groundShadow(c, p, 3, 86, W - 6);
  return c.toBitmap();
}

// ── 도서관 ──────────────────────────────────────────────────────────────
function drawLibrary(): Bitmap {
  const W = 96;
  const H = 80;
  const p = pal({
    roofLight: 0x8a7a96, roofMid: 0x6e5f7c, roofDark: 0x574a64, roofDeep: 0x443a50,
    wallLight: 0xf0ead8, wallMid: 0xded6c0, wallDark: 0xc0b69e, wallShade: 0x9e9480,
    accent: 0x8c6a4a, accentDark: 0x6b4e35,
  });
  const c = new Canvas(W, H);

  // 중앙 박공(삼각 지붕). 격식 있는 건물의 신호.
  for (let i = 0; i < 10; i += 1) {
    c.hLine(W / 2 - 22 + i * 2, i, 44 - i * 4, i === 0 ? p.outline : p.roofMid);
  }
  c.outline(W / 2 - 22, 0, 44, 11, p.outline);

  brickRoof(c, p, 0, 10, W, 12);
  const wallY = 22;
  wallPanel(c, p, 3, wallY, W - 6, 48);
  plinth(c, p, 3, 62, W - 6);

  for (const x of [8, 26, W - 40, W - 22]) archWindow(c, p, x, wallY + 6, 14, 24);

  // 기둥 두 개와 그 사이 입구
  for (const cx of [W / 2 - 16, W / 2 + 14]) {
    c.rect(cx, wallY + 4, 4, 44, p.wallLight);
    c.vLine(cx, wallY + 4, 44, p.wallDark);
    c.rect(cx - 1, wallY + 4, 6, 2, p.wallDark);
    c.rect(cx - 1, wallY + 46, 6, 2, p.wallDark);
    c.outline(cx - 1, wallY + 4, 6, 46, p.outline);
  }
  quoins(c, p, 4, wallY + 2, 38);
  quoins(c, p, W - 8, wallY + 2, 38);
  doubleDoor(c, p, (W - 20) / 2, wallY + 28, 20, 70 - wallY - 28);
  signBoard(c, p, (W - 28) / 2, wallY + 10, 28, 8, 4);
  potPlant(c, p, W / 2 - 26, 62);
  potPlant(c, p, W / 2 + 20, 62);

  steps(c, p, W / 2, 70, 24);
  groundShadow(c, p, 3, 70, W - 6);
  return c.toBitmap();
}

// ── 우체국 ──────────────────────────────────────────────────────────────
function drawPost(): Bitmap {
  const W = 96;
  const H = 80;
  const p = pal({
    roofLight: 0xb2574f, roofMid: 0x94443e, roofDark: 0x76352f, roofDeep: 0x5e2a25,
    wallLight: 0xfaf0dc, wallMid: 0xeadfc6, wallDark: 0xcdc0a4, wallShade: 0xa89c82,
    accent: 0xb2574f, accentDark: 0x8a3d37,
  });
  const c = new Canvas(W, H);

  brickRoof(c, p, 0, 6, W, 16);
  chimney(c, p, 14, 0, 7, 8);

  const wallY = 22;
  wallPanel(c, p, 3, wallY, W - 6, 48);
  plinth(c, p, 3, 62, W - 6);
  drainpipe(c, p, 5, wallY + 2, 40);
  drainpipe(c, p, W - 7, wallY + 2, 40);

  for (const x of [10, W - 24]) gridWindow(c, p, x, wallY + 8, 14, 18);

  // 아치 입구
  const doorW = 24;
  const doorX = (W - doorW) / 2;
  c.disc(W / 2, wallY + 20, doorW / 2, p.outline);
  c.rect(doorX, wallY + 20, doorW, 50 - 20, p.outline);
  c.disc(W / 2, wallY + 20, doorW / 2 - 1, p.wallDark);
  c.rect(doorX + 1, wallY + 20, doorW - 2, 29, p.wallDark);
  doubleDoor(c, p, doorX + 2, wallY + 22, doorW - 4, 70 - wallY - 22);
  signBoard(c, p, (W - 30) / 2, wallY + 4, 30, 8, 4);
  awning(c, p, (W - 34) / 2, wallY + 14, 34);
  beltCourse(c, p, 3, wallY + 34, W - 6);

  // 우편함. 우체국이라는 가장 확실한 신호.
  const boxX = W - 18;
  c.rect(boxX, 56, 9, 12, p.accent);
  c.hLine(boxX + 1, 57, 7, p.wallLight);
  c.rect(boxX + 2, 60, 5, 2, p.outline); // 투입구
  c.outline(boxX, 56, 9, 12, p.outline);
  c.vLine(boxX + 4, 68, 4, p.outline);
  c.rect(boxX + 2, 71, 5, 2, p.wallShade);

  steps(c, p, W / 2, 70, 22);
  groundShadow(c, p, 3, 70, W - 6);
  return c.toBitmap();
}

// ── 신문사 ──────────────────────────────────────────────────────────────
function drawPress(): Bitmap {
  const W = 96;
  const H = 80;
  const p = pal({
    roofLight: 0x6d7682, roofMid: 0x586069, roofDark: 0x454c55, roofDeep: 0x363c44,
    wallLight: 0xeeeae0, wallMid: 0xdad5c8, wallDark: 0xbab4a6, wallShade: 0x97917f,
    accent: 0x3f5a6b, accentDark: 0x2c4150,
  });
  const c = new Canvas(W, H);

  parapet(c, p, 0, 8, W, 12);
  const wallY = 20;
  wallPanel(c, p, 3, wallY, W - 6, 50);
  plinth(c, p, 3, 62, W - 6);

  // 건물 폭을 거의 다 쓰는 큰 간판 — 신문사의 얼굴.
  signBoard(c, p, 8, wallY + 3, W - 16, 13, 7);

  for (const x of [10, W - 24]) gridWindow(c, p, x, wallY + 20, 14, 14);
  beltCourse(c, p, 3, wallY + 28, W - 6);

  // 1층 전면 유리와 출입문
  shopFront(c, p, 8, 52, 30, 18);
  shopFront(c, p, W - 38, 52, 30, 18);
  doubleDoor(c, p, (W - 20) / 2, 52, 20, 18);

  // 길가 신문 가판대
  c.rect(6, 58, 10, 12, p.accent);
  c.hLine(7, 59, 8, p.wallLight);
  c.rect(7, 62, 8, 6, p.wallMid);
  for (let i = 0; i < 3; i += 1) c.hLine(8, 63 + i * 2, 6, p.wallShade);
  c.outline(6, 58, 10, 12, p.outline);

  groundShadow(c, p, 3, 70, W - 6);
  return c.toBitmap();
}

// ── 공방 ────────────────────────────────────────────────────────────────
function drawWorkshop(): Bitmap {
  const W = 80;
  const H = 80;
  const p = pal({
    roofLight: 0x8a7254, roofMid: 0x6f5a41, roofDark: 0x574633, roofDeep: 0x433628,
    wallLight: 0xe8d5b4, wallMid: 0xd4bf9c, wallDark: 0xb5a083, wallShade: 0x94806a,
    accent: 0x8c5a3c, accentDark: 0x6b422b,
  });
  const c = new Canvas(W, H);

  brickRoof(c, p, 0, 8, W, 18);
  chimney(c, p, 56, 0, 9, 10);
  // 굴뚝 연기
  for (const [x, y] of [[59, -2], [61, -5], [60, -8]] as const) {
    c.px(x, y, p.wallDark);
    c.px(x + 1, y, p.wallShade);
  }

  const wallY = 26;
  wallPanel(c, p, 3, wallY, W - 6, 44);
  plinth(c, p, 3, 62, W - 6);

  // 큰 작업창. 안쪽이 보이는 넓은 유리가 공방 신호.
  shopFront(c, p, 8, wallY + 6, 32, 24);
  for (let i = 0; i < 3; i += 1) c.vLine(16 + i * 8, wallY + 7, 22, p.wallDark);

  // 매달린 나무 간판
  c.hLine(48, wallY + 4, 20, p.outline);
  c.vLine(52, wallY + 5, 4, p.outline);
  c.vLine(64, wallY + 5, 4, p.outline);
  c.rect(48, wallY + 9, 20, 11, BASE.wood);
  c.hLine(49, wallY + 10, 18, p.roofLight);
  c.outline(48, wallY + 9, 20, 11, p.outline);
  for (let i = 0; i < 3; i += 1) c.rect(52 + i * 5, wallY + 12, 2, 5, p.wallLight);

  // 벽에 걸어 둔 연장
  c.hLine(10, wallY + 34, 26, p.wallShade);
  for (let i = 0; i < 3; i += 1) {
    c.vLine(13 + i * 9, wallY + 34, 6, BASE.woodDark);
    c.rect(12 + i * 9, wallY + 39, 3, 2, p.wallShade);
  }
  doubleDoor(c, p, 48, wallY + 24, 20, 70 - wallY - 24);

  // 바깥에 쌓아 둔 나무 상자
  c.rect(4, 58, 10, 10, BASE.wood);
  c.outline(4, 58, 10, 10, p.outline);
  c.hLine(5, 62, 8, BASE.woodDark);
  c.vLine(9, 59, 8, BASE.woodDark);

  groundShadow(c, p, 3, 70, W - 6);
  return c.toBitmap();
}

// ── 집 ──────────────────────────────────────────────────────────────────
function drawHome(): Bitmap {
  const W = 64;
  const H = 64;
  const p = pal({
    roofLight: 0xb2695c, roofMid: 0x95544a, roofDark: 0x77423a, roofDeep: 0x5e342e,
    wallLight: 0xfaf2e2, wallMid: 0xf0e4cf, wallDark: 0xd4c6ad, wallShade: 0xb0a287,
    accent: 0x5a9e92, accentDark: 0x427c76,
  });
  const c = new Canvas(W, H);

  // 박공지붕: 단을 좁혀 가며 쌓아 경사를 만든다.
  for (let i = 0; i < 8; i += 1) {
    const inset = 8 - i;
    c.hLine(inset, i, W - inset * 2, i === 0 ? p.outline : p.roofLight);
  }
  brickRoof(c, p, 0, 8, W, 14);
  chimney(c, p, 46, 2, 7, 8);

  const wallY = 22;
  wallPanel(c, p, 4, wallY, W - 8, 32);
  plinth(c, p, 4, 48, W - 8, 6);

  for (const x of [9, W - 23] as const) {
    gridWindow(c, p, x, wallY + 6, 14, 14);
    // 창 아래 화단 — 사는 집이라는 신호
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
  c.rect(doorX, wallY + 12, doorW, 54 - wallY - 12, BASE.wood);
  c.hLine(doorX + 1, wallY + 13, doorW - 2, p.roofLight);
  c.outline(doorX, wallY + 12, doorW, 54 - wallY - 12, p.outline);
  c.rect(doorX + 4, wallY + 16, 6, 5, BASE.glass);
  c.outline(doorX + 3, wallY + 15, 8, 7, BASE.woodDark);
  c.px(doorX + doorW - 4, wallY + 26, p.wallLight);

  awning(c, p, doorX - 3, wallY + 8, 20, 5);
  potPlant(c, p, doorX - 11, 46);
  steps(c, p, W / 2, 54, 14);
  groundShadow(c, p, 4, 54, W - 8);
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
