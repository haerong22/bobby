"use client";

import { useCallback, useEffect, useState } from "react";

type Props = {
  name: string;
  lines: readonly string[];
  onClose: () => void;
};

/**
 * 주민 대화창. 한 줄씩 보여 주고 Space / Enter / 클릭으로 넘긴다.
 *
 * 대화 중에는 게임이 멈춰 있어 Phaser 가 키를 받지 않으므로, 넘기는 입력은
 * 여기서 직접 듣는다.
 */
/**
 * 다른 주민에게 말을 걸면 처음부터 보여 줘야 한다. effect 로 index 를 되돌리면
 * 연쇄 렌더가 되므로, 쓰는 쪽에서 `key` 를 주어 리마운트시킨다 (TownStage 참고).
 */
export default function NpcDialogue({ name, lines, onClose }: Props) {
  const [index, setIndex] = useState(0);

  // onClose 를 setIndex 의 updater 안에서 부르면 안 된다. updater 는 순수해야 하고,
  // 그 안에서 부모의 state 를 바꾸면 React 가 무시해 대화창이 닫히지 않는다.
  const advance = useCallback(() => {
    if (index + 1 >= lines.length) {
      onClose();
      return;
    }
    setIndex(index + 1);
  }, [index, lines.length, onClose]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, onClose]);

  const last = index === lines.length - 1;

  return (
    <div
      role="dialog"
      aria-label={`${name} 와의 대화`}
      /*
        조작 버튼과 같은 이유로 `bottom-0` 에 붙이지 않는다 — 고정 위치는
        레이아웃 뷰포트 기준이라 모바일 브라우저의 주소창·탭바 뒤로 들어간다.
        `h-svh` 는 그 UI 가 떠 있을 때의 높이라 바닥이 늘 보이는 영역 안이다.
      */
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex h-svh items-end p-4"
      style={{
        paddingBottom: "max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))",
      }}
    >
      {/*
        넘기기는 **대화 상자 자체**가 받는다. 바깥 겹까지 받게 하면 화면
        전체가 클릭 판이 되어 좌상단 "텍스트로 보기" 같은 것이 가려진다.
      */}
      <div
        className="pointer-events-auto mx-auto w-full max-w-2xl rounded-lg border border-neutral-700 bg-neutral-900/95 p-5 shadow-xl"
        onClick={advance}
      >
        <p className="text-xs font-semibold text-amber-300">{name}</p>
        <p className="mt-2 min-h-12 text-sm leading-relaxed text-neutral-100">
          {lines[index]}
        </p>
        <p className="mt-3 text-right text-xs text-neutral-500">
          <kbd className="rounded bg-neutral-800 px-1.5 py-0.5">Space</kbd>{" "}
          {last ? "로 닫기" : "로 다음"}
        </p>
      </div>
    </div>
  );
}
