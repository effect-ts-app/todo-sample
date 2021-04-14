const withTM = require('next-transpile-modules')(['fp-ts', '@nll/datum', '@effect-ts-demo/todo-client', '@effect-ts-demo/todo-types']);

// eslint-disable-next-line no-undef
module.exports = withTM({
  //webpack: (config) => {
    //config.module.rules = [
        // customisation for using effect-ts typescript compiler with tracing

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
//     return config
//   },
  future: {
    webpack5: true
  }
})
