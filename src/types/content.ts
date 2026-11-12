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

/**
 * 도서관에 꽂히는 글 한 편.
 *
 * 책을 넘기며 읽는 형태라 **한 편이 펼침면 하나**에 들어간다. `body` 가 너무
 * 길면 한 면을 넘겨 버리므로 서너 문단에서 끊고, 길어질 내용은 `url` 로 원문을
 * 건다 — 도서관은 전문을 싣는 곳이 아니라 꽂아 두는 곳이다.
 */
export interface Post {
  title: string;
  /** "2026-03" 또는 "2026-03-14" */
  date: string;
  /** 기술 · 기록처럼 글의 갈래 */
  category: string;
  /** 차례에 실리는 한 줄 */
  summary: string;
  /** 문단 단위로 나눠 적는다. */
  body: string[];
  tags: string[];
  /** 원문(블로그·깃허브) 주소. 없으면 링크를 걸지 않는다. */
  url: string | null;
}

export interface ContactLink {
  label: string;
  value: string;
  /** 눌러서 이동할 주소. 없으면 텍스트로만 보여준다. */
  url: string | null;
}

/**
 * 신문의 제호.
 *
 * **건물 간판(`신문사`)과 다른 것이다.** 간판은 마을에서 건물을 가리키는
 * 이름이고, 제호는 그 신문의 이름이다 — 간판에 "신문사" 라고 쓰여 있다고
 * 1면에도 "신문사" 라고 찍혀 있지는 않다.
 */
export interface PressMasthead {
  name: string;
  /** 제호 아래 한 줄. 뉴욕타임스의 "All the News That's Fit to Print" 자리. */
  motto: string;
  /** 발행 정보 왼쪽 칸 */
  volume: string;
  /** 발행 정보 가운데 칸 */
  place: string;
}

/** 신문사에서 보여줄 외부 기술 뉴스. JSON 이 아니라 /api/news 에서 온다. */
export interface NewsItem {
  /**
   * 안쪽 면을 여는 열쇠. `hn-50450488` · `gn-37159` 처럼 **출처 접두사**가 붙는다.
   * 출처마다 번호 체계가 달라서, 접두사가 없으면 어느 쪽 글인지 알 길이 없다.
   */
  id: string;
  title: string;
  url: string;
  /** "Hacker News" 또는 "GeekNews" */
  source: string;
  /** GeekNews 는 피드에 점수가 없어 null 이다. */
  points: number | null;
  publishedAt: string;
}

/** 기사에 달린 독자 반응 한 줄. */
export interface NewsComment {
  id: string;
  author: string;
  /** **글자만 남긴 것.** 원본은 HTML 이라 그대로 그리면 XSS 다. */
  text: string;
  publishedAt: string;
}

/**
 * 신문 안쪽 면.
 *
 * **기사 본문은 싣지 않는다.** 남의 글이라 전재하면 저작권 문제고, 사이트마다
 * 봇 차단·구조가 제각각이라 깨진다. 대신 각 사이트가 스스로 내주는 것만 싣고
 * 본문은 링크로 넘긴다.
 *
 * **출처마다 실리는 것이 다르다.** HN 은 공개 API 로 독자 반응을 주고,
 * GeekNews 는 토론 API 가 없는 대신 투고자가 쓴 요약을 피드에 담아 준다.
 */
export interface NewsStory {
  id: string;
  /** "Hacker News" 또는 "GeekNews" */
  source: string;
  title: string;
  /** 바깥 원문 주소. Ask HN 처럼 바깥 글이 없으면 null. */
  url: string | null;
  author: string | null;
  points: number | null;
  publishedAt: string;
  /** 토론이 열려 있는 주소. GeekNews 는 토픽 페이지가 곧 토론이라 `url` 과 같다. */
  discussion: string;
  /** 피드가 주는 요약. HN 쪽은 없다. */
  summary: string | null;
  /** 상위 몇 개만 싣는다 — 통째로 옮기면 그것도 재배포에 가깝다. */
  comments: NewsComment[];
  /** 달린 반응 전체 수 */
  commentCount: number;
}
