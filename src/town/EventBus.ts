import type { BuildingId } from "./buildings";

/**
 * Phaser 씬과 React UI 사이의 유일한 통로.
 *
 * Phaser 를 import 하지 않는다 — Phaser.Events.EventEmitter 를 쓰면 이 모듈을
 * 건드리는 쪽마다 Phaser 가 따라붙고, 서버 컴포넌트에서 실수로 import 하는 순간
 * `window` 참조로 터진다. 이벤트 이름까지 타입으로 잡히는 쪽이 덤이다.
 */
export type TownEventMap = {
  "game:ready": { scene: string };
  /** 출입문 앞 칸에 들어섰다 / 벗어났다. 진입 프롬프트를 띄우는 신호. */
  "door:near": { id: BuildingId };
  "door:away": { id: BuildingId };
  /** 문 앞에서 Space 를 눌렀다. React 가 모달을 연다. */
  "building:open": { id: BuildingId };
  /** 모달이 열려 게임 입력을 끊어야 한다 / 닫혀 되돌려야 한다. */
  "game:pause": { reason: string };
  "game:resume": { reason: string };
};

type Handler<T> = (payload: T) => void;

class TownEventBus {
  /**
   * 값을 `Set<unknown>` 으로 들고 있는 이유: 제네릭 키로 매핑 타입에 쓰려고 하면
   * TS 가 모든 payload 의 교집합을 요구해서 막는다. 저장소를 느슨하게 두고
   * 좁히는 지점을 아래 두 곳으로 가둔다.
   */
  private handlers = new Map<keyof TownEventMap, Set<unknown>>();

  private setFor<K extends keyof TownEventMap>(event: K) {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    return set as Set<Handler<TownEventMap[K]>>;
  }

  /** 해제 함수를 돌려준다. React effect 에서 그대로 return 하면 된다. */
  on<K extends keyof TownEventMap>(event: K, handler: Handler<TownEventMap[K]>) {
    this.setFor(event).add(handler);
    return () => this.off(event, handler);
  }

  off<K extends keyof TownEventMap>(
    event: K,
    handler: Handler<TownEventMap[K]>,
  ) {
    this.handlers.get(event)?.delete(handler);
  }

  emit<K extends keyof TownEventMap>(event: K, payload: TownEventMap[K]) {
    const set = this.handlers.get(event) as
      | Set<Handler<TownEventMap[K]>>
      | undefined;
    set?.forEach((handler) => handler(payload));
  }

  /** 씬을 destroy 할 때 구독이 남지 않도록 비운다. */
  clear() {
    this.handlers.clear();
  }
}

export const EventBus = new TownEventBus();
