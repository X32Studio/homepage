import siteEn from "../content/site.en.yaml";
import siteZh from "../content/site.zh.yaml";

export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];

export type NavLink = {
  key: string;
  label: string;
  href: string;
};

export type SiteContent = {
  locale: Locale;
  meta: {
    title: string;
    description: string;
  };
  navigation: NavLink[];
  hero: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    subtitle: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
    stats: Array<{ value: string | number; label: string }>;
  };
  aboutTeaser: {
    eyebrow: string;
    title: string;
    body: string;
    cta: { label: string; href: string };
    capabilities: string[];
  };
  blogIntro: {
    eyebrow: string;
    title: string;
  };
  projectsIntro: {
    eyebrow: string;
    title: string;
    body: string;
  };
  footer: {
    tagline: string;
    copyright: string;
    links: Array<{ label: string; href: string }>;
  };
};

const siteContent: Record<Locale, SiteContent> = {
  en: siteEn as SiteContent,
  zh: siteZh as SiteContent,
};

export function getSiteContent(locale: Locale): SiteContent {
  return siteContent[locale];
}

export function getAlternateLocalePath(locale: Locale, pathname: string): string {
  if (locale === "en") {
    return `/zh${pathname}`;
  }

  return pathname.replace(/^\/zh/, "") || "/";
}

export function formatPostDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
