import type { StackLayerId } from "./stack";

export const STACK_EVENT = "x32:select-layer";
export const STACK_ANCHOR_PREFIX = "agentic-stack-";
export const STACK_TAB_PREFIX = "stack-tab-";

export type PendingLayerRequest = {
  id: StackLayerId;
  focus: boolean;
};

type LayerWindow = Window & {
  __x32PendingLayer?: PendingLayerRequest;
};

export function isValidStackLayer(
  value: string | undefined | null,
  validIds: readonly StackLayerId[],
): value is StackLayerId {
  return Boolean(value && validIds.includes(value as StackLayerId));
}

export function parseLayerFromHash(
  hash: string,
  validIds: readonly StackLayerId[],
): StackLayerId | null {
  const clean = hash.replace(/^#/, "").trim();
  if (!clean) return null;
  for (const prefix of [STACK_ANCHOR_PREFIX, STACK_TAB_PREFIX]) {
    if (clean.startsWith(prefix)) {
      const candidate = clean.slice(prefix.length);
      if (isValidStackLayer(candidate, validIds)) return candidate;
    }
  }
  return null;
}

export function requestLayerSelection(
  id: StackLayerId,
  win: Pick<LayerWindow, "dispatchEvent" | "__x32PendingLayer"> = window as LayerWindow,
  doc: Pick<Document, "documentElement"> = document,
): void {
  const targetWin = win as LayerWindow;
  targetWin.__x32PendingLayer = { id, focus: true };
  if (doc.documentElement?.dataset) {
    doc.documentElement.dataset.x32StackLayer = id;
  }
  targetWin.dispatchEvent(new CustomEvent<PendingLayerRequest>(STACK_EVENT, { detail: { id, focus: true } }));
}

export function clearPendingLayerSelection(
  win: Pick<LayerWindow, "__x32PendingLayer"> = window as LayerWindow,
  doc: Pick<Document, "documentElement"> = document,
): void {
  delete (win as LayerWindow).__x32PendingLayer;
  if (doc.documentElement?.dataset) {
    delete doc.documentElement.dataset.x32StackLayer;
  }
}

export function consumePendingLayerSelection(
  validIds: readonly StackLayerId[],
  win: Pick<LayerWindow, "location" | "__x32PendingLayer"> = window as LayerWindow,
  doc: Pick<Document, "documentElement"> = document,
): PendingLayerRequest | null {
  const targetWin = win as LayerWindow;
  const pending = targetWin.__x32PendingLayer;
  if (pending && isValidStackLayer(pending.id, validIds)) {
    clearPendingLayerSelection(targetWin, doc);
    return { id: pending.id, focus: pending.focus !== false };
  }

  const fromDataset = doc.documentElement?.dataset?.x32StackLayer;
  if (isValidStackLayer(fromDataset, validIds)) {
    clearPendingLayerSelection(targetWin, doc);
    return { id: fromDataset, focus: true };
  }

  const fromHash = parseLayerFromHash(targetWin.location?.hash ?? "", validIds);
  if (fromHash) {
    return { id: fromHash, focus: true };
  }

  return null;
}

export async function copyCommandToClipboard(
  command: string,
  nav: { clipboard?: { writeText?: (text: string) => Promise<void> } } | undefined =
    typeof navigator === "undefined" ? undefined : navigator,
): Promise<boolean> {
  const clipboard = nav?.clipboard;
  const writeText = clipboard?.writeText;
  if (!clipboard || typeof writeText !== "function") return false;
  try {
    await writeText.call(clipboard, command);
    return true;
  } catch {
    return false;
  }
}
