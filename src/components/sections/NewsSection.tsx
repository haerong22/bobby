"use client";

import { useEffect, useState } from "react";

import NewsStoryFace from "./NewsStory";
import type { NewsItem, NewsStory } from "@/types/content";

/**
 * 신문사. 유일하게 JSON 이 아니라 네트워크에서 내용을 가져오는 섹션이라
 * 클라이언트 컴포넌트다. 모달과 정적 페이지 양쪽에서 같은 방식으로 동작한다.
 *
 * 면이 둘이다 — **1면**(머리기사 + 두 단)과 **안쪽 면**(기사 하나의 정보와
 * 독자 반응). 기사 제목을 누르면 안쪽 면으로 갈아끼운다.
 *
 * **히스토리를 쌓지 않는다.** `TownStage` 가 popstate 를 모달 닫기로 쓰고
 * 있어서, 여기서 한 칸 쌓으면 안쪽 면에서 뒤로가기를 눌렀을 때 1면이 아니라
 * 모달이 통째로 닫힌다. 책의 면 넘김과 같은 규칙이다.
 *
 * 대가: /news 정적 페이지가 뉴스 본문을 SSR 하지 않는다. 외부 글이라 색인
 * 가치가 낮아 감수한다. 다만 **제목은 진짜 링크**(`/news/[id]`)라 JS 가 꺼져
 * 있어도 안쪽 면으로 갈 수 있다.
 */
export default function NewsSection() {
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/news")
      .then(
        (response) =>
          response.json() as Promise<{ items: NewsItem[]; error: string | null }>,
      )
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

  if (openId) {
    // 다른 기사를 열 때는 effect 로 상태를 되돌리지 말고 key 로 리마운트시킨다.
    return <Inside key={openId} id={openId} onBack={() => setOpenId(null)} />;
  }

  if (error) return <p className="text-sm text-[var(--muted)]">{error}</p>;
  if (!items) return <p className="text-sm text-[var(--muted)]">신문을 받아오는 중…</p>;
  if (items.length === 0) {
    return <p className="text-sm text-[var(--muted)]">오늘은 실린 기사가 없습니다.</p>;
  }

  // 1면처럼 — 머리기사 하나를 크게 세우고 나머지는 두 단으로 흘린다.
  const [lead, ...rest] = items;
  return (
    <div>
      <p className="text-xs text-[var(--muted)]">제1면</p>

      {lead && (
        <article className="mt-3 border-b border-[var(--rule)] pb-4">
          <Headline item={lead} onOpen={setOpenId} className="text-xl font-semibold" />
          <Byline item={lead} />
        </article>
      )}

      {/* 단 사이 세로 괘선 — 신문 조판의 표식이다. */}
      <ol className="mt-4 gap-x-8 sm:columns-2 sm:[column-rule:1px_solid_var(--rule)]">
        {rest.map((item) => (
          <li
            key={item.id}
            className="mb-3 break-inside-avoid border-b border-[var(--rule)] pb-3"
          >
            <Headline item={item} onOpen={setOpenId} />
            <Byline item={item} />
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * 기사 제목.
 *
 * **진짜 링크 위에 동작을 얹는다.** JS 가 꺼져 있으면 `/news/[id]` 로 넘어가고,
 * 켜져 있으면 그 자리에서 안쪽 면으로 갈린다. 가운데 클릭·새 탭도 그대로 된다.
 */
function Headline({
  item,
  onOpen,
  className = "",
}: {
  item: NewsItem;
  onOpen: (id: string) => void;
  className?: string;
}) {
  return (
    <a
      href={`/news/${item.id}`}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        onOpen(item.id);
      }}
      className={`leading-snug underline-offset-2 hover:underline ${className}`}
    >
      {item.title}
    </a>
  );
}

function Byline({ item }: { item: NewsItem }) {
  return (
    <p className="mt-1 text-xs text-[var(--muted)]">
      {item.source}
      {item.points !== null && ` · ${item.points}점`}
    </p>
  );
}

/** 안쪽 면. 기사 하나를 펼쳐 놓는다. */
function Inside({ id, onBack }: { id: string; onBack: () => void }) {
  const [story, setStory] = useState<NewsStory | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/news/${id}`)
      .then(
        (response) =>
          response.json() as Promise<{
            story: NewsStory | null;
            error: string | null;
          }>,
      )
      .then((data) => {
        if (!alive) return;
        setStory(data.story);
        setError(data.error);
      })
      .catch(() => {
        if (alive) setError("기사를 가져오지 못했습니다.");
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const back = (
    <button
      type="button"
      onClick={onBack}
      className="text-[var(--accent)] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    >
      1면으로
    </button>
  );

  if (error || (!story && error !== null)) {
    return (
      <div>
        <div className="flex justify-end">{back}</div>
        <p className="mt-3 text-sm text-[var(--muted)]">{error}</p>
      </div>
    );
  }

  if (!story) {
    return (
      <div>
        <div className="flex justify-end">{back}</div>
        <p className="mt-3 text-sm text-[var(--muted)]">기사를 펼치는 중…</p>
      </div>
    );
  }

  return <NewsStoryFace story={story} back={back} />;
}
