import { cacheLife } from "next/cache";

import type { NewsComment, NewsItem, NewsStory } from "@/types/content";

/**
 * 신문사가 물어오는 바깥 소식. 출처는 둘이다.
 *
 * | 출처 | 받는 법 | 안쪽 면에 싣는 것 |
 * | --- | --- | --- |
 * | Hacker News | Algolia 공개 API (JSON) | 점수 · 작성자 · 독자 반응 |
 * | GeekNews | Atom 피드 | 투고자가 쓴 요약 |
 *
 * **기사 본문은 어느 쪽도 긁어 오지 않는다.** 남의 글이라 전재하면 저작권
 * 문제고, 사이트마다 봇 차단·구조가 제각각이라 깨진다. 각 사이트가 스스로
 * 내주는 것만 싣고 본문은 링크로 넘긴다.
 *
 * **API 라우트와 정적 페이지가 같이 쓴다.** 페이지에서 자기 API 를 fetch 하면
 * 서버가 자기 자신을 한 번 더 타는 꼴이라, 로더를 떼어 두고 양쪽이 함수를 부른다.
 *
 * `export const revalidate` 를 쓰지 않는다. next.config 의 cacheComponents 가
 * 켜져 있어 세그먼트 설정과 충돌하고, 캐싱은 "use cache" + cacheLife 로 표현한다.
 */

const HN_SEARCH =
  "https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=8";
const HN_ITEM = (key: string) => `https://hn.algolia.com/api/v1/items/${key}`;
const HN_THREAD = (key: string) =>
  `https://news.ycombinator.com/item?id=${key}`;

/** 302 로 feedburner 를 가리킨다. fetch 가 따라가므로 이 주소를 쓴다. */
const GN_FEED = "https://news.hada.io/rss/news";
const GN_TOPIC = (key: string) => `https://news.hada.io/topic?id=${key}`;

/** 출처당 가져올 수. 1면은 머리기사 하나 + 두 단이라 이 정도면 찬다. */
const PER_SOURCE = 8;
/** 독자 반응은 상위 몇 개만. 통째로 옮기면 재배포에 가깝고 읽히지도 않는다. */
const MAX_COMMENTS = 8;
/** 한 덩이의 길이. 넘으면 잘라 두고 링크로 넘긴다. */
const MAX_LENGTH = 440;
const MAX_SUMMARY = 900;

/**
 * **출처마다 번호 체계가 다르다.** 접두사를 붙여야 `/news/[id]` 하나로 둘 다
 * 받을 수 있다. 접두사가 없으면 37159 가 HN 글인지 GeekNews 글인지 알 길이 없다.
 */
const ID = { hn: "hn", gn: "gn" } as const;
type Source = keyof typeof ID;

function parseId(id: string): { source: Source; key: string } | null {
  const matched = /^(hn|gn)-(\d{1,12})$/.exec(id);
  return matched
    ? { source: matched[1] as Source, key: matched[2]! }
    : null;
}

/**
 * 받아 온 글자를 그릴 수 있는 상태로 만든다.
 *
 * HN 댓글도 GeekNews 요약도 **HTML 문자열**이다. 그대로 그리면 XSS 이므로
 * 태그를 걷고 글자만 남긴다. `&amp;` 는 **맨 나중에** 푼다 — 먼저 풀면
 * `&amp;lt;` 가 `<` 로 되살아난다.
 */
function toText(raw: string, max: number): string {
  const broken = raw
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/<\s*\/\s*(p|div|li|ul|ol)\s*>/gi, "\n")
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "");

  const decoded = broken
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");

  const trimmed = decoded.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return trimmed.length > max
    ? `${trimmed.slice(0, max).trimEnd()}…`
    : trimmed;
}

/* ── Hacker News ──────────────────────────────────────────────────────── */

interface HnHit {
  objectID: string;
  title: string | null;
  url: string | null;
  points: number | null;
  created_at: string;
}

interface HnNode {
  id: number;
  author: string | null;
  title: string | null;
  url: string | null;
  text: string | null;
  points: number | null;
  created_at: string;
  children?: HnNode[];
}

async function loadHackerNews(): Promise<NewsItem[]> {
  try {
    const response = await fetch(HN_SEARCH, {
      headers: { accept: "application/json" },
    });
    if (!response.ok) throw new Error(`HN ${response.status}`);
    const data = (await response.json()) as { hits?: HnHit[] };

    return (data.hits ?? []).flatMap((hit) =>
      hit.title
        ? [
            {
              id: `${ID.hn}-${hit.objectID}`,
              title: hit.title,
              // 바깥 글이 없는 것(Ask HN 등)은 토론 페이지로 보낸다.
              url: hit.url ?? HN_THREAD(hit.objectID),
              source: "Hacker News",
              points: hit.points,
              publishedAt: hit.created_at,
            },
          ]
        : [],
    );
  } catch {
    return [];
  }
}

/** 달린 반응을 전부 센다. 싣는 것은 상위 몇 개뿐이라 수는 따로 세야 한다. */
function countReplies(node: HnNode): number {
  return (node.children ?? []).reduce(
    (sum, child) => sum + 1 + countReplies(child),
    0,
  );
}

function toComment(node: HnNode): NewsComment | null {
  // 지워진 댓글은 author 와 text 가 비어서 온다.
  if (!node.author || !node.text) return null;
  const text = toText(node.text, MAX_LENGTH);
  return text
    ? {
        id: String(node.id),
        author: node.author,
        text,
        publishedAt: node.created_at,
      }
    : null;
}

async function loadHackerNewsStory(key: string): Promise<NewsStory | null> {
  const response = await fetch(HN_ITEM(key), {
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error(`HN ${response.status}`);

  const node = (await response.json()) as HnNode;
  if (!node.title) return null;

  return {
    id: `${ID.hn}-${node.id}`,
    source: "Hacker News",
    title: node.title,
    url: node.url,
    author: node.author,
    points: node.points,
    publishedAt: node.created_at,
    discussion: HN_THREAD(String(node.id)),
    summary: null,
    comments: (node.children ?? [])
      .map(toComment)
      .filter((comment): comment is NewsComment => comment !== null)
      .slice(0, MAX_COMMENTS),
    commentCount: countReplies(node),
  };
}

/* ── GeekNews ─────────────────────────────────────────────────────────── */

/**
 * Atom 피드를 정규식으로 읽는다.
 *
 * 의존성을 하나 더 들이는 대신 **아는 피드 하나만** 읽는 쪽을 골랐다. 대신
 * 모양이 바뀌면 조용히 빈 배열이 되므로, 호출하는 쪽이 한 출처가 비어도
 * 나머지로 1면을 채우게 해 둔다.
 */
interface GnEntry {
  key: string;
  title: string;
  author: string | null;
  publishedAt: string;
  summary: string;
}

const pick = (block: string, tag: string) =>
  new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(block)?.[1] ?? null;

function parseAtom(xml: string): GnEntry[] {
  const blocks = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];

  return blocks.flatMap((block) => {
    const id = pick(block, "id");
    const key = id && /[?&]id=(\d+)/.exec(id)?.[1];
    const title = pick(block, "title");
    if (!key || !title) return [];

    const author = pick(block, "author");
    return [
      {
        key,
        title: toText(title, 300),
        author: author ? toText(pick(author, "name") ?? "", 60) || null : null,
        publishedAt: pick(block, "published") ?? pick(block, "updated") ?? "",
        summary: toText(pick(block, "content") ?? "", MAX_SUMMARY),
      },
    ];
  });
}

async function fetchGeekNews(): Promise<GnEntry[]> {
  const response = await fetch(GN_FEED, { headers: { accept: "application/atom+xml" } });
  if (!response.ok) throw new Error(`GeekNews ${response.status}`);
  return parseAtom(await response.text());
}

async function loadGeekNews(): Promise<NewsItem[]> {
  try {
    return (await fetchGeekNews()).slice(0, PER_SOURCE).map((entry) => ({
      id: `${ID.gn}-${entry.key}`,
      title: entry.title,
      // 피드가 바깥 원문 주소를 주지 않는다. 토픽 페이지가 그 역할을 한다.
      url: GN_TOPIC(entry.key),
      source: "GeekNews",
      points: null,
      publishedAt: entry.publishedAt,
    }));
  } catch {
    return [];
  }
}

async function loadGeekNewsStory(key: string): Promise<NewsStory | null> {
  const entry = (await fetchGeekNews()).find((item) => item.key === key);
  // 피드에는 최근 것만 들어 있다. 밀려난 글은 여기서 끝난다.
  if (!entry) return null;

  return {
    id: `${ID.gn}-${entry.key}`,
    source: "GeekNews",
    title: entry.title,
    url: GN_TOPIC(entry.key),
    author: entry.author,
    points: null,
    publishedAt: entry.publishedAt,
    discussion: GN_TOPIC(entry.key),
    summary: entry.summary || null,
    comments: [],
    commentCount: 0,
  };
}

/* ── 1면 ──────────────────────────────────────────────────────────────── */

/**
 * 두 출처를 번갈아 끼운다.
 *
 * 점수로 섞으면 점수가 없는 GeekNews 가 통째로 아래로 밀린다. 시각으로
 * 섞으면 HN 머리기사가 묻힌다. **각자의 순서를 지킨 채 번갈아** 놓는 것이
 * 양쪽을 다 보이게 하는 가장 단순한 방법이다.
 */
function interleave(first: NewsItem[], second: NewsItem[]): NewsItem[] {
  const merged: NewsItem[] = [];
  for (let at = 0; at < Math.max(first.length, second.length); at += 1) {
    if (first[at]) merged.push(first[at]!);
    if (second[at]) merged.push(second[at]!);
  }
  return merged;
}

export async function loadNews(): Promise<{
  items: NewsItem[];
  error: string | null;
}> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 1800, expire: 3600 });

  // 한 곳이 죽어도 나머지로 1면을 낸다. 둘 다 죽어야 휴간이다.
  const [hackerNews, geekNews] = await Promise.all([
    loadHackerNews(),
    loadGeekNews(),
  ]);
  const items = interleave(hackerNews, geekNews);

  return items.length > 0
    ? { items, error: null }
    : { items: [], error: "오늘은 신문이 배달되지 않았습니다." };
}

/* ── 안쪽 면 ──────────────────────────────────────────────────────────── */

export async function loadStory(
  id: string,
): Promise<{ story: NewsStory | null; error: string | null }> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 1800, expire: 3600 });

  // 주소에 그대로 끼워 넣으므로 아는 모양만 통과시킨다.
  const parsed = parseId(id);
  if (!parsed) return { story: null, error: "그런 기사는 없습니다." };

  try {
    const story =
      parsed.source === "hn"
        ? await loadHackerNewsStory(parsed.key)
        : await loadGeekNewsStory(parsed.key);
    return { story, error: story ? null : "그런 기사는 없습니다." };
  } catch {
    // 외부는 언젠가 반드시 죽는다. 화면이 조용히 비는 것보다 낫다.
    return { story: null, error: "기사를 가져오지 못했습니다." };
  }
}
