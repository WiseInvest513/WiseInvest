import { HistoryGallery } from "./history-gallery";
import { ProfitStrip } from "./profit-strip";
import styles from "./history-showcase.module.css";

const discussedProducts = ["INTC", "BE", "MRVL", "AVGO", "SNDK", "MU", "SKHY", "BTC", "ETH", "RKLB", "SPCX", "TQQQ", "SOXL"] as const;

export function HistoryShowcase() {
  return (
    <section id="vip-history" tabIndex={-1} aria-labelledby="vip-history-title" className={styles.section}>
      <header className={styles.header}>
        <h2 id="vip-history-title">盈利截图</h2>
        <p>一些阶段性的收益记录，保留截图中的原始信息。</p>
      </header>

      <ProfitStrip />

      <header className={`${styles.header} ${styles.caseHeader}`}>
        <h3>历史战绩</h3>
        <p>过去的讨论与反馈，留在原始记录里。</p>
      </header>

      <article className={styles.featured} aria-label="历史群聊记录与反馈">
        <div className={styles.details}>
          <span className={styles.eyebrow}>群内讨论 · 群友反馈</span>
          <h3>聊过的机会，<br />留下的记录。</h3>
          <p className={styles.introduction}>
            过去，我们在群内讨论、跟踪过这些标的，也曾带领群友在其中一些机会中，取得不错的阶段性结果。
          </p>

          <ul className={styles.products} aria-label="过去群内讨论过的标的">
            {discussedProducts.map((product) => <li key={product}>{product}</li>)}
          </ul>
          <p className={styles.recordNote}>从当时的观点，到后续的跟踪与反馈。<br />翻一翻截图，看看我们是怎么聊的。</p>
        </div>

        <HistoryGallery />
      </article>

      <div className={styles.disclaimer}>
        <p>以上为部分历史聊天记录与群友反馈，并非完整交易记录，个别结果不代表所有成员的表现。</p>
        <p>历史表现不代表未来收益，不构成投资建议。</p>
      </div>
    </section>
  );
}
