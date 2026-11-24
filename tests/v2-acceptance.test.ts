import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { parse, type DefaultTreeAdapterTypes } from "parse5";
import { parse as parseYaml } from "yaml";
import { beforeAll, expect, it } from "vitest";
import { getSiteContent } from "../src/lib/content";
import { getStackCopy, getStackLayers, type StackLayerId } from "../src/lib/stack";
import {
  consumePendingLayerSelection,
  copyCommandToClipboard,
  parseLayerFromHash,
  requestLayerSelection,
} from "../src/lib/stack-selection";

type Node = DefaultTreeAdapterTypes.Node;
type Element = DefaultTreeAdapterTypes.Element;
type Project = { locale: "en" | "zh"; name: string; visibility?: string };
const locales = ["en", "zh"] as const;
const homes = ["/", "/zh/"];
const profiles = [...homes, "/about/", "/zh/about/"];
const projectSlugs = ["agent-dao-public", "argus", "self-loop", "skills-system-guide"];
const origin = "https://x32studio.com";
const stackImports = import.meta.glob<{
  getStackLayers(locale: (typeof locales)[number]): readonly { id: string }[];
}>("../src/lib/stack.ts");
const read = (path: string) => readFileSync(path, "utf8");
const distFile = (route: string) => `dist${route}index.html`;
const html = (route: string) => parse(read(distFile(route)));
const files = (dir: string) =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile()).map((entry) => join(entry.parentPath, entry.name));
const attr = (node: Element, key: string) => node.attrs.find(({ name }) => name === key)?.value;
const byClass = (node: Element, name: string) => attr(node, "class")?.split(/\s+/).includes(name);
const normalized = (text: string) => text.replace(/\s+/g, " ").trim();
const children = (node: Node): Node[] => "childNodes" in node ? node.childNodes : [];
function elements(node: Node, match: (element: Element) => unknown): Element[] {
  const self = "tagName" in node && match(node) ? [node] : [];
  return self.concat(children(node).flatMap((child) => elements(child, match)));
}
function text(node: Node): string {
  if ("value" in node) return node.value;
  if ("tagName" in node && /^(script|style|template)$/.test(node.tagName)) return "";
  return children(node).map(text).join(" ");
}
function links(node: Node, route: string) {
  return elements(node, (el) => el.tagName === "a" && attr(el, "href"))
    .map((el) => ({ el, url: new URL(attr(el, "href")!, origin + route) }));
}
beforeAll(() => {
  if (!existsSync(distFile("/"))) {
    execFileSync("npm", ["run", "build"], { stdio: "inherit", timeout: 115_000 });
  }
}, 120_000);
it("V2-F1-03 marks the current page in both navigation layouts across the eight section routes", () => {
  for (const root of homes) {
    const routes = ["", "projects/", "blog/", "about/"].map((suffix) => root + suffix);
    for (const route of routes) {
      const navs = elements(html(route), (el) => el.tagName === "nav");
      const menus = navs.map((nav) => links(nav, route).filter(({ url }) =>
        url.origin === origin && routes.includes(url.pathname)));
      const primary = menus.filter((menu) => new Set(menu.map(({ url }) => url.pathname)).size === routes.length);
      expect(primary.length, `${route} primary navigation layouts`).toBeGreaterThanOrEqual(2);
      for (const menu of primary) {
        expect(menu.filter(({ el }) => attr(el, "aria-current") === "page")
          .map(({ url }) => url.pathname), route).toEqual([route]);
      }
    }
  }
});
it("V2-F1-04 keeps the footer brand in the Chinese locale", () => {
  for (const path of files("dist/zh").filter((file) => file.endsWith("/index.html"))) {
    const route = path.slice("dist".length, -"index.html".length);
    const footer = elements(html(route), (el) => el.tagName === "footer");
    const brands = footer.flatMap((el) => links(el, route)).filter(({ el }) =>
      byClass(el, "brand-mark") || /^X32\s*Studio(?:\s+home)?$/i.test(normalized(attr(el, "aria-label") ?? text(el))));
    expect(brands.map(({ url }) => url.origin + url.pathname), route).toEqual([origin + "/zh/"]);
  }
});
it("V2-F1-05 removes both retired components", () => {
  expect(files("src").map((path) => basename(path))
    .filter((name) => ["LinkDock.tsx", "ArgusShowcase.astro"].includes(name))).toEqual([]);
});
it("V2-F2-01 publishes real telemetry and removes vanity counters in both languages", () => {
  for (const route of homes) {
    const copy = normalized(text(elements(html(route), (el) => el.tagName === "main")[0]));
    expect(copy, route).not.toMatch(/∞\s*(?:curiosity|好奇心)|(?:★\s*)+(?:elite crew|精英(?:\s*geek)?\s*小队)/i);
    for (const signal of ["v0.4.10", "self-loop", "k-r33"]) expect(copy, route).toContain(signal);
  }
});
it("V2-F2-02 preserves agentic in the Chinese hero subtitle", () => {
  expect(getSiteContent("zh").hero.subtitle).toContain("agentic");
});
it("V2-F3-01 publishes matching public projects in both catalogs", () => {
  const records = files("src/content/projects").filter((file) => file.endsWith(".md"))
    .map((file) => ({
      slug: basename(file).replace(/\.(en|zh)\.md$/, ""),
      data: parseYaml(read(file).split(/^---\s*$/m)[1]) as Project,
    }));
  expect(records.find(({ slug }) => slug === "email-homie")?.data.visibility).toBe("private");
  const slugs = locales.map((locale) => {
    const projects = records.filter(({ data }) => data.locale === locale && data.visibility !== "private");
    const route = locale === "en" ? "/projects/" : "/zh/projects/";
    const page = html(route);
    const grids = elements(page, (el) => byClass(el, "project-grid"));
    expect(grids.length, route).toBeGreaterThan(0);
    const headings = grids.flatMap((grid) => elements(grid, (el) => /^h[2-6]$/.test(el.tagName)))
      .map((el) => normalized(text(el)));
    for (const { slug, data } of projects) {
      expect(headings.some((heading) => heading.includes(normalized(data.name))), `${route} ${slug}`).toBe(true);
    }
    return projects.map(({ slug }) => slug).sort();
  });
  expect(slugs[0]).toEqual(expect.arrayContaining(projectSlugs));
  expect(slugs[1]).toEqual(slugs[0]);
  expect(new Set(slugs[0]).size).toBe(slugs[0].length);
});
it("V2-F3-02 keeps the private draft out of all deployable files", () => {
  const leak = /email[-\s]homie/i;
  expect(files("dist").filter((file) => leak.test(file) || leak.test(read(file)))).toEqual([]);
});
it("V2-F3-03 renders project Markdown before publishing HTML", () => {
  for (const route of ["/projects/", "/zh/projects/"]) {
    expect(text(html(route)), route).not.toContain("**");
  }
});
it("V2-F3-04 renders four accessible tabs with an associated default panel in each locale", () => {
  for (const route of homes) {
    const [stack] = elements(html(route), (el) => attr(el, "id") === "agentic-stack");
    expect(stack, route).toBeDefined();
    expect(elements(stack, (el) => el.tagName === "astro-island" && attr(el, "client") === "visible"), route).not.toHaveLength(0);
    const [tablist] = elements(stack, (el) => attr(el, "role") === "tablist");
    expect(tablist, route).toBeDefined();
    const tabs = elements(tablist, (el) => attr(el, "role") === "tab");
    expect(tabs, route).toHaveLength(4);
    const selected = tabs.map((tab) => attr(tab, "aria-selected"));
    expect(selected, route).toEqual(["true", "false", "false", "false"]);
    const [active] = tabs;
    expect(text(active), route).toMatch(/self-loop/i);
    const panel = elements(stack, (el) => attr(el, "role") === "tabpanel")
      .find((el) => attr(el, "id") === attr(active, "aria-controls") && attr(el, "id"));
    expect(panel, route).toBeDefined();
    expect(attr(panel!, "aria-labelledby")?.split(/\s+/), route).toContain(attr(active, "id"));
    const ids = tabs.map((tab) => attr(tab, "id"));
    expect(ids.every(Boolean) && new Set(ids).size === 4, route).toBe(true);
  }
});
it("V2-F3-05 exposes four matching ordered layer IDs from stack.ts", async () => {
  const load = stackImports["../src/lib/stack.ts"];
  expect(load, "stack data module").toBeDefined();
  const { getStackLayers } = await load();
  const [english, chinese] = locales.map((locale) => getStackLayers(locale).map(({ id }) => id));
  expect(english).toHaveLength(4);
  expect(new Set(english).size).toBe(4);
  expect(english[0]).toBe("self-loop");
  expect(chinese).toEqual(english);
});
it("V2-F3-06 ships every referenced local WebP", () => {
  for (const file of files("dist").filter((path) => path.endsWith(".html"))) {
    for (const [, asset] of read(file).matchAll(/(?:^|[\s"'(,=;])(?:https:\/\/x32studio\.com)?(\/assets\/[^"'<>\s?#(),]+\.webp)\b/gi)) {
      expect(existsSync("public" + decodeURIComponent(asset)), `${file} → ${asset}`).toBe(true);
    }
  }
});
it("V2-F4-01 drops stale founder and crew copy from the four profile surfaces", () => {
  const stale = /elite\s+geek\s+crew|精英\s*geek\s*小队|quantitative\s+finance|量化金融|vera\s+xian|quiet\s+builders|不具名的建造者/i;
  for (const route of profiles) {
    expect(read(distFile(route)), route).not.toMatch(stale);
    expect(normalized(text(html(route))), route).not.toMatch(stale);
  }
});
it("V2-F4-02 shows the verified founder credentials and working identity link targets", () => {
  for (const route of profiles) {
    const page = html(route);
    const [main] = elements(page, (el) => el.tagName === "main");
    const copy = normalized(text(main));
    expect(copy, route).toMatch(/Ruiyuan\s+Kang/i);
    for (const credential of [/\bk-r33\b/i, /\bTII\b/, /\bDRI\b/, /\bOPC\b/, /Organizational Intelligence|组织智能/i]) {
      expect(copy, route).toMatch(credential);
    }
    const targets = links(page, route).filter(({ url }) => url.protocol === "https:")
      .map(({ url }) => (url.hostname + url.pathname).replace(/\/$/, "").toLowerCase());
    for (const target of ["github.com/k-r33", "k-r33.github.io", "github.com/x32studio/self-loop"]) {
      expect(targets, route).toContain(target);
    }
  }
});
function objects(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(objects);
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  return [record, ...Object.values(record).flatMap(objects)];
}

it("V2-F4-03 serializes a valid Organization and Person identity graph", () => {
  const scripts = elements(html("/"), (el) => el.tagName === "script" && attr(el, "type") === "application/ld+json");
  const entities = scripts.flatMap((el) => objects(JSON.parse(children(el).map(text).join(""))));
  const typed = (entity: Record<string, unknown>, type: string) => [entity["@type"]].flat().includes(type);
  expect(entities.some((node) => typed(node, "Organization") && node.name === "X32 Studio")).toBe(true);
  expect(entities.some((node) => typed(node, "Person") && node.name === "Ruiyuan Kang" &&
    [node.sameAs].flat().includes("https://github.com/k-r33"))).toBe(true);
});
it("V2-F4-04 enforces the 500-line ceiling across source and tests", () => {
  const oversized = [...files("src"), ...files("tests")]
    .filter((file) => /\.(astro|css|js|mjs|ts|tsx)$/.test(file) && read(file).split(/\r?\n/).length > 500);
  expect(oversized).toEqual([]);
});

it("V2-R2-01 persists cold-entry hero layer selection across hydration and resolves all tab aria-controls in both locales", () => {
  const validIds: StackLayerId[] = ["self-loop", "skills-system", "argus", "agent-dao"];

  for (const route of homes) {
    const page = html(route);
    const jumps = elements(page, (el) => el.tagName === "a" && Boolean(attr(el, "data-stack-jump")));
    expect(jumps.map((el) => attr(el, "data-stack-jump")), route).toEqual(validIds);
    expect(jumps.map((el) => attr(el, "href")), route).toEqual(validIds.map((id) => `#agentic-stack-${id}`));

    const [stack] = elements(page, (el) => attr(el, "id") === "agentic-stack");
    expect(stack, route).toBeDefined();
    for (const id of validIds) {
      expect(elements(stack, (el) => attr(el, "id") === `agentic-stack-${id}`), `${route} anchor ${id}`).toHaveLength(1);
    }

    const tabs = elements(stack, (el) => attr(el, "role") === "tab");
    const panelIds = new Set(elements(stack, (el) => attr(el, "role") === "tabpanel").map((el) => attr(el, "id")));
    for (const tab of tabs) {
      expect(panelIds.has(attr(tab, "aria-controls")), `${route} ${attr(tab, "id")} aria-controls`).toBe(true);
    }
  }

  // Simulate cold-entry click on Argus before AgenticStack mounts
  const win = Object.assign(new EventTarget(), { location: { hash: "#agentic-stack-argus" } });
  const doc = { documentElement: { dataset: {} as DOMStringMap } } as unknown as Document;
  requestLayerSelection("argus", win as unknown as Window, doc);
  expect(doc.documentElement.dataset.x32StackLayer).toBe("argus");
  const consumed = consumePendingLayerSelection(validIds, win as unknown as Window, doc);
  expect(consumed).toEqual({ id: "argus", focus: true });
  expect(doc.documentElement.dataset.x32StackLayer).toBeUndefined();
  expect(parseLayerFromHash("#agentic-stack-agent-dao", validIds)).toBe("agent-dao");
  expect(parseLayerFromHash("#agentic-stack-unknown", validIds)).toBeNull();
});

it("V2-R2-02 publishes the verified v0.4.10 demo command for self-loop in both locales", () => {
  for (const locale of locales) {
    const selfLoop = getStackLayers(locale).find((layer) => layer.id === "self-loop");
    expect(selfLoop, locale).toBeDefined();
    expect(selfLoop!.command, locale).not.toMatch(/self-loop\s+--/);
    expect(selfLoop!.command, locale).toContain("https://github.com/X32Studio/self-loop.git");
    expect(selfLoop!.command, locale).toContain("npm run demo");
  }
  for (const route of homes) {
    const pageText = text(html(route));
    expect(pageText, route).not.toMatch(/self-loop\s+--phase/);
    expect(pageText, route).toContain("npm run demo");
  }
});

it("V2-R2-03 reports clipboard success only when writeText resolves and exposes honest failure labels", async () => {
  expect(await copyCommandToClipboard("npm run demo", {})).toBe(false);
  expect(
    await copyCommandToClipboard("npm run demo", {
      clipboard: { writeText: async () => { throw new Error("denied"); } },
    }),
  ).toBe(false);

  let written = "";
  expect(
    await copyCommandToClipboard("npm run demo", {
      clipboard: { writeText: async (value: string) => { written = value; } },
    }),
  ).toBe(true);
  expect(written).toBe("npm run demo");

  for (const locale of locales) {
    const copy = getStackCopy(locale);
    expect(copy.copyFailedLabel.trim().length, locale).toBeGreaterThan(0);
    expect(copy.copyFailedLabel, locale).not.toBe(copy.copiedLabel);
  }
});
