"use client";

import { useEffect, useState } from "react";
import { Twitter, Youtube, Video, Instagram, MessageCircle, ArrowUpRight, Mail } from "lucide-react"; 

// --- 1. 核心组件：数字滚动动画 ---
const AnimatedNumber = ({ value }: { value: number }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 2000; // 2秒动画时长
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      
      // Ease-out 指数缓动，让数字停下来的感觉很高级
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCount(Math.floor(easeOut * end));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <>{count.toLocaleString()}</>;
};

// --- 2. 社交媒体数据配置 ---
// 使用在线图标 URL 进行测试（后续可以替换为本地文件）
const socials = [
  {
    name: "Twitter / X",
    count: 26770,
    label: "Followers",
    Icon: Twitter,
    pngPath: "https://cdn.simpleicons.org/x/000000", // 在线图标测试
    color: "hover:border-blue-400 hover:shadow-blue-100",
    text: "text-blue-500",
    bg: "bg-blue-50",
    link: "https://x.com/WiseInvest513"
  },
  {
    name: "Bilibili",
    count: 12113,
    label: "Fans",
    Icon: Video,
    pngPath: "https://cdn.simpleicons.org/bilibili/00A1D6", // 在线图标测试
    color: "hover:border-pink-400 hover:shadow-pink-100",
    text: "text-pink-500",
    bg: "bg-pink-50",
    link: "https://space.bilibili.com/347066091"
  },
  {
    name: "YouTube",
    count: 1530,
    label: "Subscribers",
    Icon: Youtube,
    pngPath: "https://cdn.simpleicons.org/youtube/FF0000", // 在线图标测试
    color: "hover:border-red-500 hover:shadow-red-100",
    text: "text-red-600",
    bg: "bg-red-50",
    link: "https://www.youtube.com/@WiseInvest513"
  },
  {
    name: "Little Red Book",
    count: 16590,
    label: "Followers",
    Icon: Instagram,
    pngPath: "https://cdn.simpleicons.org/xiaohongshu/FF2442", // 在线图标测试
    color: "hover:border-rose-500 hover:shadow-rose-100",
    text: "text-rose-500",
    bg: "bg-rose-50",
    link: "https://www.xiaohongshu.com/user/profile/6373a8ba0000000024014988"
  },
  {
    name: "Douyin",
    count: 89500,
    label: "Fans",
    Icon: Video,
    pngPath: "https://cdn.simpleicons.org/tiktok/000000", // 在线图标测试（使用 TikTok 图标）
    color: "hover:border-slate-800 hover:shadow-slate-200",
    text: "text-slate-900",
    bg: "bg-slate-100",
    link: "#"
  },
  {
    name: "WeChat",
    count: 4382,
    label: "Readers",
    Icon: MessageCircle,
    pngPath: "https://cdn.simpleicons.org/wechat/07C160", // 在线图标测试
    color: "hover:border-green-500 hover:shadow-green-100",
    text: "text-green-600",
    bg: "bg-green-50",
    link: "https://mp.weixin.qq.com/s/z9h9tyHkn42e3Iyd3MGcfA"
  }
];

export default function AboutMe() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pb-20 pt-16">
      <div className="max-w-[1200px] mx-auto px-6">
        
        {/* --- 1. Hero 区域 (居中介绍) --- */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-6">
          {/* 头像区域 */}
          <div className="w-28 h-28 mx-auto rounded-full p-1 bg-gradient-to-br from-yellow-400 to-orange-500 shadow-xl">
             <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 overflow-hidden border-2 border-white dark:border-slate-800">
                <img 
                  src="/images/profile/avatar.png" // 头像图片存放在 public/images/profile/ 目录
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                      e.currentTarget.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=WiseInvest";
                  }}
                />
             </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              Wise Invest
            </h1>
            <p className="text-lg text-yellow-600 dark:text-yellow-500 font-medium">
              Web3 & US Stock Investor
            </p>
          </div>
          
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg mx-auto">
            专注 Web3 与美股投资的独立内容创作者。<br/>
            在全网分享理性的投资逻辑与高价值的工具，寻找市场中的阿尔法。
          </p>
        </div>

        {/* --- 2. 社交资产网格 (Bento Grid) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {socials.map((item, idx) => (
            <a 
              key={idx} 
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                group relative overflow-hidden p-8 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 
                transition-all duration-300 hover:-translate-y-1 
                ${item.color} shadow-sm hover:shadow-xl
              `}
            >
              {/* 1. Content Layer (z-10 ensures it's on top) */}
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div className={`p-3 rounded-2xl transition-colors ${item.bg} ${item.text}`}>
                    <item.Icon className="w-6 h-6" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors" />
                </div>
                
                <div className="space-y-1">
                  <div className="text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
                    <AnimatedNumber value={item.count} />
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                    {item.label}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                      {item.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Decorative Watermark Layer (z-0 puts it behind) */}
              {item.pngPath && (
                <img 
                  src={item.pngPath} 
                  alt="" 
                  className="absolute -bottom-12 -right-12 w-48 h-48 opacity-[0.08] rotate-12 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:opacity-[0.12] z-0 pointer-events-none grayscale group-hover:grayscale-0"
                />
              )}
            </a>
          ))}
        </div>

        {/* --- 3. 联系区域 --- */}
        <div className="mt-20 p-8 md:p-12 bg-slate-50 dark:bg-slate-900 rounded-3xl text-center border border-slate-100 dark:border-slate-800 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">想要建立商务合作？</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xl mx-auto">无论是项目推广、工具开发还是深度投研，欢迎随时通过推特联系我</p>
          <a
            href="https://x.com/WiseInvest513"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-full font-bold hover:bg-yellow-500 hover:text-slate-900 transition-all shadow-lg hover:shadow-yellow-200"
          >
            <Twitter className="w-4 h-4" />
            <span>推特联系我</span>
          </a>
        </div>

      </div>
    </div>
  );
}

