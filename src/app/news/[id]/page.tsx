import Link from "next/link";
import { notFound } from "next/navigation";

import AssetCredits from "@/components/AssetCredits";
import Document from "@/components/sections/Document";
import NewsStoryFace from "@/components/sections/NewsStory";
import { SECTION_THEMES, themeVars } from "@/components/sections/theme";
import { loadStory } from "@/lib/news";
import { buildingById } from "@/town/buildings";

/**
 * 신문 안쪽 면의 정적 폴백.
 *
 * 게임 모달은 1면에서 이 면으로 갈아끼우고 주소를 바꾸지 않는다. 그래서 이
 * 경로는 **공유된 링크와 JS 가 꺼진 사람**을 위한 통로다. 모달과 같은
 * `NewsStoryFace` 를 쓰므로 내용이 갈라지지 않는다.
 *
 * `/[section]` 이 최상위 한 칸 경로를 잡지만 `/news` 는 그대로 거기서 처리되고
 * 두 칸짜리인 이 경로만 여기로 온다. (폴더 이름을 `_` 로 시작하면 Next 가
 * 라우팅에서 제외하므로 주의.)
 */

const press = buildingById("press");
const theme = SECTION_THEMES.press;

export async function generateMetadata({ params }: PageProps<"/news/[id]">) {
  const { id } = await params;
  const { story } = await loadStory(id);
  return story ? { title: story.title } : {};
}

/**
 * **흘려보내지 않고 막아 세운다** (`instant = false`).
 *
 * `cacheComponents` 가 켜져 있어 `params` 를 그냥 열면 빌드가
 * `blocking-prerender-dynamic` 으로 죽는다. 기사만 `Suspense` 로 감싸면 빌드는
 * 통과하지만 **껍데기가 먼저 커밋되어 없는 기사도 200 으로 나간다** — 공유
 * 링크로 도는 주소라 상태 코드가 틀리면 안 된다. 그래서 막는 쪽을 골랐다.
 * 어차피 `loadStory` 는 30 분 캐시라 대기도 거의 없다.
 */
export const instant = false;

export default async function NewsStoryPage({
  params,
}: PageProps<"/news/[id]">) {
  const { id } = await params;
  const { story } = await loadStory(id);
  if (!story) notFound();

  return (
    <main
      style={themeVars(theme)}
      className="min-h-dvh bg-[var(--paper)] font-serif text-[var(--ink)]"
    >
      <div className="mx-auto max-w-2xl py-10 sm:px-4 sm:py-14">
        <nav className="mb-6 px-6 sm:px-8">
          <Link
            href={press.route}
            className="text-sm text-[var(--muted)] underline-offset-4 hover:underline"
          >
            ← 1면으로
          </Link>
        </nav>

        <Document id="press" label={press.label} level={1}>
          <NewsStoryFace story={story} />
        </Document>

        <div className="px-6 sm:px-8">
          <nav
            aria-label="다른 건물"
            className="mt-14 border-t border-[var(--rule)] pt-6"
          >
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-[var(--muted)] underline-offset-4 hover:underline"
                >
                  마을로 돌아가기
                </Link>
              </li>
              <li>
                <Link
                  href={press.route}
                  className="text-[var(--muted)] underline-offset-4 hover:underline"
                >
                  신문사 1면
                </Link>
              </li>
            </ul>
          </nav>

          <AssetCredits />
        </div>
      </div>
    </main>
  );
}
