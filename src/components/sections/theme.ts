import type { CSSProperties } from "react";

import type { BuildingId } from "@/town/buildings";

/**
 * 건물마다 다른 "종이".
 *
 * 모달은 테마를 입힌 카드가 아니라 **그 건물이 건네주는 문서**다 — 도서관은
 * 도서 카드를, 우체국은 항공우편 봉투를, 신문사는 1면을 건넨다. 그래서 색과
 * 글꼴을 건물별로 가른다.
 *
 * **게임 모달과 정적 페이지가 같은 값을 읽는다.** 한쪽만 꾸미면 같은 내용이
 * 두 얼굴을 갖게 된다.
 *
 * 값은 CSS 변수로 내려보내므로 서버 컴포넌트에서도 쓸 수 있다 — 섹션 렌더러에
 * `"use client"` 를 붙이지 않는다는 규칙을 깨지 않는다.
 */
export interface SectionTheme {
  /** 바탕 종이 */
  paper: string;
  /** 종이 가장자리 (모달 테두리) */
  edge: string;
  /** 본문 글자 */
  ink: string;
  /** 보조 글자 — 날짜 · 출처처럼 한 단계 물러나는 것 */
  muted: string;
  /** 괘선 */
  rule: string;
  /** 그 문서를 그 문서이게 하는 색 */
  accent: string;
  /** accent 위에 올리는 글자색 */
  onAccent: string;
  /** 문서체인가. 도서관·신문사·학교·집은 세리프가 맞는다. */
  serif: boolean;
}

export const SECTION_THEMES: Record<BuildingId, SectionTheme> = {
  // 손으로 쓴 소개 — 따뜻한 편지지
  home: {
    paper: "#f4ecdd",
    edge: "#d9c9ad",
    ink: "#41352b",
    muted: "#8b7a66",
    rule: "#ddd0b8",
    accent: "#4e8c82",
    onAccent: "#f4ecdd",
    serif: true,
  },
  // 사내 이력 문서 — 차가운 슬레이트
  office: {
    paper: "#e9eef4",
    edge: "#c3cedb",
    ink: "#28313e",
    muted: "#6b7889",
    rule: "#ccd6e1",
    accent: "#3e6e9e",
    onAccent: "#eaf1f8",
    serif: false,
  },
  // 성적표 — 괘선 노트
  school: {
    paper: "#f8f5ec",
    edge: "#ddd5c0",
    ink: "#35312a",
    muted: "#8a8273",
    rule: "#e0d8c4",
    accent: "#a8781f",
    onAccent: "#f8f5ec",
    serif: true,
  },
  // 1면 — 신문지
  press: {
    paper: "#eee9dd",
    edge: "#cbc3b2",
    ink: "#25221e",
    muted: "#7a7367",
    rule: "#cfc7b6",
    accent: "#b8402f",
    onAccent: "#eee9dd",
    serif: true,
  },
  // 작업 노트 — 크라프트
  workshop: {
    paper: "#e8d9bd",
    edge: "#c4ad87",
    ink: "#3c2e20",
    muted: "#7f6a50",
    rule: "#cdb995",
    accent: "#9c5a2e",
    onAccent: "#f0e5d0",
    serif: false,
  },
  // 도서 카드 — 색인 카드
  library: {
    paper: "#f2ecdd",
    edge: "#d5cbb2",
    ink: "#2e2a22",
    muted: "#857d6b",
    rule: "#ddd4bd",
    accent: "#37604e",
    onAccent: "#f2ecdd",
    serif: true,
  },
  // 항공우편 봉투
  post: {
    paper: "#f6f1e5",
    edge: "#d2cab7",
    ink: "#2c3240",
    muted: "#77808f",
    rule: "#ded6c4",
    accent: "#2f5aa0",
    onAccent: "#f6f1e5",
    serif: false,
  },
};

/** 테마를 CSS 변수로 내려보낸다. */
export function themeVars(theme: SectionTheme): CSSProperties {
  return {
    "--paper": theme.paper,
    "--edge": theme.edge,
    "--ink": theme.ink,
    "--muted": theme.muted,
    "--rule": theme.rule,
    "--accent": theme.accent,
    "--on-accent": theme.onAccent,
  } as CSSProperties;
}
