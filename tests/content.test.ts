import { describe, expect, it } from "vitest";
import {
  getAlternateLocalePath,
  getProductsByLab,
  getSiteContent,
  locales,
} from "../src/lib/content";

describe("site content", () => {
  it("loads bilingual site content with matching navigation", () => {
    const english = getSiteContent("en");
    const chinese = getSiteContent("zh");

    expect(locales).toEqual(["en", "zh"]);
    expect(english.navigation.map((item) => item.key)).toEqual(
      chinese.navigation.map((item) => item.key),
    );
    expect(english.meta.title).toContain("X32 Studio");
    expect(chinese.meta.title).toContain("X32 Studio");
    expect(english.hero.title).toContain("Deep space");
    expect(chinese.hero.title).toContain("深空");
  });

  it("groups products into the three lab lines", () => {
    const groups = getProductsByLab("en");

    expect(Object.keys(groups)).toEqual(["geek", "newbie", "agentic"]);
    expect(groups.geek[0]?.name).toBe("Geek Lab");
    expect(groups.newbie[0]?.name).toBe("Newbie Lab");
    expect(groups.agentic[0]?.name).toBe("Agentic Lab");
  });

  it("creates alternate locale paths for core pages", () => {
    expect(getAlternateLocalePath("en", "/products/")).toBe("/zh/products/");
    expect(getAlternateLocalePath("zh", "/zh/about/")).toBe("/about/");
  });

  it("defines clear homepage paths for first-time visitors", () => {
    const english = getSiteContent("en");
    const chinese = getSiteContent("zh");

    expect(english.hero.paths.map((path) => path.intent)).toEqual([
      "build",
      "learn",
      "automate",
    ]);
    expect(chinese.hero.paths).toHaveLength(3);
    expect(english.hero.paths[0]?.href).toBe("/products/#geek-lab");
  });

  it("defines future publishing channels for notes and collections", () => {
    const english = getSiteContent("en");
    const chinese = getSiteContent("zh");

    expect(english.channels.items.map((item) => item.key)).toEqual([
      "notes",
      "tools",
      "collections",
      "logs",
    ]);
    expect(chinese.channels.items).toHaveLength(4);
  });
});
