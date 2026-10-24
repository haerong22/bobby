"use client";

import { useEffect, useState } from "react";

/**
 * 터치 기기인지. 화면 폭이 아니라 포인터 종류로 판단한다 — 작은 창으로 줄인
 * 데스크톱에 D-pad 를 띄우거나, 큰 태블릿에서 빠뜨리지 않기 위해서다.
 *
 * 서버에서는 false 로 시작한다. 그래야 SSR 결과와 첫 렌더가 어긋나지 않는다.
 */
export function useCoarsePointer() {
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse)");
    const sync = () => setCoarse(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return coarse;
}
