const withTM = require('next-transpile-modules')(['fp-ts', '@nll/datum', '@effect-ts-demo/todo-client', '@effect-ts-demo/todo-types']);

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
  future: {
    webpack5: true
  }
})
