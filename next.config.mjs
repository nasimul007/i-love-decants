// Security headers on every page and API (F-07): no framing (clickjacking), no MIME sniffing, private referrers.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];
/** @type {import('next').NextConfig} */
const nextConfig = { reactStrictMode: true, async headers() { return [{ source: "/:path*", headers: securityHeaders }]; },
  // Browsers ask for /favicon.ico on their own (F-14); the icon itself is app/icon.svg.
  async redirects() { return [{ source: "/favicon.ico", destination: "/icon.svg", permanent: true }]; } };
export default nextConfig;
