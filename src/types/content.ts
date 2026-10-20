/**
 * 포트폴리오 내용의 스키마.
 *
 * 실제 값은 `src/content/*.json` 에 있고, 게임 모달과 정적 페이지가 **같은 파일**을
 * 읽는다. 내용을 고칠 곳은 언제나 JSON 한 군데다.
 */

/** "2022-03" 형식. end 가 null 이면 현재 진행 중. */
export interface Period {
  start: string;
  end: string | null;
}

export interface Profile {
  name: string;
  tagline: string;
  /** 문단 단위로 나눠 적는다. */
  bio: string[];
  location: string;
}

export interface CareerEntry {
  company: string;
  role: string;
  period: Period;
  summary: string;
  /** 수치가 들어가면 좋다. "응답 p95 를 820ms 에서 210ms 로" 같은. */
  achievements: string[];
  stack: string[];
}

export interface EducationEntry {
  school: string;
  degree: string;
  period: Period;
  note: string;
}

export interface Certificate {
  name: string;
  issuer: string;
  /** "2024-06" */
  date: string;
}

export interface EducationContent {
  schools: EducationEntry[];
  certificates: Certificate[];
}

export interface ProjectLink {
  label: string;
  url: string;
}

export interface Project {
  name: string;
  tagline: string;
  description: string;
  stack: string[];
  links: ProjectLink[];
  /** "2025" 또는 "2024-05 ~ 2024-09" 처럼 자유 형식. */
  period: string;
}

export interface SkillGroup {
  category: string;
  items: string[];
}

export interface ContactLink {
  label: string;
  value: string;
  /** 눌러서 이동할 주소. 없으면 텍스트로만 보여준다. */
  url: string | null;
}

/** 신문사에서 보여줄 외부 기술 뉴스. JSON 이 아니라 /api/news 에서 온다. */
export interface NewsItem {
  title: string;
  url: string;
  source: string;
  points: number | null;
  publishedAt: string;
}
