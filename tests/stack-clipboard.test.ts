import { describe, expect, it, vi } from "vitest";
import { getStackCopy, getStackLayers } from "../src/lib/stack";

const hookState = {
  cursor: 0,
  states: [] as unknown[],
  refs: [] as Array<{ current: unknown }>,
  effects: [] as Array<() => void | (() => void)>,
  cleanups: [] as Array<() => void>,
};

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useState<T>(initial: T | (() => T)) {
      const idx = hookState.cursor++;
      if (!(idx in hookState.states)) {
        hookState.states[idx] = typeof initial === "function" ? (initial as () => T)() : initial;
      }
      const setState = (next: T | ((prev: T) => T)) => {
        const prev = hookState.states[idx] as T;
        hookState.states[idx] = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      };
      return [hookState.states[idx] as T, setState] as const;
    },
    useRef<T>(initial: T) {
      const idx = hookState.cursor++;
      if (!(idx in hookState.refs)) {
        hookState.refs[idx] = { current: initial };
      }
      return hookState.refs[idx] as { current: T };
    },
    useEffect(effect: () => void | (() => void)) {
      hookState.effects.push(effect);
    },
  };
});

import AgenticStack from "../src/components/AgenticStack";

type VNode = { type?: unknown; props?: Record<string, unknown>; ref?: ((el: unknown) => void) | { current: unknown } };

function walk(node: unknown, visit: (el: VNode) => void) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const child of node) walk(child, visit);
    return;
  }
  const el = node as VNode;
  visit(el);
  if (el.props?.children) walk(el.props.children, visit);
}

function findNode(tree: unknown, predicate: (el: VNode) => boolean): VNode | undefined {
  let found: VNode | undefined;
  walk(tree, (el) => {
    if (!found && predicate(el)) found = el;
  });
  return found;
}

function createHarness(locale: "en" | "zh", writeText: (text: string) => Promise<void>) {
  hookState.cursor = 0;
  hookState.states = [];
  hookState.refs = [];
  hookState.effects = [];
  hookState.cleanups = [];

  const selectedNodes: Array<{ layerId?: string; text?: string }> = [];
  const win = Object.assign(new EventTarget(), {
    location: { hash: "" },
    setTimeout: () => 1,
    clearTimeout: () => {},
    getSelection: () => ({
      removeAllRanges() {},
      addRange(range: { node?: { dataset?: { layerId?: string }; textContent?: string } }) {
        selectedNodes.push({
          layerId: range.node?.dataset?.layerId,
          text: range.node?.textContent,
        });
      },
    }),
  });
  const doc = {
    documentElement: { dataset: {} as Record<string, string> },
    createRange: () => {
      const range: { node?: unknown; selectNodeContents: (n: unknown) => void } = {
        selectNodeContents(n: unknown) {
          this.node = n;
        },
      };
      return range;
    },
  };

  vi.stubGlobal("window", win);
  vi.stubGlobal("document", doc);
  vi.stubGlobal("navigator", { clipboard: { writeText } });

  const copy = getStackCopy(locale);
  const layers = getStackLayers(locale);

  function render() {
    hookState.cursor = 0;
    hookState.effects = [];
    const tree = AgenticStack({ copy, layers });
    const codeEl = findNode(tree, (el) => el.type === "code");
    const codeRef = (codeEl?.props?.ref ?? codeEl?.ref) as { current: unknown } | undefined;
    if (codeRef && typeof codeRef === "object" && "current" in codeRef) {
      codeRef.current = {
        dataset: { layerId: codeEl?.props?.["data-layer-id"] as string },
        textContent: String(codeEl?.props?.children ?? ""),
      };
    }
    for (const effect of hookState.effects) {
      const cleanup = effect();
      if (typeof cleanup === "function") hookState.cleanups.push(cleanup);
    }
    return tree;
  }

  return { copy, layers, render, selectedNodes };
}

describe("V2-R3-01 AgenticStack async clipboard fallback isolation", () => {
  for (const locale of ["en", "zh"] as const) {
    it(`keeps initiating-layer failure feedback & prevents cross-layer selection leak (${locale})`, async () => {
      let rejectWrite!: (err: Error) => void;
      const pendingWrite = () =>
        new Promise<void>((_resolve, reject) => {
          rejectWrite = reject;
        });

      const h = createHarness(locale, pendingWrite);

      // Case 1: Click Copy on self-loop, switch to Argus while pending, then reject
      let tree = h.render();
      const copyBtn = findNode(tree, (el) => el.type === "button" && String(el.props?.className ?? "").includes("copy-btn"));
      const argusTab = findNode(tree, (el) => el.props?.id === "stack-tab-argus");
      expect(copyBtn).toBeDefined();
      expect(argusTab).toBeDefined();

      const copyPromise = (copyBtn!.props!.onClick as () => Promise<void>)();
      (argusTab!.props!.onClick as () => void)();
      tree = h.render();

      rejectWrite(new Error("clipboard denied"));
      await copyPromise;
      tree = h.render();

      expect(h.selectedNodes, `${locale}: late failure must not select Argus`).toEqual([]);
      const argusCopyBtn = findNode(tree, (el) => el.type === "button" && String(el.props?.className ?? "").includes("copy-btn"));
      const liveStatus = findNode(tree, (el) => el.props?.role === "status");
      expect(argusCopyBtn?.props?.children).toBe(h.copy.copyLabel);
      expect(liveStatus?.props?.children).toBe("");

      // Case 2: Stay on Argus, click Copy, reject -> selects Argus and shows localized failure
      const argusPromise = (argusCopyBtn!.props!.onClick as () => Promise<void>)();
      rejectWrite(new Error("clipboard denied"));
      await argusPromise;
      tree = h.render();

      expect(h.selectedNodes).toHaveLength(1);
      expect(h.selectedNodes[0].layerId).toBe("argus");
      const failedBtn = findNode(tree, (el) => el.type === "button" && String(el.props?.className ?? "").includes("copy-btn"));
      const failedStatus = findNode(tree, (el) => el.props?.role === "status");
      expect(failedBtn?.props?.children).toBe(h.copy.copyFailedLabel);
      expect(failedStatus?.props?.children).toBe(h.copy.copyFailedLabel);
    });
  }
});
