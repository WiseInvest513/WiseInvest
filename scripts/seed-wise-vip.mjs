import nextEnv from "@next/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const defaultWiseVipPartners = [
  {
    slug: "binance",
    name: "Binance 币安",
    type: "EXCHANGE",
    referralUrl: "https://www.binance.com/join?ref=WISEBNB1",
    referralCode: "WISEBNB1",
    vipEligible: true,
    vipPlusEligible: true,
    vipPlusVolumeThreshold: "50000",
    verificationMode: "MANUAL",
  },
  {
    slug: "bitget",
    name: "Bitget",
    type: "EXCHANGE",
    referralUrl: "https://partner.bitget.cafe/bg/8ax9wf4r",
    referralCode: "wise5130",
    vipEligible: true,
    vipPlusEligible: true,
    vipPlusVolumeThreshold: "50000",
    verificationMode: "MANUAL",
  },
  {
    slug: "okx",
    name: "OKX 欧易",
    type: "EXCHANGE",
    referralUrl: "https://www.vmutkhamuut.com/join/WISE6666",
    referralCode: "WISE6666",
    vipEligible: true,
    vipPlusEligible: true,
    vipPlusVolumeThreshold: "50000",
    verificationMode: "MANUAL",
  },
  {
    slug: "bybit",
    name: "Bybit",
    type: "EXCHANGE",
    referralUrl: "https://partner.bybit.com/b/WISE6666",
    referralCode: "WISE6666",
    vipEligible: true,
    vipPlusEligible: true,
    vipPlusVolumeThreshold: "50000",
    verificationMode: "MANUAL",
  },
  {
    slug: "gate",
    name: "Gate",
    type: "EXCHANGE",
    referralUrl: "https://www.wise-invest.org/articles/vcard/GUhygjYV",
    referralCode: "WISEGATE",
    vipEligible: true,
    vipPlusEligible: true,
    vipPlusVolumeThreshold: "50000",
    verificationMode: "MANUAL",
  },
  {
    slug: "galaxy-securities",
    name: "银河证券 A 股打新",
    type: "BROKERAGE",
    referralUrl: null,
    referralCode: null,
    vipEligible: true,
    vipPlusEligible: false,
    vipPlusVolumeThreshold: null,
    verificationMode: "MANUAL",
  },
  {
    slug: "mp-card",
    name: "MP 虚拟油卡",
    type: "OTHER",
    referralUrl: "https://mp.net/i/WiseInvest",
    referralCode: "WiseInvest",
    vipEligible: true,
    vipPlusEligible: false,
    vipPlusVolumeThreshold: null,
    verificationMode: "MANUAL",
  },
];

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required to seed Wise VIP partners.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

try {
  for (const partner of defaultWiseVipPartners) {
    await prisma.partner.upsert({
      where: { slug: partner.slug },
      update: partner,
      create: partner,
    });
    console.log(`Seeded partner: ${partner.name}`);
  }
} finally {
  await prisma.$disconnect();
}
