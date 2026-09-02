import type { Metadata } from "next";
import { BadgeDollarSign } from "lucide-react";
import { AdminShell } from "@/app/admin/admin-shell";
import { VipManagementClient, type VipExchangeRecordView } from "@/app/admin/vip-management/vip-management-client";
import { requireAdminUser } from "@/lib/identity/current-user";
import { isDevPreviewAdminSession } from "@/lib/identity/dev-preview-server";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "VIP 管理 | Wise Invest",
  description: "维护 Wise VIP 交易所用户、平台和 UID 返佣资料。",
  robots: { index: false, follow: false },
};

const previewRecords: VipExchangeRecordView[] = [
  {
    id: "dev_vip_exchange_1",
    email: "vip-preview@wise-invest.local",
    wechatId: "WisePreview520",
    platform: "Binance 币安",
    uid: "123456789",
    source: "VERIFIED_ACCOUNT",
    note: "本地预览记录",
    updatedAt: new Date().toISOString(),
    user: { wiseUserId: "YVIPPREVIEW", name: "Wise VIP 预览用户" },
  },
  {
    id: "dev_vip_exchange_2",
    email: "manual-preview@wise-invest.local",
    wechatId: null,
    platform: "Bitget",
    uid: "987654321",
    source: "MANUAL",
    note: null,
    updatedAt: new Date().toISOString(),
    user: null,
  },
];

export default async function VipManagementPage() {
  await requireAdminUser();
  const isMockAdmin = await isDevPreviewAdminSession();
  const prisma = isMockAdmin && !isDatabaseConfigured() ? null : getPrisma();

  const [records, exchangePartners] = prisma
    ? await Promise.all([
        prisma.vipExchangeRecord.findMany({
          select: {
            id: true,
            email: true,
            wechatId: true,
            platform: true,
            uid: true,
            source: true,
            note: true,
            updatedAt: true,
            user: { select: { wiseUserId: true, name: true } },
          },
          orderBy: [{ platform: "asc" }, { updatedAt: "desc" }],
          take: 1000,
        }),
        prisma.partner.findMany({
          where: { type: "EXCHANGE", enabled: true, vipEligible: true },
          select: { name: true },
          orderBy: { name: "asc" },
        }),
      ])
    : [previewRecords, [{ name: "Binance 币安" }, { name: "Bitget" }, { name: "Bybit" }, { name: "OKX 欧易" }, { name: "Gate" }]];

  const serializedRecords: VipExchangeRecordView[] = records.map((record) => ({
    ...record,
    updatedAt: record.updatedAt instanceof Date ? record.updatedAt.toISOString() : record.updatedAt,
  }));

  return (
    <AdminShell>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black uppercase text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              <BadgeDollarSign className="h-4 w-4" />
              Rebate Operations
            </div>
            <h1 className="mt-4 font-heading text-3xl font-black md:text-4xl">VIP 管理</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500 dark:text-slate-400">
              集中维护交易所 VIP 用户的邮箱、微信号、所属平台和 UID。已通过审核的交易所账户会自动进入这里，券商及其他渠道不会收录。
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-xs font-bold text-slate-400">独立访问地址</p>
            <code className="mt-1 block font-mono text-sm font-black text-slate-700 dark:text-slate-200">/admin/vip-management</code>
          </div>
        </div>
      </section>

      <VipManagementClient records={serializedRecords} platformOptions={exchangePartners.map((partner) => partner.name)} />
    </AdminShell>
  );
}
