"use client";

import Marquee from "react-fast-marquee";

const activities = [
  "🎉 刚刚，上海的用户使用了复利计算器",
  "🔥 《Web3开户教程》过去1小时被阅读了 128 次",
  "💡 有 5 位新用户刚刚订阅了 Wise 周刊",
  "📈 贪婪恐慌指数刚刚更新：78 (极度贪婪)",
  "✨ 北京的用户收藏了《投资第一性原理》",
  "🚀 《优选纳指定投集合》今日新增 45 次阅读",
  "🎯 深圳的用户完成了复利计算，预计收益 120%",
];

export function ActivityMarquee() {
  return (
    <div className="w-full border-y border-slate-100 bg-slate-50/50 py-3">
      <Marquee
        speed={50}
        gradient={true}
        gradientColor="rgb(248, 250, 252)"
        gradientWidth={80}
        pauseOnHover={true}
        className="text-sm text-slate-600"
      >
        {activities.map((activity, index) => (
          <div key={index} className="flex items-center gap-6 px-6">
            <span className="whitespace-nowrap">{activity}</span>
            <span className="text-slate-300">•</span>
          </div>
        ))}
      </Marquee>
    </div>
  );
}

