"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { UIEvent } from "react";

export function useCenteredCarousel(itemCount: number) {
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scrollSettledTimerRef = useRef<number | null>(null);

  const syncActiveIndex = useCallback((element: HTMLDivElement | null = carouselRef.current) => {
    if (!element || itemCount < 2) {
      setActiveIndex(0);
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

    setActiveIndex((current) => (current === nearestIndex ? current : nearestIndex));
  }, [itemCount]);

  const setCarouselRef = useCallback(
    (element: HTMLDivElement | null) => {
      carouselRef.current = element;
      if (element) window.requestAnimationFrame(() => syncActiveIndex(element));
    },
    [syncActiveIndex]
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
    setActiveIndex((current) => Math.min(current, Math.max(0, itemCount - 1)));
    window.requestAnimationFrame(() => syncActiveIndex());
  }, [itemCount, syncActiveIndex]);

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
