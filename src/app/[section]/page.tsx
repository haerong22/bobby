import Link from "next/link";
import { notFound } from "next/navigation";

import { BUILDINGS } from "@/town/buildings";

/**
 * 게임을 거치지 않는 정적 폴백. 검색엔진, 저사양 기기, 스크린 리더, 그리고
 * 게임을 켜고 싶지 않은 사람을 위한 통로다. Phase 4 에서 src/content 의 JSON 을
 * 읽어 실제 내용을 채운다 — 게임 모달과 같은 데이터를 쓴다.
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

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <nav className="mb-10">
        <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-100">
          ← 마을로 돌아가기
        </Link>
      </nav>

      <h1 className="text-3xl font-semibold">{building.label}</h1>
      <p className="mt-4 text-sm leading-relaxed text-neutral-400">
        아직 내용이 없습니다. Phase 4 에서 채웁니다.
      </p>

      <ul className="mt-12 flex flex-wrap gap-x-4 gap-y-2 border-t border-neutral-800 pt-6 text-sm">
        {BUILDINGS.filter((other) => other.id !== building.id).map((other) => (
          <li key={other.id}>
            <Link href={other.route} className="text-neutral-500 hover:text-neutral-200">
              {other.label}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
