"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { UIEvent } from "react";

type CenteredCarouselOptions = {
  initialIndex?: number;
  onActiveIndexChange?: (index: number) => void;
};

export function useCenteredCarousel(itemCount: number, { initialIndex = 0, onActiveIndexChange }: CenteredCarouselOptions = {}) {
  const [activeIndex, setActiveIndex] = useState(() => clampIndex(initialIndex, itemCount));
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scrollSettledTimerRef = useRef<number | null>(null);
  const didInitialCenterRef = useRef(false);

  const setNearestIndex = useCallback(
    (index: number) => {
      setActiveIndex((current) => {
        if (current === index) return current;
        onActiveIndexChange?.(index);
        return index;
      });
    },
    [onActiveIndexChange]
  );

  const centerIndex = useCallback((index: number, element: HTMLDivElement | null = carouselRef.current) => {
    if (!element || itemCount < 2) return;
    const items = Array.from(element.querySelectorAll<HTMLElement>("[data-carousel-item]"));
    const item = items[clampIndex(index, items.length)];
    if (!item) return;

    const targetLeft = item.offsetLeft + item.offsetWidth / 2 - element.clientWidth / 2;
    const maxLeft = Math.max(0, element.scrollWidth - element.clientWidth);
    element.scrollTo({ left: Math.min(Math.max(targetLeft, 0), maxLeft), behavior: "auto" });
  }, [itemCount]);

  const syncActiveIndex = useCallback((element: HTMLDivElement | null = carouselRef.current) => {
    if (!element || itemCount < 2) {
      setNearestIndex(0);
      return;
    }

    const items = Array.from(element.querySelectorAll<HTMLElement>("[data-carousel-item]"));
    if (!items.length) return;

    const containerRect = element.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    items.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      const itemCenter = rect.left + rect.width / 2;
      const distance = Math.abs(itemCenter - containerCenter);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setNearestIndex(nearestIndex);
  }, [itemCount, setNearestIndex]);

  const setCarouselRef = useCallback(
    (element: HTMLDivElement | null) => {
      carouselRef.current = element;
      if (element) {
        window.requestAnimationFrame(() => {
          if (!didInitialCenterRef.current) {
            didInitialCenterRef.current = true;
            centerIndex(initialIndex, element);
          }
          syncActiveIndex(element);
        });
      }
    },
    [centerIndex, initialIndex, syncActiveIndex]
  );

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const element = event.currentTarget;

      if (animationFrameRef.current === null) {
        animationFrameRef.current = window.requestAnimationFrame(() => {
          animationFrameRef.current = null;
          syncActiveIndex(element);
        });
      }

      if (scrollSettledTimerRef.current !== null) window.clearTimeout(scrollSettledTimerRef.current);
      scrollSettledTimerRef.current = window.setTimeout(() => syncActiveIndex(element), 120);
    },
    [syncActiveIndex]
  );

  useEffect(() => {
    setActiveIndex((current) => {
      const clamped = clampIndex(current, itemCount);
      window.requestAnimationFrame(() => {
        centerIndex(clamped);
        syncActiveIndex();
      });
      if (current !== clamped) onActiveIndexChange?.(clamped);
      return clamped;
    });
  }, [centerIndex, itemCount, onActiveIndexChange, syncActiveIndex]);

  useEffect(() => {
    const element = carouselRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => syncActiveIndex(element));
    observer.observe(element);
    Array.from(element.querySelectorAll<HTMLElement>("[data-carousel-item]")).forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [itemCount, syncActiveIndex]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current);
      if (scrollSettledTimerRef.current !== null) window.clearTimeout(scrollSettledTimerRef.current);
    };
  }, []);

  return {
    activeIndex,
    carouselRef: setCarouselRef,
    handleScroll
  };
}

function clampIndex(index: number, count: number) {
  if (count <= 0) return 0;
  return Math.min(Math.max(Math.round(index), 0), count - 1);
}
