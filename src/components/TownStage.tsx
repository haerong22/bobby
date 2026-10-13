"use client";

import dynamic from "next/dynamic";

/**
 * `ssr: false` 는 클라이언트 컴포넌트 안에서만 쓸 수 있다. 그래서 page.tsx
 * (서버 컴포넌트)가 metadata 를 들고 있게 두고, 이 얇은 래퍼가 Phaser 를 받는다.
 */
const GameCanvas = dynamic(() => import("./GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="grid h-dvh w-full place-items-center bg-[#0f1117] text-sm text-neutral-500">
      마을을 불러오는 중...
    </div>
  ),
});

export default function TownStage() {
  return (
    <main>
      <GameCanvas />
      <p className="pointer-events-none fixed bottom-3 left-1/2 -translate-x-1/2 text-xs text-neutral-500">
        방향키 또는 WASD 로 이동
      </p>
    </main>
  );
}
