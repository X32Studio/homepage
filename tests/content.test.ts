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
    expect(english.hero.title).toContain("X32 Studio");
    expect(chinese.hero.title).toContain("X32 Studio");
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
});
