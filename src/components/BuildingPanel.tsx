"use client";

import { useEffect, useRef } from "react";

import SectionContent from "./sections";
import type { Building } from "@/town/buildings";

type Props = {
  building: Building;
  onClose: () => void;
};

/**
 * 건물 안에서 보이는 내용. Phase 4 에서 src/content 의 JSON 을 받아
 * 건물별 패널로 갈라진다. 지금은 뼈대와 닫기 동작만 있다.
 */
export default function BuildingPanel({ building, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={building.label}
        className="max-h-[80dvh] w-full max-w-xl overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-900 p-6 text-neutral-100 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{building.label}</h2>
            <p className="mt-1 text-xs text-neutral-500">{building.route}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded border border-neutral-700 px-3 py-1 text-sm text-neutral-300 hover:bg-neutral-800"
          >
            닫기
          </button>
        </header>

        <SectionContent id={building.id} />

        <footer className="mt-8 border-t border-neutral-800 pt-4 text-xs text-neutral-500">
          <kbd className="rounded bg-neutral-800 px-1.5 py-0.5">Esc</kbd> 또는
          뒤로가기로 닫힙니다.
        </footer>
      </div>
    </div>
  );
}
