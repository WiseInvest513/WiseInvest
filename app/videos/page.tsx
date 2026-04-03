"use client";

import { useState, useMemo, useEffect } from "react";
import { ChevronDown, ChevronRight, Search, Play, Calendar, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── 工具函数 ───────────────────────────────────────────────
function getYoutubeId(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^?&\s]+)/);
  return match ? match[1] : "";
}

// 简单 UID（取视频 id hash 前8位）
function genVideoUid(id: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let h = id * 2654435761;
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars[Math.abs(h >> (i * 4)) % chars.length];
  }
  return result;
}

// ─── 数据 ──────────────────────────────────────────────────
interface Video {
  id: number;
  title: string;
  date: string;
  youtubeLink: string;
  category: string;
}

const videoData: Video[] = [
  { id: 16, title: "2026 年全网最全最详细致富证券开户教程、国内用户仅凭身份证即可完成开户、国内用户可使用的香港券商，成立 46 年，46年港资零售券商No.1！", date: "2026-02-15", youtubeLink: "https://youtu.be/pCsQo_aIrWk?si=-4ePntuEPlUEGWAb", category: "券商" },
  { id: 15, title: "2026 年全网最全最详细 Bitget 虚拟 U 卡入金盈透教程｜盈透入金教程｜虚拟 U 卡入金盈透｜券商入金教程，最快四小时即可到账、没有港卡入金盈透最佳选择、加密入金券商最佳选择！", date: "2026-02-08", youtubeLink: "https://youtu.be/9ji8KUh9ojs?si=VwFzDGHpX4nxMMP4", category: "出入金" },
  { id: 14, title: "2026 年全网最全最详细 港卡绑定微信在国内消费、港卡绑定、港卡国内消费、众安绑定微信支付、众安绑卡、出金详细教程、港卡出金详细流程、超低手续费完成港卡中资金的国内消费、港卡消费教程！", date: "2026-01-20", youtubeLink: "https://youtu.be/GG5qdaUgScc?si=LAKhCsdqxmh1NJ2a", category: "出入金" },
  { id: 1,  title: "2026 年全网最新最全领取推特创作者激励｜X 认证｜Stripe 认证｜X 开通创作收益｜推特创作者收益｜领取推特创作者收益｜推特创作者收益计划", date: "2026-01-15", youtubeLink: "https://youtu.be/h50rjDBiTIg", category: "赚钱" },
  { id: 13, title: "2026 年全网最全最详细 SafePal 入金盈透、众安入金盈透、入金盈透教程、虚拟 U 卡入金盈透、港卡入金盈透教程，无港卡入金最全解决方案，再不用担心无法投资美股了", date: "2026-01-11", youtubeLink: "https://youtu.be/6NoGmOejUsI?si=AZi1IyDsQgSHWJdi", category: "出入金" },
  { id: 2,  title: "2025 年全网最全最详细Wise身份证注册开通教程、Wise 注册+激活全流程、仅凭身份证即可开通港户最全教程、打通我们转账不便的围墙、帮助我们进行快速的资金流转！", date: "2026-01-10", youtubeLink: "https://youtu.be/BB7KtDfbXsU", category: "投资" },
  { id: 3,  title: "2025 年全网最全最详细 SafePal 出金国内银行卡教程、帮助我们打通 web2 和 web3 的不便捷性，SafaPal出金国内银行卡，SafePal出金教程！", date: "2026-01-05", youtubeLink: "https://youtu.be/WWZiufXWkqE", category: "虚拟 U 卡,出入金" },
  { id: 4,  title: "2025 年全网最全最详细的 SafePal 虚拟 U卡开设教程｜官方认证推荐小白开卡必看视频、开卡即免费赠送价值 350 元冷钱包，无开卡费用与无年费｜币圈/出海/订购海外优秀产品必备神卡", date: "2025-12-28", youtubeLink: "https://youtu.be/1Lw8VssYFNE", category: "虚拟 U 卡" },
  { id: 5,  title: "2025 年全网最全最详细的 Bitget 虚拟 U卡开设教程｜全网首个零费率虚拟 U 卡，无开卡费用、无充值与消费手续费、无年费｜币圈/出海/订购海外优秀产品必备神卡，开卡即可领取 5u 空投奖励！", date: "2025-12-21", youtubeLink: "https://youtu.be/ZxElS0gVpY4", category: "虚拟 U 卡" },
  { id: 6,  title: "存款小于 20 万&月薪低于 8K 应该如何在 web3通过结构化优势赚钱，我们普通人无法实现财富跃迁的根本原因是什么？如果你想要在 26 年有一个清晰的努力方向，那本期视频或许会给你一个答案！", date: "2025-12-14", youtubeLink: "https://youtu.be/2_Dar77OX5M", category: "赚钱" },
  { id: 7,  title: "2025 年全网最全最详细币安 alpha教程、欧易 Boost 教程，币安 alpha 空投教程、欧易 Boost 空投教程，币安 alpha&欧易 Boost 是否真的还能够赚钱？本期视频给你答案", date: "2025-12-07", youtubeLink: "https://youtu.be/frRapUcAFPI", category: "alpha" },
  { id: 8,  title: "2025 年全网最详细币安 alpha 刷交易量教程，可通过磨损控制在 2U 的情况下刷到 3w 交易量、币安 alpha 教程、币安、币安alpha、币安空投、币安教程、刷 alpha 教程。", date: "2025-11-30", youtubeLink: "https://youtu.be/bRWxDaZepJQ", category: "alpha" },
  { id: 9,  title: "2025 年全网最全最详细开通天星、众安、蚂蚁银行教程，港美股投资推荐、实体卡&虚拟卡需别、你为什么需要一张虚拟港卡、天星银行开卡、众安银行开卡、蚂蚁银行开卡教程，汇丰银行、中银香港银行开卡教程", date: "2025-11-23", youtubeLink: "https://youtu.be/wqMChW__dyk", category: "港卡" },
  { id: 10, title: "2025 年全网最全最详细开通汇丰银行、中银香港银行教程，港美股投资推荐、入港最全最详细教程，一站式解决你从无到有开港卡教程，小白办理港卡教程，最详细的开港卡教程，汇丰香港开户，中银香港开户教程。", date: "2025-11-16", youtubeLink: "https://youtu.be/8zzn-IHIBIk", category: "港卡" },
  { id: 11, title: "2025 年全网最全最详细Ifast入金盈透，Ifast 入金长桥，Ifast 入金盈立最全教程，可无损入金长桥盈透&盈立，无港卡投资港美股的最佳选择，大陆用户仅身份证即可开设投资港美股盈立证券", date: "2025-11-09", youtubeLink: "https://youtu.be/o94W7r8M2kY", category: "投资,美股" },
  { id: 12, title: "2025 年全网最全最详细 0 门槛英国 Ifast数字银行开户教程，替代港卡的最佳选择，支持大陆银行卡无痕入金。兴业银行入金 Ifast 最全最详细教程，可无损入金港美股券商。港美股券商入金首选", date: "2025-11-02", youtubeLink: "https://youtu.be/2LcPWwwMSqw", category: "投资" },
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const allCategories = ["赚钱", "投资", "虚拟 U 卡", "出入金", "alpha", "港卡", "美股", "券商"];

const categoryEmoji: Record<string, string> = {
  "赚钱": "💰", "投资": "📈", "虚拟 U 卡": "💳", "出入金": "🏦",
  "alpha": "⚡", "港卡": "🌐", "美股": "🗽", "券商": "🏛️",
};

export default function VideoContentPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);

  // 从 URL 读取选中视频
  useEffect(() => {
    const match = window.location.pathname.match(/\/videos\/([a-z0-9]{8})$/);
    if (match) {
      const uid = match[1];
      const found = videoData.find(v => genVideoUid(v.id) === uid);
      if (found) setSelectedVideoId(found.id);
    }
  }, []);

  const selectedVideo = useMemo(() => videoData.find(v => v.id === selectedVideoId) ?? null, [selectedVideoId]);

  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return videoData;
    const q = searchQuery.toLowerCase();
    return videoData.filter(v => v.title.toLowerCase().includes(q));
  }, [searchQuery]);

  const videosByCategory = useMemo(() => {
    const map = new Map<string, Video[]>();
    allCategories.forEach(cat => {
      const videos = filteredVideos.filter(v => v.category.split(",").map(c => c.trim()).includes(cat));
      if (videos.length > 0) map.set(cat, videos);
    });
    return map;
  }, [filteredVideos]);

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => {
      const n = new Set(prev);
      n.has(cat) ? n.delete(cat) : n.add(cat);
      return n;
    });
  };

  const selectVideo = (video: Video) => {
    setSelectedVideoId(video.id);
    const uid = genVideoUid(video.id);
    window.history.pushState(null, "", `/videos/${uid}`);
  };

  const videoId = selectedVideo ? getYoutubeId(selectedVideo.youtubeLink) : "";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="w-full flex h-[calc(100vh-64px)]">

        {/* ══ LEFT SIDEBAR ═══════════════════════════════ */}
        <aside className="w-72 shrink-0 flex flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="px-5 pt-6 pb-4">
            <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mb-4">视频内容</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索视频..."
                className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div className="mx-5 h-px bg-slate-100 dark:bg-slate-800" />
          <nav className="flex-1 overflow-y-auto py-3 scrollbar-hide">
            {allCategories.map(cat => {
              const videos = videosByCategory.get(cat);
              if (!videos) return null;
              const isOpen = openCategories.has(cat);
              const hasSelected = videos.some(v => v.id === selectedVideoId);
              return (
                <div key={cat} className="mb-0.5">
                  <button
                    onClick={() => toggleCategory(cat)}
                    className={cn(
                      "w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors",
                      hasSelected
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    <span className="text-base leading-none">{categoryEmoji[cat]}</span>
                    <span className="flex-1 text-left">{cat}</span>
                    <span className={cn(
                      "text-[11px] font-medium tabular-nums px-1.5 py-0.5 rounded-full",
                      hasSelected
                        ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                    )}>{videos.length}</span>
                    <span className="text-slate-400 dark:text-slate-600">
                      {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="mb-1">
                      {videos.map(video => {
                        const isActive = selectedVideoId === video.id;
                        return (
                          <button
                            key={video.id}
                            onClick={() => selectVideo(video)}
                            className={cn(
                              "w-full text-left px-5 pl-[3.25rem] py-2.5 text-sm transition-all duration-150 relative",
                              isActive
                                ? "text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/15 font-medium"
                                : "text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                            )}
                          >
                            {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-amber-400 rounded-r-full" />}
                            <span className="line-clamp-2 leading-snug">{video.title}</span>
                            <span className="flex items-center gap-1 mt-1 text-[11px] text-slate-400 dark:text-slate-600">
                              <Calendar className="w-2.5 h-2.5" />{video.date}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* ══ CENTER: VIDEO PLAYER ════════════════════════ */}
        <main className="flex-1 min-w-0 overflow-y-auto" style={{ backgroundImage: "radial-gradient(circle, rgba(148,163,184,0.25) 1.5px, transparent 1.5px)", backgroundSize: "22px 22px" }}>
          {selectedVideo ? (
            <div className="h-full flex flex-col p-6">
              {/* Player */}
              <div className="relative w-full rounded-2xl overflow-hidden bg-black shadow-xl" style={{ paddingTop: "56.25%" }}>
                <iframe
                  key={videoId}
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={selectedVideo.title}
                  frameBorder={0}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
              {/* Info */}
              <div className="mt-5 px-1">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {selectedVideo.category.split(",").map((cat, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">
                      {categoryEmoji[cat.trim()]} {cat.trim()}
                    </span>
                  ))}
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />{selectedVideo.date}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
                  {selectedVideo.title}
                </h2>
              </div>
            </div>
          ) : (
            // 空屏
            <div className="h-full flex flex-col items-center justify-center px-8 py-16">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-6 shadow-lg shadow-red-200 dark:shadow-red-900/30">
                <Youtube className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2 tracking-tight">选择一个视频开始观看</h2>
              <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm text-center leading-relaxed mb-10">
                从左侧按分类浏览所有视频，点击后在此处直接播放，无需跳转外部链接。
              </p>
              {/* 最新视频预览 */}
              <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
                {videoData.slice(0, 4).map(video => (
                  <button
                    key={video.id}
                    onClick={() => selectVideo(video)}
                    className="text-left p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md hover:shadow-amber-100/50 dark:hover:shadow-amber-900/20 transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
                      <Play className="w-4 h-4 text-red-500" fill="currentColor" />
                    </div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors leading-snug mb-2">
                      {video.title}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />{video.date}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* ══ RIGHT SIDEBAR ══════════════════════════════ */}
        <aside className="w-72 shrink-0 border-l border-slate-200/80 dark:border-slate-800 hidden lg:flex flex-col bg-white dark:bg-slate-900">
          <div className="px-5 pt-6 pb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-900 dark:text-slate-100">相关信息</p>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-8 scrollbar-hide">
            {selectedVideo ? (
              <div className="space-y-5">
                {/* 分类 */}
                <div>
                  <p className="text-xs text-slate-400 mb-2">分类</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedVideo.category.split(",").map((cat, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                        {categoryEmoji[cat.trim()]} {cat.trim()}
                      </span>
                    ))}
                  </div>
                </div>
                {/* 发布日期 */}
                <div>
                  <p className="text-xs text-slate-400 mb-1">发布日期</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />{selectedVideo.date}
                  </p>
                </div>
                {/* 同分类其他视频 */}
                <div>
                  <p className="text-xs text-slate-400 mb-2">同类视频</p>
                  <div className="space-y-2">
                    {videoData
                      .filter(v => v.id !== selectedVideo.id && v.category.split(",").some(c => selectedVideo.category.split(",").includes(c)))
                      .slice(0, 5)
                      .map(v => (
                        <button
                          key={v.id}
                          onClick={() => selectVideo(v)}
                          className="w-full text-left group"
                        >
                          <div className="flex gap-2 items-start">
                            <div className="w-5 h-5 rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0 mt-0.5">
                              <Play className="w-2.5 h-2.5 text-red-500" fill="currentColor" />
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 line-clamp-2 leading-snug transition-colors">
                              {v.title}
                            </p>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic leading-relaxed pt-2">
                选择视频后显示相关信息
              </p>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}
