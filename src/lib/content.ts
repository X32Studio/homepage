import siteEn from "../content/site.en.yaml";
import siteZh from "../content/site.zh.yaml";
import agenticLab from "../content/products/agentic-lab.yaml";
import geekLab from "../content/products/geek-lab.yaml";
import newbieLab from "../content/products/newbie-lab.yaml";

export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];
export type LabKey = "geek" | "newbie" | "agentic";

export type SiteContent = {
  locale: Locale;
  meta: {
    title: string;
    description: string;
  };
  navigation: Array<{
    key: string;
    label: string;
    href: string;
  }>;
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: LinkItem;
    secondaryCta: LinkItem;
    stats: Array<{
      value: string | number;
      label: string;
    }>;
  };
  studio: {
    kicker: string;
    title: string;
    body: string;
    principles: string[];
  };
  labsIntro: {
    eyebrow: string;
    title: string;
    body: string;
  };
  about: {
    eyebrow: string;
    title: string;
    body: string;
    capabilities: string[];
  };
  links: {
    title: string;
    items: Array<LinkItem & { note: string }>;
  };
  footer: {
    tagline: string;
    copyright: string;
  };
};

export type LinkItem = {
  label: string;
  href: string;
};

type RawProduct = {
  id: string;
  lab: LabKey;
  order: number;
  name: Record<Locale, string>;
  audience: Record<Locale, string>;
  status: Record<Locale, string>;
  summary: Record<Locale, string>;
  tags: string[];
  links: LinkItem[];
};

export type Product = {
  id: string;
  lab: LabKey;
  order: number;
  name: string;
  audience: string;
  status: string;
  summary: string;
  tags: string[];
  links: LinkItem[];
};

const siteContent: Record<Locale, SiteContent> = {
  en: siteEn as SiteContent,
  zh: siteZh as SiteContent,
};

const rawProducts = [geekLab, newbieLab, agenticLab] as RawProduct[];
const labOrder: LabKey[] = ["geek", "newbie", "agentic"];

export function getSiteContent(locale: Locale): SiteContent {
  return siteContent[locale];
}

export function getProducts(locale: Locale): Product[] {
  return rawProducts
    .map((product) => ({
      id: product.id,
      lab: product.lab,
      order: product.order,
      name: product.name[locale],
      audience: product.audience[locale],
      status: product.status[locale],
      summary: product.summary[locale],
      tags: product.tags,
      links: product.links,
    }))
    .sort((left, right) => left.order - right.order);
}

export function getProductsByLab(locale: Locale): Record<LabKey, Product[]> {
  return labOrder.reduce(
    (groups, lab) => ({
      ...groups,
      [lab]: getProducts(locale).filter((product) => product.lab === lab),
    }),
    {} as Record<LabKey, Product[]>,
  );
}

export function getAlternateLocalePath(locale: Locale, pathname: string): string {
  if (locale === "en") {
    return `/zh${pathname}`;
  }

  return pathname.replace(/^\/zh/, "") || "/";
}
