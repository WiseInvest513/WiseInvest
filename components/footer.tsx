"use client";

import { useState } from "react";
import Link from "next/link";
import { Twitter, MessageCircle, Send } from "lucide-react";
import { getSafeExternalUrl } from "@/lib/security/external-links";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function Footer() {
  const [wechatDialogOpen, setWechatDialogOpen] = useState(false);
  const [xIconFailed, setXIconFailed] = useState(false);
  const [telegramIconFailed, setTelegramIconFailed] = useState(false);
  const [wechatIconFailed, setWechatIconFailed] = useState(false);

  return (
    <>
      <footer className="w-full bg-white dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-700 mt-12 py-6 relative z-10 shadow-[0_-1px_12px_rgba(0,0,0,0.06)]">
        <div className="max-w-[1600px] mx-auto px-6">
          {/* Top Section: Multi-column Grid */}
          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
            {/* Column 1: Brand */}
            <div className="space-y-2">
              <div>
                <h2 className="font-heading text-xl font-bold text-slate-900 dark:text-slate-50 mb-1">
                  Wise Invest
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  用数据和洞察赋能您的财富之旅。
                </p>
              </div>
              {/* Social Icons */}
              <div className="flex items-center gap-4">
                <a
                  href={getSafeExternalUrl("https://x.com/WiseInvest513")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 dark:text-slate-500 hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors cursor-pointer"
                  aria-label="X"
                >
                  {xIconFailed ? (
                    <Twitter className="h-5 w-5" />
                  ) : (
                    <img
                      src="https://cdn.simpleicons.org/x/334155"
                      alt="X"
                      className="h-5 w-5 object-contain"
                      onError={() => setXIconFailed(true)}
                    />
                  )}
                </a>
                <a
                  href={getSafeExternalUrl("https://t.me/WiseInvest513")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 dark:text-slate-500 hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors cursor-pointer"
                  aria-label="Telegram"
                >
                  {telegramIconFailed ? (
                    <Send className="h-5 w-5" />
                  ) : (
                    <img
                      src="https://cdn.simpleicons.org/telegram/26A5E4"
                      alt="Telegram"
                      className="h-5 w-5 object-contain"
                      onError={() => setTelegramIconFailed(true)}
                    />
                  )}
                </a>
                <button
                  onClick={() => setWechatDialogOpen(true)}
                  className="text-slate-400 dark:text-slate-500 hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors cursor-pointer"
                  aria-label="微信"
                >
                  {wechatIconFailed ? (
                    <MessageCircle className="h-5 w-5" />
                  ) : (
                    <img
                      src="https://cdn.simpleicons.org/wechat/07C160"
                      alt="微信"
                      className="h-5 w-5 object-contain"
                      onError={() => setWechatIconFailed(true)}
                    />
                  )}
                </button>
              </div>
            </div>

          {/* Column 2: Tools Links */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-50 mb-2">实用工具</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/tools/compound-calculator"
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors cursor-pointer"
                >
                  复利计算器
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/fear-greed"
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors cursor-pointer"
                >
                  贪婪恐慌指数
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/position-calculator"
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors cursor-pointer"
                >
                  仓位管理
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources Links */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-50 mb-2">站内导航</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/anthology"
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors cursor-pointer"
                >
                  投资文集
                </Link>
              </li>
              <li>
                <Link
                  href="/perks"
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors cursor-pointer"
                >
                  福利中心
                </Link>
              </li>
              <li>
                <Link
                  href="/resources"
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors cursor-pointer"
                >
                  核心数据
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Recommendations */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-50 mb-2">推荐</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href={getSafeExternalUrl("https://www.wise-sim.org/")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors cursor-pointer"
                >
                  📱 giffgaff 手机卡
                </a>
              </li>
              <li>
                <a
                  href={getSafeExternalUrl("https://www.wise-witness.com/")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors cursor-pointer"
                >
                  🌍 见证开户
                </a>
              </li>
              <li>
                <a
                  href={getSafeExternalUrl("https://www.wise-hold.com/")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors cursor-pointer"
                >
                  📈 Wise Hold
                </a>
              </li>
              <li>
                <a
                  href={getSafeExternalUrl("https://www.wise-etf.com/")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors cursor-pointer"
                >
                  📈 ETF 投资指南
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section: Fine Print */}
        <div className="border-t border-slate-200 dark:border-slate-800 mt-6 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            {/* Copyright */}
            <div className="text-sm text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} Wise Invest. 保留所有权利。
            </div>

            {/* Disclaimer */}
            <div className="text-[10px] text-slate-400 dark:text-slate-500 max-w-2xl text-center md:text-right leading-relaxed">
              本网站所提供的内容仅供参考，不构成任何投资建议。投资有风险，入市需谨慎。
              所有投资决策应由您自行做出，本网站不对任何投资损失承担责任。
              请在进行任何投资之前，咨询专业的财务顾问。
            </div>
          </div>
        </div>
      </div>
    </footer>

    {/* WeChat QR Code Dialog */}
    <Dialog open={wechatDialogOpen} onOpenChange={setWechatDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">关注公众号，获取博主个人微信</DialogTitle>
          <DialogDescription className="text-center">
            扫描下方二维码关注公众号，即可获取博主个人微信联系方式
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative w-full max-w-xs aspect-square">
            <img
              src="/images/wechat-qrcode.jpg"
              alt="关注公众号，获取博主个人微信"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

