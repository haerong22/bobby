import type { ReactNode } from "react";

import type { NewsStory } from "@/types/content";

/**
 * 신문 안쪽 면.
 *
 * **게임 모달과 정적 페이지가 같은 것을 쓴다** — 모달은 1면에서 기사를 눌러
 * 이 면으로 갈아끼우고, `/news/[id]` 는 이걸 서버에서 그린다.
 *
 * `"use client"` 를 붙이지 않는다. 받은 값을 그리기만 하므로 양쪽에서 다 된다.
 */

/**
 * 날짜는 **ISO 문자열을 잘라서** 만든다.
 *
 * `toLocaleDateString` 을 쓰면 서버와 브라우저의 표준시·로캘이 달라 정적
 * 페이지에서 hydration 이 어긋난다. 증상이 "가끔 날짜 한 칸이 다름" 이라
 * 찾기 어렵다.
 */
const formatDay = (iso: string) => iso.slice(0, 10).replaceAll("-", ".");

export default function NewsStoryFace({
  story,
  back,
}: {
  story: NewsStory;
  /** 1면으로 돌아가는 조작. 정적 페이지에서는 바깥 nav 가 맡으므로 비운다. */
  back?: ReactNode;
}) {
  return (
    <article>
      <div className="flex items-baseline justify-between gap-4 text-xs text-[var(--muted)]">
        <span>안쪽 면</span>
        {back}
      </div>

      <h2 className="mt-3 text-2xl leading-snug font-semibold text-balance sm:text-3xl">
        {story.title}
      </h2>

      <p className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-[var(--rule)] pb-3 text-xs text-[var(--muted)]">
        <span>{story.source}</span>
        {story.author && <span>{story.author}</span>}
        {story.points !== null && (
          <span className="tabular-nums">{story.points}점</span>
        )}
        <span className="tabular-nums">{formatDay(story.publishedAt)}</span>
      </p>

      {/*
        **링크를 두 번 걸지 않는다.** GeekNews 는 토픽 페이지가 곧 토론이라
        원문과 토론 주소가 같다 — 그대로 두면 같은 데로 가는 링크가 나란히 둘
        붙는다.
      */}
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {story.url && (
          <a
            href={story.url}
            target="_blank"
            rel="noreferrer noopener"
            className="text-[var(--accent)] underline underline-offset-2"
          >
            {story.url === story.discussion
              ? `${story.source} 에서 보기`
              : "원문 보기"}
          </a>
        )}
        {story.url !== story.discussion && (
          <a
            href={story.discussion}
            target="_blank"
            rel="noreferrer noopener"
            className="text-[var(--accent)] underline underline-offset-2"
          >
            토론 전체 보기
          </a>
        )}
      </div>

      {/* 피드가 요약을 주는 쪽(GeekNews). 투고자가 직접 쓴 글이다. */}
      {story.summary && (
        <div className="mt-6 border-l-2 border-[var(--rule)] pl-4">
          <p className="leading-relaxed break-words whitespace-pre-line">
            {story.summary}
          </p>
        </div>
      )}

      {story.comments.length > 0 && (
        <section className="mt-8">
          <h3 className="border-y border-[var(--ink)] py-1 text-xs font-semibold">
            독자 반응
          </h3>

          {/* 본문은 줄바꿈만 살린 글자다 — 원본 HTML 은 lib/news 에서 걷어냈다. */}
          <ol className="mt-4 gap-x-8 sm:columns-2 sm:[column-rule:1px_solid_var(--rule)]">
            {story.comments.map((comment) => (
              <li
                key={comment.id}
                className="mb-4 break-inside-avoid border-b border-[var(--rule)] pb-4"
              >
                <p className="text-xs text-[var(--muted)]">
                  {comment.author}
                  <span aria-hidden> · </span>
                  <span className="tabular-nums">
                    {formatDay(comment.publishedAt)}
                  </span>
                </p>
                {/*
                  댓글에는 끊을 자리가 없는 긴 주소가 섞여 들어온다. 안 끊으면
                  단 경계를 넘어 **옆 단 글자 위에 겹쳐 찍힌다.**
                */}
                <p className="mt-1.5 leading-relaxed break-words whitespace-pre-line">
                  {comment.text}
                </p>
              </li>
            ))}
          </ol>

          <p className="text-xs text-[var(--muted)]">
            전체 {story.commentCount}건 가운데 {story.comments.length}건.
          </p>
        </section>
      )}
    </article>
  );
}
