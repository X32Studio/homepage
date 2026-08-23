import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

const SITE = "https://x32studio.com";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const GET: APIRoute = async () => {
  const posts = (await getCollection("blog", ({ data }) => !data.draft && data.locale === "en")).sort(
    (left, right) => right.data.pubDate.valueOf() - left.data.pubDate.valueOf(),
  );

  const items = posts
    .map((post) => {
      const date = post.data.pubDate.toUTCString();
      const url = `${SITE}/blog/${post.data.postSlug}/`;
      return [
        "    <item>",
        `      <title>${escapeXml(post.data.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <description>${escapeXml(post.data.description)}</description>`,
        `      <pubDate>${date}</pubDate>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>X32 Studio — Field Notes</title>\n    <link>${SITE}</link>\n    <description>Signals from the X32 Studio expedition — agentic systems, tools, and field notes.</description>\n    <language>en</language>\n    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n    <ttl>60</ttl>\n${items}\n  </channel>\n</rss>\n`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
};
