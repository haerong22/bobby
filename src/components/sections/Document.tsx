import type { ReactNode } from "react";

import type { BuildingId } from "@/town/buildings";

import { COVER, COVER_INK, COVER_LINE, COVER_MUTED } from "./paper";

/**
 * 건물이 건네주는 문서의 겉모습.
 *
 * **모달은 테마를 입힌 카드가 아니다.** 우체국은 항공우편 봉투를, 도서관은 펼친
 * 책을, 회사는 결재가 올라간 기안문을 건넨다. 종이색·글꼴만 바꾸면 일곱 채가
 * 결국 같은 카드로 보이므로, 건물마다 **물리적 장치 하나**를 붙인다.
 *
 * | 건물 | 문서 | 장치 |
 * | --- | --- | --- |
 * | 집 | 손편지 | 여백선 + 괘선 + 세 번 접은 자국 + 서명 |
 * | 회사 | 결재 기안문 | 결재란(담당·팀장·대표) + 날인 + 수신 + "끝." |
 * | 학교 | 졸업장 | 장식 테두리 + 모서리 마름모 + 메달과 리본 |
 * | 신문사 | 1면 | 제호 + 발행 레일 + 단 사이 괘선 + 마감선 |
 * | 공방 | 작업 도면 | 모눈 바탕 + 표제란 + 재단 마크 |
 * | 도서관 | 펼친 책 | 머리글 + 가운데 접지선 + 쪽번호 + 넘기는 모서리 |
 * | 우체국 | 항공우편 봉투 | 빗금 테두리 + 우표 + 겹쳐 찍은 소인 |
 *
 * **모달과 정적 페이지가 같은 것을 쓴다.** 한쪽만 꾸미면 같은 내용이 두 얼굴을
 * 갖는다. 색은 전부 `theme.ts` 가 내려보낸 CSS 변수에서 읽는다.
 *
 * `"use client"` 를 붙이지 않는다 — 정적 페이지에서 서버 렌더되어야 한다.
 */

type Level = 1 | 2;

export type DocumentProps = {
  id: BuildingId;
  label: string;
  /** 정적 페이지는 1(h1), 모달은 2(h2). */
  level: Level;
  /** 문서 머리 오른쪽에 놓이는 조작 요소 — 모달의 닫기 버튼. */
  action?: ReactNode;
  /** 본문 끝에 붙는 안내 — 모달의 닫기 힌트. */
  foot?: ReactNode;
  children: ReactNode;
};

/** 모든 문서가 같은 여백을 쓴다. 문서마다 다르면 모달 크기가 들쭉날쭉해진다. */
const PAD = "p-6 sm:p-8";

/** 괘선·모눈을 종이처럼 흐리게. 괘선 색을 그대로 쓰면 표처럼 보인다. */
const faint = (percent: number) =>
  `color-mix(in srgb, var(--rule) ${percent}%, transparent)`;

/** 종이에 떨어뜨리는 그늘 — 접은 자국, 접지선, 넘기는 모서리. */
const shade = (percent: number) =>
  `color-mix(in srgb, var(--ink) ${percent}%, transparent)`;

/**
 * 날인은 붉다. 결재 도장을 테마 색(파랑)으로 찍으면 도장이 아니라 아이콘으로
 * 보인다. 인주는 문서 색과 무관하게 붉은 것이 현실이다.
 */
const SEAL = "#b23a2e";

type Inner = Omit<DocumentProps, "id">;

function Title({
  level,
  className,
  children,
}: {
  level: Level;
  className: string;
  children: ReactNode;
}) {
  const Tag = level === 1 ? "h1" : "h2";
  return <Tag className={className}>{children}</Tag>;
}

/**
 * 모달의 닫기 안내.
 *
 * **문서의 장식(직인·쪽번호·마감선)보다 앞에 둔다.** 뒤에 두면 문서가 끝난 다음
 * UI 가 한 줄 더 붙은 것처럼 보인다.
 */
function Foot({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <div className="mt-10 border-t border-[var(--rule)] pt-3 text-xs text-[var(--muted)]">
      {children}
    </div>
  );
}

/**
 * 집 — 손편지.
 *
 * 왼쪽 여백선과 세 번 접은 자국. 접은 자국은 높이 비율로 긋는다 — 내용이 길든
 * 짧든 편지지를 삼등분한 자리에 그대로 생긴다.
 */
function Letter({ label, level, action, foot, children }: Inner) {
  return (
    <div
      className="relative py-6 pr-6 pl-12 sm:py-8 sm:pr-8 sm:pl-14"
      style={{
        backgroundImage: `linear-gradient(to bottom, transparent 0 32.8%, ${shade(8)} 32.8% 33.1%, transparent 33.1% 66.3%, ${shade(8)} 66.3% 66.6%, transparent 66.6% 100%)`,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-5 left-7 w-px bg-[var(--accent)] opacity-40 sm:left-9"
      />
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Title level={level} className="text-2xl font-semibold">
            {label}
          </Title>
          <p className="mt-1 text-sm text-[var(--muted)]">손으로 쓴 소개</p>
        </div>
        {action}
      </header>
      <div className="mt-7">{children}</div>
      <Foot>{foot}</Foot>
    </div>
  );
}

/** 회사의 결재란. 담당·팀장·대표 세 칸, 첫 칸에 날인이 찍혀 있다. */
function ApprovalBox() {
  const roles = ["담당", "팀장", "대표"];
  return (
    <div
      aria-hidden
      className="shrink-0 border border-[var(--ink)] text-center text-[0.6rem] text-[var(--muted)]"
    >
      <div className="flex">
        {roles.map((role) => (
          <span
            key={role}
            className="w-11 border-r border-[var(--ink)] py-0.5 last:border-r-0 sm:w-12"
          >
            {role}
          </span>
        ))}
      </div>
      <div className="flex border-t border-[var(--ink)]">
        {roles.map((role, cell) => (
          <span
            key={role}
            className="grid h-10 w-11 place-items-center border-r border-[var(--ink)] last:border-r-0 sm:w-12"
          >
            {cell === 0 && (
              <span
                className="grid size-7 -rotate-6 place-items-center rounded-sm border text-[0.5rem] font-semibold opacity-80"
                style={{ borderColor: SEAL, color: SEAL }}
              >
                결재
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * 회사 — 결재가 올라간 기안문.
 *
 * 결재란이 1차 신호다. 제목은 가운데에 자간을 벌려 세우고, 본문은 공문서처럼
 * "끝." 으로 닫는다.
 */
function Approval({ label, level, action, foot, children }: Inner) {
  return (
    <div className={PAD}>
      <header>
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <dl className="text-xs text-[var(--muted)]">
            <div className="flex gap-2">
              <dt>문서번호</dt>
              <dd className="tabular-nums">경력-01</dd>
            </div>
            <div className="mt-1 flex gap-2">
              <dt>수신</dt>
              <dd>읽는 사람</dd>
            </div>
          </dl>

          <div className="flex items-start gap-3">
            <ApprovalBox />
            {action}
          </div>
        </div>

        <div className="mt-6 border-y-4 border-double border-[var(--ink)] py-3 text-center">
          <Title
            level={level}
            className="pl-[0.3em] text-2xl font-semibold tracking-[0.3em]"
          >
            {label}
          </Title>
        </div>
        <p className="mt-2 text-center text-sm text-[var(--muted)]">
          아래와 같이 경력을 알립니다.
        </p>
      </header>

      <div className="mt-7">{children}</div>
      <p aria-hidden className="mt-6 text-sm text-[var(--muted)]">
        끝.
      </p>
      <Foot>{foot}</Foot>
    </div>
  );
}

/** 학교 졸업장에 달리는 메달과 리본. */
function Medal() {
  const tail = {
    clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 72%, 0 100%)",
  } as const;
  return (
    <div aria-hidden className="relative mt-10 flex justify-center pb-12">
      {/* 리본은 메달 밖으로 충분히 나와야 보인다 — 짧으면 술처럼 보인다. */}
      <span className="absolute top-11 flex gap-3">
        <span
          className="h-16 w-4 -rotate-12 bg-[var(--accent)] opacity-55"
          style={tail}
        />
        <span
          className="h-16 w-4 rotate-12 bg-[var(--accent)] opacity-55"
          style={tail}
        />
      </span>
      <span className="relative z-10 grid size-[4.25rem] place-items-center rounded-full border-2 border-[var(--accent)] bg-[var(--paper)]">
        <span className="grid size-[3.4rem] place-items-center rounded-full border border-[var(--accent)] text-center text-[0.58rem] leading-tight font-semibold text-[var(--accent)]">
          학적
          <br />
          확인
        </span>
      </span>
    </div>
  );
}

/**
 * 학교 — 졸업장.
 *
 * 장식 테두리 · 모서리 마름모 · 가운데 정렬 · 메달과 리본. 증서는 읽는 문서가
 * 아니라 **거는 문서**라 가운데 정렬이 맞는다. 다만 본문(학교 목록·자격증)은
 * 읽어야 하므로 왼쪽 정렬로 둔다.
 */
function Diploma({ label, level, action, foot, children }: Inner) {
  const corners = [
    "top-1.5 left-1.5",
    "top-1.5 right-1.5",
    "bottom-1.5 left-1.5",
    "bottom-1.5 right-1.5",
  ];
  return (
    <div className="p-2.5 sm:p-3">
      <div className="relative border-2 border-[var(--accent)] p-1">
        {corners.map((corner) => (
          <span
            key={corner}
            aria-hidden
            className={`absolute ${corner} size-2 rotate-45 bg-[var(--accent)]`}
          />
        ))}

        <div className={`border border-[var(--accent)] ${PAD}`}>
          {action && <div className="mb-2 flex justify-end">{action}</div>}

          <header className="text-center">
            <Title
              level={level}
              className="pl-[0.4em] text-3xl font-semibold tracking-[0.4em]"
            >
              {label}
            </Title>
            <p className="mx-auto mt-3 w-20 border-t border-[var(--accent)] opacity-60" />
            <p className="mt-3 text-sm text-[var(--muted)]">
              아래 과정을 마쳤음을 증명함
            </p>
          </header>

          <div className="mt-8">{children}</div>
          <Foot>{foot}</Foot>
          <Medal />
        </div>
      </div>
    </div>
  );
}

/**
 * 신문사 — 1면.
 *
 * 제호를 굵은 선 사이에 세우고, 아래에 발행 레일을 깐다. 본문 아래는 마감선으로
 * 닫는다 — 신문 지면은 아래가 열려 있지 않다.
 */
function FrontPage({ label, level, action, foot, children }: Inner) {
  return (
    <div className={PAD}>
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs text-[var(--muted)]">제1면</p>
        {action}
      </div>

      <div className="mt-2 border-y-2 border-[var(--ink)] py-2 text-center">
        <Title
          level={level}
          className="text-4xl leading-none font-black tracking-tight text-balance"
        >
          {label}
        </Title>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-[var(--ink)] py-1 text-xs text-[var(--muted)]">
        <span>Hacker News · GeekNews</span>
        <span>매시간 갱신</span>
      </div>

      <div className="mt-5">{children}</div>
      <div aria-hidden className="mt-5 border-t-2 border-[var(--ink)]" />
      <Foot>{foot}</Foot>
    </div>
  );
}

/**
 * 공방 — 모눈종이에 그린 작업 도면.
 *
 * 표제란이 제목 자리고, 네 모서리의 재단 마크가 도면이라는 표식이다.
 */
function WorkNote({ label, level, action, foot, children }: Inner) {
  const marks = [
    ["top-2 left-2", "border-t border-l"],
    ["top-2 right-2", "border-t border-r"],
    ["bottom-2 left-2", "border-b border-l"],
    ["bottom-2 right-2", "border-b border-r"],
  ];
  return (
    <div
      className={`relative ${PAD}`}
      style={{
        backgroundImage: `repeating-linear-gradient(to right, ${faint(70)} 0 1px, transparent 1px 16px), repeating-linear-gradient(to bottom, ${faint(70)} 0 1px, transparent 1px 16px)`,
      }}
    >
      {marks.map(([position, edge]) => (
        <span
          key={position}
          aria-hidden
          className={`pointer-events-none absolute ${position} size-4 ${edge} border-[var(--ink)] opacity-45`}
        />
      ))}

      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 border-2 border-[var(--ink)] bg-[var(--paper)]">
          <Title level={level} className="px-3 py-1.5 text-xl font-semibold">
            {label}
          </Title>
          <p className="flex items-center border-l-2 border-[var(--ink)] px-3 text-xs text-[var(--muted)]">
            작업 노트
          </p>
        </div>
        {action}
      </header>

      <div className="mt-6">{children}</div>
      <Foot>{foot}</Foot>
    </div>
  );
}

/**
 * 도서관 — 책 한 권의 **표지**.
 *
 * 제목은 종이가 아니라 **표지에 박는다.** 면마다 제목이 다시 찍혀 있는 책은
 * 없고, 더 중요하게는 제목을 면 위에 두면 그것만 안 넘어가서 "책 전체가
 * 넘어가는" 그림이 깨진다. 표지에 두면 머리글·본문·쪽번호가 통째로 넘어간다.
 *
 * 책배 · 면 · 넘김 · 쪽수는 전부 `Book` 이 그린다 — 넘어가는 것은 한 덩어리로
 * 묶여 있어야 한다.
 */
function BookCover({ label, level, action, foot, children }: Inner) {
  return (
    <div
      className="book-cover relative"
      style={{ backgroundColor: COVER, boxShadow: COVER_LINE }}
    >
      <div
        className="flex items-start justify-between gap-4 px-4 pt-3 sm:px-5 sm:pt-4"
        style={{ color: COVER_INK }}
      >
        <div className="min-w-0">
          <Title level={level} className="text-lg font-semibold">
            {label}
          </Title>
          <p className="mt-0.5 text-xs" style={{ color: COVER_MUTED }}>
            넘겨 읽는 글
          </p>
        </div>
        {action}
      </div>

      <div className="mt-3 px-3 sm:px-4">{children}</div>

      {foot && (
        <div
          className="px-4 pb-3 text-xs sm:px-5 sm:pb-4"
          style={{ color: COVER_MUTED }}
        >
          {foot}
        </div>
      )}
    </div>
  );
}

/** 우체국 — 항공우편 봉투. 빗금 테두리는 바깥(모달 패널·페이지)이 두른다. */
function Envelope({ label, level, action, foot, children }: Inner) {
  return (
    <div className={PAD}>
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-[var(--muted)]">받는 사람</p>
          <Title level={level} className="mt-0.5 text-2xl font-semibold">
            {label}
          </Title>
        </div>

        <div className="flex shrink-0 items-start gap-2">
          <span
            aria-hidden
            className="grid size-14 place-items-center border-2 border-dashed border-[var(--accent)] opacity-80"
          >
            <span className="grid size-full place-items-center bg-[var(--accent)] text-[0.6rem] font-semibold text-[var(--on-accent)]">
              우편
            </span>
          </span>
          {/*
            소인은 우표 **위에** 찍힌다 — 떨어뜨려 놓으면 둘 다 장식으로 보인다.
            우표보다 뒤에 둬야 위에 그려진다. 앞에 두고 z-index 로 올리면
            `opacity` 가 만든 쌓임 맥락과 싸우게 된다.
          */}
          <span
            aria-hidden
            className="relative -ml-6 hidden size-14 -rotate-12 place-items-center rounded-full border-2 border-[var(--accent)] opacity-45 sm:grid"
          >
            <span className="border-y border-[var(--accent)] px-1 text-[0.55rem] font-semibold text-[var(--accent)]">
              항공
            </span>
          </span>
          {action}
        </div>
      </header>

      <div className="mt-6 border-t border-[var(--rule)] pt-6">{children}</div>
      <Foot>{foot}</Foot>
    </div>
  );
}

const DOCUMENTS: Record<BuildingId, (props: Inner) => React.JSX.Element> = {
  home: Letter,
  office: Approval,
  school: Diploma,
  press: FrontPage,
  workshop: WorkNote,
  library: BookCover,
  post: Envelope,
};

/**
 * 넓게 펴야 하는 문서.
 *
 * 도서관만 참이다 — 두 면에 글이 흐르는 책이라 좁으면 단이 하나로 합쳐져
 * 그냥 긴 글 목록이 된다. 나머지는 한 단짜리 서류라 좁은 쪽이 읽기 좋다.
 */
export const WIDE: Record<BuildingId, boolean> = {
  home: false,
  office: false,
  school: false,
  press: false,
  workshop: false,
  library: true,
  post: false,
};

/**
 * 모달 패널의 바깥 테두리. 1면은 신문지처럼 짙은 테두리고, 봉투는 빗금 자체가
 * 테두리라 선을 두르지 않는다.
 */
export const PANEL_EDGE: Record<BuildingId, string> = {
  home: "border border-[var(--edge)]",
  office: "border border-[var(--edge)]",
  school: "border border-[var(--edge)]",
  press: "border-2 border-[var(--ink)]",
  workshop: "border border-[var(--edge)]",
  // 표지가 테두리다. 선을 더 두르면 책에 액자를 씌운 꼴이 된다.
  library: "rounded-sm",
  post: "",
};

/**
 * 패널 바닥에 깔리는 색.
 *
 * 도서관만 종이가 아니다 — 모달 전체가 책이라 바닥이 표지여야 한다. 종이로
 * 두면 책 둘레로 흰 띠가 돌아 책이 종이 위에 인쇄된 그림처럼 보인다.
 */
export const PANEL_FILL: Partial<Record<BuildingId, string>> = {
  library: COVER,
};

/** 우체국만 두르는 항공우편 빗금. 봉투의 표식이다. */
export const AIRMAIL =
  "repeating-linear-gradient(45deg, #c0392b 0 8px, #f6f1e5 8px 16px, #2f5aa0 16px 24px, #f6f1e5 24px 32px)";

export default function Document({ id, ...rest }: DocumentProps) {
  const Shell = DOCUMENTS[id];
  return <Shell {...rest} />;
}
