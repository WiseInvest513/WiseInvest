"use client";

import { AirdropTracker } from "@/components/tools/AirdropTracker";

export default function AirdropPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1600px] mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-heading text-4xl font-bold text-slate-900 mb-2">
            空投雷达
          </h1>
          <p className="text-lg text-slate-600">
            追踪和管理你的空投机会，不错过任何潜在收益
          </p>
        </div>

        {/* Airdrop Tracker Component */}
        <AirdropTracker />
      </div>
    </div>
  );
}

