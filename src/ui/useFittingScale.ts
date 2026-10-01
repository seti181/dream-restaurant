// The biggest scale at which a pixel-art picture fits its box. Whole device pixels per art
// pixel keep it crisp; only when that would waste a lot of space is an in-between scale used.

import { useLayoutEffect, useRef, useState } from 'react';

export function useFittingScale(width: number, height: number, fitHeight = true) {
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(2);
  useLayoutEffect(() => {
    const element = wrap.current;
    if (!element) return;
    const measure = () => {
      const dpr = window.devicePixelRatio || 1;
      const byWidth = element.clientWidth / width;
      const fit = (fitHeight ? Math.min(byWidth, element.clientHeight / height) : byWidth) * dpr;
      const whole = Math.max(1, Math.floor(fit));
      setScale((whole / fit >= 0.85 ? whole : Math.max(1, fit)) / dpr);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [width, height, fitHeight]);
  return { wrap, scale };
}
