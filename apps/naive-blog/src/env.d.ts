/// <reference types="astro/client" />

// Native tsc checks TS/TSX; the Astro checker validates template implementations.
declare module "*.astro" {
  const component: import("astro/runtime/server/index.js").AstroComponentFactory;
  export default component;
}
