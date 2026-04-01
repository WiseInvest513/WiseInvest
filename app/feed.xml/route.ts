import { tweets } from "@/lib/data";
import { siteConfig } from "@/lib/config";

export async function GET() {
  const baseUrl = siteConfig.baseUrl;
  const siteName = siteConfig.name;

  // 取最新的 50 条推文
  const latestTweets = [...tweets]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 50);

  const items = latestTweets
    .map((tweet) => {
      const pubDate = new Date(tweet.date).toUTCString();
      const category = tweet.category
        .split(",")
        .map((c) => `<category><![CDATA[${c.trim()}]]></category>`)
        .join("");

      return `
    <item>
      <title><![CDATA[${tweet.title}]]></title>
      <link>${tweet.link}</link>
      <guid isPermaLink="true">${tweet.link}</guid>
      <pubDate>${pubDate}</pubDate>
      ${category}
      <description><![CDATA[${tweet.title} — 查看原文：${tweet.link}]]></description>
    </item>`;
    })
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${siteName} - 推文精选]]></title>
    <link>${baseUrl}/tweets</link>
    <description><![CDATA[${siteConfig.description}]]></description>
    <language>zh-CN</language>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <image>
      <url>${baseUrl}/favicon.ico</url>
      <title>${siteName}</title>
      <link>${baseUrl}</link>
    </image>
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
