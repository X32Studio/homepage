import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { StackCopy, StackLayer, StackLayerId } from "@lib/stack";

type AgenticStackProps = {
  copy: StackCopy;
  layers: StackLayer[];
};

const NODE_Y = [46, 134, 222, 310];

export default function AgenticStack({ copy, layers }: AgenticStackProps) {
  const [activeId, setActiveId] = useState<StackLayerId>(layers[0]?.id ?? "self-loop");
  const [copiedId, setCopiedId] = useState<StackLayerId | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const onSelectLayer = (event: Event) => {
      const customEvent = event as CustomEvent<{ id?: StackLayerId }>;
      const targetId = customEvent.detail?.id;
      if (targetId && layers.some((layer) => layer.id === targetId)) {
        setActiveId(targetId);
      }
    };

    window.addEventListener("x32:select-layer", onSelectLayer);
    return () => window.removeEventListener("x32:select-layer", onSelectLayer);
  }, [layers]);

  const activeIndex = Math.max(
    0,
    layers.findIndex((layer) => layer.id === activeId),
  );
  const activeLayer = layers[activeIndex] ?? layers[0];
  const upstreamLayer = layers.find((item) => item.id === activeLayer.connections.upstream);
  const downstreamLayer = layers.find((item) => item.id === activeLayer.connections.downstream);

  function activateIndex(nextIndex: number) {
    const bounded = (nextIndex + layers.length) % layers.length;
    const next = layers[bounded];
    if (!next) return;
    setActiveId(next.id);
    tabRefs.current[bounded]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      activateIndex(index + 1);
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      activateIndex(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      activateIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      activateIndex(layers.length - 1);
    }
  }

  async function handleCopy(command: string, id: StackLayerId) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(command);
      }
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 1800);
    } catch {
      setCopiedId(id);
    }
  }

  const upstreamIndex = layers.findIndex((l) => l.id === activeLayer.connections.upstream);
  const downstreamIndex = layers.findIndex((l) => l.id === activeLayer.connections.downstream);
  const feedbackHighlighted = activeIndex === 0 || activeIndex === layers.length - 1;

  return (
    <div className="stack-explorer">
      <div className="stack-topology">
        <div className="bus-rail" aria-hidden="true">
          <svg viewBox="0 0 64 356" fill="none" className="bus-svg">
            {/* Vertical telemetry bus spine */}
            <line x1="22" y1="46" x2="22" y2="310" stroke="rgba(110,231,255,0.22)" strokeWidth="1.5" />

            {/* Adjacent forward edges */}
            {[0, 1, 2].map((idx) => {
              const isFlowActive =
                (activeIndex === idx && downstreamIndex === idx + 1) ||
                (activeIndex === idx + 1 && upstreamIndex === idx);
              return (
                <line
                  key={idx}
                  x1="22"
                  y1={NODE_Y[idx]}
                  x2="22"
                  y2={NODE_Y[idx + 1]}
                  stroke={isFlowActive ? "#6ee7ff" : "rgba(110,231,255,0.16)"}
                  strokeWidth={isFlowActive ? "2.6" : "1.5"}
                />
              );
            })}

            {/* Closed feedback loop L4 -> L1 */}
            <path
              d="M 28 310 C 56 310, 56 46, 28 46"
              stroke={feedbackHighlighted ? "#8b7cf8" : "rgba(139,124,248,0.28)"}
              strokeWidth={feedbackHighlighted ? "2.2" : "1.25"}
              strokeDasharray="4 4"
              fill="none"
            />

            {/* Layer nodes */}
            {NODE_Y.map((cy, idx) => {
              const isSelected = idx === activeIndex;
              const isLinked = idx === upstreamIndex || idx === downstreamIndex;
              return (
                <g key={cy}>
                  {isSelected && (
                    <circle cx="22" cy={cy} r="10" fill="rgba(110,231,255,0.16)" stroke="#6ee7ff" strokeWidth="1" />
                  )}
                  <circle
                    cx="22"
                    cy={cy}
                    r={isSelected ? "5" : isLinked ? "4" : "3.2"}
                    fill={isSelected ? "#6ee7ff" : isLinked ? "#8b7cf8" : "#243052"}
                    stroke={isSelected ? "#eef2ff" : "#6ee7ff"}
                    strokeOpacity={isSelected ? "1" : "0.45"}
                    strokeWidth="1.2"
                  />
                </g>
              );
            })}
          </svg>
          <span className="bus-caption mono-metric">{copy.feedbackLabel}</span>
        </div>

        <div className="stack-tabs" role="tablist" aria-label={copy.busLabel}>
          {layers.map((layer, index) => {
            const isSelected = layer.id === activeLayer.id;
            const isRelated =
              layer.id === activeLayer.connections.upstream ||
              layer.id === activeLayer.connections.downstream;

            return (
              <button
                key={layer.id}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                type="button"
                role="tab"
                id={`stack-tab-${layer.id}`}
                aria-selected={isSelected}
                aria-controls={`stack-panel-${layer.id}`}
                tabIndex={isSelected ? 0 : -1}
                className={`stack-tab ${isSelected ? "is-active" : ""} ${isRelated ? "is-linked" : ""}`}
                onClick={() => setActiveId(layer.id)}
                onKeyDown={(event) => handleKeyDown(event, index)}
              >
                <span className="tab-head">
                  <span className="tab-code mono-metric">{layer.code}</span>
                  <span className="tab-badge mono-metric">{layer.badge}</span>
                </span>
                <span className="tab-name">{layer.name}</span>
                <span className="tab-role">{layer.role}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="hud-frame stack-inspector"
        role="tabpanel"
        id={`stack-panel-${activeLayer.id}`}
        aria-labelledby={`stack-tab-${activeLayer.id}`}
      >
        <div className="inspector-head">
          <div className="inspector-meta">
            <span className="telemetry-chip is-cyan">
              {activeLayer.code} // {activeLayer.badge}
            </span>
            <span className="inspector-role mono-metric">{activeLayer.role}</span>
          </div>
          <h3>{activeLayer.name}</h3>
          <p className="inspector-oneliner">{activeLayer.oneLiner}</p>
          <p className="inspector-desc">{activeLayer.description}</p>
        </div>

        <div className="io-grid">
          <div className="io-cell">
            <span className="io-label mono-metric">{copy.inputLabel}</span>
            <p>{activeLayer.io.input}</p>
          </div>
          <div className="io-arrow mono-metric" aria-hidden="true">
            →
          </div>
          <div className="io-cell">
            <span className="io-label mono-metric">{copy.outputLabel}</span>
            <p>{activeLayer.io.output}</p>
          </div>
        </div>

        <div className="command-wrap">
          <div className="command-header">
            <span className="mono-metric">{activeLayer.commandLabel}</span>
            <button
              type="button"
              className="copy-btn mono-metric"
              onClick={() => handleCopy(activeLayer.command, activeLayer.id)}
            >
              {copiedId === activeLayer.id ? copy.copiedLabel : copy.copyLabel}
            </button>
          </div>
          <div className="cmd-block">
            <code>$ {activeLayer.command}</code>
          </div>
        </div>

        <div className="visual-slot">
          {activeLayer.visual.type === "image" ? (
            <figure className="instrument-figure">
              <img
                src={activeLayer.visual.src}
                alt={activeLayer.visual.alt}
                width="760"
                height="428"
                loading="lazy"
              />
              <figcaption className="mono-metric">{activeLayer.visual.caption}</figcaption>
            </figure>
          ) : (
            <div className="telemetry-matrix">
              <p className="matrix-title mono-metric">{activeLayer.visual.title}</p>
              <div className="matrix-grid">
                {activeLayer.visual.readouts.map((item) => (
                  <div key={item.label} className={`matrix-cell tone-${item.tone}`}>
                    <span className="mono-metric">{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="guarantees">
          <p className="sub-heading mono-metric">{copy.guaranteesLabel}</p>
          <ul>
            {activeLayer.guarantees.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="composition-bar">
          <div>
            <p className="sub-heading mono-metric">{copy.compositionLabel}</p>
            <p className="composition-text">{activeLayer.connections.summary}</p>
          </div>
          <div className="jump-pills">
            {upstreamLayer && (
              <button
                type="button"
                className="jump-pill mono-metric"
                onClick={() => setActiveId(upstreamLayer.id)}
              >
                {copy.upstreamLabel}: {upstreamLayer.code} {upstreamLayer.name}
              </button>
            )}
            {downstreamLayer && (
              <button
                type="button"
                className="jump-pill mono-metric"
                onClick={() => setActiveId(downstreamLayer.id)}
              >
                {copy.downstreamLabel}: {downstreamLayer.code} {downstreamLayer.name}
              </button>
            )}
          </div>
        </div>

        <div className="inspector-actions">
          <a
            className="btn btn-primary"
            href={activeLayer.links.primary.href}
            target={activeLayer.links.primary.href.startsWith("http") ? "_blank" : undefined}
            rel={activeLayer.links.primary.href.startsWith("http") ? "noopener noreferrer" : undefined}
          >
            {activeLayer.links.primary.label} ↗
          </a>
          {activeLayer.links.secondary && (
            <a className="btn btn-ghost" href={activeLayer.links.secondary.href}>
              {activeLayer.links.secondary.label} →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
