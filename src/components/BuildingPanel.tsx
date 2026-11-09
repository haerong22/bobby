"use client";

import { useEffect, useRef } from "react";

import SectionContent from "./sections";
import Document, {
  AIRMAIL,
  PANEL_EDGE,
  PANEL_FILL,
  WIDE,
} from "./sections/Document";
import { SECTION_THEMES, themeVars } from "./sections/theme";
import type { Building } from "@/town/buildings";

type Props = {
  building: Building;
  onClose: () => void;
};

/**
 * 건물 안에서 보이는 내용.
 *
 * **모달은 테마를 입힌 카드가 아니라 그 건물이 건네주는 문서다.** 문서의 겉모습
 * (테두리·여백선·직인·우표…)은 전부 `Document` 가 그리고, 정적 페이지도 같은
 * 것을 쓴다. 여기 남는 것은 모달 노릇뿐이다 — 어둡게 덮기, 포커스, Esc, 스크롤.
 *
 * 패널은 여백을 주지 않는다. `Document` 가 자기 여백을 가지므로, 카드 상단 띠나
 * 바인더 기둥처럼 **종이 끝까지 가야 하는 장치**가 여백에 잘리지 않는다.
 */

export default function BuildingPanel({ building, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const theme = SECTION_THEMES[building.id];

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

  const envelope = building.id === "post";
  // 책은 세로로도 크다. 서류와 같은 높이로 자르면 노트북 화면에서 표지 아래가
  // 잘려 책이 끝나지 않은 것처럼 보인다.
  const tall = WIDE[building.id];

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={building.label}
        style={{
          ...themeVars(theme),
          ...(envelope ? { background: AIRMAIL, padding: 6 } : null),
        }}
        className={`w-full overflow-hidden shadow-2xl ${
          tall ? "max-h-[93dvh] max-w-6xl" : "max-h-[85dvh] max-w-xl"
        } ${PANEL_EDGE[building.id]} ${
          theme.serif ? "font-serif" : "font-sans"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{ background: PANEL_FILL[building.id] ?? "var(--paper)" }}
          className={`overflow-y-auto overscroll-contain text-[var(--ink)] ${
            tall ? "max-h-[93dvh]" : "max-h-[calc(85dvh-12px)]"
          }`}
        >
          <Document
            id={building.id}
            label={building.label}
            level={2}
            action={
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="shrink-0 border border-[var(--rule)] bg-[var(--paper)] px-3 py-1 text-sm text-[var(--muted)] hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                닫기
              </button>
            }
            foot={
              <>
                <kbd className="border border-[var(--rule)] px-1.5 py-0.5">
                  Esc
                </kbd>{" "}
                또는 뒤로가기로 닫힙니다.
              </>
            }
          >
            <SectionContent id={building.id} />
          </Document>
        </div>
      </div>
    </div>
  );
}
