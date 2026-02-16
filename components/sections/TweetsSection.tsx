"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ExternalLink, Eye } from "lucide-react";
import { tweets } from "@/lib/data";
import { SectionCardShell } from "@/components/sections/SectionCardShell";
import { openSafeExternalUrl } from "@/lib/security/external-links";

const TYPE_ALIAS_MAP: Record<string, "干货" | "教程" | "日常" | "资讯"> = {
  "干货": "干货",
  "dry goods": "干货",
  "教程": "教程",
  "tutorial": "教程",
  "日常": "日常",
  "daily": "日常",
  "资讯": "资讯",
  "news": "资讯",
};

function normalizeTweetType(type: string): "干货" | "教程" | "日常" | "资讯" {
  const candidates = type
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  for (const candidate of candidates) {
    const key = candidate.toLowerCase();
    if (TYPE_ALIAS_MAP[key]) {
      return TYPE_ALIAS_MAP[key];
    }
  }

  return "资讯";
}

export function TweetsSection() {
  // 只显示前9个推文（三排）
  const displayedTweets = tweets.slice(0, 9);

  const getBadgeStyle = (type: string) => {
    const normalizedType = normalizeTweetType(type);
    if (normalizedType === "干货" || normalizedType === "教程") {
      return "bg-yellow-400 text-black";
    }
    return "bg-slate-100 text-slate-600";
  };

  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-center mb-10 text-slate-900 dark:text-white tracking-tight relative inline-block w-full">
        <span className="relative inline-block">
          精选推文 & 干货
          <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-30" />
        </span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 max-w-6xl mx-auto">
        {displayedTweets.map((tweet) => (
                <div
                  key={tweet.id}
                  className="cursor-pointer h-full"
                  onClick={() => {
                    openSafeExternalUrl(tweet.link);
                  }}
                >
                  <SectionCardShell
                    className="h-full"
                    contentClassName="p-6"
                    watermarkSrc="https://cdn.simpleicons.org/x/000000"
                    watermarkAlt=""
                  >
                    <Card
                      className="border-0 shadow-none p-0 bg-transparent relative z-10 h-full flex flex-col"
                    >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs text-muted-foreground">
                        {tweet.date}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getBadgeStyle(
                          tweet.type
                        )}`}
                      >
                        {normalizeTweetType(tweet.type)}
                      </span>
                    </div>
                    <h3 className="font-heading text-lg font-bold line-clamp-2 leading-tight">
                      {tweet.title}
                    </h3>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3 flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      点击查看完整内容...
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0 pb-4 justify-between items-center">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Eye className="h-3.5 w-3.5" />
                      <span className="font-mono">
                        {tweet.views >= 1000
                          ? `${(tweet.views / 1000).toFixed(1)}k`
                          : tweet.views}
                      </span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </CardFooter>
                    </Card>
                  </SectionCardShell>
                </div>
      ))}
      </div>
    </section>
  );
}
