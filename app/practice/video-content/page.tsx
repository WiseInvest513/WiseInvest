"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Calendar, Search, X, Play } from "lucide-react";

const videoCategories = ["赚钱", "投资", "虚拟 U 卡", "出入金", "alpha", "港卡", "美股", "券商"];

interface Video {
  id: number;
  title: string;
  date: string;
  youtubeLink: string;
  category: string;
}

function getYoutubeId(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^?&\s]+)/);
  return match ? match[1] : "";
}

const videoData: Video[] = [
  {
    id: 16,
    title: "2026 年全网最全最详细致富证券开户教程、国内用户仅凭身份证即可完成开户、国内用户可使用的香港券商，成立 46 年，46年港资零售券商No.1！",
    date: "2026-02-15",
    youtubeLink: "https://youtu.be/pCsQo_aIrWk?si=-4ePntuEPlUEGWAb",
    category: "券商",
  },
  {
    id: 15,
    title: "2026 年全网最全最详细 Bitget 虚拟 U 卡入金盈透教程｜盈透入金教程｜虚拟 U 卡入金盈透｜券商入金教程，最快四小时即可到账、没有港卡入金盈透最佳选择、加密入金券商最佳选择！",
    date: "2026-02-08",
    youtubeLink: "https://youtu.be/9ji8KUh9ojs?si=VwFzDGHpX4nxMMP4",
    category: "出入金",
  },
  {
    id: 14,
    title: "2026 年全网最全最详细 港卡绑定微信在国内消费、港卡绑定、港卡国内消费、众安绑定微信支付、众安绑卡、出金详细教程、港卡出金详细流程、超低手续费完成港卡中资金的国内消费、港卡消费教程！",
    date: "2026-01-20",
    youtubeLink: "https://youtu.be/GG5qdaUgScc?si=LAKhCsdqxmh1NJ2a",
    category: "出入金",
  },
  {
    id: 1,
    title: "2026 年全网最新最全领取推特创作者激励｜X 认证｜Stripe 认证｜X 开通创作收益｜推特创作者收益｜领取推特创作者收益｜推特创作者收益计划",
    date: "2026-01-15",
    youtubeLink: "https://youtu.be/h50rjDBiTIg",
    category: "赚钱",
  },
  {
    id: 13,
    title: "2026 年全网最全最详细 SafePal 入金盈透、众安入金盈透、入金盈透教程、虚拟 U 卡入金盈透、港卡入金盈透教程，无港卡入金最全解决方案，再不用担心无法投资美股了",
    date: "2026-01-11",
    youtubeLink: "https://youtu.be/6NoGmOejUsI?si=AZi1IyDsQgSHWJdi",
    category: "出入金",
  },
  {
    id: 2,
    title: "2025 年全网最全最详细Wise身份证注册开通教程、Wise 注册+激活全流程、仅凭身份证即可开通港户最全教程、打通我们转账不便的围墙、帮助我们进行快速的资金流转！",
    date: "2026-01-10",
    youtubeLink: "https://youtu.be/BB7KtDfbXsU",
    category: "投资",
  },
  {
    id: 3,
    title: "2025 年全网最全最详细 SafePal 出金国内银行卡教程、帮助我们打通 web2 和 web3 的不便捷性，SafaPal出金国内银行卡，SafePal出金教程！",
    date: "2026-01-05",
    youtubeLink: "https://youtu.be/WWZiufXWkqE",
    category: "虚拟 U 卡,出入金",
  },
  {
    id: 4,
    title: "2025 年全网最全最详细的 SafePal 虚拟 U卡开设教程｜官方认证推荐小白开卡必看视频、开卡即免费赠送价值 350 元冷钱包，无开卡费用与无年费｜币圈/出海/订购海外优秀产品必备神卡",
    date: "2025-12-28",
    youtubeLink: "https://youtu.be/1Lw8VssYFNE",
    category: "虚拟 U 卡",
  },
  {
    id: 5,
    title: "2025 年全网最全最详细的 Bitget 虚拟 U卡开设教程｜全网首个零费率虚拟 U 卡，无开卡费用、无充值与消费手续费、无年费｜币圈/出海/订购海外优秀产品必备神卡，开卡即可领取 5u 空投奖励！",
    date: "2025-12-21",
    youtubeLink: "https://youtu.be/ZxElS0gVpY4",
    category: "虚拟 U 卡",
  },
  {
    id: 6,
    title: "存款小于 20 万&月薪低于 8K 应该如何在 web3通过结构化优势赚钱，我们普通人无法实现财富跃迁的根本原因是什么？如果你想要在 26 年有一个清晰的努力方向，那本期视频或许会给你一个答案！",
    date: "2025-12-14",
    youtubeLink: "https://youtu.be/2_Dar77OX5M",
    category: "赚钱",
  },
  {
    id: 7,
    title: "2025 年全网最全最详细币安 alpha教程、欧易 Boost 教程，币安 alpha 空投教程、欧易 Boost 空投教程，币安 alpha&欧易 Boost 是否真的还能够赚钱？本期视频给你答案",
    date: "2025-12-07",
    youtubeLink: "https://youtu.be/frRapUcAFPI",
    category: "alpha",
  },
  {
    id: 8,
    title: "2025 年全网最详细币安 alpha 刷交易量教程，可通过磨损控制在 2U 的情况下刷到 3w 交易量、币安 alpha 教程、币安、币安alpha、币安空投、币安教程、刷 alpha 教程。",
    date: "2025-11-30",
    youtubeLink: "https://youtu.be/bRWxDaZepJQ",
    category: "alpha",
  },
  {
    id: 9,
    title: "2025 年全网最全最详细开通天星、众安、蚂蚁银行教程，港美股投资推荐、实体卡&虚拟卡需别、你为什么需要一张虚拟港卡、天星银行开卡、众安银行开卡、蚂蚁银行开卡教程，汇丰银行、中银香港银行开卡教程",
    date: "2025-11-23",
    youtubeLink: "https://youtu.be/wqMChW__dyk",
    category: "港卡",
  },
  {
    id: 10,
    title: "2025 年全网最全最详细开通汇丰银行、中银香港银行教程，港美股投资推荐、入港最全最详细教程，一站式解决你从无到有开港卡教程，小白办理港卡教程，最详细的开港卡教程，汇丰香港开户，中银香港开户教程。",
    date: "2025-11-16",
    youtubeLink: "https://youtu.be/8zzn-IHIBIk",
    category: "港卡",
  },
  {
    id: 11,
    title: "2025 年全网最全最详细Ifast入金盈透，Ifast 入金长桥，Ifast 入金盈立最全教程，可无损入金长桥盈透&盈立，无港卡投资港美股的最佳选择，大陆用户仅身份证即可开设投资港美股盈立证券",
    date: "2025-11-09",
    youtubeLink: "https://youtu.be/o94W7r8M2kY",
    category: "投资,美股",
  },
  {
    id: 12,
    title: "2025 年全网最全最详细 0 门槛英国 Ifast数字银行开户教程，替代港卡的最佳选择，支持大陆银行卡无痕入金。兴业银行入金 Ifast 最全最详细教程，可无损入金港美股券商。港美股券商入金首选",
    date: "2025-11-02",
    youtubeLink: "https://youtu.be/2LcPWwwMSqw",
    category: "投资",
  },
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export default function VideoContentPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<Video>(videoData[0]);

  const filteredVideos = useMemo(() => {
    return videoData.filter((video) => {
      const matchesSearch =
        searchQuery === "" ||
        video.title.toLowerCase().includes(searchQuery.toLowerCase());
      const cats = video.category.split(",").map((c) => c.trim());
      const matchesCategory = selectedCategory === null || cats.includes(selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const hasActiveFilters = searchQuery !== "" || selectedCategory !== null;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
  };

  const videoId = getYoutubeId(activeVideo.youtubeLink);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="mb-4">
          <Link
            href="/practice"
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-3"
          >
            ← 返回实践主页
          </Link>
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-1">
              <img src="https://cdn.simpleicons.org/youtube/FF0000" alt="YouTube" className="w-8 h-8" />
              <h1 className="font-serif text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
                视频内容
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">
              每周一期的 YouTube 视频内容，分享投资策略、市场分析和实战经验
            </p>
          </div>
        </div>

        {/* Main Layout: Left list + Right player */}
        <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">
          {/* Left: Video List */}
          <div className="w-80 flex-shrink-0 flex flex-col border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            {/* Search */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索视频..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              {/* Category filters */}
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                    selectedCategory === null
                      ? "bg-amber-400 text-slate-900"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-50"
                  }`}
                >
                  全部
                </button>
                {videoCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                      selectedCategory === cat
                        ? "bg-amber-400 text-slate-900"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="px-2 py-0.5 rounded text-xs text-slate-400 hover:text-slate-600 flex items-center gap-0.5">
                    <X className="w-3 h-3" /> 清除
                  </button>
                )}
              </div>
            </div>

            {/* Video list */}
            <div className="flex-1 overflow-y-auto">
              {filteredVideos.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-400">暂无相关视频</div>
              ) : (
                filteredVideos.map((video) => {
                  const isActive = activeVideo.id === video.id;
                  return (
                    <button
                      key={video.id}
                      onClick={() => setActiveVideo(video)}
                      className={`w-full text-left px-3 py-3 border-b border-slate-100 dark:border-slate-800 transition-all ${
                        isActive
                          ? "bg-amber-50 dark:bg-amber-900/20 border-l-2 border-l-amber-400"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${isActive ? "bg-amber-400" : "bg-slate-100 dark:bg-slate-800"}`}>
                          <Play className={`w-2.5 h-2.5 ${isActive ? "text-white" : "text-slate-400"}`} fill="currentColor" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs leading-relaxed line-clamp-2 ${isActive ? "text-amber-700 dark:text-amber-300 font-medium" : "text-slate-700 dark:text-slate-300"}`}>
                            {video.title}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span className="text-[11px] text-slate-400">{video.date}</span>
                            <span className="text-[11px] text-slate-300 dark:text-slate-600">·</span>
                            {video.category.split(",").map((cat, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                {cat.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Count */}
            <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 text-center">
              共 {filteredVideos.length} 个视频
            </div>
          </div>

          {/* Right: Player */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Player */}
            <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingTop: "56.25%" }}>
              <iframe
                key={videoId}
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                title={activeVideo.title}
                frameBorder={0}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>

            {/* Video info */}
            <div className="mt-4 px-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {activeVideo.category.split(",").map((cat, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">
                    {cat.trim()}
                  </span>
                ))}
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {activeVideo.date}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {activeVideo.title}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
