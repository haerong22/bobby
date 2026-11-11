import localFont from "next/font/local";

/**
 * 신문 제호용 고딕체(blackletter).
 *
 * **신문처럼 보이게 하는 건 이름이 아니라 이 글자꼴이다.** 뉴욕타임스·워싱턴
 * 포스트·보스턴 글로브가 전부 이 계열을 쓴다. 보통 세리프로 크게 쓰면 그냥
 * 제목이고, 고딕체여야 제호로 읽힌다.
 *
 * **폰트 파일을 레포에 넣고 `next/font/local` 로 쓴다.** `next/font/google` 은
 * 빌드 때 구글에서 받아오므로 네트워크가 막히면 빌드가 죽는다. latin 서브셋
 * 22KB 라 넣어 두는 편이 싸다.
 *
 * UnifrakturMaguntia, SIL Open Font License 1.1.
 * 라이선스 전문은 `src/app/fonts/OFL-UnifrakturMaguntia.txt` — **지우면 안 된다.**
 */
export const masthead = localFont({
  src: "./fonts/UnifrakturMaguntia-latin.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  // 제호 한 줄에만 쓰므로 못 불러와도 세리프로 떨어지면 그만이다.
  fallback: ["ui-serif", "Georgia", "serif"],
});
