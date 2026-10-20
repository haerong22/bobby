import { cacheLife } from "next/cache";

import type { NewsItem } from "@/types/content";

/**
 * 신문사에서 보여줄 외부 기술 뉴스.
 *
 * 서버에서 가져오므로 CORS 도 API 키 노출도 없다. 30 분 캐시.
 * 외부 피드는 언젠가 반드시 죽으므로, 실패를 빈 배열이 아니라 플레이버 메시지로
 * 돌려준다 — 화면이 조용히 비어 있는 것보다 낫다.
 *
 * `export const revalidate` 를 쓰지 않는다. next.config 의 cacheComponents 가
 * 켜져 있어 세그먼트 설정과 충돌하고, 캐싱은 "use cache" + cacheLife 로 표현한다.
 */

const HN_ENDPOINT =
  "https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=12";

interface HnHit {
  objectID: string;
  title: string | null;
  url: string | null;
  points: number | null;
  created_at: string;
}

function toItem(hit: HnHit): NewsItem | null {
  if (!hit.title) return null;
  return {
    title: hit.title,
    // 외부 링크가 없는 글(Ask HN 등)은 HN 토론 페이지로 보낸다.
    url: hit.url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`,
    source: "Hacker News",
    points: hit.points,
    publishedAt: hit.created_at,
  };
}

async function loadNews(): Promise<{ items: NewsItem[]; error: string | null }> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 1800, expire: 3600 });

  try {
    const response = await fetch(HN_ENDPOINT, {
      headers: { accept: "application/json" },
    });
    if (!response.ok) throw new Error(`HN ${response.status}`);

    const data = (await response.json()) as { hits?: HnHit[] };
    const items = (data.hits ?? [])
      .map(toItem)
      .filter((item): item is NewsItem => item !== null);

    return { items, error: null };
  } catch {
    return { items: [], error: "오늘은 신문이 배달되지 않았습니다." };
  }
}

export async function GET() {
  // 실패해도 200 으로 돌려준다. 화면은 에러 문구를 그릴 뿐 깨지지 않는다.
  return Response.json(await loadNews());
}
