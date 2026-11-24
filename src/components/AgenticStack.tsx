import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { StackCopy, StackLayer, StackLayerId } from "../lib/stack";
import {
  clearPendingLayerSelection,
  consumePendingLayerSelection,
  copyCommandToClipboard,
  parseLayerFromHash,
  STACK_EVENT,
  type PendingLayerRequest,
} from "../lib/stack-selection";

type AgenticStackProps = {
  copy: StackCopy;
  layers: StackLayer[];
};

type CopyFeedback = {
  id: StackLayerId;
  state: "copied" | "failed";
};

const NODE_Y = [46, 134, 222, 310];
const PANEL_ID = "stack-inspector-panel";

function selectNodeText(el: HTMLElement | null) {
  if (!el || typeof window === "undefined" || typeof document === "undefined") return;
  try {
    const selection = window.getSelection?.();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    selection.removeAllRanges();
    selection.addRange(range);
  } catch {
    // Selection API unavailable in non-DOM environments
  }
}

export default function AgenticStack({ copy, layers }: AgenticStackProps) {
  const [activeId, setActiveId] = useState<StackLayerId>(layers[0]?.id ?? "self-loop");
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedback | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const codeRef = useRef<HTMLElement | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const copySeqRef = useRef(0);
  const activeIdRef = useRef<StackLayerId>(activeId);
  const isMountedRef = useRef(true);
  const pendingFocusIdRef = useRef<StackLayerId | null>(null);

  activeIdRef.current = activeId;

  useEffect(() => {
    isMountedRef.current = true;
    const validIds = layers.map((layer) => layer.id);

    const applySelection = (targetId: StackLayerId, shouldFocus: boolean) => {
      if (targetId !== activeIdRef.current) {
        copySeqRef.current += 1;
        setCopyFeedback(null);
      }
      if (shouldFocus) {
        pendingFocusIdRef.current = targetId;
      }
      activeIdRef.current = targetId;
      setActiveId((current) => {
        if (current === targetId && shouldFocus) {
          const idx = layers.findIndex((layer) => layer.id === targetId);
          if (idx >= 0) {
            tabRefs.current[idx]?.focus({ preventScroll: true });
            pendingFocusIdRef.current = null;
          }
        }
        return targetId;
      });
    };

    const initial = consumePendingLayerSelection(validIds);
    if (initial) {
      applySelection(initial.id, initial.focus);
    }

    const onSelectLayer = (event: Event) => {
      const customEvent = event as CustomEvent<Partial<PendingLayerRequest>>;
      const targetId = customEvent.detail?.id;
      if (targetId && validIds.includes(targetId)) {
        clearPendingLayerSelection();
        applySelection(targetId, customEvent.detail?.focus !== false);
      }
    };

    const onHashChange = () => {
      const fromHash = parseLayerFromHash(window.location.hash, validIds);
      if (fromHash) {
        clearPendingLayerSelection();
        applySelection(fromHash, true);
      }
    };

    window.addEventListener(STACK_EVENT, onSelectLayer);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      isMountedRef.current = false;
      window.removeEventListener(STACK_EVENT, onSelectLayer);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [layers]);

  useEffect(() => {
    if (pendingFocusIdRef.current !== activeId) return;
    const idx = layers.findIndex((layer) => layer.id === activeId);
    if (idx >= 0) {
      tabRefs.current[idx]?.focus({ preventScroll: true });
    }
    pendingFocusIdRef.current = null;
  }, [activeId, layers]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const activeIndex = Math.max(
    0,
    layers.findIndex((layer) => layer.id === activeId),
  );
  const activeLayer = layers[activeIndex] ?? layers[0];
  const upstreamLayer = layers.find((item) => item.id === activeLayer.connections.upstream);
  const downstreamLayer = layers.find((item) => item.id === activeLayer.connections.downstream);

  function selectLayer(nextId: StackLayerId, focusTab = false) {
    if (nextId !== activeIdRef.current) {
      copySeqRef.current += 1;
      setCopyFeedback(null);
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
        copyTimerRef.current = null;
      }
    }
    if (focusTab) {
      pendingFocusIdRef.current = nextId;
    }
    activeIdRef.current = nextId;
    setActiveId(nextId);
  }

  function activateIndex(nextIndex: number) {
    const bounded = (nextIndex + layers.length) % layers.length;
    const next = layers[bounded];
    if (!next) return;
    selectLayer(next.id, true);
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
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = null;
    }

    const requestSeq = ++copySeqRef.current;
    const copied = await copyCommandToClipboard(command);

    if (!isMountedRef.current || requestSeq !== copySeqRef.current || activeIdRef.current !== id) {
      return;
    }

    if (!copied && codeRef.current?.dataset?.layerId === id) {
      selectNodeText(codeRef.current);
    }

    const state: CopyFeedback["state"] = copied ? "copied" : "failed";
    setCopyFeedback({ id, state });
    copyTimerRef.current = window.setTimeout(() => {
      setCopyFeedback((current) => (current?.id === id ? null : current));
      copyTimerRef.current = null;
    }, copied ? 1800 : 3200);
  }

  const upstreamIndex = layers.findIndex((l) => l.id === activeLayer.connections.upstream);
  const downstreamIndex = layers.findIndex((l) => l.id === activeLayer.connections.downstream);
  const feedbackHighlighted = activeIndex === 0 || activeIndex === layers.length - 1;
  const activeCopyState = copyFeedback?.id === activeLayer.id ? copyFeedback.state : null;
  const copyButtonLabel =
    activeCopyState === "copied"
      ? copy.copiedLabel
      : activeCopyState === "failed"
        ? copy.copyFailedLabel
        : copy.copyLabel;

  return (
    <div className="stack-explorer">
      <div className="stack-topology">
        <div className="bus-rail" aria-hidden="true">
          <svg viewBox="0 0 64 356" fill="none" className="bus-svg">
            <line x1="22" y1="46" x2="22" y2="310" stroke="rgba(243,244,246,0.16)" strokeWidth="1" />

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
                  stroke={isFlowActive ? "#c9b896" : "rgba(243,244,246,0.12)"}
                  strokeWidth={isFlowActive ? "2" : "1"}
                />
              );
            })}

            <path
              d="M 28 310 C 56 310, 56 46, 28 46"
              stroke={feedbackHighlighted ? "#c9b896" : "rgba(201,184,150,0.28)"}
              strokeWidth={feedbackHighlighted ? "1.6" : "1"}
              strokeDasharray="3 4"
              fill="none"
            />

            {NODE_Y.map((cy, idx) => {
              const isSelected = idx === activeIndex;
              const isLinked = idx === upstreamIndex || idx === downstreamIndex;
              return (
                <g key={cy}>
                  {isSelected && (
                    <circle
                      cx="22"
                      cy={cy}
                      r="9.5"
                      fill="rgba(201,184,150,0.14)"
                      stroke="#c9b896"
                      strokeWidth="1"
                    />
                  )}
                  <circle
                    cx="22"
                    cy={cy}
                    r={isSelected ? "4.5" : isLinked ? "3.6" : "3"}
                    fill={isSelected ? "#c9b896" : isLinked ? "#f3f4f6" : "#11141a"}
                    stroke={isSelected ? "#f3f4f6" : "rgba(243,244,246,0.45)"}
                    strokeWidth="1"
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
                aria-controls={PANEL_ID}
                tabIndex={isSelected ? 0 : -1}
                className={`stack-tab ${isSelected ? "is-active" : ""} ${isRelated ? "is-linked" : ""}`}
                onClick={() => selectLayer(layer.id)}
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
        className="arch-panel stack-inspector"
        role="tabpanel"
        id={PANEL_ID}
        aria-labelledby={`stack-tab-${activeLayer.id}`}
      >
        <div className="inspector-head">
          <div className="inspector-meta">
            <span className="inspector-chip mono-metric">
              {activeLayer.code} · {activeLayer.badge}
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
              className={`copy-btn mono-metric ${activeCopyState ? `is-${activeCopyState}` : ""}`}
              onClick={() => handleCopy(activeLayer.command, activeLayer.id)}
            >
              {copyButtonLabel}
            </button>
          </div>
          <span className="sr-only" role="status" aria-live="polite">
            {activeCopyState ? copyButtonLabel : ""}
          </span>
          <div className="cmd-block">
            <span className="cmd-prompt" aria-hidden="true">$</span>
            <code ref={codeRef} data-layer-id={activeLayer.id}>{activeLayer.command}</code>
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
            <div className="spec-matrix">
              <p className="matrix-title mono-metric">{activeLayer.visual.title}</p>
              <div className="matrix-grid">
                {activeLayer.visual.readouts.map((item) => (
                  <div key={item.label} className="matrix-cell">
                    <span className="mono-metric">{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="guarantees">
          <p className="sub-heading">{copy.guaranteesLabel}</p>
          <ul>
            {activeLayer.guarantees.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="composition-bar">
          <div>
            <p className="sub-heading">{copy.compositionLabel}</p>
            <p className="composition-text">{activeLayer.connections.summary}</p>
          </div>
          <div className="jump-pills">
            {upstreamLayer && (
              <button
                type="button"
                className="jump-pill mono-metric"
                onClick={() => selectLayer(upstreamLayer.id, true)}
              >
                {copy.upstreamLabel}: {upstreamLayer.code} {upstreamLayer.name}
              </button>
            )}
            {downstreamLayer && (
              <button
                type="button"
                className="jump-pill mono-metric"
                onClick={() => selectLayer(downstreamLayer.id, true)}
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
            <a className="btn btn-secondary" href={activeLayer.links.secondary.href}>
              {activeLayer.links.secondary.label} →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
