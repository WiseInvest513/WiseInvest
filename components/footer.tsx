import Link from "next/link";
import { Twitter, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-12 py-6">
      <div className="max-w-[1600px] mx-auto px-6">
        {/* Top Section: Multi-column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
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
                href="https://x.com/WiseInvest513"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 dark:text-slate-500 hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors cursor-pointer"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="mailto:wiseinvest513@gmail.com"
                className="text-slate-400 dark:text-slate-500 hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors cursor-pointer"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
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
  );
}

