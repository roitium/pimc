import { defineMiddleware } from "astro:middleware";

const csp =
  "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; media-src 'self' blob: https://*.s3.amazonaws.com; connect-src 'self' https://*.roitium.com https://international.v1.hitokoto.cn https://*.cloudflareinsights.com; worker-src 'self' blob:; frame-src https://giscus.app; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';";
export const onRequest = defineMiddleware(async (_context, next) => {
  const original = await next();
  // Cloudflare image/fetch responses can have immutable headers. Reconstruct
  // the response to get writable headers while preserving its body and status.
  const response = new Response(original.body, original);
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  return response;
});
