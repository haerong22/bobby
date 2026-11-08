/**
 * 도서관 책의 물성.
 *
 * `Document`(표지·책배)와 `Book`(넘어가는 종이)이 **같은 값을 써야** 넘기는
 * 종이가 밑에 깔린 면과 같은 종이로 보인다. 한쪽만 고치면 넘기는 순간 색이
 * 튀어서 종이가 아니라 덮개가 지나가는 것처럼 보인다.
 *
 * 서버 컴포넌트(`Document`)와 클라이언트 컴포넌트(`Book`)가 같이 읽으므로
 * **React 컴포넌트가 없는 모듈**로 떼어 뒀다 — 안 그러면 클라이언트 번들에
 * 문서 틀이 통째로 끌려 들어간다.
 */

/** 종이에 지는 그늘. */
const dim = (percent: number) =>
  `color-mix(in srgb, var(--ink) ${percent}%, var(--paper))`;

/**
 * 면 바탕은 **`globals.css` 에 있다** (`.book-pages` · `.book-half`).
 * 넓은 화면은 펼침면, 좁은 화면은 한 면이라 미디어 쿼리가 필요한데
 * 인라인 `style` 에는 걸 수 없다.
 */

/**
 * 쌓인 종이의 잘린 면. 바깥쪽(책상에 닿는 아래 장)이 가장 어둡다.
 * 낱장을 나누는 가로 실선은 `globals.css` 의 `.book-edge` 가 겹쳐 깐다.
 */
export const FORE_LEFT = `linear-gradient(to right, ${dim(48)}, ${dim(24)} 45%, ${dim(8)})`;
export const FORE_RIGHT = `linear-gradient(to left, ${dim(48)}, ${dim(24)} 45%, ${dim(8)})`;

/** 면 아래로 비어져 나오는 묶음. 아래로 갈수록 어둡다. */
export const STACK_NEAR = `linear-gradient(to bottom, ${dim(22)}, ${dim(40)})`;
export const STACK_FAR = `linear-gradient(to bottom, ${dim(40)}, ${dim(58)})`;

/** 천으로 싼 표지. 종이보다 **훨씬** 어두워야 책으로 보인다. */
export const COVER = "#2c4639";
/**
 * 표지에 눌러 찍은 테와 책이 바닥에 떨구는 그림자.
 *
 * **그림자는 한 겹으로 만들지 않는다.** 가까이 짙게 한 겹, 멀리 옅게 한 겹을
 * 겹쳐야 빛이 떨어지는 모양이 나온다. 색도 순검정이 아니라 종이·천 쪽으로
 * 따뜻하게 기울인다.
 */
export const COVER_LINE = [
  "inset 0 0 0 1px rgb(255 255 255 / 0.1)",
  "inset 0 0 0 2px rgb(0 0 0 / 0.22)",
  "0 2px 6px rgb(32 24 14 / 0.2)",
  "0 14px 34px -10px rgb(32 24 14 / 0.34)",
].join(", ");
/** 표지에 박은 글씨. 종이 위 글자색을 쓰면 천 위에서 읽히지 않는다. */
export const COVER_INK = "#e7e1d1";
export const COVER_MUTED = "rgb(231 225 209 / 0.6)";
export const COVER_RULE = "rgb(231 225 209 / 0.3)";
/** 책갈피 리본 */
export const RIBBON = "#9c3b31";

/**
 * 넘김에 걸리는 시간. `globals.css` 의 `--leaf-ms` 와 같아야 한다.
 * 종이는 손가락보다 느리다 — 0.9 초쯤이 넘기는 동작으로 읽히는 하한이고
 * 그보다 짧으면 깜빡임으로 보인다.
 */
export const LEAF_MS = 820;

/**
 * 면 안쪽 여백.
 *
 * **면 전체가 아니라 머리글·본문·쪽수가 각자 가진다.** 면 바깥에 여백을 주면
 * 넘어가는 종이가 자기 폭을 기준으로 다시 까는 바탕과 기준 폭이 달라져
 * 밑면에 사각형 자국이 남는다.
 */
export const BOOK_INSET = "px-5 sm:px-9";
