import careerData from "@/content/career.json";
import contactData from "@/content/contact.json";
import educationData from "@/content/education.json";
import profileData from "@/content/profile.json";
import projectsData from "@/content/projects.json";
import skillsData from "@/content/skills.json";
import type { BuildingId } from "@/town/buildings";
import type {
  CareerEntry,
  ContactLink,
  EducationContent,
  Period,
  Profile,
  Project,
  SkillGroup,
} from "@/types/content";

import NewsSection from "./NewsSection";

/**
 * 건물 하나의 내용을 그린다.
 *
 * **`"use client"` 를 붙이지 않는다.** 그래야 정적 페이지에서는 서버 렌더되어
 * 검색엔진이 읽고, 게임 모달(클라이언트) 안에서는 클라이언트 렌더된다.
 * 같은 컴포넌트가 양쪽에 쓰이므로 내용이 갈라질 일이 없다.
 * 따라서 async 나 서버 전용 API 를 여기서 쓰면 안 된다.
 */

const profile = profileData as Profile;
const career = careerData as CareerEntry[];
const education = educationData as EducationContent;
const projects = projectsData as Project[];
const skills = skillsData as SkillGroup[];
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
          className="rounded border border-neutral-700 px-1.5 py-0.5 text-xs text-neutral-400"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function Empty({ what }: { what: string }) {
  return (
    <p className="text-sm text-neutral-500">
      아직 {what} 내용이 없습니다. <code>src/content</code> 의 JSON 을 채워주세요.
    </p>
  );
}

function AboutSection() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-neutral-100">{profile.name}</h3>
        <p className="mt-1 text-sm text-neutral-400">{profile.tagline}</p>
        <p className="mt-1 text-xs text-neutral-500">{profile.location}</p>
      </div>
      {profile.bio.map((paragraph) => (
        <p key={paragraph} className="text-sm leading-relaxed text-neutral-300">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function ResumeSection() {
  if (career.length === 0) return <Empty what="경력" />;
  return (
    <ol className="space-y-8">
      {career.map((entry) => (
        <li
          key={`${entry.company}-${entry.period.start}`}
          className="border-l border-neutral-700 pl-4"
        >
          <p className="text-xs text-neutral-500">{formatPeriod(entry.period)}</p>
          <h3 className="mt-1 font-semibold text-neutral-100">{entry.company}</h3>
          <p className="text-sm text-neutral-400">{entry.role}</p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-300">
            {entry.summary}
          </p>
          {entry.achievements.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {entry.achievements.map((achievement) => (
                <li
                  key={achievement}
                  className="text-sm leading-relaxed text-neutral-300 before:mr-2 before:text-neutral-600 before:content-['▸']"
                >
                  {achievement}
                </li>
              ))}
            </ul>
          )}
          <Tags items={entry.stack} />
        </li>
      ))}
    </ol>
  );
}

function EducationSection() {
  const { schools, certificates } = education;
  if (schools.length === 0 && certificates.length === 0) {
    return <Empty what="학적" />;
  }
  return (
    <div className="space-y-8">
      <ol className="space-y-5">
        {schools.map((school) => (
          <li key={school.school} className="border-l border-neutral-700 pl-4">
            <p className="text-xs text-neutral-500">{formatPeriod(school.period)}</p>
            <h3 className="mt-1 font-semibold text-neutral-100">{school.school}</h3>
            <p className="text-sm text-neutral-400">{school.degree}</p>
            {school.note && (
              <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                {school.note}
              </p>
            )}
          </li>
        ))}
      </ol>

      {certificates.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            자격증
          </h3>
          <ul className="mt-3 space-y-2">
            {certificates.map((certificate) => (
              <li key={certificate.name} className="flex justify-between gap-4 text-sm">
                <span className="text-neutral-200">{certificate.name}</span>
                <span className="shrink-0 text-neutral-500">
                  {certificate.issuer} · {certificate.date.replace("-", ".")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ProjectsSection() {
  if (projects.length === 0) return <Empty what="프로젝트" />;
  return (
    <ul className="space-y-6">
      {projects.map((project) => (
        <li key={project.name} className="rounded border border-neutral-800 p-4">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="font-semibold text-neutral-100">{project.name}</h3>
            <span className="shrink-0 text-xs text-neutral-500">{project.period}</span>
          </div>
          <p className="mt-1 text-sm text-neutral-400">{project.tagline}</p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-300">
            {project.description}
          </p>
          <Tags items={project.stack} />
          {project.links.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-3">
              {project.links.map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-xs text-neutral-400 underline underline-offset-2 hover:text-neutral-100"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

function SkillsSection() {
  if (skills.length === 0) return <Empty what="기술 스택" />;
  return (
    <div className="space-y-5">
      {skills.map((group) => (
        <section key={group.category}>
          <h3 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            {group.category}
          </h3>
          <Tags items={group.items} />
        </section>
      ))}
    </div>
  );
}

function ContactSection() {
  if (contact.length === 0) return <Empty what="연락처" />;
  return (
    <ul className="space-y-3">
      {contact.map((link) => (
        <li key={link.label} className="flex items-baseline gap-4 text-sm">
          <span className="w-20 shrink-0 text-neutral-500">{link.label}</span>
          {link.url ? (
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-neutral-200 underline underline-offset-2 hover:text-neutral-50"
            >
              {link.value}
            </a>
          ) : (
            <span className="text-neutral-300">{link.value}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

const SECTIONS: Record<BuildingId, () => React.JSX.Element> = {
  home: AboutSection,
  office: ResumeSection,
  school: EducationSection,
  workshop: ProjectsSection,
  library: SkillsSection,
  post: ContactSection,
  press: NewsSection,
};

export default function SectionContent({ id }: { id: BuildingId }) {
  const Section = SECTIONS[id];
  return <Section />;
}
