"use client";

import { useState } from "react";
import { ReviewResultDialog } from "@/app/account/vip/review-result-dialog";
import { WechatIdForm } from "@/app/account/vip/wechat-id-form";

type VipPagePromptsProps = {
  initialWechatId: string | null;
  isVip: boolean;
  rejection: {
    partnerName: string;
    reason: string | null;
    isExchange: boolean;
  } | null;
};

export function VipPagePrompts({ initialWechatId, isVip, rejection }: VipPagePromptsProps) {
  const [reviewOpen, setReviewOpen] = useState(Boolean(rejection));

  return (
    <>
      {rejection && (
        <ReviewResultDialog
          partnerName={rejection.partnerName}
          reason={rejection.reason}
          isExchange={rejection.isExchange}
          open={reviewOpen}
          onOpenChange={setReviewOpen}
        />
      )}
      {isVip && <WechatIdForm initialWechatId={initialWechatId} autoPrompt={!reviewOpen} />}
    </>
  );
}
