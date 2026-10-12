export type BuildingId =
  | "home"
  | "office"
  | "school"
  | "press"
  | "workshop"
  | "library"
  | "post";

export interface Building {
  id: BuildingId;
  /** 건물 간판에 띄울 이름 */
  label: string;
  /** 정적 폴백 페이지 경로. 게임 모달과 같은 콘텐츠를 보여준다. */
  route: string;
  /** 좌상단 타일 좌표 */
  x: number;
  y: number;
  /** 타일 단위 크기 */
  w: number;
  h: number;
  /** 출입구의 건물 내 가로 오프셋 (타일). Phase 3 의 상호작용 존이 여기 붙는다. */
  doorOffset: number;
  color: number;
}

/**
 * 도시 테마 배치. 간선도로(ROADS)가 맵을 네 블록으로 가르고
 * 각 블록에 건물이 들어간다. Phase 2 에서 Tiled 오브젝트 레이어로 옮긴다.
 */
export const BUILDINGS: readonly Building[] = [
  {
    id: "school",
    label: "학교",
    route: "/education",
    x: 2,
    y: 2,
    w: 12,
    h: 8,
    doorOffset: 6,
    color: 0x4a6fa5,
  },
  {
    id: "office",
    label: "회사",
    route: "/resume",
    x: 24,
    y: 2,
    w: 12,
    h: 8,
    doorOffset: 6,
    color: 0x5b5f97,
  },
  {
    id: "home",
    label: "집",
    route: "/about",
    x: 2,
    y: 17,
    w: 6,
    h: 6,
    doorOffset: 3,
    color: 0x8c5a4a,
  },
  {
    id: "workshop",
    label: "공방",
    route: "/projects",
    x: 10,
    y: 17,
    w: 7,
    h: 6,
    doorOffset: 3,
    color: 0x7a6246,
  },
  {
    id: "press",
    label: "신문사",
    route: "/news",
    x: 23,
    y: 17,
    w: 7,
    h: 5,
    doorOffset: 3,
    color: 0x4f7a6a,
  },
  {
    id: "library",
    label: "도서관",
    route: "/skills",
    x: 32,
    y: 17,
    w: 6,
    h: 5,
    doorOffset: 3,
    color: 0x6b5080,
  },
  {
    id: "post",
    label: "우체국",
    route: "/contact",
    x: 27,
    y: 24,
    w: 6,
    h: 5,
    doorOffset: 3,
    color: 0xa05c5c,
  },
] as const;
