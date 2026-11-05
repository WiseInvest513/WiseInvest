import { ArrowUpRight } from "lucide-react";
import { CopyTextButton } from "@/components/copy-text-button";
import { getRegistrationBrand } from "@/lib/registration-brands";
import { exclusiveInvitationBenefits } from "@/lib/registration-benefits";
import { cn } from "@/lib/utils";
import styles from "./article-registration-card.module.css";
import type { RegistrationCallout } from "@/lib/article-registration";

export function ArticleRegistrationCard({
  title,
  href,
  code,
  codeLabel = "邀请码",
  benefitText,
}: Omit<RegistrationCallout, "codeLabel"> & { codeLabel?: RegistrationCallout["codeLabel"] }) {
  const brand = getRegistrationBrand(href, title);
  // An explicit Markdown benefit takes precedence when it differs from the
  // approved rich layout, so a later content correction is never hidden.
  const benefits = !benefitText || benefitText === brand?.benefits?.summaryText
    ? brand?.benefits ?? (codeLabel === "优惠码" ? undefined : exclusiveInvitationBenefits)
    : undefined;
  const singleBenefit = benefits?.items.length === 1 ? benefits.items[0] : undefined;
  const benefitTitle = benefits?.title ?? (codeLabel === "优惠码" ? "优惠说明" : "邀请福利");

  return (
    <aside
      aria-label={code ? `${title}，${codeLabel} ${code}` : `${title}，邀请链接`}
      data-brand-tone={brand?.tone ?? "neutral"}
      className={cn(styles.card, "my-6 rounded-2xl border p-4 shadow-sm first:mt-0")}
    >
      <div className={styles.layout} data-has-brand={Boolean(brand)}>
        <div className={styles.content}>
          <div className={styles.intro}>
            {brand ? <img src={brand.iconSrc} alt="" width={40} height={40} className={styles.brandMark} aria-hidden="true" /> : null}
            <div className="min-w-0">
              <p className={cn(styles.eyebrow, "text-[10px] font-bold tracking-wider")}>Wise Invest {codeLabel === "优惠码" ? "专属优惠" : "邀请注册"}</p>
              <p className="mt-1 text-base font-bold text-slate-950 dark:text-white">{title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
                {href
                  ? code ? codeLabel === "优惠码" ? "通过下方链接购买，结算时填写优惠码。" : "通过邀请链接注册，确认邀请码已填入。" : "通过邀请链接进入，按页面提示完成注册。"
                  : `在 App ${title.startsWith("申请") ? "申请" : "注册"}页面填写${codeLabel}，核对后提交。`}
              </p>
            </div>
          </div>
          <div className={styles.actions}>
            {code ? <div className={cn(styles.codeBox, "rounded-lg border bg-white dark:bg-slate-950/50")}>
              <span className={cn(styles.codeLabel, "text-slate-500 dark:text-slate-400")}>{codeLabel}</span>
              <code className={cn(styles.code, "select-all font-mono font-bold text-slate-950 dark:text-slate-100")}>{code}</code>
              <CopyTextButton value={code} className={styles.copyButton}>
                <span className={styles.copyLabel}>复制</span><span className="sr-only">{codeLabel}</span>
              </CopyTextButton>
            </div> : null}
            {href ? <a
              href={href}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className={cn(styles.registerLink, "inline-flex shrink-0 items-center justify-center rounded-lg font-bold transition-colors")}
            >
              {code ? codeLabel === "优惠码" ? "使用优惠码" : "邀请码链接进行注册" : "通过邀请链接注册"}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a> : null}
          </div>
        </div>
        <section className={styles.benefits} aria-label={benefitTitle}>
          <div className={styles.benefitHeading}>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{benefitTitle}</span>
            {singleBenefit?.value ? <strong className={cn(styles.benefitValue, "text-lg font-bold tracking-tight")}>{singleBenefit.value}</strong> : null}
            {benefits?.period && !singleBenefit ? <span className="text-[11px] text-slate-500 dark:text-slate-400">{benefits.period}</span> : null}
          </div>
          <ul className={styles.benefitList}>
            {benefits ? benefits.items.map((item) => (
              <li key={item.label}>
                <p className={singleBenefit ? "flex flex-wrap items-baseline gap-x-2 gap-y-1" : "text-xs leading-5 text-slate-500 dark:text-slate-400"}>
                  {!singleBenefit ? <><strong className={cn(styles.benefitValue, "text-sm font-bold tracking-tight")}>{item.value}</strong>{" "}</> : null}
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{item.label}</span>
                  {singleBenefit && benefits.period ? <span className="text-[11px] text-slate-500 dark:text-slate-400">· {benefits.period}</span> : null}
                  {!singleBenefit ? <span> · {item.condition}</span> : null}
                </p>
                {singleBenefit ? <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.condition}</p> : null}
              </li>
            )) : benefitText ? <li className="text-sm leading-6 text-slate-700 dark:text-slate-200">{benefitText}</li> : (
              <li>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    福利待补充
                </p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {brand?.benefitGap ?? "正文未写明具体奖励金额、比例及领取条件，待补充。"}
                </p>
              </li>
            )}
          </ul>
          {benefits?.note ? <p className="mt-1.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">{benefits.note}</p> : null}
          {benefits?.detailsHref ? <a href={benefits.detailsHref} className={styles.benefitsLink}>
            查看全部福利及条件
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a> : null}
        </section>
        {brand ? (
          <div className={styles.brandVisual} aria-hidden="true">
            <div className={styles.brandFloat}>
              <img
                src={brand.iconSrc}
                alt=""
                draggable={false}
                width={256}
                height={256}
                className={styles.watermark}
              />
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
