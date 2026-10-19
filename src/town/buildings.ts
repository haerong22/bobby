import type { Material } from "./tiles";

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
  /** 외벽 재질. 타일 묶음은 tiles.ts 의 MATERIALS 가 들고 있다. */
  material: Material;
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
    x: 20,
    y: 2,
    w: 12,
    h: 8,
    doorOffset: 6,
    material: "tan",
  },
  {
    id: "office",
    label: "회사",
    route: "/resume",
    x: 49,
    y: 2,
    w: 12,
    h: 8,
    doorOffset: 6,
    material: "gray",
  },
  {
    id: "home",
    label: "집",
    route: "/about",
    x: 3,
    y: 17,
    w: 6,
    h: 6,
    doorOffset: 3,
    material: "red",
  },
  {
    id: "workshop",
    label: "공방",
    route: "/projects",
    x: 3,
    y: 31,
    w: 7,
    h: 6,
    doorOffset: 3,
    material: "red",
  },
  {
    id: "press",
    label: "신문사",
    route: "/news",
    x: 20,
    y: 17,
    w: 7,
    h: 5,
    doorOffset: 3,
    material: "gray",
  },
  {
    id: "library",
    label: "도서관",
    route: "/skills",
    x: 33,
    y: 17,
    w: 6,
    h: 5,
    doorOffset: 3,
    material: "tan",
  },
  {
    id: "post",
    label: "우체국",
    route: "/contact",
    x: 50,
    y: 17,
    w: 6,
    h: 5,
    doorOffset: 3,
    material: "red",
  },
] as const;

export function buildingById(id: BuildingId): Building {
  const found = BUILDINGS.find((building) => building.id === id);
  if (!found) throw new Error(`알 수 없는 건물 id: ${id}`);
  return found;
}

/** 출입문이 놓인 타일 좌표. 상호작용 판정과 맵 생성이 같은 식을 써야 한다. */
export function doorTile(building: Building) {
  return { x: building.x + building.doorOffset, y: building.y + building.h - 1 };
}
