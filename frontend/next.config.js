const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  i18n: {
    locales: ['de', 'fr', 'es', 'en', 'it', 'ru', 'pseudo'],
    defaultLocale: 'en',
    localeDetection: false,
    domains: [
      {
        domain: process.env.NODE_ENV === 'development' ? 'localhost' : 'rangersdb.com',
        defaultLocale: 'en',
        http: process.env.NODE_ENV === 'development',
      },
      {
        domain: process.env.NODE_ENV === 'development' ? 'de.localhost:3000' : 'de.rangersdb.com',
        defaultLocale: 'de',
        http: process.env.NODE_ENV === 'development',
      },
      {
        domain: process.env.NODE_ENV === 'development' ? 'fr.localhost' : 'fr.rangersdb.com',
        defaultLocale: 'fr',
        http: process.env.NODE_ENV === 'development',
      },
      {
        domain: process.env.NODE_ENV === 'development' ? 'fr.localhost' : 'fr.rangersdb.com',
        defaultLocale: 'es',
        http: process.env.NODE_ENV === 'development',
      },
      {
        domain: process.env.NODE_ENV === 'development' ? 'it.localhost' : 'it.rangersdb.com',
        defaultLocale: 'it',
        http: process.env.NODE_ENV === 'development',
      },
      {
        domain: process.env.NODE_ENV === 'development' ? 'ru.localhost' : 'ru.rangersdb.com',
        defaultLocale: 'ru',
        http: process.env.NODE_ENV === 'development',
      },
      {
        domain: process.env.NODE_ENV === 'development' ? 'pseudo.localhost' : 'pseudo.rangersdb.com',
        defaultLocale: 'pseudo',
        http: process.env.NODE_ENV === 'development',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias['~'] = path.resolve(__dirname);
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|svg)$/,
      loader: 'url-loader',
      options: {
        limit: '100000'
      }
    });
    config.module.rules.push({
      test: /\.po/,
      use: ['@lingui/loader'],
    });
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false, // for lingui
    };
    return config;
  },
}

module.exports = nextConfig
