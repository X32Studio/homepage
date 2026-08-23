import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

const SITE = "https://x32studio.com";

type PagePair = { en: string; zh: string; changefreq?: string; priority?: string };

const staticPages: PagePair[] = [
  { en: "/", zh: "/zh/", changefreq: "weekly", priority: "1.0" },
  { en: "/projects/", zh: "/zh/projects/", changefreq: "weekly", priority: "0.9" },
  { en: "/blog/", zh: "/zh/blog/", changefreq: "weekly", priority: "0.9" },
  { en: "/about/", zh: "/zh/about/", changefreq: "monthly", priority: "0.8" },
];

function urlEntries(pair: PagePair, lastmod?: string) {
  const optional = [
    ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
    ...(pair.changefreq ? [`    <changefreq>${pair.changefreq}</changefreq>`] : []),
    ...(pair.priority ? [`    <priority>${pair.priority}</priority>`] : []),
  ];

  return [pair.en, pair.zh]
    .map(
      (path) =>
        [
          "  <url>",
          `    <loc>${SITE}${path}</loc>`,
          `    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${pair.en}" />`,
          `    <xhtml:link rel="alternate" hreflang="zh" href="${SITE}${pair.zh}" />`,
          ...optional,
          "  </url>",
        ].join("\n"),
    )
    .join("\n");
}

export const GET: APIRoute = async () => {
  const posts = await getCollection("blog", ({ data }) => !data.draft);

  const postsBySlug = new Map<string, { pair: PagePair; lastmod: string }>();
  for (const post of posts) {
    const slug = post.data.postSlug;
    const record = postsBySlug.get(slug) ?? {
      pair: { en: `/blog/${slug}/`, zh: `/zh/blog/${slug}/` },
      lastmod: post.data.pubDate.toISOString().slice(0, 10),
    };
    record.lastmod = post.data.pubDate.toISOString().slice(0, 10);
    postsBySlug.set(slug, record);
  }

  const entries = [
    ...staticPages.map((page) => urlEntries(page)),
    ...[...postsBySlug.values()].map((record) => urlEntries(record.pair, record.lastmod)),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join("\n")}\n</urlset>\n`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
