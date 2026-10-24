import type { BuildingId } from "./buildings";
import { BUILDINGS } from "./buildings";
import { EventBus } from "./EventBus";

/**
 * 들어가 본 건물 기록. localStorage 에 남는다.
 *
 * React state 가 아니라 외부 스토어로 둔다 — 실제로 React 바깥(브라우저 저장소)에
 * 사는 값이고, effect 안에서 setState 로 끌어오면 불필요한 연쇄 렌더가 생긴다.
 * `useSyncExternalStore` 로 읽으면 SSR 과 하이드레이션도 React 가 알아서 맞춘다.
 */
const STORAGE_KEY = "town:visited";

/** 서버 스냅샷은 항상 같은 참조여야 한다. 매번 새 배열을 주면 무한 렌더가 된다. */
const EMPTY: readonly BuildingId[] = [];

function load(): readonly BuildingId[] {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return EMPTY;
    const known = new Set<string>(BUILDINGS.map((building) => building.id));
    return parsed.filter(
      (value): value is BuildingId =>
        typeof value === "string" && known.has(value),
    );
  } catch {
    // 저장값이 깨져 있어도 진행도 때문에 게임이 멈추면 안 된다.
    return EMPTY;
  }
}

let snapshot: readonly BuildingId[] =
  typeof window === "undefined" ? EMPTY : load();

const listeners = new Set<() => void>();

function markVisited(id: BuildingId) {
  if (snapshot.includes(id)) return;
  snapshot = [...snapshot, id];
  globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  EventBus.on("building:open", ({ id }) => markVisited(id));
}

export function subscribeVisited(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getVisited() {
  return snapshot;
}

export function getServerVisited() {
  return EMPTY;
}

export const TOTAL_BUILDINGS = BUILDINGS.length;
