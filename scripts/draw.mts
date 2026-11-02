import type { Bitmap } from "./png.mts";

/**
 * 건물을 코드로 그리기 위한 캔버스와 공용 부품.
 *
 * 무료 에셋에 "학교처럼 생긴 학교" 가 없어서 직접 그린다.
 *
 * **단순하게 그린다.** 한때 벽에 얼룩·세로 줄눈·모서리돌·빗물받이·치형 몰딩까지
 * 넣었는데, 16px 타일을 두 배율로 보는 화면에서는 전부 잡티로 뭉개져 정작 봐야 할
 * 지붕 모양과 간판 그림을 가렸다. 지금 규칙은 이렇다.
 *
 *   - 면 하나에 색 **세 개까지** (밝은 윗줄 · 본색 · 어두운 아랫줄)
 *   - 얼룩·잡음 없음, 세로 줄눈 없음
 *   - 창은 **적고 크게**. 잘게 나누지 않는다
 *   - 마당 소품은 건물당 하나까지
 *
 * **입체는 빛의 방향 하나로 만든다.** 해는 **왼쪽 위**에 있다. 이것만 전부 지키면
 * 납작한 정면도가 덩어리로 보인다.
 *
 *   - 면은 왼쪽이 밝고 오른쪽이 어둡다 — 1px 테두리가 아니라 **넓은 띠**로
 *   - 앞으로 튀어나온 것(간판·차양·굴뚝·도머)은 **오른쪽 아래에 그림자**를 떨군다
 *   - 파 들어간 것(창·문)은 반대로 **왼쪽 위 안쪽이 어둡다**
 *   - 지붕은 윗면을 한 줄 보여 두께를 만든다
 *   - 바닥 그림자도 오른쪽으로 쏠린다
 *
 * **마감 규칙** — 이걸 지켜야 기존 Cozy 에셋 옆에 놓아도 어색하지 않다.
 *   1. 실루엣 바깥은 항상 1px 어두운 테두리
 *   2. 지붕은 벽보다 양쪽으로 나오고(처마), 처마 밑 벽은 두 줄 어둡게
 *   3. 벽은 바닥에서 바로 솟지 않는다 — 기단으로 받친다
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

  disc(cx: number, cy: number, radius: number, hex: number | null) {
    for (let y = -radius; y <= radius; y += 1) {
      for (let x = -radius; x <= radius; x += 1) {
        if (Math.hypot(x, y) <= radius) this.px(cx + x, cy + y, hex);
      }
    }
  }

  ring(cx: number, cy: number, radius: number, hex: number | null) {
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

/** 좌표만 넣으면 같은 값이 나오는 잡음. 나뭇잎에 쓴다 — 벽에는 쓰지 않는다. */
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

/** 팔레트에서 벽 네 색만 갈아 끼운다. 벽돌 건물에 석재 띠를 올릴 때 쓴다. */
export function withWall(
  pal: Palette,
  wall: Pick<Palette, "wallLight" | "wallMid" | "wallDark" | "wallShade">,
): Palette {
  return { ...pal, ...wall };
}

// ── 몸통 ────────────────────────────────────────────────────────────────

/** 단색 벽. 처마 그림자 두 줄 · 좌우 한 줄 · 테두리가 전부다. */
export function wallPanel(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  canvas.rect(x, y, w, h, pal.wallMid);
  // 해는 왼쪽 위. 1px 테두리가 아니라 넓은 띠로 깔아야 면이 돌아 보인다.
  canvas.rect(x, y, Math.max(2, Math.round(w * 0.09)), h, pal.wallLight);
  canvas.rect(x + w - Math.max(3, Math.round(w * 0.15)), y, Math.max(3, Math.round(w * 0.15)), h, pal.wallDark);
  canvas.rect(x + w - 3, y, 3, h, pal.wallShade);
  // 처마 그림자
  canvas.hLine(x, y, w, pal.wallShade);
  canvas.hLine(x, y + 1, w, pal.wallShade);
  canvas.hLine(x, y + 2, w, pal.wallDark);
  canvas.outline(x, y, w, h, pal.outline);
}

/** 조적조 벽. **가로 줄눈만** 성글게 — 세로 줄눈까지 넣으면 멀리서 지저분하다. */
export function coursedWall(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  w: number,
  h: number,
  course = 8,
) {
  wallPanel(canvas, pal, x, y, w, h);
  for (let cy = y + course; cy < y + h - 2; cy += course) {
    canvas.hLine(x + 2, cy, w - 4, pal.wallDark);
  }
}

/** 기단. 벽이 바닥에서 바로 솟지 않게 받친다. */
export function plinth(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  w: number,
  h = 8,
) {
  canvas.rect(x, y, w, h, pal.wallDark);
  // 기단이 앞으로 나와 있으므로 윗면이 보이고, 그 위에 벽 그림자가 한 줄 진다.
  canvas.hLine(x + 1, y + 1, w - 2, pal.wallLight);
  canvas.hLine(x, y, w, pal.wallShade);
  canvas.rect(x + w - 4, y + 1, 3, h - 2, pal.wallShade);
  canvas.vLine(x, y, h, pal.outline);
  canvas.vLine(x + w - 1, y, h, pal.outline);
  canvas.hLine(x, y + h - 1, w, pal.outline);
}

/** 가로 띠. 처마 · 엔타블러처 · 층 구분에 두루 쓴다. */
export function band(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  w: number,
  h = 6,
) {
  canvas.rect(x, y, w, h, pal.wallMid);
  canvas.hLine(x, y, w, pal.wallLight);
  canvas.hLine(x + 1, y + 1, w - 2, pal.wallLight);
  canvas.hLine(x, y + h - 2, w, pal.wallDark);
  canvas.outline(x, y, w, h, pal.outline);
  canvas.hLine(x + 2, y + h, w - 2, pal.wallShade);
}

// ── 지붕 ────────────────────────────────────────────────────────────────

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
  // 위에서 내려다보므로 난간의 윗면이 한 줄 보인다 — 이게 두께가 된다.
  canvas.rect(x + 1, y + 1, w - 2, 3, pal.roofLight);
  canvas.hLine(x + 1, y + 4, w - 2, pal.roofMid);
  canvas.hLine(x + 1, y + h - 2, w - 2, pal.roofDark);
  canvas.rect(x + w - 4, y + 4, 3, h - 5, pal.roofDark);
  canvas.outline(x, y, w, h, pal.outline);
}

const roofTone = (pal: Palette, t: number, h: number) =>
  t < 2 ? pal.roofLight : t >= h - 3 ? pal.roofDark : pal.roofMid;

/** 모임지붕. 윗변이 짧은 사다리꼴이라 평지붕·박공과 한눈에 구별된다. */
export function slabRoof(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  w: number,
  h: number,
  inset: number,
) {
  for (let t = 0; t < h; t += 1) {
    const f = (t + 1) / h;
    const left = Math.round(x + inset - inset * f);
    const right = Math.round(x + w - 1 - inset + inset * f);
    canvas.hLine(left, y + t, right - left + 1, roofTone(pal, t, h));
    canvas.px(left, y + t, pal.outline);
    canvas.px(right, y + t, pal.outline);
  }
  // 용마루 덮개 — 윗면이 보여야 지붕이 판때기가 아니라 덩어리로 읽힌다.
  const capX = x + inset - 2;
  const capW = w - inset * 2 + 4;
  canvas.rect(capX, y - 2, capW, 2, pal.roofLight);
  canvas.rect(capX + capW - 3, y - 2, 3, 2, pal.roofMid);
  canvas.hLine(capX, y - 3, capW, pal.outline);
  canvas.vLine(capX, y - 2, 2, pal.outline);
  canvas.vLine(capX + capW - 1, y - 2, 2, pal.outline);
  canvas.hLine(x, y + h - 1, w, pal.outline);
}

/** 박공지붕을 앞에서 본 삼각면. */
export function gableRoof(
  canvas: Canvas,
  pal: Palette,
  cx: number,
  y: number,
  halfW: number,
  h: number,
  cap = false,
) {
  for (let t = 0; t < h; t += 1) {
    const hw = Math.max(0, Math.round((halfW * (t + 1)) / h));
    canvas.hLine(cx - hw, y + t, hw * 2 + 1, roofTone(pal, t, h));
    canvas.px(cx - hw, y + t, pal.outline);
    canvas.px(cx + hw, y + t, pal.outline);
  }
  canvas.hLine(cx - halfW, y + h - 1, halfW * 2 + 1, pal.outline);
  if (cap) {
    canvas.rect(cx - 3, y - 3, 7, 3, pal.roofLight);
    canvas.rect(cx + 1, y - 3, 3, 3, pal.roofMid);
    canvas.outline(cx - 3, y - 3, 7, 3, pal.outline);
  }
}

/** 삼각 페디먼트. 안쪽은 벽, 비탈만 지붕색 띠. */
export function pediment(
  canvas: Canvas,
  pal: Palette,
  cx: number,
  baseY: number,
  halfW: number,
  h: number,
) {
  for (let t = 0; t < h; t += 1) {
    const y = baseY - h + t;
    const hw = Math.max(1, Math.round((halfW * (t + 1)) / h));
    canvas.hLine(cx - hw, y, hw * 2 + 1, pal.wallMid);
    if (hw > 6) {
      for (let i = 1; i <= 3; i += 1) {
        canvas.px(cx - hw + i, y, pal.roofLight);
        canvas.px(cx + hw - i, y, pal.roofDark);
      }
    }
    canvas.px(cx - hw, y, pal.outline);
    canvas.px(cx + hw, y, pal.outline);
  }
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

export function smoke(canvas: Canvas, x: number, y: number) {
  for (const [dx, dy, r] of [
    [0, 0, 2],
    [2, -4, 2],
    [-1, -8, 3],
  ] as const) {
    canvas.disc(x + dx, y + dy, r, 0xcfc9bd);
    canvas.disc(x + dx - 1, y + dy - 1, r - 1, 0xe8e3d8);
  }
}

/**
 * 앞으로 튀어나온 것이 벽에 떨구는 그림자. **그릴 것보다 먼저** 부른다.
 * 해가 왼쪽 위에 있으니 오른쪽과 아래로만 진다.
 */
export function dropShadow(
  canvas: Canvas,
  tone: number,
  x: number,
  y: number,
  w: number,
  h: number,
  d = 2,
) {
  canvas.rect(x + w, y + d, d, h, tone);
  canvas.rect(x + d, y + h, w, d, tone);
}

// ── 개구부 ──────────────────────────────────────────────────────────────

/** 큰 창. 유리 한 장 + 사선 반사 + 창턱. 많아야 네 칸으로 나눈다. */
export function paneWindow(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  w: number,
  h: number,
  cols = 2,
  rows = 2,
  glass: number = BASE.glass,
  glassLight: number = BASE.glassLight,
  glassDark: number = BASE.glassDark,
) {
  canvas.rect(x, y, w, h, pal.outline);
  canvas.rect(x + 1, y + 1, w - 2, h - 2, glass);
  // 파 들어간 창은 왼쪽 위 안쪽이 어둡다 (문틀 그늘), 오른쪽 아래가 밝다.
  canvas.hLine(x + 1, y + 1, w - 2, glassDark);
  canvas.vLine(x + 1, y + 1, h - 2, glassDark);
  canvas.hLine(x + 1, y + h - 2, w - 2, glassLight);
  canvas.vLine(x + w - 2, y + 2, h - 3, glassLight);
  for (let i = 0; i < Math.min(w, h) - 4; i += 1) {
    canvas.px(x + 2 + i, y + h - 3 - i, glassLight);
    canvas.px(x + 3 + i, y + h - 3 - i, glassLight);
  }
  for (let i = 1; i < cols; i += 1) {
    canvas.vLine(x + Math.round((w * i) / cols), y + 1, h - 2, pal.wallLight);
  }
  for (let i = 1; i < rows; i += 1) {
    canvas.hLine(x + 1, y + Math.round((h * i) / rows), w - 2, pal.wallLight);
  }
  canvas.hLine(x - 1, y + h, w + 2, pal.wallLight);
  canvas.hLine(x - 1, y + h + 1, w + 2, pal.wallShade);
}

/** 아치 창. 격식 있는 건물에 쓴다. */
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
  canvas.hLine(x + 1, y + h - 2, w - 2, BASE.glassDark);
  for (let i = 0; i < w - 4; i += 1) {
    canvas.px(x + 2 + i, y + h - 3 - i, BASE.glassLight);
    canvas.px(x + 3 + i, y + h - 3 - i, BASE.glassLight);
  }
  canvas.hLine(x + 1, y + r + Math.floor((h - r) / 2), w - 2, pal.wallLight);
  canvas.hLine(x - 1, y + h, w + 2, pal.wallLight);
  canvas.hLine(x - 1, y + h + 1, w + 2, pal.wallShade);
}

/** 1층 유리 전면. */
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
  canvas.hLine(x + 1, y + 1, w - 2, BASE.glassDark);
  canvas.vLine(x + 1, y + 1, h - 2, BASE.glassDark);
  canvas.vLine(x + w - 2, y + 2, h - 6, BASE.glassLight);
  canvas.rect(x + 1, y + h - 4, w - 2, 3, pal.wallDark);
  canvas.vLine(x + Math.floor(w / 2), y + 1, h - 5, pal.wallLight);
  for (let i = 0; i < 8; i += 1) {
    canvas.px(x + 3 + i, y + h - 6 - i, BASE.glassLight);
  }
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
  const leaf = Math.floor(w / 2);
  canvas.rect(x, y, w, h, BASE.wood);
  // 문도 벽보다 안쪽에 있다 — 왼쪽 위 안이 어둡고 오른쪽 아래가 밝다.
  canvas.hLine(x + 1, y + 1, w - 2, BASE.woodDark);
  canvas.vLine(x + 1, y + 1, h - 2, BASE.woodDark);
  canvas.vLine(x + w - 2, y + 2, h - 3, 0xb07850);
  canvas.outline(x, y, w, h, pal.outline);
  const mid = x + leaf;
  canvas.vLine(mid, y + 1, h - 2, BASE.woodDark);
  for (const gx of [x + 3, mid + 3]) {
    canvas.rect(gx, y + 4, leaf - 6, 9, BASE.glass);
    canvas.hLine(gx, y + 4, leaf - 6, BASE.glassLight);
    canvas.outline(gx - 1, y + 3, leaf - 4, 11, BASE.woodDark);
  }
  canvas.px(mid - 3, y + h - 8, pal.wallLight);
  canvas.px(mid + 3, y + h - 8, pal.wallLight);
}

/**
 * 아치 현관. 둘레는 돌로 두르고 안은 그늘, 아치 머리에 부채꼴 채광창.
 * 문짝은 아치 **밑**에만 — 반원까지 문으로 채우면 둥근 덩어리로 보인다.
 */
export function archDoor(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const r = Math.floor(w / 2);
  const cx = x + r;
  const head = y + r;

  canvas.disc(cx, head, r, pal.outline);
  canvas.rect(x, head, w, h - r, pal.outline);
  canvas.disc(cx, head, r - 1, pal.wallLight);
  canvas.rect(x + 1, head, w - 2, h - r - 1, pal.wallLight);
  canvas.disc(cx, head, r - 3, pal.wallShade);
  canvas.rect(x + 3, head, w - 6, h - r - 3, pal.wallShade);
  canvas.disc(cx, head, r - 4, BASE.glass);
  canvas.ring(cx, head, r - 4, pal.outline);
  canvas.vLine(cx, head - r + 5, r - 5, pal.wallLight);
  canvas.hLine(x + 3, head, w - 6, pal.outline);

  doubleDoor(canvas, pal, x + 3, head + 1, w - 6, h - r - 2);
}

/** 미닫이 헛간문. 레일에 매달려 X 로 버틴다. */
export function barnDoor(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  w: number,
  h: number,
  rail: number,
) {
  canvas.hLine(x - rail, y - 4, w + rail * 2, pal.outline);
  canvas.hLine(x - rail, y - 3, w + rail * 2, pal.wallShade);

  canvas.rect(x, y, w, h, BASE.wood);
  for (let px = x + 5; px < x + w - 1; px += 6) {
    canvas.vLine(px, y + 1, h - 2, BASE.woodDark);
  }
  for (let i = 1; i < w - 1; i += 1) {
    const t = i / (w - 2);
    canvas.rect(x + i, y + 4 + Math.round(t * (h - 10)), 1, 2, BASE.woodDark);
    canvas.rect(x + i, y + h - 6 - Math.round(t * (h - 10)), 1, 2, BASE.woodDark);
  }
  canvas.rect(x + 1, y + 1, w - 2, 2, BASE.woodDark);
  canvas.rect(x + 1, y + h - 3, w - 2, 2, BASE.woodDark);
  canvas.outline(x, y, w, h, pal.outline);
  for (const hx of [x + 3, x + w - 5]) canvas.rect(hx, y - 3, 2, 4, pal.outline);
  canvas.vLine(x + w - 7, y + Math.floor(h / 2) - 3, 7, pal.wallLight);
}

/** 줄무늬 차양. 입구 위에 달면 들어가는 곳이 또렷해진다. */
export function awning(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  w: number,
  h = 6,
) {
  for (let col = 0; col < w; col += 1) {
    canvas.vLine(
      x + col,
      y,
      h,
      Math.floor(col / 4) % 2 === 0 ? pal.accent : pal.wallLight,
    );
  }
  canvas.hLine(x, y, w, pal.wallLight);
  canvas.hLine(x, y + h - 1, w, pal.accentDark);
  canvas.outline(x, y, w, h, pal.outline);
}

/** 원기둥. 주두와 주초만, 홈은 파지 않는다. */
export function column(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  h: number,
  w = 12,
) {
  // 왼쪽부터 어둡게 → 밝게 → 어둡게 가야 원기둥으로 보인다. 한쪽만 밝히면 판이다.
  canvas.rect(x, y, w, h, pal.wallMid);
  canvas.vLine(x + 1, y, h, pal.wallDark);
  canvas.rect(x + 2, y, 3, h, pal.wallLight);
  canvas.rect(x + w - 4, y, 2, h, pal.wallDark);
  canvas.vLine(x + w - 2, y, h, pal.wallShade);
  canvas.vLine(x, y, h, pal.outline);
  canvas.vLine(x + w - 1, y, h, pal.outline);
  for (const cy of [y, y + h - 5]) {
    canvas.rect(x - 2, cy, w + 4, 5, pal.wallMid);
    canvas.hLine(x - 2, cy, w + 4, pal.wallLight);
    canvas.hLine(x - 2, cy + 1, w + 4, pal.wallLight);
    canvas.hLine(x - 2, cy + 3, w + 4, pal.wallDark);
    canvas.outline(x - 2, cy, w + 4, 5, pal.outline);
  }
}

// ── 바닥 ────────────────────────────────────────────────────────────────

/** 단마다 넓어지는 계단. */
export function steps(
  canvas: Canvas,
  pal: Palette,
  cx: number,
  y: number,
  innerW: number,
  treads = 2,
) {
  for (let i = 0; i < treads; i += 1) {
    const w = innerW + i * 10;
    const sx = cx - Math.floor(w / 2);
    canvas.rect(sx, y + i * 3, w, 3, pal.wallShade);
    canvas.hLine(sx, y + i * 3, w, pal.wallLight);
    canvas.hLine(sx, y + i * 3 + 1, w, pal.wallDark);
    canvas.px(sx, y + i * 3 + 2, pal.outline);
    canvas.px(sx + w - 1, y + i * 3 + 2, pal.outline);
  }
  const last = innerW + (treads - 1) * 10;
  canvas.hLine(cx - Math.floor(last / 2), y + treads * 3, last, pal.outline);
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
  // 해가 왼쪽 위에 있으므로 그림자는 오른쪽 아래로 쏠린다. 가운데 정렬로 깔면
  // 건물이 바닥에 도장 찍힌 것처럼 납작해진다.
  canvas.rect(x + 4, y + 3, w - 2, 2, pal.shadow);
  canvas.rect(x + 10, y + 5, w - 8, 1, pal.shadow);
}

// ── 건물당 하나씩만 붙이는 것 ───────────────────────────────────────────

export function shutters(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  for (const sx of [x - 5, x + w + 1]) {
    canvas.rect(sx, y, 4, h, pal.accent);
    canvas.vLine(sx + 1, y, h, pal.wallLight);
    canvas.outline(sx, y, 4, h, pal.outline);
  }
}

export function picketFence(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  w: number,
) {
  for (let px = x; px < x + w; px += 5) {
    canvas.rect(px, y, 3, 9, pal.wallLight);
    canvas.vLine(px + 2, y, 9, pal.wallShade);
    canvas.px(px, y, pal.outline);
    canvas.px(px + 2, y, pal.outline);
  }
  canvas.hLine(x, y + 3, w, pal.wallShade);
}

/** 깃대. 건물 윤곽 밖으로 삐져나와 실루엣을 깬다. */
export function flagPole(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  h: number,
  cloth: number,
  clothDark: number,
) {
  canvas.vLine(x, y, h, pal.outline);
  for (let i = 0; i < 12; i += 1) {
    const wave = Math.round(Math.sin(i / 2.4) * 1.4);
    canvas.vLine(x + 1 + i, y + 2 + wave, 9, i > 8 ? clothDark : cloth);
    canvas.px(x + 1 + i, y + 2 + wave, pal.outline);
    canvas.px(x + 1 + i, y + 10 + wave, pal.outline);
  }
}

/** 옥상 간판 철골. 하늘을 배경으로 뚫려 보여 실루엣이 확 달라진다. */
export function signFrame(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  w: number,
  h: number,
  legs: number,
) {
  for (const lx of [x + 4, x + w - 6]) {
    canvas.rect(lx, y + h, 2, legs, pal.outline);
  }
  canvas.rect(x, y, w, h, pal.accent);
  canvas.hLine(x + 1, y + 1, w - 2, BASE.glassLight);
  canvas.hLine(x + 1, y + h - 2, w - 2, pal.accentDark);
  canvas.outline(x, y, w, h, pal.outline);
}

/** 시계판. */
export function clockFace(
  canvas: Canvas,
  pal: Palette,
  cx: number,
  cy: number,
  r: number,
) {
  canvas.disc(cx, cy, r + 1, pal.wallLight);
  canvas.ring(cx, cy, r + 1, pal.outline);
  canvas.disc(cx, cy, r - 1, 0xfbf6e8);
  canvas.ring(cx, cy, r, pal.accent);
  for (const [dx, dy] of [
    [0, -(r - 2)],
    [0, r - 2],
    [-(r - 2), 0],
    [r - 2, 0],
  ] as const) {
    canvas.px(cx + dx, cy + dy, pal.outline);
  }
  canvas.vLine(cx, cy - r + 3, r - 2, pal.outline);
  canvas.hLine(cx, cy, r - 3, pal.outline);
}

/**
 * ────────────────────────────────────────────────────────────────────────
 * 간판 그림
 *
 * 건물 생김새만으로는 **무슨 건물인지 바로 알 수 없다.** 열주가 도서관이라는
 * 것도 아는 사람만 읽는 신호다. 그래서 건물마다 큼직한 그림을 하나씩 단다.
 * 이게 용도를 말하는 **1차 신호**고 모양·크기·색은 거든다.
 *
 * 바탕과 그림의 **명도를 반대로** 잡을 것 — 검은 학사모를 네이비 간판에 올렸더니
 * 통째로 사라졌다.
 * ────────────────────────────────────────────────────────────────────────
 */

/** 그림을 얹을 간판 바탕. */
export function plaque(
  canvas: Canvas,
  pal: Palette,
  x: number,
  y: number,
  w: number,
  h: number,
  face: number,
  faceDark: number,
) {
  canvas.rect(x, y, w, h, face);
  canvas.hLine(x + 1, y + 1, w - 2, pal.wallLight);
  canvas.hLine(x + 1, y + h - 2, w - 2, faceDark);
  canvas.outline(x, y, w, h, pal.outline);
}

const PAGE = 0xf6f1e2;
const PAGE_SHADE = 0xd4cbb6;
const COVER = 0x9c3f3a;
const COVER_DARK = 0x6e2a27;

/**
 * 도서관 — 펼친 책.
 *
 * 면이 **책등 쪽으로 내려앉아야** 펼친 책으로 읽힌다. 바깥을 낮게 그리면
 * 가운데가 솟아 나비넥타이가 된다.
 */
export function iconBook(
  canvas: Canvas,
  pal: Palette,
  cx: number,
  cy: number,
  r = 12,
) {
  const H = Math.round(r * 0.95);
  const drop = Math.round(r * 0.3);
  const top0 = cy - Math.round(H / 2);

  for (const side of [-1, 1] as const) {
    for (let j = 0; j < r; j += 1) {
      const x = cx + side * (r - j); // j: 0 바깥 → r-1 책등
      const top = top0 + Math.round((j * drop) / (r - 1));
      canvas.vLine(x, top, H, j > r - 4 ? PAGE_SHADE : PAGE);
      canvas.px(x, top, pal.outline);
      canvas.px(x, top + H - 1, pal.outline);
      canvas.px(x, top + H, COVER);
      canvas.px(x, top + H + 1, COVER_DARK);
      canvas.px(x, top + H + 2, pal.outline);
    }
    for (let i = 0; i < 3; i += 1) {
      const sx = side < 0 ? cx - r + 3 : cx + 4;
      canvas.hLine(sx, top0 + 4 + i * Math.round(H / 4), r - 6, 0x9a9180);
    }
  }
  canvas.vLine(cx, top0 + drop, H, COVER_DARK);
}

/** 학교 — 학사모. */
export function iconCap(canvas: Canvas, pal: Palette, cx: number, cy: number) {
  const BOARD = 0x30384a;
  const BOARD_LIGHT = 0x49536a;
  canvas.rect(cx - 6, cy, 13, 9, BOARD);
  canvas.hLine(cx - 5, cy + 8, 11, 0x1e2430);
  canvas.outline(cx - 6, cy, 13, 9, pal.outline);
  for (let dy = -5; dy <= 5; dy += 1) {
    const hw = 13 - Math.abs(dy) * 2;
    if (hw < 0) continue;
    canvas.hLine(cx - hw, cy - 4 + dy, hw * 2 + 1, dy < 0 ? BOARD_LIGHT : BOARD);
    canvas.px(cx - hw, cy - 4 + dy, pal.outline);
    canvas.px(cx + hw, cy - 4 + dy, pal.outline);
  }
  canvas.vLine(cx + 12, cy - 4, 7, 0xe0b24a);
  canvas.rect(cx + 11, cy + 3, 3, 5, 0xe0b24a);
  canvas.outline(cx + 11, cy + 3, 3, 5, pal.outline);
}

/** 신문사 — 접힌 신문. */
export function iconNews(
  canvas: Canvas,
  pal: Palette,
  cx: number,
  cy: number,
  w = 26,
) {
  const INK = 0x554e42;
  const h = Math.round(w * 0.74);
  const x = cx - Math.round(w / 2);
  const y = cy - Math.round(h / 2);
  const photoW = Math.round(w * 0.42);
  canvas.rect(x, y, w, h, PAGE);
  canvas.rect(x + 2, y + 2, w - 4, 4, INK); // 제호
  canvas.rect(x + 2, y + 9, photoW, h - 13, 0x8fa9bd);
  canvas.outline(x + 2, y + 9, photoW, h - 13, INK);
  for (let i = 0; i * 3 < h - 14; i += 1) {
    canvas.hLine(x + photoW + 4, y + 9 + i * 3, w - photoW - 7, INK);
  }
  canvas.outline(x, y, w, h, pal.outline);
}

/** 우체국 — 편지 봉투. */
export function iconEnvelope(
  canvas: Canvas,
  pal: Palette,
  cx: number,
  cy: number,
  w = 26,
) {
  const h = Math.round(w * 0.68);
  const x = cx - Math.round(w / 2);
  const y = cy - Math.round(h / 2);
  canvas.rect(x, y, w, h, PAGE);
  canvas.outline(x, y, w, h, pal.outline);
  for (let i = 0; i <= Math.floor((w - 2) / 2); i += 1) {
    canvas.hLine(x + 1, y + 1 + i, i, PAGE_SHADE);
    canvas.hLine(x + w - 1 - i, y + 1 + i, i, PAGE_SHADE);
    canvas.px(x + 1 + i, y + 1 + i, pal.outline);
    canvas.px(x + w - 2 - i, y + 1 + i, pal.outline);
  }
}

/**
 * 공방 — 엇갈린 망치와 스패너.
 *
 * 머리 둘을 **위쪽 좌우로 갈라** 놓아야 X 로 읽힌다. 자루가 머리를 가로지르면
 * 그냥 엉킨 막대가 된다. 링 구멍은 **간판 바탕색으로 메운다** — 투명으로 뚫으면
 * 벽까지 뚫려서 그 자리에 바깥 풀밭이 비친다.
 */
export function iconTools(
  canvas: Canvas,
  pal: Palette,
  cx: number,
  cy: number,
  bg: number,
) {
  const STEEL = 0x9aa4ae;
  const STEEL_LIGHT = 0xc8d0d8;
  const STEEL_DARK = 0x5a636c;
  const HANDLE = 0xcf9a5e;
  const HANDLE_DARK = 0x8c6336;

  // 망치 — 머리는 왼쪽 위, 자루는 머리 바로 밑에서 오른쪽 아래로
  for (let i = 0; i < 14; i += 1) {
    canvas.rect(cx - 6 + i, cy - 5 + i, 3, 3, HANDLE);
    canvas.px(cx - 6 + i, cy - 3 + i, HANDLE_DARK);
  }
  canvas.rect(cx - 13, cy - 12, 11, 8, STEEL);
  canvas.hLine(cx - 12, cy - 11, 9, STEEL_LIGHT);
  canvas.hLine(cx - 12, cy - 6, 9, STEEL_DARK);
  canvas.outline(cx - 13, cy - 12, 11, 8, pal.outline);

  // 스패너 — 머리는 오른쪽 위, 자루는 링 바로 밑에서 왼쪽 아래로
  for (let i = 0; i < 14; i += 1) {
    canvas.rect(cx + 4 - i, cy - 2 + i, 3, 3, STEEL);
    canvas.px(cx + 4 - i, cy + i, STEEL_DARK);
  }
  canvas.disc(cx + 7, cy - 7, 6, STEEL);
  canvas.disc(cx + 6, cy - 8, 4, STEEL_LIGHT);
  canvas.ring(cx + 7, cy - 7, 6, pal.outline);
  canvas.disc(cx + 7, cy - 7, 3, bg);
  canvas.ring(cx + 7, cy - 7, 3, STEEL_DARK);
}

/** 회사 — 서류가방. */
export function iconCase(canvas: Canvas, pal: Palette, cx: number, cy: number) {
  const LEATHER = 0x8c5a38;
  const x = cx - 12;
  const y = cy - 6;
  canvas.rect(cx - 4, y - 5, 9, 5, null);
  canvas.outline(cx - 4, y - 5, 9, 5, pal.outline);
  canvas.rect(x, y, 25, 16, LEATHER);
  canvas.hLine(x + 1, y + 1, 23, 0xb07850);
  canvas.rect(x + 1, y + 13, 23, 2, 0x6b4126);
  canvas.rect(x + 9, y + 6, 8, 4, 0xe0b24a);
  canvas.outline(x + 9, y + 6, 8, 4, pal.outline);
  canvas.outline(x, y, 25, 16, pal.outline);
}
