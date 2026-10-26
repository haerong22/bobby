import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";
import { BUILDINGS } from "@/town/buildings";

/** 게임은 색인이 안 되므로, 정적 폴백 페이지들이 사실상 이 사이트의 본문이다. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    ...BUILDINGS.map((building) => ({
      url: `${SITE_URL}${building.route}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
