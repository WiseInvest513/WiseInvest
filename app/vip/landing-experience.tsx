"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./vip.module.css";

const sections = [
  ["invitation", "邀请"],
  ["why-vip", "为什么加入"],
  ["vip-services", "VIP 服务"],
  ["vip-reports", "投研样例"],
  ["how-it-works", "如何加入"],
  ["svip", "SVIP"],
  ["vip-faq", "常见问题"],
] as const;

/** A small client island: content and access decisions stay on the server. */
export function LandingExperience({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string>("invitation");

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const targets = sections.map(([id]) => document.getElementById(id)).filter((node): node is HTMLElement => Boolean(node));
    const revealTargets = [...element.querySelectorAll<HTMLElement>("[data-vip-reveal]")];
    const mediaTargets = [...element.querySelectorAll<HTMLElement>("[data-vip-parallax]")];
    const visibleMedia = new Set<HTMLElement>();
    const revealed = new Set<HTMLElement>();
    const animations = new Map<HTMLElement, Animation>();
    let frame = 0;
    let currentSection = "invitation";
    let previousScrollY = window.scrollY;
    let direction = 1;

    const resetMedia = () => {
      for (const media of mediaTargets) {
        media.style.removeProperty("--vip-shift");
        media.style.removeProperty("--vip-scale");
      }
    };
    const updateScroll = () => {
      frame = 0;
      let current = targets[0]?.id ?? "invitation";
      for (const target of targets) {
        if (target.getBoundingClientRect().top <= 190) current = target.id;
      }
      // Read all geometry before writing styles; motion never updates React state.
      const viewportHeight = window.innerHeight;
      const mediaPositions = reducedMotion.matches ? [] : [...visibleMedia].map(media => {
        const bounds = media.getBoundingClientRect();
        const progress = Math.max(-1, Math.min(1,
          (viewportHeight / 2 - bounds.top - bounds.height / 2) / ((viewportHeight + bounds.height) / 2),
        ));
        return { media, shift: progress * 18, scale: 1 - Math.abs(progress) * 0.04 };
      });
      if (current !== currentSection) {
        currentSection = current;
        setActive(current);
      }
      for (const { media, shift, scale } of mediaPositions) {
        media.style.setProperty("--vip-shift", `${shift.toFixed(2)}px`);
        media.style.setProperty("--vip-scale", scale.toFixed(4));
      }
    };
    const scheduleUpdate = () => { if (!frame) frame = requestAnimationFrame(updateScroll); };
    const onScroll = () => {
      const nextScrollY = window.scrollY;
      if (nextScrollY !== previousScrollY) direction = nextScrollY > previousScrollY ? 1 : -1;
      previousScrollY = nextScrollY;
      scheduleUpdate();
    };
    const onAnchorClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
      const href = link?.getAttribute("href");
      const target = href ? document.getElementById(href.slice(1)) : null;
      if (!href || !target) return;
      event.preventDefault();
      window.history.pushState(null, "", href);
      target.scrollIntoView({ behavior: reducedMotion.matches ? "instant" : "smooth", block: "start" });
      // Preserve keyboard navigation: the next Tab continues within this section.
      target.focus({ preventScroll: true });
    };
    const revealObserver = new IntersectionObserver(entries => {
      let stagger = 0;
      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        if (!entry.isIntersecting || entry.intersectionRatio < 0.08 || revealed.has(target)) continue;
        revealed.add(target);
        if (reducedMotion.matches) continue;
        // The individual translate property composes with a media wrapper's scale/transform.
        // Content stays visible in SSR and when animation is unavailable or cancelled.
        const animation = target.animate([
          { opacity: 0.35, translate: `0 ${direction * 32}px` },
          { opacity: 1, translate: "0 0" },
        ], { duration: 650, delay: Math.min(stagger++ * 65, 130), easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "backwards" });
        animations.set(target, animation);
        const release = () => { if (animations.get(target) === animation) animations.delete(target); };
        animation.onfinish = release;
        animation.oncancel = release;
      }
    }, { threshold: 0.08, rootMargin: "-6% 0px -6% 0px" });
    // Re-arm only after the whole element is well outside the viewport. Hovering
    // near an entry threshold must not keep restarting a fade or hiding text.
    const departureObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) continue;
        const target = entry.target as HTMLElement;
        revealed.delete(target);
        animations.get(target)?.cancel();
        animations.delete(target);
      }
    }, { rootMargin: "160px 0px 160px 0px" });
    const mediaObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        if (entry.isIntersecting) visibleMedia.add(target);
        else visibleMedia.delete(target);
      }
      scheduleUpdate();
    }, { rootMargin: "160px 0px 160px 0px" });
    for (const target of revealTargets) {
      revealObserver.observe(target);
      departureObserver.observe(target);
    }
    mediaTargets.forEach(media => mediaObserver.observe(media));
    const onMotionChange = () => {
      if (reducedMotion.matches) {
        animations.forEach(animation => animation.cancel());
        animations.clear();
        resetMedia();
      }
      scheduleUpdate();
    };
    reducedMotion.addEventListener("change", onMotionChange);
    element.addEventListener("click", onAnchorClick);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    updateScroll();
    return () => {
      revealObserver.disconnect();
      departureObserver.disconnect();
      mediaObserver.disconnect();
      animations.forEach(animation => animation.cancel());
      cancelAnimationFrame(frame);
      resetMedia();
      reducedMotion.removeEventListener("change", onMotionChange);
      element.removeEventListener("click", onAnchorClick);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  return (
    <div className={styles.shell} ref={root}>
      <aside className={styles.sidebar}>
        <nav className={styles.index} aria-label="VIP 页面目录">
          <span className={styles.indexTitle}>WISE VIP</span>
          {sections.map(([id, label], index) => (
            <a key={id} href={`#${id}`} aria-current={active === id ? "location" : undefined}>
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{label}
            </a>
          ))}
        </nav>
      </aside>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
