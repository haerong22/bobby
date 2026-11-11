/**
 * 에셋 출처. 둘 다 CC-BY 4.0 이라 **표기가 법적 의무**다. 임의로 지우면 안 된다.
 *
 * 정적 페이지가 늘어날 때마다 같은 문단을 복사하다 한 군데를 빠뜨리는 쪽이
 * 위험해서 컴포넌트로 뺐다.
 */
export default function AssetCredits() {
  return (
    <footer className="mt-8 text-xs leading-relaxed text-[var(--muted)]">
      게임 아트{" "}
      <a
        href="https://aquumgifts.itch.io"
        target="_blank"
        rel="noreferrer noopener"
        className="underline underline-offset-2"
      >
        &ldquo;Cozy Town Lite&rdquo; by Spaceyyy
      </a>{" "}
      ·{" "}
      <a
        href="https://aquumgifts.itch.io"
        target="_blank"
        rel="noreferrer noopener"
        className="underline underline-offset-2"
      >
        &ldquo;Cozy Farm Village Lite&rdquo; by Bramble &amp; Byte
      </a>{" "}
      (CC-BY 4.0)
    </footer>
  );
}
