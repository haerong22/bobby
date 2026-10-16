"use client";

type Props = {
  label: string | null;
};

/** 문 앞에 섰을 때 뜨는 하단 프롬프트. */
export default function DialogueBox({ label }: Props) {
  return (
    // 내용을 조건부로 그린다. opacity 로만 숨기면 스크린 리더가 계속 읽는다.
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-8 flex justify-center"
    >
      {label && (
        <p className="rounded border border-neutral-700 bg-neutral-900/90 px-4 py-2 text-sm text-neutral-100">
          <span className="font-semibold">{label}</span>
          <span className="mx-2 text-neutral-500">·</span>
          <kbd className="rounded bg-neutral-700 px-1.5 py-0.5 text-xs">Space</kbd>
          <span className="ml-2 text-neutral-400">로 입장</span>
        </p>
      )}
    </div>
  );
}
