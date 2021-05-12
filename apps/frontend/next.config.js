const withTM = require('next-transpile-modules')([
    'fp-ts',
    '@nll/datum',
    '@effect-ts-demo/core',
    '@effect-ts-demo/todo-client',
    '@effect-ts-demo/todo-types'
]);


// eslint-disable-next-line no-undef
module.exports = withTM({
//   webpack: (config) => {
//     config.module.rules = [
//     // customization for effect-ts custom ts with compiler plugin
//       {
//         test: /\.(tsx|ts)$/,
//         use: [
//           {
//             loader: "ts-loader",
//             options: {
//               configFile: "tsconfig.build.json",
//               compiler: "ttypescript"
//             }
//           }
//         ]
//       },
//       ...config.module.rules.map((r) => {
//         if (String(r.test).includes("ts")) {
//           return { ...r, test: /\.(js|mjs|jsx)$/ }
//         }
//         return r
//       })
//     ]

//     return config
//   },

//   async rewrites() {
//       // TODO: Fix swagger* css js etc.
//       // currently "auth" route is taken by auth0
//       const paths = ["tasks", "lists", "groups", "me", "swagger", "docs"]
//     return [
//         ...paths.map(p => ({
//                 source: `/api/${p}`,
//                 destination: `${API_ROOT}/${p}` // Proxy to Backend
//               })

//         ),

//     //   {
//     //     source: '/api/:path*',
//     //     destination: `${API_ROOT}/:path*` // Proxy to Backend
//     //   }
//     ]
//   },
  future: {
    webpack5: true
  }
})
