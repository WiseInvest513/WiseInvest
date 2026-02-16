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
      <footer className="w-full bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-12 py-6">
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
                  常用导航
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: About */}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-50 mb-2">关于</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/aboutme"
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors cursor-pointer"
                >
                  关于我
                </Link>
              </li>
            </ul>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
              专注于理性投资与 Web3 Alpha 探索的平台。
            </p>
            {/* Middle Coast Accent（固定在中间分割处，不增加高度） */}
            <div className="footer-coast-overlay pointer-events-none">
              <div className="footer-coast-wave footer-coast-wave-a" />
              <div className="footer-coast-wave footer-coast-wave-b" />
              <div className="footer-coast-glow" />
            </div>
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
      <style jsx>{`
        @keyframes footerWaveA {
          0% {
            transform: translateX(-7%) translateY(4px);
            clip-path: polygon(0% 58%, 12% 52%, 23% 60%, 34% 54%, 47% 62%, 60% 55%, 73% 63%, 85% 56%, 100% 61%, 100% 100%, 0% 100%);
          }
          50% {
            transform: translateX(4%) translateY(1px);
            clip-path: polygon(0% 61%, 11% 55%, 22% 63%, 35% 57%, 48% 65%, 61% 58%, 74% 66%, 86% 59%, 100% 64%, 100% 100%, 0% 100%);
          }
          100% {
            transform: translateX(7%) translateY(4px);
            clip-path: polygon(0% 59%, 10% 53%, 21% 61%, 33% 55%, 46% 63%, 59% 56%, 72% 64%, 84% 57%, 100% 62%, 100% 100%, 0% 100%);
          }
        }

        @keyframes footerWaveB {
          0% {
            transform: translateX(6%) translateY(7px);
            clip-path: polygon(0% 68%, 10% 63%, 22% 70%, 34% 64%, 46% 72%, 58% 66%, 71% 73%, 83% 67%, 100% 72%, 100% 100%, 0% 100%);
          }
          60% {
            transform: translateX(-3%) translateY(4px);
            clip-path: polygon(0% 70%, 11% 65%, 23% 73%, 35% 67%, 48% 74%, 60% 68%, 73% 75%, 85% 69%, 100% 74%, 100% 100%, 0% 100%);
          }
          100% {
            transform: translateX(-6%) translateY(7px);
            clip-path: polygon(0% 69%, 9% 64%, 21% 71%, 33% 65%, 45% 73%, 57% 67%, 70% 74%, 82% 68%, 100% 73%, 100% 100%, 0% 100%);
          }
        }

        @keyframes footerGlowFlow {
          0% {
            background-position: -40% 0%;
          }
          100% {
            background-position: 140% 0%;
          }
        }

        .footer-coast-wave {
          position: absolute;
          left: -10%;
          width: 120%;
          border-radius: 9999px;
        }

        .footer-coast-overlay {
          position: absolute;
          left: 0;
          right: 0;
          bottom: -10px;
          height: 58px;
          opacity: 0.96;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        .footer-coast-wave-a {
          bottom: -70%;
          height: 150%;
          background: linear-gradient(
            to top,
            rgba(245, 158, 11, 0.58) 0%,
            rgba(251, 191, 36, 0.34) 30%,
            rgba(255, 255, 255, 0) 76%
          );
          filter: blur(1px);
          animation: footerWaveA 16s ease-in-out infinite alternate;
        }

        .footer-coast-wave-b {
          bottom: -74%;
          height: 150%;
          background: linear-gradient(
            to top,
            rgba(217, 119, 6, 0.54) 0%,
            rgba(245, 158, 11, 0.3) 28%,
            rgba(255, 255, 255, 0) 74%
          );
          filter: blur(0.8px);
          animation: footerWaveB 12s ease-in-out infinite alternate;
        }

        .footer-coast-glow {
          position: absolute;
          inset: auto -15% 0;
          height: 80%;
          background: linear-gradient(
            108deg,
            rgba(251, 191, 36, 0) 0%,
            rgba(251, 191, 36, 0.2) 38%,
            rgba(255, 251, 235, 0.52) 50%,
            rgba(251, 191, 36, 0.2) 62%,
            rgba(251, 191, 36, 0) 100%
          );
          background-size: 210% 100%;
          filter: blur(6px);
          animation: footerGlowFlow 18s linear infinite;
        }

        :global(.dark) .footer-coast-wave-a {
          background: linear-gradient(
            to top,
            rgba(217, 119, 6, 0.42) 0%,
            rgba(251, 191, 36, 0.26) 34%,
            rgba(15, 23, 42, 0) 78%
          );
        }

        :global(.dark) .footer-coast-wave-b {
          background: linear-gradient(
            to top,
            rgba(180, 83, 9, 0.4) 0%,
            rgba(245, 158, 11, 0.24) 30%,
            rgba(15, 23, 42, 0) 76%
          );
        }
      `}</style>

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

