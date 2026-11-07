export interface NpcData {
  id: string;
  name: string;
  /** 스프라이트시트 키. gen-npc-sprites.mts 가 만든 파일 이름과 같다. */
  texture: string;
  /**
   * 순찰 구간 (타일 좌표). from 과 to 가 같으면 제자리에 선다.
   * **실제로 발을 딛는 칸**이다 — 스프라이트는 그보다 위로 솟는다.
   */
  from: { x: number; y: number };
  to: { x: number; y: number };
  /** 말을 걸면 순서대로 보여 준다. */
  lines: string[];
}

/**
 * 마을 주민.
 *
 * 배치할 때 지켜야 할 것 두 가지:
 * - **출입문 앞을 비켜야 한다.** 문과 주민이 겹치면 상호작용 대상이 헷갈린다
 *   (지금은 문이 우선이라 주민에게 말을 걸 수 없게 된다).
 * - **가로수 줄을 피해야 한다.** 가로수는 도로에 접한 보도 줄에 네 칸 간격으로
 *   서 있어서, 순찰 경로가 그 줄을 지나면 나무에 막힌다.
 *
 * 대사는 길 안내를 겸한다. 마을이 넓어 어디에 뭐가 있는지 모르면 헤매게 된다.
 *
 * 스프라이트는 플레이어 시트의 머리·셔츠 색만 바꾼 것이다 (`npm run gen:npc`).
 * 주민을 늘리려면 `gen-npc-sprites.mts` 에 색 조합을 먼저 추가할 것.
 */
export const NPCS: readonly NpcData[] = [
  {
    id: "minsu",
    name: "민수",
    texture: "npc-a",
    from: { x: 26, y: 15 },
    to: { x: 33, y: 15 },
    lines: [
      "안녕하세요. 이 마을 처음이신가요?",
      "신문사에 들르면 요즘 기술 소식을 읽을 수 있어요.",
      "회사는 이 길로 쭉 동쪽입니다.",
    ],
  },
  {
    id: "jiyeon",
    name: "지연",
    texture: "npc-b",
    from: { x: 29, y: 24 },
    to: { x: 35, y: 24 },
    lines: [
      "광장 분수는 마을 한가운데예요. 길 잃으면 여기로 오세요.",
      "서쪽으로 가면 도서관, 그 옆이 공방이에요.",
    ],
  },
  {
    id: "jungwoo",
    name: "정우",
    texture: "npc-c",
    from: { x: 10, y: 26 },
    to: { x: 10, y: 26 },
    lines: [
      "이 흙길을 따라가면 남쪽 들판이 나와요.",
      "도서관은 바로 저기, 기둥 네 개 세운 집입니다.",
    ],
  },
  {
    id: "sujin",
    name: "수진",
    texture: "npc-d",
    from: { x: 40, y: 16 },
    to: { x: 45, y: 16 },
    lines: [
      "출퇴근길이에요. 저 유리 건물이 회사입니다.",
      "우체국은 골목 건너 동쪽 끝이에요.",
    ],
  },
  {
    id: "taeho",
    name: "태호",
    texture: "npc-e",
    from: { x: 52, y: 30 },
    to: { x: 52, y: 35 },
    lines: [
      "동쪽 공원이 제일 조용해요. 벤치도 있고요.",
      "이 길은 들판을 돌아 마을로 다시 이어집니다.",
    ],
  },
  {
    id: "eunyoung",
    name: "은영",
    texture: "npc-f",
    from: { x: 20, y: 34 },
    to: { x: 26, y: 34 },
    lines: [
      "여기 텃밭은 마을 사람들이 같이 가꿔요.",
      "공방 주인이 연장을 빌려주거든요. 서쪽 끝에 있어요.",
    ],
  },
];

export const NPC_TEXTURES = [...new Set(NPCS.map((npc) => npc.texture))];
