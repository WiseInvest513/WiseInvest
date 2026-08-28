import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/account/",
          "/login",
          "/test/",
          "/test-data/",
          "/test-simple/",
          "/test-colors/",
          "/layout-debug",
          "/tools/price-tester",
          "/tools/god-mode/crypto-yields/test/",
        ],
      },
    ],
    sitemap: `${siteConfig.baseUrl}/sitemap.xml`,
  };
}
