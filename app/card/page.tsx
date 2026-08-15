import type { Metadata } from "next";
import CardPageClient from "./card-page-client";

export const metadata: Metadata = {
  title: "虚拟 U 卡资料库 - Wise Invest",
  description: "整理虚拟 U 卡、AI 订阅、邀请码、教程入口和费率弹窗。",
};

export default function CardPage() {
  return <CardPageClient />;
}
