"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import postsData from "@/content/posts.json";
import skillsData from "@/content/skills.json";
import type { Post, SkillGroup } from "@/types/content";

import {
  BOOK_INSET,
  COVER_INK,
  COVER_MUTED,
  COVER_RULE,
  FORE_LEFT,
  FORE_RIGHT,
  LEAF_MS,
  RIBBON,
  STACK_FAR,
  STACK_NEAR,
} from "./paper";

/**
 * 도서관 — 넘겨 읽는 책.
 *
 * 도서관은 기술 스택 목록이 아니라 **글을 쓰고 읽는 곳**이다. 그래서 내용이
 * 한 번에 다 보이지 않는다. 펼침면 하나에 글 한 편이 들어가고, 넘겨야 다음
 * 글이 나온다 — 블로그 목록을 스크롤하는 것과 책을 읽는 것의 차이가 여기다.
 *
 * 면 구성: 차례 → 글 n편 → 색인. 색인은 `skills.json` 이다. 기술 목록은
 * 책 뒤에 붙은 찾아보기로 두는 게 글 사이에 끼워 넣는 것보다 자연스럽다.
 *
 * ## 넘길 때 화면에 있는 것 네 겹
 *
 * 종이 한 장이 진짜로 넘어가려면 **떠나는 쪽과 도착하는 쪽이 같이 보여야**
 * 한다. 그래서 넘기는 동안만 아래 네 겹을 쌓는다.
 *
 * 1. 흐름에 있는 면 — 이미 **도착 면**이다. 바깥 반쪽이 여기서 드러난다
 * 2. `leaf-held` — **떠나는 면의 안쪽 반쪽**. 1 이 덮어 버린 자리를 되돌린다.
 *    이게 없으면 넘기기도 전에 새 쪽이 보여서 넘기는 의미가 사라진다
 * 3. 종이 앞면 — 떠나는 면의 바깥 반쪽. 이게 돈다
 * 4. 종이 뒷면 — 도착 면의 안쪽 반쪽. 90° 를 넘기면서 드러나 2 위에 내려앉는다
 *
 * 반쪽은 **전체 너비로 그린 뒤 잘라서** 만든다 (`Half`). 글이 두 면에 걸쳐
 * 흐르는 단 배치도, 면 바탕의 굴곡도 전체 너비를 기준으로 계산되므로 이렇게
 * 해야 정적인 면과 한 픽셀도 어긋나지 않는다. 그래서 종이에 따로 그늘을 칠할
 * 필요가 없다 — 바탕이 이미 같은 굴곡을 들고 있다.
 *
 * ## 그 밖에
 *
 * **면을 전부 DOM 에 두고 안 보이는 것만 감춘다.** 펼친 면만 그리면 정적
 * 페이지 HTML 에 차례만 남아 **글 본문이 검색엔진에 하나도 안 걸린다** —
 * 블로그에서 그건 치명적이다. `"use client"` 라도 서버에서 한 번 그려지므로
 * 이렇게 두면 글이 전부 HTML 에 들어간다.
 *
 * 표지·책배·접지 골은 `Document` 의 `BookCover` 가 그린다.
 */

const posts = postsData as Post[];
const skills = skillsData as SkillGroup[];

type Leaf =
  | { kind: "toc"; title: string }
  | { kind: "post"; title: string; post: Post }
  | { kind: "index"; title: string };

const LEAVES: readonly Leaf[] = [
  { kind: "toc", title: "차례" },
  ...posts.map((post) => ({ kind: "post" as const, title: post.title, post })),
  { kind: "index", title: "색인" },
];

/** 펼침면 n 의 왼쪽 쪽번호. 한 면에 두 쪽이다. */
const leftPageOf = (leaf: number) => leaf * 2 + 1;

const formatDate = (date: string) => date.replaceAll("-", ".");

/** 두 면에 걸쳐 흐르는 단. 접지가 이 단 사이 홈에 떨어진다. */
const FLOW = "sm:columns-2 sm:gap-20";
/** 제목처럼 두 면을 가로지르는 것. */
const SPAN = "sm:[column-span:all]";

function Toc({ onOpen }: { onOpen: (leaf: number) => void }) {
  const entries = [
    ...posts.map((post, order) => ({
      key: post.title,
      label: post.title,
      note: post.summary,
      leaf: order + 1,
    })),
    { key: "index", label: "색인", note: "기술 찾아보기", leaf: LEAVES.length - 1 },
  ];

  return (
    <div className={FLOW}>
      <header className={`mb-6 ${SPAN}`}>
        <h2 className="text-lg font-semibold">차례</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">글 {posts.length}편</p>
      </header>

      <ol className="space-y-4">
        {entries.map((entry, order) => (
          <li key={entry.key} className="break-inside-avoid">
            <button
              type="button"
              onClick={() => onOpen(entry.leaf)}
              className="group block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              <span className="flex items-baseline gap-2">
                <span className="text-xs text-[var(--muted)] tabular-nums">
                  {String(order + 1).padStart(2, "0")}
                </span>
                <span className="font-semibold underline-offset-4 group-hover:underline">
                  {entry.label}
                </span>
                <span
                  aria-hidden
                  className="min-w-4 flex-1 translate-y-[-0.2em] border-b border-dotted border-[var(--rule)]"
                />
                <span className="text-xs text-[var(--muted)] tabular-nums">
                  {leftPageOf(entry.leaf)}
                </span>
              </span>
              <span className="mt-1 block pl-7 text-sm text-[var(--muted)]">
                {entry.note}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Article({ post }: { post: Post }) {
  return (
    <div className={FLOW}>
      <header className={`mb-5 ${SPAN}`}>
        <p className="text-xs text-[var(--muted)]">
          {post.category}
          <span aria-hidden> · </span>
          <span className="tabular-nums">{formatDate(post.date)}</span>
        </p>
        <h2 className="mt-1 text-2xl leading-snug font-semibold">{post.title}</h2>
        <p className="mt-2 text-[var(--muted)] italic">{post.summary}</p>
      </header>

      {/*
        문단 사이를 띄우지 않고 **첫 줄을 한 글자 들여쓴다.** 책이 문단을
        가르는 방식이고, 이게 있어야 두 면에 걸친 글이 본문으로 읽힌다.
      */}
      {post.body.map((paragraph) => (
        <p key={paragraph} className="indent-[1em] leading-7">
          {paragraph}
        </p>
      ))}

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 break-inside-avoid border-t border-[var(--rule)] pt-3 text-xs">
        <ul className="flex flex-wrap gap-x-3 text-[var(--muted)]">
          {post.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        {post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noreferrer noopener"
            className="text-[var(--accent)] underline underline-offset-2"
          >
            원문 보기
          </a>
        )}
      </div>
    </div>
  );
}

function IndexLeaf() {
  return (
    <div className={FLOW}>
      <header className={`mb-5 ${SPAN}`}>
        <h2 className="text-lg font-semibold">색인</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">책 뒤에 붙인 기술 목록</p>
      </header>

      {skills.map((group) => (
        <section key={group.category} className="mb-5 break-inside-avoid">
          <h3 className="border-b border-[var(--rule)] pb-1 text-sm font-semibold text-[var(--accent)]">
            {group.category}
          </h3>
          <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 leading-relaxed">
            {group.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/**
 * 펼친 면 한 장 전체 — 머리글 · 본문 · 쪽번호.
 *
 * **면에 있는 것은 전부 여기 들어가야 한다.** 머리글이나 쪽번호를 바깥에 두면
 * 그것만 제자리에 남아서 "가운데 네모만 돌아가는" 그림이 된다. 책 제목이
 * 표지로 올라간 것도 같은 이유다.
 *
 * 위아래 여백도 여기서 준다 — 면 바깥에 주면 넘어갈 때 위아래로 빈 띠가
 * 남는다.
 */
function Page({
  index,
  onOpen,
}: {
  index: number;
  onOpen: (leaf: number) => void;
}) {
  const leaf = LEAVES[index]!;
  const left = leftPageOf(index);

  return (
    // 한 면이 가로보다 세로로 길어야 책면으로 읽힌다. 모달 폭(6xl)에서
    // 한 면이 560px 쯤이므로 30rem 이 그 비율에 맞고, 표지·쪽수를 더해도
    // 노트북 화면(800px)에 들어온다.
    <div className="flex min-h-[23rem] flex-col py-6 sm:min-h-[30rem] sm:py-8">
      <div
        className={`flex items-baseline justify-between border-b border-[var(--rule)] pb-2 text-xs text-[var(--muted)] ${BOOK_INSET}`}
      >
        <span>기록 서가</span>
        <span className="tabular-nums">004</span>
      </div>

      <div className={`mt-6 flex-1 ${BOOK_INSET}`}>
        {leaf.kind === "toc" && <Toc onOpen={onOpen} />}
        {leaf.kind === "post" && <Article post={leaf.post} />}
        {leaf.kind === "index" && <IndexLeaf />}
      </div>

      {/* 쪽번호는 바깥쪽 아래 구석에 — 책이 그렇게 찍는다. */}
      <div
        className={`mt-8 flex items-baseline justify-between text-xs text-[var(--muted)] tabular-nums ${BOOK_INSET}`}
      >
        <span>{left}</span>
        <span className="hidden sm:inline">{left + 1}</span>
      </div>
    </div>
  );
}

type Side = "left" | "right";

/**
 * 펼침면의 반쪽.
 *
 * **전체 너비로 그린 뒤 잘라낸다.** 반쪽만 따로 그리면 두 면에 걸쳐 흐르는
 * 단이 다시 계산되어 정적인 면과 글줄이 어긋난다. 바탕도 같은 이유로 전체
 * 너비(`200%`)로 깔고 해당 쪽만 보인다 — 그래서 `.book` 바깥에 좌우 여백이
 * 있으면 안 된다 (`BOOK_INSET` 주석 참고).
 *
 * `held` 는 `.book` 안에서 반쪽 자리를 차지하고, 아니면 이미 반쪽 크기인
 * 종이 면(`.leaf-face`)을 가득 채운다.
 */
function Half({
  side,
  held = false,
  children,
}: {
  side: Side;
  held?: boolean;
  children: ReactNode;
}) {
  const box = held
    ? `leaf-held absolute inset-y-0 z-[1] w-1/2 ${side === "left" ? "left-0" : "left-1/2"}`
    : "absolute inset-0";

  return (
    <div className={`${box} book-half book-half-${side} overflow-hidden`}>
      <div className={`w-[200%] ${side === "right" ? "-translate-x-1/2" : ""}`}>
        {children}
      </div>
    </div>
  );
}

/**
 * 넘김 단추. **표지 위에 놓이므로 밝은 글씨다** — 종이 위 글자색을 쓰면 천
 * 위에서 읽히지 않는다.
 *
 * 끝 면에서도 포커스를 잃지 않도록 `disabled` 대신 `aria-disabled` 를 쓴다.
 */
function Turn({
  label,
  blocked,
  onTurn,
}: {
  label: string;
  blocked: boolean;
  onTurn: () => void;
}) {
  return (
    <button
      type="button"
      aria-disabled={blocked}
      onClick={blocked ? undefined : onTurn}
      style={{ borderColor: COVER_RULE, color: COVER_INK }}
      className={`border px-3 py-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${
        blocked ? "cursor-default opacity-30" : "hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );
}

export default function Book() {
  const [at, setAt] = useState(0);
  const [flip, setFlip] = useState<{ from: number; dir: 1 | -1 } | null>(null);

  /*
   * 넘김이 끝나면 종이를 걷는다.
   *
   * `animationend` 가 아니라 타이머를 쓴다 — 동작 줄이기(reduced motion)에서는
   * 종이를 `display: none` 으로 숨기므로 이벤트가 영영 오지 않는다. 그러면
   * 종이가 상태에 남아 다음 넘김이 막힌다.
   */
  useEffect(() => {
    if (!flip) return;
    const timer = window.setTimeout(() => setFlip(null), LEAF_MS + 40);
    return () => window.clearTimeout(timer);
  }, [flip]);

  /*
   * 넘김이 끝날 때까지 다음 넘김을 받지 않는다. 겹쳐 받으면 떠나는 면이 두
   * 겹으로 쌓여 종이가 두 장 겹쳐 보인다. 덕분에 넘김 사이에 종이가 반드시
   * 언마운트되므로 애니메이션을 다시 돌리려고 `key` 를 흔들 필요도 없다.
   */
  const open = (target: number) => {
    if (flip) return;
    const next = Math.min(Math.max(target, 0), LEAVES.length - 1);
    if (next === at) return;
    setFlip({ from: at, dir: next > at ? 1 : -1 });
    setAt(next);
  };

  const leaf = LEAVES[at]!;
  const left = leftPageOf(at);

  /** 넘기는 동안 들고 있어야 하는, 떠나는 면의 안쪽 반쪽. */
  const held: Side = flip?.dir === 1 ? "left" : "right";
  /** 종이 앞면이 실어 가는 반쪽. */
  const carried: Side = flip?.dir === 1 ? "right" : "left";

  return (
    <div
      aria-roledescription="책"
      aria-keyshortcuts="ArrowLeft ArrowRight"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        open(at + (event.key === "ArrowRight" ? 1 : -1));
      }}
      className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
    >
      {/*
        JS 가 꺼져 있으면 넘길 수가 없다 — 면을 전부 펴고 넘김 단추를 치운다.
        정적 페이지는 게임을 켜지 않는 사람의 통로이므로 여기서 글이 막히면
        "게임은 레이어다" 가 말뿐이 된다.
        React 가 noscript 안의 마크업을 글자로 이스케이프하므로 직접 넣는다.
      */}
      <noscript
        dangerouslySetInnerHTML={{
          __html:
            "<style>.book-leaf{display:block !important}.book-pager{display:none}</style>",
        }}
      />

      {/*
        책배 — 쌓인 종이의 잘린 면. 가로 실선이 낱장이고 바깥쪽(아래 장)이
        가장 어둡다. 민 그라디언트만 깔면 묶음이 아니라 색 띠로 보인다.
      */}
      <div className="relative px-[9px] pb-[5px]">
        <span
          aria-hidden
          className="book-edge absolute inset-y-0 left-0 w-[9px] rounded-l-[3px]"
          style={{ "--edge-fade": FORE_LEFT } as CSSProperties}
        />
        <span
          aria-hidden
          className="book-edge absolute inset-y-0 right-0 w-[9px] rounded-r-[3px]"
          style={{ "--edge-fade": FORE_RIGHT } as CSSProperties}
        />

        {/* 책이 두껍다는 표시 — 면 아래로 묶음이 한 겹 더 비어져 나온다. */}
        <span
          aria-hidden
          className="absolute inset-x-[14px] bottom-[2px] h-[3px] rounded-b-[2px]"
          style={{ background: STACK_NEAR }}
        />
        <span
          aria-hidden
          className="absolute inset-x-[19px] bottom-0 h-[3px] rounded-b-[2px]"
          style={{ background: STACK_FAR }}
        />

        {/*
          **면에 여백을 주면 안 된다.** 넘어가는 종이는 자기 폭(`.book` 의
          절반)을 기준으로 같은 바탕을 다시 깔아 밑면과 맞추는데, 바깥에 여백이
          있으면 두 그라디언트의 기준 폭이 달라져 왼쪽 면에 사각형 자국이
          생긴다. 여백은 `Page` 안의 줄들이 각자 가진다.

          **`overflow-hidden` 도 주지 않는다.** 넘어가는 종이는 원근 때문에
          책 폭 밖으로 삐져나오는데, 자르면 들리다 말고 잘려 보인다.
        */}
        <div
          className="book-pages relative rounded-[3px]"
          style={{
            // 접지의 깊이는 안쪽 그림자가, 묶음이 표지에 눌린 자국은
            // 바깥 그림자가 만든다. 한 겹으로는 둘 다 안 나온다.
            boxShadow:
              "inset 0 2px 10px -6px rgb(28 20 10 / .55), inset 0 -2px 10px -6px rgb(28 20 10 / .45), 0 1px 0 rgb(255 255 255 / .18), 0 6px 14px -8px rgb(0 0 0 / .55)",
          }}
        >
          <div className="book relative">
            {LEAVES.map((page, order) => (
              <div
                key={page.title}
                className={`book-leaf ${order === at ? "" : "hidden"}`}
              >
                <Page index={order} onOpen={open} />
              </div>
            ))}

            {flip && (
              <>
                {/* ② 떠나는 면의 안쪽 반쪽을 붙들어 둔다 */}
                <Half side={held} held>
                  <Page index={flip.from} onOpen={open} />
                </Half>

                {/* 들린 종이가 밑면에 드리우는 그림자 */}
                <span
                  aria-hidden
                  className={`leaf-cast leaf-cast-in leaf-cast-${held[0]}`}
                />
                <span
                  aria-hidden
                  className={`leaf-cast leaf-cast-out leaf-cast-${carried[0]}`}
                />

                {/* ③④ 돌아가는 종이 한 장 */}
                <div
                  aria-hidden
                  className={`leaf ${flip.dir === 1 ? "leaf-next" : "leaf-prev"}`}
                >
                  <div className="leaf-face">
                    <Half side={carried}>
                      <Page index={flip.from} onOpen={open} />
                    </Half>
                    <span className={`leaf-sheen leaf-sheen-${carried[0]}`} />
                  </div>
                  <div className="leaf-face leaf-face-back">
                    <Half side={held}>
                      <Page index={at} onOpen={open} />
                    </Half>
                    <span className={`leaf-sheen leaf-sheen-${held[0]}`} />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 책갈피 리본 — 접지에 꿰어 있으므로 넘어가는 면 위에 남는다. */}
          <span
            aria-hidden
            className="absolute top-0 left-1/2 z-[3] hidden h-16 w-2.5 -translate-x-[260%] sm:block"
            style={{
              background: RIBBON,
              clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)",
            }}
          />
        </div>
      </div>

      {/* 넘김은 조작이지 종이가 아니다 — 표지 위에 둔다. */}
      <footer className="book-pager flex items-center justify-between gap-3 px-1 py-3">
        <Turn label="이전 면" blocked={at === 0} onTurn={() => open(at - 1)} />

        <p className="text-xs" style={{ color: COVER_MUTED }}>
          <span className="tabular-nums">
            {left}–{left + 1}
          </span>
          <span className="hidden sm:inline"> · 방향키로도 넘깁니다</span>
        </p>

        <Turn
          label="다음 면"
          blocked={at === LEAVES.length - 1}
          onTurn={() => open(at + 1)}
        />
      </footer>

      <p aria-live="polite" className="sr-only">
        {left}쪽, {leaf.title}
      </p>
    </div>
  );
}
