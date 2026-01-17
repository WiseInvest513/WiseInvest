import { PanicSimulator } from "@/components/tools/PanicSimulator";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "恐慌模拟器 - Wise Invest",
  description: "模拟恐慌卖出可能带来的损失，帮助您做出更理性的决策",
};

export default function PanicSimulatorPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <PanicSimulator />
    </div>
  );
}
