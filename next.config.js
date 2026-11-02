/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  experimental: {
    // @react-pdf/renderer loads pdfkit font files by a computed path, which the serverless file
    // tracer misses. Without this, every invoice PDF fails with "Cannot find module … Helvetica.cjs".
    outputFileTracingIncludes: {
      "/api/**": ["./node_modules/@react-pdf/pdfkit/js/standard-fonts/**"],
    },
  },
};
