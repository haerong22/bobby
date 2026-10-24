"use client";

import { useSyncExternalStore } from "react";

import {
  getServerVisited,
  getVisited,
  subscribeVisited,
  TOTAL_BUILDINGS,
} from "@/town/visited";

/** 들어가 본 건물 수. 전부 돌면 한 번 칭찬해 준다. */
export default function ExploreProgress() {
  const visited = useSyncExternalStore(
    subscribeVisited,
    getVisited,
    getServerVisited,
  );
  const done = visited.length === TOTAL_BUILDINGS;

  return (
    <p className="pointer-events-none fixed top-4 right-4 z-30 rounded border border-neutral-700 bg-neutral-900/70 px-3 py-1.5 text-xs text-neutral-300">
      {done
        ? "마을을 전부 둘러봤습니다"
        : `탐험 ${visited.length} / ${TOTAL_BUILDINGS}`}
    </p>
  );
}
