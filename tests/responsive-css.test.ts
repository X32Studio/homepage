import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const storyCss = readFileSync("src/styles/deep-space-story.css", "utf8");
const layoutCss = readFileSync("src/styles/layout.css", "utf8");

describe("deep space story responsive styles", () => {
  it("defines a dedicated phone layout for the immersive homepage", () => {
    expect(storyCss).toContain("@media (max-width: 560px)");
    expect(storyCss).toContain("min-height: auto");
    expect(storyCss).toContain("grid-template-columns: 1fr");
    expect(storyCss).toContain(".hud");
    expect(storyCss).toContain("display: none");
    expect(storyCss).toContain(".orbital-map");
  });

  it("keeps mobile cards readable and touch friendly", () => {
    expect(storyCss).toContain("border-radius: 1.25rem");
    expect(storyCss).toContain("min-height: 44px");
    expect(storyCss).toContain("aspect-ratio: 16 / 10");
  });

  it("keeps the mobile header navigable without squeezing links", () => {
    expect(layoutCss).toContain("@media (max-width: 760px)");
    expect(layoutCss).toContain("overflow-x: auto");
    expect(layoutCss).toContain("min-height: 44px");
    expect(layoutCss).toContain("width: 100%");
  });
});
