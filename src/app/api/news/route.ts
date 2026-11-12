import { loadNews } from "@/lib/news";

/**
 * 1면에 실을 목록. 내용은 `src/lib/news.ts` 가 만든다 — 정적 페이지가 같은
 * 함수를 직접 부르므로 로더를 라우트에 두지 않는다.
 */
export async function GET() {
  // 실패해도 200 으로 돌려준다. 화면은 문구를 그릴 뿐 깨지지 않는다.
  return Response.json(await loadNews());
}
