import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Bobby's Town",
    template: "%s | Bobby's Town",
  },
  description: "마을을 돌아다니며 둘러보는 픽셀아트 포트폴리오",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
