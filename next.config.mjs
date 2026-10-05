


// next.config.mjs

import path from 'path'

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Все .json из public/ (Lottie-анимации) импортируются как URL статического файла
    // (/_next/static/lottie/<имя>.<hash>.json), а не вшиваются в JS-бандл: раньше они весили
    // ~14 МБ в общем бандле. Читает их components/lottie-player.tsx (fetch по требованию).
    // nginx отдаёт /_next/static с кэшем на год и (после gzip_types) со сжатием.
    webpack(config) {
        config.module.rules.push({
            test: /\.json$/,
            include: [path.join(process.cwd(), 'public')],
            type: 'asset/resource',
            generator: { filename: 'static/lottie/[name].[hash:8][ext]' },
        })
        return config
    },
    async headers() {
        return [
            {
                source: '/api/(.*)',
                headers: [
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: '*',
                    },
                    {
                        key: 'Access-Control-Allow-Methods',
                        value: 'GET, POST, PUT, DELETE, OPTIONS',
                    },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: 'Content-Type, Authorization',
                    },
                    {
                        key: 'Content-Range',
                        value: 'bytes : 0-9/*',
                    },
                ]
            }
        ]
    }
};

export default nextConfig;






// // next.config.mjs

// import withPWA from 'next-pwa';

// const nextConfig = {
//     reactStrictMode: true,
//     swcMinify: true,
    
//     // Ваши существующие headers
//     async headers() {
//         return [
//             {
//                 source: '/api/(.*)',
//                 headers: [
//                     {
//                         key: 'Access-Control-Allow-Origin',
//                         value: '*',
//                     },
//                     {
//                         key: 'Access-Control-Allow-Methods',
//                         value: 'GET, POST, PUT, DELETE, OPTIONS',
//                     },
//                     {
//                         key: 'Access-Control-Allow-Headers',
//                         value: 'Content-Type, Authorization',
//                     },
//                     {
//                         key: 'Content-Range',
//                         value: 'bytes : 0-9/*',
//                     },
//                 ]
//             }
//         ]
//     }
// };

// const pwaConfig = {
//     dest: 'public',
//     register: true,
//     skipWaiting: true,
//     disable: process.env.NODE_ENV === 'development',
//     runtimeCaching: [
//         {
//             urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
//             handler: 'CacheFirst',
//             options: {
//                 cacheName: 'google-fonts',
//                 expiration: {
//                     maxEntries: 10,
//                     maxAgeSeconds: 60 * 60 * 24 * 365, // 1 год
//                 },
//             },
//         },
//         {
//             urlPattern: /\.(js|css|png|jpg|jpeg|svg|ico|webp)$/,
//             handler: 'CacheFirst',
//             options: {
//                 cacheName: 'static-assets',
//                 expiration: {
//                     maxEntries: 100,
//                     maxAgeSeconds: 60 * 60 * 24 * 30, // 30 дней
//                 },
//             },
//         },
//         {
//             urlPattern: /\/api\/.*/,
//             handler: 'NetworkFirst',
//             options: {
//                 cacheName: 'api-cache',
//                 expiration: {
//                     maxEntries: 50,
//                     maxAgeSeconds: 60 * 60, // 1 час
//                 },
//             },
//         },
//     ],
// };

// export default withPWA(pwaConfig)(nextConfig);

