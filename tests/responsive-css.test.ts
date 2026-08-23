import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const layoutCss = readFileSync("src/styles/layout.css", "utf8");
const surfacesCss = readFileSync("src/styles/surfaces.css", "utf8");

describe("responsive styles", () => {
  it("collapses the header into a mobile nav on phones", () => {
    expect(layoutCss).toContain("@media (max-width: 720px)");
    expect(layoutCss).toContain(".mobile-nav");
    expect(layoutCss).toContain("grid-template-columns: 1fr");
  });

  it("keeps project cards readable on narrow screens", () => {
    expect(surfacesCss).toContain("minmax(min(21rem, 100%), 1fr)");
  });

  it("stacks post rows and section heads on small screens", () => {
    expect(surfacesCss).toContain("@media (max-width: 560px)");
    expect(surfacesCss).toContain("grid-template-columns: 1fr");
  });
});
