"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import BuildingPanel from "./BuildingPanel";
import DialogueBox from "./DialogueBox";
import ExploreProgress from "./ExploreProgress";
import TouchControls from "./TouchControls";
import { useCoarsePointer } from "./useCoarsePointer";
import type { BuildingId } from "@/town/buildings";
import { buildingById } from "@/town/buildings";
import { EventBus } from "@/town/EventBus";

/**
 * `ssr: false` 는 클라이언트 컴포넌트 안에서만 쓸 수 있다. 그래서 page.tsx
 * (서버 컴포넌트)가 metadata 를 들고 있게 두고, 이 래퍼가 Phaser 를 받는다.
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
  const [nearId, setNearId] = useState<BuildingId | null>(null);
  const [openId, setOpenId] = useState<BuildingId | null>(null);
  const touch = useCoarsePointer();

  useEffect(() => {
    const offNear = EventBus.on("door:near", ({ id }) => setNearId(id));
    const offAway = EventBus.on("door:away", () => setNearId(null));
    const offOpen = EventBus.on("building:open", ({ id }) => {
      setOpenId(id);
      EventBus.emit("game:pause", { reason: "building-panel" });
      // router.push 를 쓰면 라우트가 바뀌면서 Phaser 캔버스가 통째로 언마운트된다.
      // App Router 가 지원하는 shallow 갱신으로 주소만 바꾼다.
      window.history.pushState(null, "", buildingById(id).route);
    });
    return () => {
      offNear();
      offAway();
      offOpen();
    };
  }, []);

  // 모달을 열 때 히스토리를 한 칸 쌓으므로 뒤로가기가 곧 닫기다.
  useEffect(() => {
    const onPop = () => {
      setOpenId(null);
      EventBus.emit("game:resume", { reason: "popstate" });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const close = useCallback(() => {
    window.history.back();
  }, []);

  const nearLabel = nearId ? buildingById(nearId).label : null;

  return (
    <main>
      <GameCanvas />
      <ExploreProgress />

      {/* 게임을 켜고 싶지 않은 사람의 탈출구. 이게 없으면 "게임은 레이어다" 가
          말뿐이 된다. 스크린 리더에게도 canvas 바깥의 유일한 통로다. */}
      {!openId && (
        <Link
          href="/about"
          className="fixed top-4 left-4 z-30 rounded border border-neutral-700 bg-neutral-900/70 px-3 py-1.5 text-xs text-neutral-300 hover:text-neutral-50"
        >
          텍스트로 보기
        </Link>
      )}

      {/* 터치에서는 하단을 D-pad 가 쓰므로 프롬프트를 띄우지 않는다 —
          대신 입장 버튼이 활성화되는 것으로 알린다. */}
      {!touch && <DialogueBox label={openId ? null : nearLabel} />}

      {touch && !openId && <TouchControls canEnter={nearId !== null} />}

      {openId && (
        <BuildingPanel building={buildingById(openId)} onClose={close} />
      )}

      {!touch && !openId && !nearId && (
        <p className="pointer-events-none fixed bottom-3 left-1/2 -translate-x-1/2 text-xs text-neutral-500">
          방향키 또는 WASD 로 이동
          <span className="mx-2 text-neutral-700">·</span>
          <kbd className="rounded bg-neutral-800 px-1 py-0.5">-</kbd>
          <kbd className="ml-1 rounded bg-neutral-800 px-1 py-0.5">=</kbd> 로
          화면 배율
        </p>
      )}
    </main>
  );
}
