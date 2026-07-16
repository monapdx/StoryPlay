import { useEffect, useMemo, useRef, useState } from "react";
import type { StoryVariables, VariableMetaMap } from "../../types/storyCore";
import type { UsePlayStateResult } from "../../hooks/usePlayState";
import {
  formatPlayerStatValue,
  getNodeVariableExposure,
  getVisiblePlayerStats,
  type PlayerStatNodeSource,
} from "../../utils/playerVariableStats";

interface AnimatedStatNumberProps {
  value: unknown;
  className?: string;
}

function AnimatedStatNumber({ value, className = "" }: AnimatedStatNumberProps) {
  const [display, setDisplay] = useState(() => Number(value) || 0);
  const prevValueRef = useRef(Number(value) || 0);
  const rafRef = useRef(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const from = prevValueRef.current;

    if (from === target) {
      setDisplay(target);
      return undefined;
    }

    const start = performance.now();
    const duration = 520;

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(from + (target - from) * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevValueRef.current = target;
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return <span className={className}>{display}</span>;
}

interface StatValueProps {
  statKey: string;
  value: unknown;
  nodes: ReadonlyArray<PlayerStatNodeSource | null | undefined>;
  variableMeta: VariableMetaMap;
  changed?: boolean;
}

function StatValue({
  statKey,
  value,
  nodes,
  variableMeta,
  changed,
}: StatValueProps) {
  const formatted = formatPlayerStatValue(statKey, value, nodes, variableMeta);
  const isNumber = typeof value === "number";

  if (isNumber) {
    return (
      <span
        className={`player-stat-card__value ${changed ? "player-stat-card__value--changed" : ""}`}
      >
        <AnimatedStatNumber value={value} />
      </span>
    );
  }

  return (
    <span
      className={`player-stat-card__value player-stat-card__value--text ${
        changed ? "player-stat-card__value--changed" : ""
      }`}
    >
      {formatted}
    </span>
  );
}

interface PlayerStatsPanelProps {
  playVariables?: StoryVariables;
  initialVariables?: StoryVariables;
  revealedVariableKeys?: string[];
  changedVariableKeys?: string[];
  nodes?: ReadonlyArray<PlayerStatNodeSource | null | undefined>;
  variableMeta?: VariableMetaMap;
  currentPlayNode?: UsePlayStateResult["currentPlayNode"] | PlayerStatNodeSource | null;
}

export default function PlayerStatsPanel({
  playVariables = {},
  initialVariables = {},
  revealedVariableKeys = [],
  changedVariableKeys = [],
  nodes = [],
  variableMeta = {},
  currentPlayNode = null,
}: PlayerStatsPanelProps) {
  const activeNodeExposure = useMemo(() => {
    if (!currentPlayNode) return [];
    return getNodeVariableExposure(currentPlayNode);
  }, [currentPlayNode]);

  const stats = useMemo(
    () =>
      getVisiblePlayerStats({
        playVariables,
        initialVariables,
        revealedKeys: revealedVariableKeys,
        activeNodeExposure,
        nodes,
        variableMeta,
      }),
    [
      playVariables,
      initialVariables,
      revealedVariableKeys,
      activeNodeExposure,
      nodes,
      variableMeta,
    ]
  );

  const [enteredKeys, setEnteredKeys] = useState(() => new Set<string>());
  const prevVisibleKeysRef = useRef(new Set(stats.map((stat) => stat.key)));

  useEffect(() => {
    const currentKeys = new Set(stats.map((stat) => stat.key));
    const newlyVisible = [...currentKeys].filter(
      (key) => !prevVisibleKeysRef.current.has(key)
    );

    if (newlyVisible.length > 0) {
      setEnteredKeys((prev) => {
        const next = new Set(prev);
        newlyVisible.forEach((key) => next.add(key));
        return next;
      });

      const timerId = window.setTimeout(() => {
        setEnteredKeys((prev) => {
          const next = new Set(prev);
          newlyVisible.forEach((key) => next.delete(key));
          return next;
        });
      }, 700);

      prevVisibleKeysRef.current = currentKeys;
      return () => window.clearTimeout(timerId);
    }

    prevVisibleKeysRef.current = currentKeys;
    return undefined;
  }, [stats]);

  if (stats.length === 0) {
    return null;
  }

  return (
    <section className="player-stats-panel" aria-label="Your status">
      <header className="player-stats-panel__head">
        <h3 className="player-stats-panel__title">Your status</h3>
        <p className="player-stats-panel__subtitle">Updates as the story unfolds</p>
      </header>

      <div className="player-stats-panel__grid">
        {stats.map((stat) => {
          const changed = changedVariableKeys?.includes?.(stat.key);
          const isEntering = enteredKeys.has(stat.key);

          return (
            <article
              key={stat.key}
              className={[
                "player-stat-card",
                changed ? "player-stat-card--pulse" : "",
                isEntering ? "player-stat-card--enter" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="player-stat-card__icon" aria-hidden="true">
                {stat.display.icon}
              </span>
              <div className="player-stat-card__body">
                <span className="player-stat-card__label">{stat.display.label}</span>
                <StatValue
                  statKey={stat.key}
                  value={stat.value}
                  nodes={nodes}
                  variableMeta={variableMeta}
                  changed={changed}
                />
                <span className="player-stat-card__description">
                  {stat.display.description}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
