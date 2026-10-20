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

  if (error) return <p className="text-sm text-neutral-500">{error}</p>;
  if (!items) return <p className="text-sm text-neutral-500">신문을 받아오는 중...</p>;
  if (items.length === 0) {
    return <p className="text-sm text-neutral-500">오늘은 실린 기사가 없습니다.</p>;
  }

  return (
    <ol className="space-y-4">
      {items.map((item, index) => (
        <li key={item.url} className="flex gap-3">
          <span className="w-5 shrink-0 pt-0.5 text-right font-mono text-xs text-neutral-600">
            {index + 1}
          </span>
          <div className="min-w-0">
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-sm leading-snug text-neutral-100 underline-offset-2 hover:underline"
            >
              {item.title}
            </a>
            <p className="mt-1 text-xs text-neutral-500">
              {item.source}
              {item.points !== null && ` · ${item.points}점`}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
