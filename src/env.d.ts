/// <reference types="astro/client" />

declare module "*.yaml" {
  const value: unknown;
  export default value;
}

declare module "*.yml" {
  const value: unknown;
  export default value;
}

declare module "*.mp4" {
  const src: string;
  export default src;
}
