import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  archDoor,
  archWindow,
  awning,
  band,
  barnDoor,
  BASE,
  Canvas,
  chimney,
  clockFace,
  column,
  coursedWall,
  doubleDoor,
  dropShadow,
  flagPole,
  gableRoof,
  groundShadow,
  iconBook,
  iconCap,
  iconCase,
  iconEnvelope,
  iconNews,
  iconTools,
  paneWindow,
  parapet,
  pediment,
  picketFence,
  plaque,
  plinth,
  shopFront,
  shutters,
  signFrame,
  slabRoof,
  smoke,
  steps,
  wallPanel,
  withWall,
  type Palette,
} from "./draw.mts";
import type { Bitmap } from "./png.mts";
import { encodePng } from "./png.mts";

/**
 * 건물 일곱 채를 직접 그린다. `npm run gen:buildings`
 *
 * 무료 에셋에는 용도가 드러나는 건물(학교·사무실·도서관…)이 없다. 그래서 직접 그린다.
 *
 * **용도는 그림 간판이 말한다.** 열주가 도서관이라는 건 아는 사람만 읽는 신호다.
 * 그래서 건물마다 큼직한 그림을 하나씩 달았고 그게 1차 신호다.
 *
 * **그리고 단순하게 그린다.** 한 채에 들어가는 것을 넷으로 묶었다 —
 * 지붕 하나 · 벽 하나 · 큰 창 몇 개 · 간판 하나. 모서리돌·빗물받이·화분·장작더미
 * 같은 걸 덧붙일수록 정작 봐야 할 간판과 지붕 모양이 묻힌다. 한 번 넣었다 걷어냈다.
 *
 *            그림 간판     지붕                  벽          크기
 *   회사     서류가방      평지붕 + 옥상 간판      커튼월       5x10
 *   학교     학사모        첨탑 + 낮은 모임지붕    붉은 벽돌    9x8
 *   도서관   펼친 책       페디먼트 + 열주        석조         7x8
 *   신문사   신문          평지붕 + 옥상 철골      짙은 벽돌    6x8
 *   우체국   편지 봉투     급한 모임지붕 + 깃대    회벽         5x7
 *   공방     망치와 스패너  낮은 모임지붕 + 굴뚝    회벽         6x5
 *   집       (없음)        급경사 박공 + 도머      회벽         4x5
 *
 * 집만 간판이 없다 — 굴뚝·도머·덧문·울타리가 붙은 작은 박공집은 그 자체로 집 말고
 * 다른 것으로 읽히지 않는다.
 *
 * 크기는 전부 16 의 배수여야 타일 격자에 맞는다. 스크립트가 검사한다.
 * **문의 가로 중심은 `buildings.ts` 의 `doorOffset` 칸 한가운데여야 한다.**
 * 어긋나면 문짝과 실제로 들어갈 수 있는 칸이 따로 논다.
 *
 * 그리는 순서도 규칙이다 — **벽 → 기단 → 개구부 → 간판.** 기단을 나중에 그리면
 * 문과 창 밑동을 가로로 잘라 먹는다.
 */

const pal = (over: Partial<Palette>): Palette => ({
  outline: BASE.outline,
  shadow: BASE.shadow,
  roofLight: 0xb07850,
  roofMid: 0x92603c,
  roofDark: 0x6e462e,
  wallLight: 0xfaf4e6,
  wallMid: 0xeee4ce,
  wallDark: 0xd6c8ae,
  wallShade: 0xb9ab92,
  accent: 0x5a9e92,
  accentDark: 0x427c76,
  ...over,
});

/** 벽돌 건물에 올리는 석재 띠 색. 몸통과 대비돼야 테두리가 산다. */
const TRIM = {
  wallLight: 0xeee8da,
  wallMid: 0xd8d1c2,
  wallDark: 0xb3ab9b,
  wallShade: 0x8b8375,
} as const;

/** 크림색 간판 바탕. 짙은 그림(학사모·연장)은 여기 올려야 보인다. */
const CREAM = [0xf2ead6, 0xc9bfa6] as const;

/** 불이 켜진 창. 공방 화덕과 집 거실. */
const WARM = { glass: 0xf2cd86, light: 0xfdeec2, dark: 0xc49a52 } as const;

// ── 회사 : 5x10 ─────────────────────────────────────────────────────────
function drawOffice(): Bitmap {
  const W = 80;
  const H = 160;
  const p = pal({
    roofLight: 0x7c8a9c, roofMid: 0x5c6a80, roofDark: 0x445065,
    wallLight: 0xdfe6ee, wallMid: 0xc6d0dc, wallDark: 0xa6b2c2, wallShade: 0x8794a6,
    accent: 0x4f7a9e, accentDark: 0x365a78,
  });
  const c = new Canvas(W, H);
  const baseY = 150;

  c.vLine(10, 6, 22, p.outline);
  c.vLine(70, 10, 18, p.outline);
  dropShadow(c, p.roofDark, 18, 2, 44, 26, 3);
  plaque(c, p, 18, 2, 44, 26, 0x3e4a5e, 0x2a3240);
  iconCase(c, p, 40, 15);

  parapet(c, p, 0, 28, W, 12);
  wallPanel(c, p, 3, 40, W - 6, baseY - 40);
  plinth(c, p, 1, baseY - 8, W - 2);

  // 같은 창이 다섯 층 반복되는 것이 고층 사무동의 신호다.
  for (let floor = 0; floor < 5; floor += 1) {
    for (const x of [8, 32, 56]) paneWindow(c, p, x, 46 + floor * 16, 16, 13);
  }
  shopFront(c, p, 6, 128, 22, 22);
  shopFront(c, p, W - 28, 128, 22, 22);
  doubleDoor(c, p, 29, 128, 22, 22);

  groundShadow(c, p, 3, H - 6, W - 6);
  return c.toBitmap();
}

// ── 학교 : 9x8 ──────────────────────────────────────────────────────────
function drawSchool(): Bitmap {
  const W = 144;
  const H = 128;
  const p = pal({
    roofLight: 0x6f7b86, roofMid: 0x525d68, roofDark: 0x3c454e,
    wallLight: 0xc4705c, wallMid: 0xa85a4a, wallDark: 0x87453a, wallShade: 0x6c372e,
    accent: 0xd9a441, accentDark: 0xa87a2c,
  });
  const stone = withWall(p, TRIM);
  const c = new Canvas(W, H);
  const CX = 72;
  const baseY = 112;

  // 몸통 → 탑 순서. 탑이 앞으로 나와야 처마가 가려진다.
  slabRoof(c, p, 0, 54, W, 14, 10);
  coursedWall(c, p, 2, 67, W - 4, baseY - 67);
  gableRoof(c, p, CX, 8, 24, 22, true);
  coursedWall(c, p, 54, 28, 36, baseY - 28);
  // 탑이 몸통보다 앞으로 나와 있다. 그림자를 떨궈야 두 덩어리로 보인다.
  c.rect(90, 70, 5, baseY - 78, p.wallShade);
  c.rect(90, 56, 5, 11, p.roofDark);
  plinth(c, stone, 0, baseY - 8, W);

  for (const x of [7, 30, 96, 119]) paneWindow(c, stone, x, 76, 18, 24);

  clockFace(c, p, CX, 42, 9);
  dropShadow(c, p.wallShade, 56, 58, 32, 22);
  plaque(c, p, 56, 58, 32, 22, CREAM[0], CREAM[1]);
  iconCap(c, p, CX, 69);
  archDoor(c, stone, 60, 82, 24, baseY - 82);

  steps(c, stone, CX, baseY, 24);
  groundShadow(c, p, 0, H - 6, W);
  return c.toBitmap();
}

// ── 도서관 : 7x8 ────────────────────────────────────────────────────────
function drawLibrary(): Bitmap {
  const W = 112;
  const H = 128;
  const p = pal({
    roofLight: 0x8f9fa8, roofMid: 0x6d7d87, roofDark: 0x515f68,
    wallLight: 0xeae3d2, wallMid: 0xd8d0bc, wallDark: 0xbdb49f, wallShade: 0x9b9280,
    accent: 0x3f6f5a, accentDark: 0x2a5041,
  });
  const c = new Canvas(W, H);
  const CX = 56;
  const baseY = 104;

  pediment(c, p, CX, 30, 54, 28);
  band(c, p, 2, 28, W - 4, 10);

  // 기둥 뒤는 파 들어간 그늘이다. 여기가 어두워야 기둥이 앞으로 나온다.
  c.rect(4, 38, W - 8, baseY - 38, 0x6a6252);
  for (let i = 0; i < 8; i += 1) c.hLine(4, 38 + i, W - 8, 0x4c463a);
  c.hLine(4, 38, W - 8, p.outline);

  dropShadow(c, 0x3b362b, 39, 44, 34, 26, 3);
  plaque(c, p, 39, 44, 34, 26, p.accent, p.accentDark);
  iconBook(c, p, CX, 57, 13);
  archDoor(c, p, 45, 74, 22, baseY - 74);
  for (const x of [6, 26, 74, 94]) {
    c.rect(x + 11, 41, 4, baseY - 44, 0x3b362b);
    column(c, p, x, 38, baseY - 38);
  }

  plinth(c, p, 0, baseY, W);
  steps(c, p, CX, baseY + 8, 40, 3);
  groundShadow(c, p, 2, H - 6, W - 4);
  return c.toBitmap();
}

// ── 신문사 : 6x8 ────────────────────────────────────────────────────────
function drawPress(): Bitmap {
  const W = 96;
  const H = 128;
  const p = pal({
    roofLight: 0x5c636b, roofMid: 0x434950, roofDark: 0x2f343a,
    wallLight: 0x9a7f72, wallMid: 0x836a5f, wallDark: 0x6a554c, wallShade: 0x54433c,
    accent: 0xc74b3c, accentDark: 0x8f3326,
  });
  const steel = withWall(p, {
    wallLight: 0xb8c0c8, wallMid: 0x97a1aa, wallDark: 0x6f7a84, wallShade: 0x515b65,
  });
  const c = new Canvas(W, H);
  const baseY = 112;

  signFrame(c, p, 10, 2, 76, 32, 12);
  iconNews(c, p, 34, 18, 34);
  for (let i = 0; i < 3; i += 1) c.rect(58 + i * 7, 10, 3, 16, p.wallLight);

  parapet(c, p, 0, 46, W, 12);
  coursedWall(c, p, 3, 58, W - 6, baseY - 58);
  // 옥상 철골 다리가 난간에 떨구는 그림자
  for (const lx of [14, 80]) c.rect(lx + 2, 36, 2, 10, p.roofDark);
  plinth(c, p, 1, baseY - 8, W - 2);

  for (const x of [8, 37, 66]) paneWindow(c, steel, x, 64, 22, 24, 3, 3);
  shopFront(c, steel, 8, 92, 30, 20);
  doubleDoor(c, p, 46, 90, 20, baseY - 90);
  shopFront(c, steel, 70, 92, 20, 20);

  groundShadow(c, p, 3, H - 6, W - 6);
  return c.toBitmap();
}

// ── 우체국 : 5x7 ────────────────────────────────────────────────────────
function drawPost(): Bitmap {
  const W = 80;
  const H = 112;
  const p = pal({
    roofLight: 0xc85f54, roofMid: 0xa3453d, roofDark: 0x7d322c,
    wallLight: 0xfaf0dc, wallMid: 0xeadfc6, wallDark: 0xcdc0a4, wallShade: 0xa89c82,
    accent: 0x3f6aa8, accentDark: 0x2b4d80,
  });
  const c = new Canvas(W, H);
  const CX = 40;
  const baseY = 100;

  chimney(c, p, 12, 4, 8, 18);
  slabRoof(c, p, 0, 20, W, 20, 16);
  c.rect(21, 20, 4, 7, p.roofDark);
  flagPole(c, p, 58, 0, 20, p.accent, p.accentDark);

  wallPanel(c, p, 2, 39, W - 4, baseY - 39);
  plinth(c, p, 0, baseY - 8, W);

  for (const x of [5, 61]) archWindow(c, p, x, 48, 14, 26);
  dropShadow(c, p.wallShade, 23, 43, 34, 23);
  plaque(c, p, 23, 43, 34, 23, p.accent, p.accentDark);
  iconEnvelope(c, p, CX, 54, 28);
  dropShadow(c, p.wallShade, 26, 68, 28, 6);
  awning(c, p, 26, 68, 28, 6);
  doubleDoor(c, p, 30, 76, 20, baseY - 76);

  steps(c, p, CX, baseY, 20);
  groundShadow(c, p, 2, H - 6, W - 4);
  return c.toBitmap();
}

// ── 공방 : 6x5 ──────────────────────────────────────────────────────────
function drawWorkshop(): Bitmap {
  const W = 96;
  const H = 80;
  const p = pal({
    roofLight: 0x8d7458, roofMid: 0x685440, roofDark: 0x4c3d2e,
    wallLight: 0xe8cfa2, wallMid: 0xd6b985, wallDark: 0xb89a6a, wallShade: 0x957c54,
    accent: 0x9c5a2e, accentDark: 0x76401f,
  });
  const c = new Canvas(W, H);
  const baseY = 74;

  chimney(c, p, 10, 8, 10, 16);
  smoke(c, 15, 5);
  slabRoof(c, p, 0, 16, W, 14, 10);
  c.rect(21, 16, 4, 7, p.roofDark);
  wallPanel(c, p, 1, 29, W - 2, baseY - 29);
  plinth(c, p, 0, baseY - 8, W);

  // 화덕이 켜진 작업창 — 공방이 돌아가고 있다는 유일한 표시.
  paneWindow(c, p, 7, 38, 26, 20, 2, 2, WARM.glass, WARM.light, WARM.dark);
  barnDoor(c, p, 48, 36, 16, baseY - 36, 12);
  const SIGN = 0x8a6a45;
  dropShadow(c, p.wallShade, 65, 33, 29, 30);
  plaque(c, p, 65, 33, 29, 30, SIGN, 0x5d4428);
  iconTools(c, p, 79, 48, SIGN);

  groundShadow(c, p, 1, H - 6, W - 2);
  return c.toBitmap();
}

// ── 집 : 4x5 ────────────────────────────────────────────────────────────
function drawHome(): Bitmap {
  const W = 64;
  const H = 80;
  const p = pal({
    roofLight: 0xc87a5e, roofMid: 0xa25a43, roofDark: 0x7d4432,
    wallLight: 0xfbf3e3, wallMid: 0xf1e5d0, wallDark: 0xd5c7ae, wallShade: 0xb1a388,
    accent: 0x5a9e92, accentDark: 0x427c76,
  });
  const c = new Canvas(W, H);
  const baseY = 64;
  // 문은 가운데가 아니라 doorOffset(2) 칸 한가운데에 선다.
  const DOOR = { x: 33, w: 14, cx: 40 };

  // 굴뚝은 지붕 비탈에 닿을 때까지 내려와야 한다. 짧으면 공중에 뜬다.
  chimney(c, p, 9, 2, 8, 20);
  smoke(c, 14, 0);
  gableRoof(c, p, 32, 4, 31, 24);

  // 도머 — 작은 집일수록 지붕에 하나 얹어야 덩어리가 안 된다.
  dropShadow(c, p.roofDark, 37, 16, 15, 12);
  wallPanel(c, p, 37, 16, 15, 12);
  gableRoof(c, p, 44, 9, 9, 8);
  paneWindow(c, p, 40, 19, 9, 7, 2, 1, WARM.glass, WARM.light, WARM.dark);

  wallPanel(c, p, 4, 27, W - 8, baseY - 27);
  plinth(c, p, 2, baseY - 8, W - 4);

  paneWindow(c, p, 11, 33, 14, 16, 2, 2, WARM.glass, WARM.light, WARM.dark);
  shutters(c, p, 11, 33, 14, 16);
  paneWindow(c, p, 50, 34, 9, 11, 1, 2, WARM.glass, WARM.light, WARM.dark);

  // 둥근 머리 현관
  const doorY = 36;
  const r = DOOR.w / 2;
  c.disc(DOOR.cx, doorY + r, r, p.outline);
  c.rect(DOOR.x, doorY + r, DOOR.w, baseY - doorY - r, p.outline);
  c.disc(DOOR.cx, doorY + r, r - 1, BASE.wood);
  c.rect(DOOR.x + 1, doorY + r, DOOR.w - 2, baseY - doorY - r - 1, BASE.wood);
  c.vLine(DOOR.x + 1, doorY + r, baseY - doorY - r - 1, p.roofLight);
  c.rect(DOOR.x + 4, doorY + 4, 6, 6, BASE.glass);
  c.outline(DOOR.x + 3, doorY + 3, 8, 8, BASE.woodDark);
  c.px(DOOR.x + DOOR.w - 4, doorY + 18, p.wallLight);
  dropShadow(c, p.wallShade, DOOR.x - 4, doorY - 6, 22, 5);
  awning(c, p, DOOR.x - 4, doorY - 6, 22, 5);

  // 앞마당 — 울타리 사이로 디딤돌이 문까지 이어진다.
  picketFence(c, p, 2, 65, 28);
  picketFence(c, p, 50, 65, 13);
  for (let i = 0; i < 3; i += 1) {
    c.rect(34, 65 + i * 4, 12, 3, p.wallDark);
    c.hLine(34, 65 + i * 4, 12, p.wallLight);
  }
  groundShadow(c, p, 4, H - 6, W - 8);
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
