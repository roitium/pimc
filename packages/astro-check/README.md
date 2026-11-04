# Astro template checking

Naive Blog uses TypeScript 7 for TS/TSX checks. Astro's current template checker
requires the TypeScript 6 JavaScript API, including in its Volar dependencies.
This workspace isolates that compiler and runs `astro-check --root` against the
site after `astro sync` and the native TypeScript 7 check.

Remove this workspace when Astro supports checking templates with stable
TypeScript 7.
