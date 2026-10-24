/**
 * 터치 조작이 쓰는 방향 입력.
 *
 * EventBus 로 흘리지 않는 이유: 방향 입력은 프레임마다 읽히는 "상태"지
 * 한 번 일어나는 "사건"이 아니다. 매 프레임 이벤트를 쏘면 낭비다.
 * 키보드와 같은 층위의 입력 장치 하나라고 보면 된다.
 */
const state = { x: 0, y: 0 };

/** -1, 0, 1 로 정규화해 둔다. 대각선 정규화는 Player 가 한다. */
export function setTouchAxis(x: number, y: number) {
  state.x = Math.sign(x);
  state.y = Math.sign(y);
}

export function clearTouchAxis() {
  state.x = 0;
  state.y = 0;
}

export function readTouchAxis() {
  return state;
}
