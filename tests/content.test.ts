import { describe, expect, it } from "vitest";
import { formatPostDate, getAlternateLocalePath, getSiteContent, locales } from "../src/lib/content";

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
    expect(english.hero.title.length).toBeGreaterThan(0);
    expect(chinese.hero.subtitle).toContain("agentic");
  });

  it("navigates between home, projects, blog and about in both locales", () => {
    const english = getSiteContent("en");
    const chinese = getSiteContent("zh");

    expect(english.navigation.map((item) => item.href)).toEqual([
      "/",
      "/projects/",
      "/blog/",
      "/about/",
    ]);
    expect(chinese.navigation.map((item) => item.href)).toEqual([
      "/zh/",
      "/zh/projects/",
      "/zh/blog/",
      "/zh/about/",
    ]);
  });

  it("maps alternate locale paths", () => {
    expect(getAlternateLocalePath("en", "/")).toBe("/zh/");
    expect(getAlternateLocalePath("zh", "/zh/projects/")).toBe("/projects/");
  });

  it("formats post dates as ISO day strings", () => {
    expect(formatPostDate(new Date("2026-08-22T12:34:00Z"))).toBe("2026-08-22");
  });
});
