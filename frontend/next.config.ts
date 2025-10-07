import path from 'path';
import type { Configuration as WebpackConfig } from 'webpack';

const nextConfig = {
  reactStrictMode: true,
  
  // Configure page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // Configure webpack
  webpack: (config: WebpackConfig): WebpackConfig => {
    // Add path aliases
    if (config.resolve && config.resolve.alias) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname, 'src'),
      };
    }
    return config;
  },
  
  // Images configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.g2a.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh4.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh5.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh6.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "platform-lookaside.fbsbx.com",
      },
      {
        protocol: "https",
        hostname: "**.fbcdn.net", 
      },
      {
        protocol: "https",
        hostname: "graph.facebook.com",
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
    loader: 'default',
    loaderFile: '',
    domains: [],
    path: '/_next/image',
    unoptimized: false,
  },
};

module.exports = nextConfig;
