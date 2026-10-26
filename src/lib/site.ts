/**
 * 사이트의 공개 주소. OG 이미지와 sitemap 이 절대 주소를 만들 때 쓴다.
 *
 * 도메인을 코드에 박지 않는다. 아직 배포 전이라 추측한 주소를 넣으면 틀리고,
 * 틀린 OG 주소는 링크 미리보기가 깨진 뒤에야 드러난다.
 *
 * 우선순위:
 *   1. NEXT_PUBLIC_SITE_URL — 커스텀 도메인을 붙이면 이걸 설정한다
 *   2. VERCEL_PROJECT_PRODUCTION_URL — Vercel 이 빌드 때 자동으로 넣어준다
 *   3. localhost — 로컬 개발
 */
function resolveSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();

export const SITE = {
  name: "Bobby's Town",
  description: "마을을 돌아다니며 둘러보는 픽셀아트 포트폴리오",
} as const;
