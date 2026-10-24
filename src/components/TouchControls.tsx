"use client";

import { useCallback, useEffect } from "react";

import { EventBus } from "@/town/EventBus";
import { clearTouchAxis, setTouchAxis } from "@/town/touchInput";

type Axis = { x: number; y: number };

const DIRECTIONS: { label: string; axis: Axis; area: string }[] = [
  { label: "↑", axis: { x: 0, y: -1 }, area: "col-start-2 row-start-1" },
  { label: "←", axis: { x: -1, y: 0 }, area: "col-start-1 row-start-2" },
  { label: "→", axis: { x: 1, y: 0 }, area: "col-start-3 row-start-2" },
  { label: "↓", axis: { x: 0, y: 1 }, area: "col-start-2 row-start-3" },
];

/**
 * 터치 기기용 조작. 키보드가 없으면 캐릭터가 아예 움직이지 않으므로
 * 포트폴리오를 폰으로 여는 경우를 위해 반드시 필요하다.
 */
export default function TouchControls({ canEnter }: { canEnter: boolean }) {
  // 손가락을 버튼 밖에서 떼면 pointerup 이 버튼에 오지 않아 계속 걷는다.
  useEffect(() => {
    const stop = () => clearTouchAxis();
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, []);

  useEffect(() => clearTouchAxis, []);

  const press = useCallback((axis: Axis) => setTouchAxis(axis.x, axis.y), []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-end justify-between p-5 select-none">
      <div className="pointer-events-auto grid grid-cols-3 grid-rows-3 gap-1.5">
        {DIRECTIONS.map((direction) => (
          <button
            key={direction.label}
            type="button"
            aria-label={direction.label}
            className={`${direction.area} h-14 w-14 rounded-lg border border-neutral-600 bg-neutral-900/70 text-xl text-neutral-200 active:bg-neutral-700`}
            onPointerDown={(event) => {
              // 길게 눌렀을 때 선택·확대가 끼어들지 않게 한다.
              event.currentTarget.setPointerCapture(event.pointerId);
              press(direction.axis);
            }}
            onPointerUp={clearTouchAxis}
            onPointerCancel={clearTouchAxis}
            onContextMenu={(event) => event.preventDefault()}
          >
            {direction.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={!canEnter}
        onClick={() => EventBus.emit("game:interact", { source: "touch" })}
        className={`pointer-events-auto h-20 w-20 rounded-full border text-sm font-semibold transition-opacity ${
          canEnter
            ? "border-amber-400/60 bg-amber-400/20 text-amber-100"
            : "border-neutral-700 bg-neutral-900/50 text-neutral-600 opacity-50"
        }`}
      >
        입장
      </button>
    </div>
  );
}
