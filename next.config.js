/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) return config;
    // Leave pdfkit's font files as real requires. The renderer loads them through a package
    // import the file tracer cannot see, so these requires are what get them into the bundle.
    config.externals.push(({ request }, callback) => {
      if (request && request.startsWith("pdfkit/js/standard-fonts/")) {
        return callback(null, `commonjs ${request}`);
      }
      callback();
    });
    return config;
  },
};
