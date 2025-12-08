/* eslint-env node */

/*
 * This file runs in a Node context (it's NOT transpiled by Babel), so use only
 * the ES6 features that are supported by your Node version. https://node.green/
 */

// Configuration for your app
// https://v2.quasar.dev/quasar-cli-webpack/quasar-config-js


import { defineConfig } from "#q-app/wrappers";
import { readFileSync } from "fs";
import path from "path";
import { LicenseWebpackPlugin } from "license-webpack-plugin";
import { config } from "dotenv";

const packageJson = JSON.parse(readFileSync("./package.json"));
const envFilenName = (process.env.QENV?.replace(/^production$/, "") || "") + ".env";
const env = config({ path: path.resolve(process.cwd(), envFilenName) }).parsed || {};
env.UPDATE_URL = process.env.UPDATE_URL || env.UPDATE_URL;
env.APP_ID = process.env.APP_ID || env.APP_ID;
env.QENV = process.env.QENV || "production";
env.IS_TESTFLIGHT = process.env.IS_TESTFLIGHT || "false";

export default defineConfig(function (ctx) {
  return {
    // https://v2.quasar.dev/quasar-cli-webpack/prefetch-feature
    // preFetch: true,

    // app boot file (/src/boot)
    // --> boot files are part of "main.js"
    // https://v2.quasar.dev/quasar-cli-webpack/boot-files
    boot: [
      "eventBus",
      "fetch",
      "database",
      "i18n",
      "localeChange",
      "updater",
      "setup",
      "openURL",
    ],

    // https://v2.quasar.dev/quasar-cli-webpack/quasar-config-js#Property%3A-css
    css: [
      "app.sass"
    ],

    // https://github.com/quasarframework/quasar/tree/dev/extras
    extras: [
      // 'ionicons-v4',
      // 'mdi-v5',
      // 'fontawesome-v6',
      // 'eva-icons',
      // 'themify',
      // 'line-awesome',
      // 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!

      "roboto-font", // optional, you are not bound to it
      "material-icons", // optional, you are not bound to it
      "fontawesome-v6",
    ],

    eslint: {
      // fix: true,
      // include: [],
      // exclude: [],
      // cache: false,
      // rawEsbuildEslintOptions: {},
      // rawWebpackEslintPluginOptions: {},
      warnings: true,
      errors: true
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-webpack/quasar-config-js#Property%3A-build
    build: {
      vueRouterMode: "hash", // available values: 'hash', 'history'
      webpackDevtool: "source-map", // builds slowest, but most accurate, which is good for debugging, see https://webpack.js.org/configuration/devtool/

      // webpackTranspile: false,
      // publicPath: '/',

      // Add dependencies for transpiling with Babel (Array of string/regex)
      // (from node_modules, which are by default not transpiled).
      // Applies only if "transpile" is set to true.
      // webpackTranspileDependencies: [],

      // rtl: true, // https://quasar.dev/options/rtl-support
      // preloadChunks: true,
      // webpackShowProgress: false,
      // gzip: true,
      // analyze: true,

      // Options below are automatically set depending on the env, set them if you want to override
      // extractCSS: false,

      // https://v2.quasar.dev/quasar-cli-webpack/handling-webpack
      // "chain" is a webpack-chain object https://github.com/neutrinojs/webpack-chain
      // chainWebpack (/* chain */) {}

      envFilter: () => {
        console.log("Using .env file:", envFilenName, "(not the .env file mentioned in the following line, which is ignored)");
        return {
          BACKEND: "",
          CSP_URLS: "",
          USE_FALLBACK_LICENSE: "",
          VAULTKEY: "",
          SYNC_SERVER: "",
          URL_SCHEME: "",
          BETA_EXPIRATION: "",
          APP_ID: "",
          UPDATE_URL: "",
          INSTALL_URL: "",
          APPLE_APP_ID: "",
          CONTRIBUTING_URL: "https://www.roaringroster.app/en/contributing/",
          FEEDBACK_ADDRESS: "feedback@roaringroster.app",
          DEFAULT_ROUTE: "overview",
          APPSETTINGS_DBKEY: "117,92,224,103,245,209,145,178,128,123,202,194,188,164,94,181,168,87,48,227,202,184,246,191,156,141,232,100,188,212,15,224",
          ...env,
          APP_VERSION: packageJson.version || 0,
          APP_BUILD: (new Date()).toISOString().replace(/\D/g, ""),
          APP_NAME: packageJson.productName || "",
        };
      },

      typescript: {
        strict: true, // (recommended) enables strict settings for TypeScript
        vueShim: true, // required when using ESLint with type-checked rules, will generate a shim file for `*.vue` files
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        extendTsConfig (tsConfig) {
          // You can use this hook to extend tsConfig dynamically
          // For basic use cases, you can still update the usual tsconfig.json file to override some settings
        },
      },

      extendWebpack(config) {
        config.resolve.alias = {
          ...config.resolve.alias,
          "vue-facing-decorator": "vue-facing-decorator/dist/index-return-cons"
        };

        /* pre-compiles all locale messages to enable the runtime-only version,
        otherwise the CSP header needs to allow unsafe-eval for script which should be avoided for security reasons */
        // config.module.rules.push({
        //   test: /index\.(json5?|ya?ml)$/, // target json, json5, yaml and yml files, but not files named terminology or other
        //   type: "javascript/auto",
        //   loader: "@intlify/vue-i18n-loader",
        //   include: [ // Use `Rule.include` to specify the files of locale messages to be pre-compiled
        //     path.resolve(__dirname, "src/i18n")
        //   ]
        // });

        // enable loading web assembly
        config.module.rules.push({
          test: /argon2\.wasm$/,
          loader: "base64-loader",
          type: "javascript/auto",
        });
        config.module.noParse = /argon2\.wasm$/;
        config.resolve.fallback = {
          ...config.resolve.fallback,
          path: false,
          fs: false,
          Buffer: false,
          process: false,
          crypto: false,
        };
        config.experiments = {
          ...config.experiments,
          asyncWebAssembly: true,
        };
        config.performance = {
          ...config.performance,
          hints: false,
          maxEntrypointSize: 512000,
          maxAssetSize: 512000,
        };


        const findDependencies = (names) => {
          const results = [...new Set(names.flatMap(name => [name, ...Object.keys(JSON.parse(readFileSync(`src-cordova/node_modules/${name}/package.json`)).dependencies || {})]))];

          if (results.length > names.length) {
            return findDependencies(results);
          } else {
            return results;
          }
        }

        /* An unexaustive list of licenses that are compatible with AGPL-3.0 license.
           Licenses that are incompatible with AGPL-3.0 are unacceptable and may not be combined with the source code of this app.
           For a complete list, see https://www.gnu.org/licenses/license-list.html.
           For a compatibility overview, see https://web.archive.org/web/20210101030518/https://dwheeler.com/essays/floss-license-slide.html.
        */
        const unacceptableLicenseTest = (license) => ![
          "MIT",
          "Apache-2.0",
          "Apache 2.0",
          "ISC",
          "LGPL",
          "LGPL-3.0",
          "Unlicense",
          "CC0-1.0",
          "BSD-3-Clause",
          "BSD-2-Clause",
          "0BSD",
          "(MIT AND BSD-3-Clause)",
          "MIT or GPL-2.0",
          "(MIT OR Apache-2.0)",
          "AGPL-3.0-or-later",
          "(MPL-2.0 OR Apache-2.0)",
          "BlueOak-1.0.0",
        ].includes(license);
        const licenseTypeOverrides = {
          "cordova-plugin-keyboard": "Apache-2.0",
          "cordova-plugin-printer": "Apache-2.0",
          "shelljs": "BSD-3-Clause",
          "tail": "MIT",
          "xml-escape": "MIT",
          "rechoir": "MIT"
        }

        config.plugins = config.plugins || [];

        config.plugins.push(
          new LicenseWebpackPlugin({
            outputFilename: "oss-licenses.json",
            perChunkOutput: false,
            unacceptableLicenseTest,
            renderLicenses: modules => JSON.stringify(
              modules.map(module => ({
                name: module.name,
                author: (author => {
                  const authorName = author.name || author;
                  const name = authorName.replace(/( <.+@.+>)/, "").replace(/( \(http.+\))/, "");
                  const email = author.email || authorName.match(/^.* <(.+@.+)>.*$/)?.[1];
                  const url = (author.url || authorName.match(/^.* \((http.+)\).*$/)?.[1])//?.replace(/^(?!http)/, "http://");
                  return {name: name + (email ? ` <${email}>` : "") + (url ? ` (${url})`: "")};
                })(module.packageJson?.author || ""),
                license: module.licenseId,
                licenseText: module.licenseText,
                repository: (module.packageJson?.repository?.url || module.packageJson?.repository)
                  ?.replace(/^(git\+https|git|git\+ssh):/, "https:").replace(/^git@github.com:/, "https://github.com/").replace(/^(?!https:)/, "https://github.com/"),
                // source: `https://registry.npmjs.org/${module.name}/-/${module.name.split("/").pop()}-${module.packageJson?.version}.tgz`,
                homepage: module.packageJson?.homepage,
                // version: module.packageJson?.version
              })).concat([{
                name: "@fortawesome/fontawesome-free",
                author: {
                  name: "The Font Awesome Team (https://github.com/orgs/FortAwesome/people)",
                },
                license: "(CC-BY-4.0 AND OFL-1.1 AND MIT)", // the OFL-1.1 part applies to this project and should be compatible, see explanation at https://www.gnu.org/licenses/license-list.html#SILOFL
                licenseText: readFileSync("node_modules/@quasar/extras/fontawesome-v6/LICENSE.txt", {encoding: "utf-8"}),
                repository: "https://github.com/FortAwesome/Font-Awesome",
                homepage: "https://fontawesome.com"
              }, {
                name: "@mdi/font",
                author: {
                  name: "Austin Andrews (http://twitter.com/templarian)",
                },
                license: "Apache-2.0",
                licenseText: readFileSync("node_modules/@quasar/extras/material-icons/LICENSE", { encoding: "utf-8" }),
                repository: "https://github.com/Templarian/MaterialDesign-Webfont.git",
                homepage: "https://materialdesignicons.com"
              }, {
                name: "roboto-font",
                author: {
                  name: "Christian Robertson"
                },
                license: "Apache-2.0",
                licenseText: readFileSync("node_modules/@quasar/extras/material-icons/LICENSE", { encoding: "utf-8" }),
              }]),
            null, 2),
            licenseTypeOverrides,
            licenseTemplateDir: path.resolve(__dirname, "license-templates"),
            additionalModules: ctx.mode.cordova
              ? findDependencies(Object.keys(JSON.parse(readFileSync("src-cordova/package.json")).devDependencies))
                .map(name => {
                  const license = licenseTypeOverrides[name]
                    || JSON.parse(readFileSync(`src-cordova/node_modules/${name}/package.json`)).license;

                  if (unacceptableLicenseTest(license)) {
                    throw new Error(`Unacceptable License for "${name}": ${license}`);
                  }

                  return {
                    name,
                    directory: path.join(__dirname, "src-cordova", "node_modules", name)
                  }
                })
              : []
          })
        );
      },

    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-webpack/quasar-config-js#Property%3A-devServer
    devServer: {
      server: {
        type: process.env.USE_HTTP != "true" ? "https" : "http",
        options: {
          key: path.join(__dirname, "localhost-key.pem"),
          cert: path.join(__dirname, "localhost.pem"),
        },
      },
      port: 8081,
      open: false // opens browser window automatically
    },

    // https://v2.quasar.dev/quasar-cli-webpack/quasar-config-js#Property%3A-framework
    framework: {
      config: {
        notify: {
          position: "top",
          timeout: 3000
        }
      },

      iconSet: "material-icons", // Quasar icon set
      lang: "en-US", // Quasar language pack

      // For special cases outside of where the auto-import strategy can have an impact
      // (like functional components as one of the examples),
      // you can manually specify Quasar components/directives to be available everywhere:
      //
      // components: [],
      // directives: [],

      // Quasar plugins
      plugins: [
        "Notify", 
        "Meta", 
        "Dialog"
      ]
    },

    // animations: 'all', // --- includes all animations
    // https://quasar.dev/options/animations
    animations: ["fadeInDown", "fadeOutUp", "slideInRight", "slideOutRight", "slideInLeft", "slideOutLeft"],

    // https://v2.quasar.dev/quasar-cli-webpack/developing-ssr/configuring-ssr
    ssr: {
      pwa: false,

      // manualStoreHydration: true,
      // manualPostHydrationTrigger: true,

      prodPort: 3000, // The default port that the production server should use
                      // (gets superseded if process.env.PORT is specified at runtime)

      maxAge: 1000 * 60 * 60 * 24 * 30,
        // Tell browser when a file from the server should expire from cache (in ms)

      // chainWebpackWebserver (/* chain */) {},

      middlewares: [
        ctx.prod ? "compression" : "",
        "render" // keep this as last one
      ]
    },

    // https://v2.quasar.dev/quasar-cli-webpack/developing-pwa/configuring-pwa
    pwa: {
      workboxPluginMode: "GenerateSW", // 'GenerateSW' or 'InjectManifest'
      workboxOptions: {}, // only for GenerateSW

      // for the custom service worker ONLY (/src-pwa/custom-service-worker.[js|ts])
      // if using workbox in InjectManifest mode
      // chainWebpackCustomSW (/* chain */) {},

      manifest: {
        name: "RoaringRoster",
        short_name: "RoaringRoster",
        description: "",
        display: "standalone",
        orientation: "portrait",
        background_color: "#ffffff",
        theme_color: "#027be3",
        icons: [
          {
            src: "icons/icon-128x128.png",
            sizes: "128x128",
            type: "image/png"
          },
          {
            src: "icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "icons/icon-256x256.png",
            sizes: "256x256",
            type: "image/png"
          },
          {
            src: "icons/icon-384x384.png",
            sizes: "384x384",
            type: "image/png"
          },
          {
            src: "icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-webpack/developing-cordova-apps/configuring-cordova
    cordova: {
      // add the dynamic top padding on iOS mobile devices
      iosStatusBarPadding: true,

      // noIosLegacyBuildFlag: true, // uncomment only if you know what you are doing
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-webpack/developing-capacitor-apps/configuring-capacitor
    capacitor: {
      hideSplashscreen: true
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-webpack/developing-electron-apps/configuring-electron
    electron: {
       // Electron preload scripts (if any) from /src-electron, WITHOUT file extension
      preloadScripts: [ "electron-preload" ],
      bundler: "builder", // 'packager' or 'builder'

      packager: {
        // https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#options

        // OS X / Mac App Store
        // appBundleId: '',
        // appCategoryType: '',
        // osxSign: '',
        // protocol: 'myapp://path',

        // Windows only
        // win32metadata: { ... }
      },

      builder: {
        // https://www.electron.build/configuration/configuration

        appId: env.APP_ID,
        productName: "RoaringRoster",
        copyright: "Copyright © Michael Kamphausen",
        nativeRebuilder: "legacy",
        protocols: [{
          name: "RoaringRoster URL",
          schemes: [env.URL_SCHEME]
        }],
        mac: {
          target: !process.env.FAST_BUILD
            ? [{
                target: "zip",
                arch: [/*"arm64", "x64",*/ "universal"]
              }]
            : [{
                target: "dir"
              }],
          category: "public.app-category.productivity",
          icon: "src-electron/icons/icon.icns",
          hardenedRuntime: true,
          entitlements: "src-electron/build/entitlements.mac.plist",
          entitlementsInherit: "src-electron/build/entitlements.mac.plist",
          notarize: false, // we're using the afterSign hook for notariziation instead (see below)
          extendInfo: {
            "NSCameraUsageDescription": "This app needs access to the camera for scanning QR codes and documents."
          },
        },
        win: {
          target: [{
            target: "nsis",
            // arch: ["x64", "ia32"]
          }],
          icon: "src-electron/icons/icon.ico",
        },
        nsis: {
          runAfterFinish: false,
          perMachine: true,
        },
        linux: {
          target: [{
            target: "AppImage",
            arch: ["x64", "arm64"]
          }],
          category: "Office",
          icon: "src-electron/icons/icon.icns",
          artifactName: "${productName}-${version}-${arch}-linux.${ext}"

        },
        snap: {
          publish: {
            provider: "generic",
            url: env.UPDATE_URL
          }
        },
        afterPack: "src-electron/scripts/afterPack.js",
        afterSign: "src-electron/scripts/afterSign.js",
        publish: [{
        //   provider: "github"
        // },{
          provider: "generic",
          url: env.UPDATE_URL
        }],
        electronUpdaterCompatibility: ">= 2.16"
      },

      extendPackageJson: json => {
        json.dependencies = {
          "electron-updater": "^6.6.2",
          "electron-window-state": "^5.0.3",
        };
      }
    }
  }
});
