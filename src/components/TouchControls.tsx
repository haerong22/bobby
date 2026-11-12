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
    /*
      **`bottom-0` 에 바로 붙이면 안 된다.** 고정 위치는 *레이아웃* 뷰포트
      기준인데, 모바일 브라우저의 레이아웃 뷰포트는 주소창이 숨었을 때 크기다.
      그래서 주소창·탭바가 떠 있으면 바닥 버튼이 **그 뒤로 들어가 사라진다**
      (주소창이 아래 있는 브라우저에서 특히).

      `h-svh` 는 **브라우저 UI 가 떠 있을 때의 높이**(가장 작은 뷰포트)다.
      위에 붙여 놓고 그 높이만큼만 차지하면 바닥이 늘 보이는 영역 안에 있다.
      이 화면은 스크롤을 잠가 둬서 UI 가 접히지도 않으므로 `dvh` 보다 안전하다.

      거기에 홈 인디케이터·노치용 안전 영역을 더한다. `max()` 로 감싸 두면
      `viewport-fit=cover` 가 아니어서 `env()` 가 0 이어도 기본 여백이 남는다.
    */
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-40 flex h-svh items-end justify-between p-5 select-none"
      style={{
        paddingBottom: "max(1.5rem, calc(env(safe-area-inset-bottom) + 0.5rem))",
        paddingLeft: "max(1.25rem, env(safe-area-inset-left))",
        paddingRight: "max(1.25rem, env(safe-area-inset-right))",
      }}
    >
      <div className="pointer-events-auto grid grid-cols-3 grid-rows-3 gap-1.5">
        {DIRECTIONS.map((direction) => (
          <button
            key={direction.label}
            type="button"
            aria-label={direction.label}
            // 밝은 잔디 위에 올라가므로 바탕이 옅으면 버튼이 안 보인다.
            className={`${direction.area} h-14 w-14 rounded-lg border border-neutral-500 bg-neutral-950/85 text-xl text-neutral-100 shadow-lg shadow-black/40 active:bg-neutral-700`}
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
        // 꺼져 있어도 **버튼이 거기 있다는 것은 보여야 한다.** 너무 흐리게
        // 두면 문 앞에 서기 전까지 입장 수단이 있는 줄도 모른다.
        className={`pointer-events-auto h-20 w-20 rounded-full border text-sm font-semibold shadow-lg shadow-black/40 transition-colors ${
          canEnter
            ? "border-amber-300 bg-amber-400/35 text-amber-50"
            : "border-neutral-500 bg-neutral-950/85 text-neutral-400"
        }`}
      >
        입장
      </button>
    </div>
  );
}
