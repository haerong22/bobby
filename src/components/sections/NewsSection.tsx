"use client";

import { useEffect, useState } from "react";

import type { NewsItem } from "@/types/content";

/**
 * 신문사. 유일하게 JSON 이 아니라 네트워크에서 내용을 가져오는 섹션이라
 * 클라이언트 컴포넌트다. 모달과 정적 페이지 양쪽에서 같은 방식으로 동작한다.
 *
 * 대가: /news 정적 페이지가 뉴스 본문을 SSR 하지 않는다. 외부 글이라 색인 가치가
 * 낮아 감수한다.
 */
export default function NewsSection() {
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/news")
      .then((response) => response.json() as Promise<{ items: NewsItem[]; error: string | null }>)
      .then((data) => {
        if (!alive) return;
        setItems(data.items);
        setError(data.error);
      })
      .catch(() => {
        if (alive) setError("신문을 가져오지 못했습니다.");
      });
    return () => {
      alive = false;
    };
  }, []);

  if (error) return <p className="text-sm text-[var(--muted)]">{error}</p>;
  if (!items) return <p className="text-sm text-[var(--muted)]">신문을 받아오는 중…</p>;
  if (items.length === 0) {
    return <p className="text-sm text-[var(--muted)]">오늘은 실린 기사가 없습니다.</p>;
  }

  // 1면처럼 — 머리기사 하나를 크게 세우고 나머지는 두 단으로 흘린다.
  const [lead, ...rest] = items;
  return (
    <div>
      {lead && (
        <article className="border-b border-[var(--rule)] pb-4">
          <a
            href={lead.url}
            target="_blank"
            rel="noreferrer noopener"
            className="text-xl leading-snug font-semibold underline-offset-4 hover:underline"
          >
            {lead.title}
          </a>
          <p className="mt-1.5 text-xs text-[var(--muted)]">
            {lead.source}
            {lead.points !== null && ` · ${lead.points}점`}
          </p>
        </article>
      )}

      {/* 단 사이 세로 괘선 — 신문 조판의 표식이다. */}
      <ol className="mt-4 gap-x-8 sm:columns-2 sm:[column-rule:1px_solid_var(--rule)]">
        {rest.map((item) => (
          <li
            key={item.url}
            className="mb-3 break-inside-avoid border-b border-[var(--rule)] pb-3"
          >
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer noopener"
              className="leading-snug underline-offset-2 hover:underline"
            >
              {item.title}
            </a>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {item.source}
              {item.points !== null && ` · ${item.points}점`}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
