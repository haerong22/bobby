import Link from "next/link";
import { notFound } from "next/navigation";

import SectionContent from "@/components/sections";
import Document, { AIRMAIL, WIDE } from "@/components/sections/Document";
import { SECTION_THEMES, themeVars } from "@/components/sections/theme";
import { BUILDINGS } from "@/town/buildings";

/**
 * 게임을 거치지 않는 정적 폴백. 검색엔진, 저사양 기기, 스크린 리더, 그리고
 * 게임을 켜고 싶지 않은 사람을 위한 통로다.
 *
 * **모달과 같은 `Document` 를 쓴다** — 종이와 장치(직인·우표·반납 도장칸)가
 * 양쪽에서 같다. 한쪽만 꾸미면 같은 내용이 두 얼굴을 갖는다.
 */

const findBuilding = (section: string) =>
  BUILDINGS.find((building) => building.route === `/${section}`);

export function generateStaticParams() {
  return BUILDINGS.map((building) => ({ section: building.route.slice(1) }));
}

export async function generateMetadata({ params }: PageProps<"/[section]">) {
  const { section } = await params;
  const building = findBuilding(section);
  return building ? { title: building.label } : {};
}

export default async function SectionPage({ params }: PageProps<"/[section]">) {
  const { section } = await params;
  const building = findBuilding(section);
  if (!building) notFound();

  const theme = SECTION_THEMES[building.id];
  const envelope = building.id === "post";

  return (
    <main
      style={{
        ...themeVars(theme),
        // 봉투는 가장자리까지 간다 — 우체국에서 받는 것은 편지다.
        ...(envelope
          ? { borderTop: "6px solid transparent", borderImage: `${AIRMAIL} 6` }
          : null),
      }}
      className={`min-h-dvh bg-[var(--paper)] text-[var(--ink)] ${
        theme.serif ? "font-serif" : "font-sans"
      }`}
    >
      {/* 좌우 여백은 Document 가 가진다 — 카드 상단 띠·바인더 기둥이 종이 끝까지 가야 한다. */}
      <div
        className={`mx-auto py-10 sm:px-4 sm:py-14 ${
          WIDE[building.id] ? "max-w-6xl" : "max-w-2xl"
        }`}
      >
        <nav className="mb-6 px-6 sm:px-8">
          <Link
            href="/"
            className="text-sm text-[var(--muted)] underline-offset-4 hover:underline"
          >
            ← 마을로 돌아가기
          </Link>
        </nav>

        <Document id={building.id} label={building.label} level={1}>
          <SectionContent id={building.id} />
        </Document>

        <div className="px-6 sm:px-8">
          <nav
            aria-label="다른 건물"
            className="mt-14 border-t border-[var(--rule)] pt-6"
          >
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {BUILDINGS.filter((other) => other.id !== building.id).map(
                (other) => (
                  <li key={other.id}>
                    <Link
                      href={other.route}
                      className="text-[var(--muted)] underline-offset-4 hover:underline"
                    >
                      {other.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </nav>

          {/* 에셋 출처. 둘 다 CC-BY 라 표기가 의무다. 임의로 지우면 안 된다. */}
          <footer className="mt-8 text-xs leading-relaxed text-[var(--muted)]">
            게임 아트{" "}
            <a
              href="https://aquumgifts.itch.io"
              target="_blank"
              rel="noreferrer noopener"
              className="underline underline-offset-2"
            >
              &ldquo;Cozy Town Lite&rdquo; by Spaceyyy
            </a>{" "}
            ·{" "}
            <a
              href="https://aquumgifts.itch.io"
              target="_blank"
              rel="noreferrer noopener"
              className="underline underline-offset-2"
            >
              &ldquo;Cozy Farm Village Lite&rdquo; by Bramble &amp; Byte
            </a>{" "}
            (CC-BY 4.0)
          </footer>
        </div>
      </div>
    </main>
  );
}
