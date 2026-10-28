export interface NpcData {
  id: string;
  name: string;
  /** 스프라이트시트 키. gen-npc-sprites.mts 가 만든 파일 이름과 같다. */
  texture: string;
  /** 순찰 구간 (타일 좌표). from 과 to 가 같으면 제자리에 선다. */
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
 */
export const NPCS: readonly NpcData[] = [
  {
    id: "minsu",
    name: "민수",
    texture: "npc-a",
    from: { x: 22, y: 24 },
    to: { x: 30, y: 24 },
    lines: [
      "안녕하세요. 이 마을 처음이신가요?",
      "신문사에 들르면 요즘 기술 소식을 읽을 수 있어요.",
      "회사는 길 건너 북쪽에 있습니다.",
    ],
  },
  {
    id: "jiyeon",
    name: "지연",
    texture: "npc-b",
    // 스폰 지점(6, 25)을 지나지 않게 x=8 부터 시작한다. 겹치면 시작하자마자
    // 주민이 플레이어를 밀고 지나간다.
    from: { x: 8, y: 25 },
    to: { x: 12, y: 25 },
    lines: [
      "저 빨간 지붕이 이 마을 주인 집이에요.",
      "옆 공방에 가면 그동안 만든 것들을 볼 수 있어요.",
    ],
  },
  {
    id: "jungwoo",
    name: "정우",
    texture: "npc-c",
    from: { x: 52, y: 24 },
    to: { x: 52, y: 24 },
    lines: [
      "우체국에서 연락처를 받아 가세요.",
      "마을을 전부 둘러보면 뭔가 좋은 일이 있을지도 모르죠.",
    ],
  },
];

export const NPC_TEXTURES = [...new Set(NPCS.map((npc) => npc.texture))];
