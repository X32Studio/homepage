import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse, type DefaultTreeAdapterTypes } from "parse5";
import { beforeAll, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import { getSiteContent } from "../src/lib/content";

type Node = DefaultTreeAdapterTypes.Node;
type Element = DefaultTreeAdapterTypes.Element;
type JsonObject = Record<string, unknown>;

const origin = "https://x32studio.com";
const homes = ["/", "/zh/"] as const;
const sections = ["", "projects/", "blog/", "about/"] as const;
const routes = homes.flatMap((home) => sections.map((section) => home + section));
const profiles = [...homes, "/about/", "/zh/about/"];
const projects = ["/projects/", "/zh/projects/"];
const layerIds = ["self-loop", "skills-system", "argus", "agent-dao"];
const media = {
  "/media/hero-bg.mp4": 2_621_440,
  "/media/hero-bg.webm": 1_048_576,
  "/media/hero-bg-poster.webp": 102_400,
};
const neon = /#(?:00f0ff|ff4d00|00ff9d|ff2e4c|6366f1)|rgba?\(\s*(?:0[\s,]+240[\s,]+255|255[\s,]+77[\s,]+0)(?![\d.])/i;
const hud = /Starfield\.astro|hud-frame|telemetry-grid|gradient-text|aurora-shift|clip-path|pulse-dot|led-pulse|OPC-DECK|SYS\.ONLINE|COFFEE\s+MODE|\[!\]|\[✓\]/i;
const stale = /elite\s+geek\s+crew|精英\s*geek\s*小队|vera\s+xian|quantitative\s+finance|two[-\s]+person\s+crew/i;
const privateProject = /email[-_\s]+homie/i;
const reduce = /prefers-reduced-motion\s*:\s*reduce/i;

const read = (file: string) => readFileSync(file, "utf8");
const htmlFile = (route: string) => `dist${route}index.html`;
const page = (route: string) => parse(read(htmlFile(route)));
const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const path = join(dir, entry.name);
  if (entry.isDirectory()) return files(path);
  return statSync(path).isFile() ? [path] : [];
});
const children = (node: Node): Node[] => "childNodes" in node ? node.childNodes : [];
const attr = (el: Element, name: string) => el.attrs.find((item) => item.name === name)?.value;
const tokens = (value = "") => value.trim().split(/\s+/).filter(Boolean);
const hasClass = (el: Element, name: string) => tokens(attr(el, "class")).includes(name);
const tag = (name: string) => (el: Element) => el.tagName === name;
const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function elements(node: Node, match: (el: Element) => unknown): Element[] {
  const own = "tagName" in node && match(node) ? [node] : [];
  return own.concat(children(node).flatMap((child) => elements(child, match)));
}

function one(node: Node, match: (el: Element) => unknown, label: string): Element {
  const matches = elements(node, match);
  expect(matches, label).toHaveLength(1);
  return matches[0]!;
}

function hidden(el: Element) {
  return attr(el, "hidden") !== undefined ||
    attr(el, "aria-hidden") === "true" ||
    /(?:^|;)\s*(?:display:\s*none|visibility:\s*hidden)\b/i.test(attr(el, "style") ?? "");
}

function visible(el: Element): boolean {
  if (hidden(el)) return false;
  return !("tagName" in el.parentNode!) || visible(el.parentNode as Element);
}

function text(node: Node, excludeHidden = true): string {
  if ("value" in node) return node.value;
  if ("tagName" in node && excludeHidden &&
    (hidden(node) || /^(script|style|template)$/.test(node.tagName))) return "";
  return children(node).map((child) => text(child, excludeHidden)).join("");
}

function hero(doc: Node, route: string) {
  const main = one(doc, tag("main"), `${route} main`);
  return one(main, (el) => el.tagName === "section" &&
    (hasClass(el, "hero") || attr(el, "id") === "hero"), `${route} Hero section`);
}

function links(node: Node, route: string) {
  return elements(node, (el) => el.tagName === "a" && attr(el, "href") !== undefined)
    .map((el) => ({ el, url: new URL(attr(el, "href")!, origin + route) }));
}

function withoutBlockComments(source: string) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

function delivered(doc: Node, route: string, kind: "css" | "js"): string {
  const base = origin + route;
  const nodes = kind === "css"
    ? elements(doc, (el) => el.tagName === "style" ||
      (el.tagName === "link" && tokens(attr(el, "rel")).includes("stylesheet")))
    : elements(doc, (el) => el.tagName === "script" &&
      /^(?:|module|(?:text|application)\/(?:java|ecma)script)$/i.test(attr(el, "type") ?? ""));
  const seen = new Set<string>();
  function load(href: string, referrer: string): string {
    const url = new URL(href, referrer);
    if (url.origin !== origin || seen.has(url.pathname)) return "";
    seen.add(url.pathname);
    const source = withoutBlockComments(read(`dist${decodeURIComponent(url.pathname)}`));
    const dependencies = kind === "css"
      ? source.matchAll(/@import\s+(?:url\(\s*)?["']?([^"')\s;]+)/gi)
      : source.matchAll(/\b(?:import|export)\s*(?:(?:[^;"'()]*?)\bfrom\s*)?["']((?:\.{1,2}\/|\/)[^"']+)["']/g);
    return [source, ...Array.from(dependencies, ([, path]) => load(path, url.href))].join("\n");
  }
  return nodes.map((el) => {
    const href = attr(el, kind === "css" ? "href" : "src");
    return href ? load(href, base) : withoutBlockComments(text(el, false));
  }).join("\n");
}

function blockAfter(source: string, openingBrace: number): string {
  let depth = 1;
  for (let i = openingBrace + 1; i < source.length; i++) {
    if (source[i] === "{") depth++;
    if (source[i] === "}" && --depth === 0) return source.slice(openingBrace + 1, i);
  }
  return "";
}

function targetsVideo(selector: string, video: Element): boolean {
  const anchors = [
    "video",
    ...tokens(attr(video, "class")).map((name) => `.${name}`),
    ...(attr(video, "id") ? [`#${attr(video, "id")}`] : []),
  ];
  return selector.split(",").some((part) => {
    const subject = part.trim().split(/[\s>+~]+/).at(-1) ?? "";
    return anchors.some((anchor) =>
      new RegExp(`(?:^|[.#])${escapeRegExp(anchor.replace(/^[.#]/, ""))}(?=$|[.#[:])`).test(subject) &&
      (anchor === "video" ? subject.startsWith("video") : subject.includes(anchor)));
  });
}

function hasVideoMotionFallback(css: string, video: Element): boolean {
  return Array.from(css.matchAll(/@media\s+([^{}]+)\{/gi)).some((query) => {
    if (!reduce.test(query[1]) || /\bnot\b/i.test(query[1])) return false;
    const body = blockAfter(css, query.index! + query[0].length - 1);
    return Array.from(body.matchAll(/([^{}]+)\{([^{}]*)\}/g)).some(([, selector, declarations]) =>
      targetsVideo(selector, video) &&
      /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?:\.0+)?)(?=\s*(?:!important)?\s*(?:;|$))/i.test(declarations));
  });
}

beforeAll(() => {
  if (!existsSync(htmlFile("/"))) {
    execFileSync("npm", ["run", "build"], { stdio: "inherit", timeout: 115_000 });
  }
}, 120_000);

it("V3-VID-01 ships both Hero video formats and the poster within budget", () => {
  for (const route of homes) {
    const video = one(hero(page(route), route), tag("video"), `${route} Hero video`);
    for (const name of ["autoplay", "loop", "muted", "playsinline"]) {
      expect(attr(video, name), `${route} video ${name}`).toBeDefined();
    }
    expect(attr(video, "poster"), route).toBe("/media/hero-bg-poster.webp");
    const sources = children(video).filter((node): node is Element => "tagName" in node && node.tagName === "source");
    for (const extension of ["webm", "mp4"]) {
      const source = sources.find((el) => attr(el, "src") === `/media/hero-bg.${extension}`);
      expect(source, `${route} ${extension} video source`).toBeDefined();
      if (attr(source!, "type") !== undefined) expect(attr(source!, "type")).toBe(`video/${extension}`);
    }
  }
  for (const [asset, ceiling] of Object.entries(media)) {
    const file = statSync(`dist${asset}`);
    expect(file.isFile(), asset).toBe(true);
    expect(file.size, asset).toBeGreaterThan(0);
    expect(file.size, asset).toBeLessThanOrEqual(ceiling);
  }
});

it("V3-VID-02 exposes a named playback toggle and delivers reduced-motion handling", () => {
  const source = withoutBlockComments(read("src/components/Hero.astro"))
    .replace(/<!--[\s\S]*?-->/g, "");
  expect(source).toMatch(reduce);
  for (const route of homes) {
    const doc = page(route);
    const section = hero(doc, route);
    const video = one(section, tag("video"), `${route} Hero video`);
    const buttons = elements(section, (el) => el.tagName === "button" && visible(el) &&
      attr(el, "disabled") === undefined && attr(el, "tabindex") !== "-1" &&
      /^(true|false)$/.test(attr(el, "aria-pressed") ?? ""));
    const toggle = buttons.find((el) => {
      const label = normalize(attr(el, "aria-label") || text(el));
      const controls = tokens(attr(el, "aria-controls"));
      return label && (controls.length
        ? controls.includes(attr(video, "id") ?? "")
        : /\b(?:pause|play|resume|video|motion)\b|暂停|播放|视频|动态/i.test(label));
    });
    expect(toggle, `${route} accessible Hero video toggle`).toBeDefined();
    const script = delivered(doc, route, "js");
    expect(script, `${route} delivered motion query`).toMatch(
      /(?:\bmatchMedia|\[\s*["']matchMedia["']\s*\])\s*\(\s*["'`]\([^"'`]*prefers-reduced-motion\s*:\s*reduce[^"'`]*\)["'`]/i,
    );
    expect(script, `${route} delivered preference check`).toMatch(/\.matches\b/);
    expect(script, `${route} delivered playback pause`).toMatch(/(?:\?\.|\.)pause\s*\(/);
    expect(hasVideoMotionFallback(delivered(doc, route, "css"), video),
      `${route} reduced-motion CSS hides the Hero video`).toBe(true);
  }
});

it("V3-PAL-01 removes the retired HUD palette and artifacts from source and output", () => {
  const built = files("dist").filter((file) => /\.(?:html|css)$/i.test(file));
  for (const file of [...files("src"), ...built]) {
    expect(file, file).not.toMatch(hud);
    const contents = read(file);
    expect(contents, file).not.toMatch(neon);
    expect(contents, file).not.toMatch(hud);
  }
});

it("V3-TYP-01 delivers obsidian and platinum tokens without eyebrow elements", () => {
  for (const route of [...profiles, ...projects]) {
    const doc = page(route);
    const css = delivered(doc, route, "css");
    const values = (name: string) => Array.from(css.matchAll(
      new RegExp(`(?:^|[;{])\\s*--color-${name}\\s*:\\s*#([\\da-f]{6})(?![\\da-f])`, "gi"),
    ), ([, hex]) => hex.toLowerCase());
    const backgrounds = values("bg");
    expect(backgrounds.length, `${route} background token`).toBeGreaterThan(0);
    for (const value of backgrounds) {
      const [r, g, b] = value.match(/../g)!.map((channel) => Number.parseInt(channel, 16));
      expect(r >= 6 && r <= 12 && g >= 7 && g <= 14 && b >= 9 && b <= 18,
        `${route} obsidian #${value}`).toBe(true);
    }
    const ink = values("ink");
    expect(ink.length, `${route} ink token`).toBeGreaterThan(0);
    expect(ink.every((value) => value === "f3f4f6"), `${route} platinum ink`).toBe(true);
    expect(elements(doc, (el) => hasClass(el, "eyebrow")), route).toHaveLength(0);
  }
});

it("V3-STACK-01 preserves the visible island, tab panel, and Hero rail targets", () => {
  expect(read("src/components/AgenticStack.tsx")).not.toMatch(neon);
  for (const route of homes) {
    const doc = page(route);
    const stack = one(doc, (el) => attr(el, "id") === "agentic-stack", `${route} stack`);
    const island = one(stack, (el) => el.tagName === "astro-island" &&
      attr(el, "client") === "visible" && elements(el, (child) => attr(child, "role") === "tablist").length,
    `${route} visible Stack island`);
    const list = one(island, (el) => attr(el, "role") === "tablist", `${route} tablist`);
    const tabs = elements(island, (el) => attr(el, "role") === "tab");
    expect(elements(list, (el) => attr(el, "role") === "tab"), route).toEqual(tabs);
    expect(tabs.map((el) => el.tagName), route).toEqual(layerIds.map(() => "button"));
    expect(tabs.map((el) => attr(el, "id")), route).toEqual(layerIds.map((id) => `stack-tab-${id}`));
    expect(tabs.map((el) => attr(el, "aria-selected")), route).toEqual(["true", "false", "false", "false"]);
    for (const tab of tabs) {
      const id = attr(tab, "id")!;
      const target = attr(tab, "aria-controls");
      expect(target, `${route} ${id} aria-controls`).toBeTruthy();
      expect(one(doc, (el) => attr(el, "id") === id, `${route} ${id}`)).toBe(tab);
      const panel = one(doc, (el) => attr(el, "id") === target, `${route} ${target}`);
      expect(attr(panel, "role"), route).toBe("tabpanel");
      expect(elements(island, (el) => el === panel), route).toHaveLength(1);
      if (tab === tabs[0]) {
        expect(tokens(attr(panel, "aria-labelledby")), route).toContain(id);
      }
    }
    const jumps = elements(hero(doc, route), (el) => attr(el, "data-stack-jump") !== undefined);
    expect(jumps.map((el) => attr(el, "data-stack-jump")), route).toEqual(layerIds);
    for (const [index, id] of layerIds.entries()) {
      const anchor = `agentic-stack-${id}`;
      expect(jumps[index].tagName, route).toBe("a");
      expect(attr(jumps[index], "href"), route).toBe(`#${anchor}`);
      const target = one(doc, (el) => attr(el, "id") === anchor, `${route} #${anchor}`);
      expect(elements(stack, (el) => el === target), route).toHaveLength(1);
    }
  }
});

function schemaEntities(value: unknown, inherited = false): JsonObject[] {
  if (Array.isArray(value)) return value.flatMap((item) => schemaEntities(item, inherited));
  if (!value || typeof value !== "object") return [];
  const entity = value as JsonObject;
  const context = entity["@context"];
  const schema = context === undefined ? inherited : [context].flat()
    .some((item) => typeof item === "string" && /^https?:\/\/schema\.org\/?$/.test(item));
  return [...(schema ? [entity] : []), ...schemaEntities(entity["@graph"], schema)];
}

it("V3-COPY-01 publishes founder signals, clean copy, and valid identity JSON-LD", () => {
  for (const route of profiles) {
    const doc = page(route);
    const main = one(doc, tag("main"), `${route} main`);
    const copy = normalize(text(main));
    for (const signal of [/Ruiyuan\s+Kang/i, /\bk-r33\b/i, /\bTII\b/, /\bDRI\b/, /\bOPC\b/,
      /Organizational Intelligence|组织智能/i]) expect(copy, route).toMatch(signal);
    const targets = links(doc, route).filter(({ el, url }) => visible(el) && url.protocol === "https:")
      .map(({ url }) => `${url.host}${url.pathname}`.replace(/\/$/, "").toLowerCase());
    for (const target of ["github.com/k-r33", "k-r33.github.io", "github.com/x32studio/self-loop"]) {
      expect(targets, route).toContain(target);
    }
  }
  expect(getSiteContent("zh").hero.subtitle).toMatch(/\bagentic\b/i);
  for (const route of homes) {
    const heading = one(hero(page(route), route), tag("h1"), `${route} Hero headline`);
    expect(visible(heading), route).toBe(true);
    expect(normalize(text(heading)), route).not.toMatch(/\bv\d+\.\d+/i);
  }
  for (const file of files("src/content/projects").filter((path) => privateProject.test(path) && /\.md$/i.test(path))) {
    const frontmatter = read(file).match(/^---\s*\r?\n([\s\S]*?)^---\s*$/m);
    expect(frontmatter, file).not.toBeNull();
    expect(parseYaml(frontmatter![1]).visibility, file).toBe("private");
  }
  for (const file of files("dist")) {
    const contents = read(file);
    expect(file, file).not.toMatch(privateProject);
    expect(contents, file).not.toMatch(privateProject);
    if (/\.html$/i.test(file)) {
      expect(contents, file).not.toMatch(stale);
      const rendered = normalize(text(parse(contents)));
      expect(rendered, file).not.toMatch(stale);
      expect(rendered, file).not.toMatch(privateProject);
    }
  }
  const scripts = elements(page("/"), (el) => el.tagName === "script" &&
    attr(el, "type") === "application/ld+json");
  const entities = scripts.flatMap((el) => schemaEntities(JSON.parse(text(el, false))));
  expect(entities.some((entity) => [entity["@type"]].flat().includes("Organization") &&
    entity.name === "X32 Studio" && [origin, `${origin}/`].includes(String(entity.url)))).toBe(true);
  expect(entities.some((entity) => [entity["@type"]].flat().includes("Person") &&
    entity.name === "Ruiyuan Kang" && [entity.sameAs].flat().includes("https://github.com/k-r33"))).toBe(true);
});

it("V3-NAV-01 keeps navigation, footer, project markup, assets, and file sizes intact", () => {
  for (const route of routes) {
    const doc = page(route);
    const home = route.startsWith("/zh/") ? "/zh/" : "/";
    const header = one(doc, tag("header"), `${route} site header`);
    for (const layout of ["site-nav", "mobile-nav"]) {
      const nav = one(header, (el) => el.tagName === "nav" && hasClass(el, layout), `${route} ${layout}`);
      const menu = links(nav, route);
      const local = menu.filter(({ url }) => url.origin === origin).map(({ url }) => url.pathname);
      expect(local, `${route} ${layout}`).toEqual(expect.arrayContaining(sections.map((part) => home + part)));
      expect(menu.filter(({ el }) => attr(el, "aria-current") === "page")
        .map(({ url }) => url.href), `${route} ${layout} current page`).toEqual([origin + route]);
    }
    const footer = one(doc, tag("footer"), `${route} site footer`);
    const brands = links(footer, route).filter(({ el }) => visible(el) &&
      (hasClass(el, "brand-mark") || /^X32\s*Studio(?:\s+home)?$/i.test(normalize(attr(el, "aria-label") ?? text(el)))));
    expect(brands.map(({ url }) => url.href), `${route} localized footer brand`).toEqual([origin + home]);
  }

  const references = /(?:^|[\s"'`=(,;])((?:(?:https?:)?\/\/[^/\s"'`<>()]+)?\/(?:assets\/[^"'`\s<>?#(),;]+\.webp|media\/[^"'`\s<>?#(),;]+))/gi;
  for (const file of files("dist").filter((path) => /\.(?:html|css|[cm]?js|json|xml|svg)$/i.test(path))) {
    const contents = read(file);
    const doc = /\.html$/i.test(file) ? parse(contents) : undefined;
    if (doc && /^dist\/(?:zh\/)?projects\//.test(file)) {
      expect(text(doc), file).not.toContain("**");
    }
    const attributes = doc ? elements(doc, () => true).flatMap((el) => el.attrs.map(({ value }) => value)) : [];
    for (const input of [contents, ...attributes]) {
      for (const [, reference] of input.matchAll(references)) {
        const url = new URL(reference, origin);
        if (url.origin !== origin) continue;
        const asset = decodeURIComponent(url.pathname);
        expect(asset, file).toMatch(/^\/(?:assets|media)\//);
        expect(asset.split("/"), file).not.toContain("..");
        for (const root of ["public", "dist"]) {
          const path = root + asset;
          expect(existsSync(path) && statSync(path).isFile(), `${file} references ${path}`).toBe(true);
        }
      }
    }
  }

  const code = /\.(?:astro|css|scss|sass|less|[cm]?[jt]sx?|html|svg|vue|svelte|sh)$/i;
  const oversized = [...files("src"), ...files("tests")].filter((file) => code.test(file))
    .map((file) => ({ file, lines: read(file).replace(/\r?\n$/, "").split(/\r\n|\n|\r/).length }))
    .filter(({ lines }) => lines > 500);
  expect(oversized).toEqual([]);
});
