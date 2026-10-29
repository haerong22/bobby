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
      className="fixed inset-x-0 bottom-0 z-50 p-4"
      onClick={advance}
    >
      <div className="mx-auto max-w-2xl rounded-lg border border-neutral-700 bg-neutral-900/95 p-5 shadow-xl">
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
