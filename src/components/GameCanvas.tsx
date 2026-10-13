"use client";

import Phaser from "phaser";
import { useEffect, useRef, useState } from "react";

import { EventBus } from "@/town/EventBus";
import { createGameConfig } from "@/town/config";

/**
 * Phaser 인스턴스의 라이프사이클만 책임진다. 이 컴포넌트는 반드시
 * `ssr: false` 로 불려야 한다 — Phaser 가 import 시점에 `window` 를 만진다.
 */
export default function GameCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // StrictMode 는 개발 중 effect 를 두 번 실행한다. 이 가드가 없으면
    // Phaser.Game 이 두 개 생성되고 캔버스도 두 개 뜬다.
    if (!hostRef.current || gameRef.current) return;

    gameRef.current = new Phaser.Game(createGameConfig(hostRef.current));

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
      EventBus.clear();
    };
  }, []);

  useEffect(() => EventBus.on("game:ready", () => setReady(true)), []);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#0f1117]">
      <div ref={hostRef} className="h-full w-full" />
      {!ready && (
        <p className="absolute inset-0 grid place-items-center text-sm text-neutral-500">
          마을을 불러오는 중...
        </p>
      )}
    </div>
  );
}
