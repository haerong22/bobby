"use client";

import { useSyncExternalStore } from "react";

/**
 * 손가락 조작을 띄울 것인가.
 *
 * **틀렸을 때의 대가가 비대칭이다.** 잘못 띄우면 화면에 안 쓰는 버튼이 생길
 * 뿐이지만, 잘못 숨기면 키보드가 없는 사람은 **게임을 아예 못 한다.** 그래서
 * 아래 넷 중 하나라도 걸리면 띄운다.
 *
 *   ① 화면을 한 번이라도 건드렸다 — 가장 확실한 증거
 *   ② `(any-pointer: coarse)` — 쓸 수 있는 포인터 중에 손가락이 있다
 *   ③ `navigator.maxTouchPoints > 0`
 *   ④ 화면이 좁다 (40rem 이하)
 *
 * **`(pointer: coarse)` 하나로 보면 안 된다.** 그건 "*주된* 포인터가
 * 손가락인가" 라서 마우스와 터치를 둘 다 가진 기기에서 거짓이 된다 —
 * 트랙패드 붙인 아이패드, 터치 노트북, 터치 에뮬레이션을 끈 개발자 도구.
 * 거기서 버튼이 통째로 사라졌다.
 *
 * ④ 는 원래 일부러 뺐던 조건이다 ("창을 줄인 데스크톱에 D-pad 가 뜬다").
 * 그 대가는 안 쓰는 버튼 하나고, 빠뜨렸을 때의 대가는 조작 불능이라 바꿨다.
 *
 * React state 가 아니라 외부 스토어다 — 값이 실제로 React 바깥(미디어 쿼리와
 * 이벤트)에 살고, effect 안에서 setState 로 끌어오면 lint 가 연쇄 렌더로 잡는다.
 */

const COARSE = "(any-pointer: coarse)";
const NARROW = "(max-width: 40rem)";

/** 한 번이라도 화면을 건드렸는가. 판정이 틀렸을 때의 그물. */
let touched = false;

function subscribe(onChange: () => void) {
  const queries = [window.matchMedia(COARSE), window.matchMedia(NARROW)];
  const onTouch = () => {
    touched = true;
    onChange();
  };
  for (const query of queries) query.addEventListener("change", onChange);
  window.addEventListener("touchstart", onTouch, { passive: true });
  return () => {
    for (const query of queries) query.removeEventListener("change", onChange);
    window.removeEventListener("touchstart", onTouch);
  };
}

const getSnapshot = () =>
  touched ||
  window.matchMedia(COARSE).matches ||
  navigator.maxTouchPoints > 0 ||
  window.matchMedia(NARROW).matches;

/** 서버에서는 false. 그래야 SSR 결과와 첫 렌더가 어긋나지 않는다. */
const getServerSnapshot = () => false;

export function useTouchInput() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
