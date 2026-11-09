import careerData from "@/content/career.json";
import contactData from "@/content/contact.json";
import educationData from "@/content/education.json";
import profileData from "@/content/profile.json";
import projectsData from "@/content/projects.json";
import type { BuildingId } from "@/town/buildings";
import type {
  CareerEntry,
  ContactLink,
  EducationContent,
  Period,
  Profile,
  Project,
} from "@/types/content";

import Book from "./Book";
import NewsSection from "./NewsSection";

/**
 * 건물 하나의 내용을 그린다.
 *
 * **`"use client"` 를 붙이지 않는다.** 그래야 정적 페이지에서는 서버 렌더되어
 * 검색엔진이 읽고, 게임 모달(클라이언트) 안에서는 클라이언트 렌더된다.
 * 같은 컴포넌트가 양쪽에 쓰이므로 내용이 갈라질 일이 없다.
 * 따라서 async 나 서버 전용 API 를 여기서 쓰면 안 된다.
 *
 * 색은 전부 `theme.ts` 가 내려보낸 CSS 변수에서 읽는다 — 섹션마다 색을 박아
 * 넣으면 건물 테마를 바꿀 때 일곱 군데를 고쳐야 한다.
 */

const profile = profileData as Profile;
const career = careerData as CareerEntry[];
const education = educationData as EducationContent;
const projects = projectsData as Project[];
const contact = contactData as ContactLink[];

/** "2022-03" → "2022.03", end 가 null 이면 "현재". */
function formatPeriod({ start, end }: Period) {
  const fmt = (value: string) => value.replace("-", ".");
  return `${fmt(start)} – ${end ? fmt(end) : "현재"}`;
}

function Tags({ items }: { items: readonly string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-sm border border-[var(--rule)] px-1.5 py-0.5 text-xs text-[var(--muted)]"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function Empty({ what }: { what: string }) {
  return (
    <p className="text-sm text-[var(--muted)]">
      아직 {what} 내용이 없습니다. <code>src/content</code> 의 JSON 을 채워주세요.
    </p>
  );
}

/**
 * 편지지의 괘선.
 *
 * **줄 간격과 단락 간격이 둘 다 28px 이어야 한다.** 한쪽이라도 어긋나면 글줄이
 * 괘선을 타고 내려가다 어긋나 종이가 아니라 표처럼 보인다. 그래서 본문은
 * `leading-7`(28px) · `space-y-7`(28px) 로 묶는다.
 */
const RULED = {
  backgroundImage:
    "repeating-linear-gradient(to bottom, transparent 0 27px, color-mix(in srgb, var(--rule) 75%, transparent) 27px 28px)",
};

/** 집 — 손으로 쓴 소개. 괘선 위를 흐르고 서명으로 끝난다. */
function AboutSection() {
  return (
    <div>
      <div className="space-y-7 leading-7" style={RULED}>
        {profile.bio.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <div className="mt-9 text-right">
        <p className="text-sm text-[var(--muted)]">{profile.location}에서</p>
        <h2 className="mt-1 text-2xl font-semibold italic">{profile.name}</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">{profile.tagline}</p>
      </div>
    </div>
  );
}

/**
 * 회사 — 결재 기안문의 본문.
 *
 * 항목에 번호를 붙인다. 공문서가 그렇기도 하고, **경력은 실제로 순서가 있는
 * 내용**이라 번호가 장식이 아니라 정보가 된다.
 */
function ResumeSection() {
  if (career.length === 0) return <Empty what="경력" />;
  return (
    <ol className="space-y-7">
      {career.map((entry, order) => (
        <li
          key={`${entry.company}-${entry.period.start}`}
          className="grid gap-x-5 gap-y-1 sm:grid-cols-[7.5rem_1fr]"
        >
          <p className="pt-0.5 text-sm text-[var(--muted)] tabular-nums">
            {formatPeriod(entry.period)}
          </p>
          <div className="border-l-2 border-[var(--accent)] pl-4">
            <h2 className="font-semibold">
              <span className="mr-1.5 text-[var(--accent)] tabular-nums">
                {order + 1}.
              </span>
              {entry.company}
            </h2>
            <p className="text-sm text-[var(--muted)]">{entry.role}</p>
            <p className="mt-2 leading-relaxed">{entry.summary}</p>
            {entry.achievements.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {entry.achievements.map((achievement) => (
                  <li key={achievement} className="flex gap-2 leading-relaxed">
                    <span aria-hidden className="text-[var(--accent)]">
                      —
                    </span>
                    <span>{achievement}</span>
                  </li>
                ))}
              </ul>
            )}
            <Tags items={entry.stack} />
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * 학교 — 졸업장의 본문.
 *
 * 학적은 **가운데 정렬**이다. 증서는 읽는 문서가 아니라 거는 문서라 한가운데가
 * 맞고, 학교 이름이 그 증서의 주인공이라 제일 크다. 자격증은 읽어야 하는 표라
 * 정렬을 바꾸지 않는다.
 */
function EducationSection() {
  const { schools, certificates } = education;
  if (schools.length === 0 && certificates.length === 0) {
    return <Empty what="학적" />;
  }
  return (
    <div className="space-y-10">
      <ol className="space-y-6">
        {schools.map((school) => (
          <li key={school.school} className="text-center">
            <h2 className="text-xl font-semibold">{school.school}</h2>
            <p className="mt-1 text-sm">{school.degree}</p>
            <p className="mt-0.5 text-sm text-[var(--muted)] tabular-nums">
              {formatPeriod(school.period)}
            </p>
            {school.note && (
              <p className="mx-auto mt-3 max-w-md leading-relaxed text-[var(--muted)]">
                {school.note}
              </p>
            )}
          </li>
        ))}
      </ol>

      {certificates.length > 0 && (
        <section className="border-t border-[var(--rule)] pt-6">
          <h2 className="mb-1 text-center text-sm font-semibold text-[var(--accent)]">
            자격증
          </h2>
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">자격증 목록</caption>
            <tbody>
              {certificates.map((certificate) => (
                <tr key={certificate.name} className="border-b border-[var(--rule)]">
                  <td className="py-2 pr-4">{certificate.name}</td>
                  <td className="py-2 pr-4 text-[var(--muted)]">
                    {certificate.issuer}
                  </td>
                  <td className="py-2 text-right text-[var(--muted)] tabular-nums">
                    {certificate.date.replace("-", ".")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

/**
 * 공방 — 모눈종이에 붙인 작업 카드.
 *
 * 카드 바탕은 **불투명해야 한다**(`var(--paper)`). 반투명으로 두면 뒤의 모눈이
 * 글자 밑으로 비쳐 본문이 읽기 어려워진다.
 */
function ProjectsSection() {
  if (projects.length === 0) return <Empty what="프로젝트" />;
  return (
    <ul className="space-y-5">
      {projects.map((project) => (
        <li
          key={project.name}
          className="border border-[var(--rule)] bg-[var(--paper)] shadow-sm"
        >
          <div className="flex flex-wrap items-baseline gap-x-3 border-b border-[var(--rule)] px-4 py-2">
            <h2 className="font-semibold">{project.name}</h2>
            <span className="text-xs text-[var(--muted)] tabular-nums">
              {project.period}
            </span>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm text-[var(--muted)]">{project.tagline}</p>
            <p className="mt-2 leading-relaxed">{project.description}</p>
            <Tags items={project.stack} />
            {project.links.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                {project.links.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-sm text-[var(--accent)] underline underline-offset-2"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** 우체국 — 봉투에 쓴 주소. 그래서 왼쪽을 들여 쓴다. */
function ContactSection() {
  if (contact.length === 0) return <Empty what="연락처" />;
  return (
    <dl className="space-y-3 sm:pl-10">
      {contact.map((link) => (
        <div key={link.label} className="flex flex-wrap items-baseline gap-x-4">
          <dt className="w-16 shrink-0 text-sm text-[var(--muted)]">{link.label}</dt>
          <dd className="min-w-0 break-all">
            {link.url ? (
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer noopener"
                className="text-[var(--accent)] underline underline-offset-2"
              >
                {link.value}
              </a>
            ) : (
              link.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

const SECTIONS: Record<BuildingId, () => React.JSX.Element> = {
  home: AboutSection,
  office: ResumeSection,
  school: EducationSection,
  workshop: ProjectsSection,
  library: Book,
  post: ContactSection,
  press: NewsSection,
};

export default function SectionContent({ id }: { id: BuildingId }) {
  const Section = SECTIONS[id];
  return <Section />;
}
