import { cacheLife } from "next/cache";

import type { NewsComment, NewsStory } from "@/types/content";

/**
 * 신문 안쪽 면을 가져온다.
 *
 * **API 라우트와 정적 페이지가 같이 쓴다.** 페이지에서 자기 API 를 fetch 하면
 * 서버가 자기 자신을 한 번 더 타는 꼴이라, 로더를 떼어 두고 양쪽이 함수를
 * 부른다.
 *
 * 싣는 것은 HN 이 공개 API 로 내주는 **자기 데이터**뿐이다 — 점수 · 작성자 ·
 * 토론. 기사 본문은 남의 글이라 긁어 오지 않고 원문 링크로 넘긴다.
 *
 * `export const revalidate` 를 쓰지 않는다. next.config 의 cacheComponents 가
 * 켜져 있어 세그먼트 설정과 충돌하고, 캐싱은 "use cache" + cacheLife 로 표현한다.
 */

const ITEM_ENDPOINT = (id: string) => `https://hn.algolia.com/api/v1/items/${id}`;

/** 상위 몇 개만. 통째로 옮기면 재배포에 가까워지고 읽히지도 않는다. */
const MAX_COMMENTS = 8;
/** 한 줄의 길이. 넘으면 잘라 두고 토론 링크로 넘긴다. */
const MAX_LENGTH = 440;

interface HnNode {
  id: number;
  type: string;
  author: string | null;
  title: string | null;
  url: string | null;
  text: string | null;
  points: number | null;
  created_at: string;
  children?: HnNode[];
}

/**
 * HN 댓글은 **HTML 문자열**이다. 그대로 그리면 XSS 이므로 태그를 걷고 글자만
 * 남긴다. `&amp;` 는 맨 나중에 푼다 — 먼저 풀면 `&amp;lt;` 가 `<` 로 되살아난다.
 */
function toText(html: string): string {
  const broken = html
    .replace(/<\s*p\s*>/gi, "\n\n")
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "");

  const decoded = broken
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");

  const trimmed = decoded.replace(/\n{3,}/g, "\n\n").trim();
  return trimmed.length > MAX_LENGTH
    ? `${trimmed.slice(0, MAX_LENGTH).trimEnd()}…`
    : trimmed;
}

/** 달린 반응을 전부 센다. 싣는 것은 상위 몇 개뿐이라 수는 따로 세야 한다. */
function countReplies(node: HnNode): number {
  const children = node.children ?? [];
  return children.reduce((sum, child) => sum + 1 + countReplies(child), 0);
}

function toComment(node: HnNode): NewsComment | null {
  // 지워진 댓글은 author 와 text 가 비어서 온다.
  if (!node.author || !node.text) return null;
  const text = toText(node.text);
  if (!text) return null;
  return {
    id: String(node.id),
    author: node.author,
    text,
    publishedAt: node.created_at,
  };
}

export async function loadStory(
  id: string,
): Promise<{ story: NewsStory | null; error: string | null }> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 1800, expire: 3600 });

  // 주소에 그대로 끼워 넣으므로 숫자만 통과시킨다.
  if (!/^\d{1,12}$/.test(id)) {
    return { story: null, error: "그런 기사는 없습니다." };
  }

  try {
    const response = await fetch(ITEM_ENDPOINT(id), {
      headers: { accept: "application/json" },
    });
    if (!response.ok) throw new Error(`HN ${response.status}`);

    const node = (await response.json()) as HnNode;
    if (!node.title) throw new Error("기사가 아님");

    const comments = (node.children ?? [])
      .map(toComment)
      .filter((comment): comment is NewsComment => comment !== null)
      .slice(0, MAX_COMMENTS);

    return {
      story: {
        id: String(node.id),
        title: node.title,
        url: node.url,
        author: node.author,
        points: node.points,
        publishedAt: node.created_at,
        discussion: `https://news.ycombinator.com/item?id=${node.id}`,
        comments,
        commentCount: countReplies(node),
      },
      error: null,
    };
  } catch {
    // 외부 피드는 언젠가 반드시 죽는다. 화면이 조용히 비는 것보다 낫다.
    return { story: null, error: "기사를 가져오지 못했습니다." };
  }
}
