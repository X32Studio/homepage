# X32 Studio Homepage

X32 Studio is a deep-space themed bilingual homepage for a two-person studio exploring agentic systems, technical tools, field notes, and useful experiments.

The site is built with Astro, React islands, YAML content files, and a small set of reusable layout and story components.

## Stack

- Astro for static site generation
- React for interactive UI islands
- YAML for editable bilingual content
- Vitest for content and behavior checks
- TypeScript for project safety

## Project Structure

```text
src/
  components/      Reusable Astro and React UI components
  content/         Bilingual site and product content
  layouts/         Shared page layout
  lib/             Content loading helpers
  pages/           English and Chinese routes
  styles/          Global tokens, layout, base, and motion styles
assets/            Source media assets
public/            Static public files
scripts/           Project maintenance scripts
tests/             Vitest test files
```

## Commands

Install dependencies:

```bash
npm install
```

Start local development:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Build for production:

```bash
npm run build
```

Check file line limits:

```bash
npm run check:lines
```

Preview the production build:

```bash
npm run preview
```

## Content Editing

- English site copy lives in `src/content/site.en.yaml`.
- Chinese site copy lives in `src/content/site.zh.yaml`.
- Product data lives in `src/content/products/`.
- Routes are mirrored under `/` and `/zh/`.

## Git Remote

The intended GitHub remote is:

```bash
git@github.com:X32Studio/homepage.git
```

After SSH access is configured for the GitHub account with repository permissions, push with:

```bash
git push -u origin main
```
