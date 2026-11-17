const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // Nothing on this site should be framed by another origin (clickjacking on admin and the portal).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
];

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) return config;
    // Leave pdfkit's font files as real requires. The renderer loads them through a package
    // import the file tracer cannot see, so these requires are what get them into the bundle.
    config.externals.push(({ request }, callback) => {
      if (request && request.startsWith("pdfkit/standard-fonts/")) {
        return callback(null, `commonjs ${request}`);
      }
      callback();
    });
    return config;
  },
};
