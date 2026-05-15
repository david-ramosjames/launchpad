"use client";

import { useState, useEffect, useCallback } from "react";
import { CORE_VALUES } from "@/lib/core-values";
import { cn } from "@/lib/utils";

const ROTATE_MS = 5500;

export function ValuesRotator() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const goTo = useCallback((index: number) => {
    setActive(index);
    setAnimKey((k) => k + 1);
  }, []);

  const next = useCallback(() => {
    goTo((active + 1) % CORE_VALUES.length);
  }, [active, goTo]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, ROTATE_MS);
    return () => clearInterval(id);
  }, [paused, next]);

  const value = CORE_VALUES[active];
  const Icon = value.icon;

  return (
    <section
      className="relative overflow-hidden border-b border-navy-700/50 bg-navy-800"
      aria-label="Firm core values"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-pink-500/20 blur-3xl" />
        <div className="absolute -right-16 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-pink-400/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.06]">
          <div className="values-marquee flex gap-16 whitespace-nowrap text-6xl font-bold uppercase tracking-[0.2em] text-white sm:text-7xl">
            {[...CORE_VALUES, ...CORE_VALUES].map((v, i) => (
              <span key={`${v.id}-${i}`}>{v.title}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-pink-400">
            Our Core Values
          </p>
          <div className="flex items-center gap-2">
            {CORE_VALUES.map((v, i) => (
              <button
                key={v.id}
                type="button"
                onClick={() => goTo(i)}
                className={cn(
                  "h-1.5 overflow-hidden rounded-full transition-all duration-500",
                  i === active
                    ? "w-10 bg-pink-500"
                    : "w-1.5 bg-white/25 hover:bg-white/40"
                )}
                aria-label={`Show ${v.title}`}
                aria-current={i === active ? "true" : undefined}
              />
            ))}
          </div>
        </div>

        <div
          key={animKey}
          className="values-enter mt-4 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-6"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/30 ring-2 ring-white/10 sm:h-16 sm:w-16">
            <Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {value.title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-navy-100/90 sm:text-base">
              {value.description}
            </p>
          </div>
        </div>

        <div className="mt-5 hidden flex-wrap gap-2 sm:flex">
          {CORE_VALUES.map((v, i) => (
            <button
              key={v.id}
              type="button"
              onClick={() => goTo(i)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-all duration-300",
                i === active
                  ? "border-pink-400/60 bg-pink-500/20 text-white"
                  : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/80"
              )}
            >
              {v.title}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
