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
  /** 건물 스프라이트 키. public/town/buildings/<id>.png 와 같다. */
  sprite: string;
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
    x: 19,
    y: 5,
    w: 9,
    h: 6,
    doorOffset: 4,
    sprite: "school",
  },
  {
    id: "office",
    label: "회사",
    route: "/resume",
    x: 31,
    y: 1,
    w: 5,
    h: 10,
    doorOffset: 2,
    sprite: "office",
  },
  {
    id: "home",
    label: "집",
    route: "/about",
    x: 5,
    y: 7,
    w: 4,
    h: 4,
    doorOffset: 2,
    sprite: "home",
  },
  {
    id: "workshop",
    label: "공방",
    route: "/projects",
    x: 5,
    y: 22,
    w: 5,
    h: 4,
    doorOffset: 3,
    sprite: "workshop",
  },
  {
    id: "press",
    label: "신문사",
    route: "/news",
    x: 51,
    y: 5,
    w: 6,
    h: 6,
    doorOffset: 3,
    sprite: "press",
  },
  {
    id: "library",
    label: "도서관",
    route: "/skills",
    x: 19,
    y: 20,
    w: 7,
    h: 6,
    doorOffset: 3,
    sprite: "library",
  },
  {
    id: "post",
    label: "우체국",
    route: "/contact",
    x: 31,
    y: 21,
    w: 5,
    h: 5,
    doorOffset: 2,
    sprite: "post",
  },
] as const;

/** Phaser 텍스처 키. 파일 이름과 분리해 두면 나중에 한쪽만 바꿔도 된다. */
export const buildingTexture = (building: Building) =>
  `building-${building.sprite}`;

export function buildingById(id: BuildingId): Building {
  const found = BUILDINGS.find((building) => building.id === id);
  if (!found) throw new Error(`알 수 없는 건물 id: ${id}`);
  return found;
}

/** 출입문이 놓인 타일 좌표. 상호작용 판정과 맵 생성이 같은 식을 써야 한다. */
export function doorTile(building: Building) {
  return { x: building.x + building.doorOffset, y: building.y + building.h - 1 };
}
