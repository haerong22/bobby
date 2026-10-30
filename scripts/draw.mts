import type { Bitmap } from "./png.mts";

/**
 * 건물을 코드로 그리기 위한 캔버스와 공용 부품.
 *
 * 무료 에셋에 "학교처럼 생긴 학교" 가 없어서 직접 그린다. 팔레트와 마감 규칙은
 * 기존 Cozy 에셋에서 가져와 한 마을로 보이게 한다.
 *
 * **마감 규칙** — 이걸 지켜야 기존 건물 옆에 놓아도 어색하지 않다.
 *   1. 실루엣 바깥은 항상 1px 어두운 테두리
 *   2. 지붕은 벽보다 양쪽으로 나오고(처마), 처마 밑 벽은 두 줄 어둡게
 *   3. 빛은 위에서 — 면마다 위는 밝게 아래는 어둡게, 왼쪽 밝고 오른쪽 어둡게
 *   4. 앞으로 튀어나온 것은 자기 테두리와 옆벽 그림자를 가진다
 *   5. 벽은 바닥에서 바로 솟지 않는다 — 돌 기단으로 받친다
 */
export class Canvas {
  readonly width: number;
  readonly height: number;
  private readonly pixels: Uint8Array;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.pixels = new Uint8Array(width * height * 4);
  }

  px(x: number, y: number, hex: number | null) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || iy < 0 || ix >= this.width || iy >= this.height) return;
    const i = (iy * this.width + ix) * 4;
    if (hex === null) {
      this.pixels[i + 3] = 0;
      return;
    }
    this.pixels[i] = (hex >> 16) & 0xff;
    this.pixels[i + 1] = (hex >> 8) & 0xff;
    this.pixels[i + 2] = hex & 0xff;
    this.pixels[i + 3] = 255;
  }

  rect(x: number, y: number, w: number, h: number, hex: number | null) {
    for (let dy = 0; dy < h; dy += 1) {
      for (let dx = 0; dx < w; dx += 1) this.px(x + dx, y + dy, hex);
    }
  }

  hLine(x: number, y: number, w: number, hex: number) {
    this.rect(x, y, w, 1, hex);
  }

  vLine(x: number, y: number, h: number, hex: number) {
    this.rect(x, y, 1, h, hex);
  }

  outline(x: number, y: number, w: number, h: number, hex: number) {
    this.hLine(x, y, w, hex);
    this.hLine(x, y + h - 1, w, hex);
    this.vLine(x, y, h, hex);
    this.vLine(x + w - 1, y, h, hex);
  }

  disc(cx: number, cy: number, radius: number, hex: number) {
    for (let y = -radius; y <= radius; y += 1) {
      for (let x = -radius; x <= radius; x += 1) {
        if (Math.hypot(x, y) <= radius) this.px(cx + x, cy + y, hex);
      }
    }
  }

  ring(cx: number, cy: number, radius: number, hex: number) {
    for (let y = -radius; y <= radius; y += 1) {
      for (let x = -radius; x <= radius; x += 1) {
        const d = Math.hypot(x, y);
        if (d <= radius && d > radius - 1.4) this.px(cx + x, cy + y, hex);
      }
    }
  }

  toBitmap(): Bitmap {
    return { width: this.width, height: this.height, pixels: this.pixels };
  }
}

/** 좌표만 넣으면 같은 값이 나오는 잡음. 벽 얼룩에 쓴다. */
export const noise = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

export interface Palette {
  outline: number;
  shadow: number;
  roofLight: number;
  roofMid: number;
  roofDark: number;
  roofDeep: number;
  wallLight: number;
  wallMid: number;
  wallDark: number;
  wallShade: number;
  accent: number;
  accentDark: number;
}

/** 기존 Cozy 에셋에서 뽑은 공통 색. */
export const BASE = {
  outline: 0x3e2a28,
  shadow: 0x2b1f1e,
  glass: 0x94c0d8,
  glassDark: 0x6b839e,
  glassLight: 0xcde6ee,
  wood: 0x92603c,
  woodDark: 0x68422c,
  lamp: 0xf6e3a8,
} as const;

/** 지붕: 가로 기와 단 + 단마다 어긋나는 세로 줄눈. */
export function brickRoof(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const COURSE = 3;
  for (let row = 1; row < h - 1; row += 1) {
    const inCourse = row % COURSE;
    const tone =
      inCourse === 0 ? pal.roofDeep : inCourse === 1 ? pal.roofLight : pal.roofMid;
    canvas.hLine(x + 1, y + row, w - 2, tone);

    if (inCourse === 1) {
      const offset = (Math.floor(row / COURSE) % 2) * 4;
      for (let sx = x + 1 + offset; sx < x + w - 1; sx += 8) {
        canvas.px(sx, y + row, pal.roofDeep);
        canvas.px(sx, y + row + 1, pal.roofDeep);
      }
    }
  }
  canvas.hLine(x + 1, y + h - 2, w - 2, pal.roofDark);
  canvas.outline(x, y, w, h, pal.outline);
}

/** 평지붕 난간. 현대식 건물에 쓴다. */
export function parapet(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  canvas.rect(x, y, w, h, pal.roofMid);
  canvas.hLine(x + 1, y + 1, w - 2, pal.roofLight);
  canvas.hLine(x + 1, y + h - 3, w - 2, pal.roofDeep);
  canvas.hLine(x + 1, y + h - 2, w - 2, pal.roofDark);
  canvas.outline(x, y, w, h, pal.outline);
}

/** 벽면 한 장. 처마 그림자 · 좌우 음영 · 얼룩 · 테두리까지. */
export function wallPanel(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  canvas.rect(x, y, w, h, pal.wallMid);
  canvas.hLine(x, y, w, pal.wallShade);
  canvas.hLine(x, y + 1, w, pal.wallDark);
  canvas.vLine(x + 1, y + 2, h - 2, pal.wallLight);
  canvas.vLine(x + w - 2, y + 2, h - 2, pal.wallDark);

  for (let py = y + 3; py < y + h - 3; py += 1) {
    for (let px = x + 2; px < x + w - 2; px += 1) {
      const n = noise(px, py);
      if (n > 0.977) canvas.px(px, py, pal.wallLight);
      else if (n < 0.012) canvas.px(px, py, pal.wallDark);
    }
  }
  canvas.outline(x, y, w, h, pal.outline);
}

/** 돌 기단. 벽이 바닥에서 바로 솟지 않게 받친다. */
export function plinth(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  w: number,
  h = 8,
) {
  canvas.rect(x, y, w, h, pal.wallDark);
  canvas.hLine(x, y, w, pal.wallShade);
  canvas.hLine(x + 1, y + 1, w - 2, pal.wallLight);
  for (let sx = x + 4; sx < x + w - 2; sx += 9) {
    canvas.vLine(sx, y + 2, h - 2, pal.wallShade);
  }
  canvas.hLine(x + 1, y + Math.floor(h / 2), w - 2, pal.wallShade);
}

export function drainpipe(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  h: number,
) {
  canvas.vLine(x, y, h, pal.wallDark);
  canvas.vLine(x + 1, y, h, pal.wallShade);
  for (let band = y + 6; band < y + h; band += 12) {
    canvas.px(x, band, pal.outline);
    canvas.px(x + 1, band, pal.outline);
  }
}

/** 네모 창. 커튼 · 사선 반사 · 창턱까지. */
export function gridWindow(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  canvas.rect(x, y, w, h, pal.outline);
  canvas.rect(x + 1, y + 1, w - 2, h - 2, BASE.glass);
  canvas.hLine(x + 1, y + 1, w - 2, BASE.glassLight);
  canvas.hLine(x + 1, y + h - 3, w - 2, BASE.glassDark);
  canvas.rect(x + 1, y + 1, w - 2, 3, pal.wallDark);
  canvas.hLine(x + 1, y + 4, w - 2, pal.wallShade);
  for (let i = 0; i < 5; i += 1) {
    canvas.px(x + 2 + i, y + 6 + i, BASE.glassLight);
    canvas.px(x + 3 + i, y + 6 + i, BASE.glassLight);
  }
  canvas.vLine(x + Math.floor(w / 2), y + 1, h - 2, pal.wallMid);
  canvas.hLine(x + 1, y + Math.floor(h / 2), w - 2, pal.wallMid);
  canvas.hLine(x - 1, y + h, w + 2, pal.wallLight);
  canvas.hLine(x - 1, y + h + 1, w + 2, pal.wallShade);
  canvas.px(x - 1, y + h + 1, pal.outline);
  canvas.px(x + w, y + h + 1, pal.outline);
}

/** 아치 창. 도서관·우체국처럼 격식 있는 건물에 쓴다. */
export function archWindow(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const r = Math.floor(w / 2);
  const cx = x + r;
  canvas.disc(cx, y + r, r, pal.outline);
  canvas.rect(x, y + r, w, h - r, pal.outline);
  canvas.disc(cx, y + r, r - 1, BASE.glass);
  canvas.rect(x + 1, y + r, w - 2, h - r - 1, BASE.glass);
  canvas.hLine(x + 1, y + h - 3, w - 2, BASE.glassDark);
  for (let i = 0; i < 4; i += 1) {
    canvas.px(x + 2 + i, y + r + 2 + i, BASE.glassLight);
    canvas.px(x + 3 + i, y + r + 2 + i, BASE.glassLight);
  }
  canvas.vLine(cx, y + 2, h - 3, pal.wallMid);
  canvas.hLine(x + 1, y + r + Math.floor((h - r) / 2), w - 2, pal.wallMid);
  canvas.hLine(x - 1, y + h, w + 2, pal.wallLight);
  canvas.hLine(x - 1, y + h + 1, w + 2, pal.wallShade);
}

/** 1층 유리 전면. 상점·신문사처럼 안이 보여야 하는 곳. */
export function shopFront(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  canvas.rect(x, y, w, h, pal.outline);
  canvas.rect(x + 1, y + 1, w - 2, h - 2, BASE.glass);
  canvas.hLine(x + 1, y + 1, w - 2, BASE.glassLight);
  canvas.rect(x + 1, y + h - 4, w - 2, 3, pal.wallDark);
  canvas.hLine(x + 1, y + h - 4, w - 2, pal.wallShade);
  for (let sx = x + 4; sx < x + w - 2; sx += 7) {
    canvas.vLine(sx, y + 1, h - 5, pal.wallMid);
  }
  for (let i = 0; i < 7; i += 1) {
    canvas.px(x + 3 + i, y + 3 + i, BASE.glassLight);
  }
}

/** 간판. 글자 자리는 짧은 선으로 암시한다. */
export function signBoard(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  w: number,
  h: number,
  glyphs: number,
) {
  canvas.rect(x, y, w, h, pal.accent);
  canvas.hLine(x + 1, y + 1, w - 2, BASE.glassLight);
  canvas.outline(x, y, w, h, pal.accentDark);
  const step = Math.floor((w - 8) / glyphs);
  for (let i = 0; i < glyphs; i += 1) {
    canvas.rect(x + 4 + i * step, y + 3, 2, h - 6, pal.wallLight);
  }
}

export function wallLamp(canvas: Canvas, pal: Palette, x: number, y: number) {
  canvas.vLine(x, y, 3, pal.outline);
  canvas.rect(x - 1, y + 3, 3, 4, pal.outline);
  canvas.rect(x, y + 4, 1, 2, BASE.lamp);
  canvas.px(x - 1, y + 7, pal.wallShade);
  canvas.px(x + 1, y + 7, pal.wallShade);
}

export function chimney(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  canvas.rect(x, y, w, h, pal.roofMid);
  canvas.vLine(x + 1, y + 1, h - 1, pal.roofLight);
  canvas.rect(x - 1, y, w + 2, 3, pal.roofDark);
  canvas.outline(x - 1, y, w + 2, 3, pal.outline);
  canvas.vLine(x, y + 3, h - 3, pal.outline);
  canvas.vLine(x + w - 1, y + 3, h - 3, pal.outline);
}

/** 양개문. */
export function doubleDoor(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  canvas.rect(x, y, w, h, BASE.wood);
  canvas.hLine(x + 1, y + 1, w - 2, pal.roofLight);
  canvas.outline(x, y, w, h, pal.outline);
  const mid = x + Math.floor(w / 2);
  canvas.vLine(mid - 1, y + 1, h - 2, BASE.woodDark);
  canvas.vLine(mid, y + 1, h - 2, pal.roofLight);
  for (const gx of [x + 3, x + w - 9]) {
    canvas.rect(gx, y + 4, 6, 7, BASE.glass);
    canvas.hLine(gx, y + 4, 6, BASE.glassLight);
    canvas.outline(gx - 1, y + 3, 8, 9, BASE.woodDark);
  }
  canvas.px(mid - 3, y + h - 7, pal.wallLight);
  canvas.px(mid + 2, y + h - 7, pal.wallLight);
}

/** 계단 두 단 + 바닥 테두리. */
export function steps(
  canvas: Canvas,
  pal: Palette,
  cx: number,
  y: number,
  innerW: number,
) {
  const rows = [
    { w: innerW + 6, y },
    { w: innerW + 12, y: y + 2 },
  ];
  for (const row of rows) {
    const sx = cx - Math.floor(row.w / 2);
    canvas.rect(sx, row.y, row.w, 2, pal.wallDark);
    canvas.hLine(sx, row.y, row.w, pal.wallLight);
    canvas.px(sx, row.y + 1, pal.outline);
    canvas.px(sx + row.w - 1, row.y + 1, pal.outline);
  }
  const last = rows[1]!;
  canvas.hLine(cx - Math.floor(last.w / 2), y + 4, last.w, pal.outline);
}

/** 층 사이를 가르는 띠 몰딩. 벽이 한 장으로 보이지 않게 한다. */
export function beltCourse(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  w: number,
) {
  canvas.hLine(x, y, w, pal.wallLight);
  canvas.hLine(x, y + 1, w, pal.wallDark);
  canvas.hLine(x, y + 2, w, pal.wallShade);
}

/** 모서리 돌쌓기. 관공서·도서관처럼 격식 있는 건물에 쓴다. */
export function quoins(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  h: number,
  w = 4,
) {
  for (let row = 0; row * 6 < h - 2; row += 1) {
    const ty = y + row * 6;
    const tone = row % 2 === 0 ? pal.wallLight : pal.wallDark;
    canvas.rect(x, ty, w, 5, tone);
    canvas.hLine(x, ty + 4, w, pal.wallShade);
  }
}

/** 줄무늬 차양. 입구나 창 위에 달면 상점·관공서 입구가 또렷해진다. */
export function awning(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  w: number,
  h = 6,
) {
  for (let col = 0; col < w; col += 1) {
    const stripe = Math.floor(col / 3) % 2 === 0 ? pal.accent : pal.wallLight;
    canvas.vLine(x + col, y, h, stripe);
  }
  canvas.hLine(x, y, w, pal.wallLight);
  canvas.hLine(x, y + h - 1, w, pal.accentDark);
  // 아래로 늘어진 물결 단
  for (let col = 0; col < w; col += 4) {
    canvas.px(x + col + 1, y + h, pal.accentDark);
    canvas.px(x + col + 2, y + h, pal.accentDark);
  }
  canvas.outline(x, y, w, h, pal.outline);
}

/** 옥상 실외기. 평지붕 건물에 얹으면 사무동 티가 난다. */
export function roofVent(canvas: Canvas, pal: Palette, x: number, y: number) {
  canvas.rect(x, y, 8, 5, pal.wallDark);
  canvas.hLine(x, y, 8, pal.wallLight);
  canvas.outline(x, y, 8, 5, pal.outline);
  for (let i = 1; i < 4; i += 1) canvas.vLine(x + i * 2, y + 1, 3, pal.wallShade);
}

/** 화분. 입구 옆에 두면 사람이 사는 티가 난다. */
export function potPlant(canvas: Canvas, pal: Palette, x: number, y: number) {
  canvas.rect(x, y + 4, 6, 4, BASE.wood);
  canvas.hLine(x, y + 4, 6, pal.roofLight);
  canvas.outline(x, y + 4, 6, 4, pal.outline);
  canvas.rect(x + 1, y + 1, 4, 3, 0x5f8d5f);
  canvas.px(x + 2, y, 0x6ba665);
  canvas.px(x + 4, y + 1, 0x6ba665);
}

/** 바닥에 닿는 그림자. 건물이 떠 보이지 않게 한다. */
export function groundShadow(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  w: number,
) {
  canvas.rect(x + 1, y, w - 2, 2, pal.wallShade);
  canvas.hLine(x, y + 2, w, pal.outline);
  canvas.rect(x + 2, y + 3, w - 4, 2, pal.shadow);
}
