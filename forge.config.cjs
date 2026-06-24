const { FusesPlugin } = require('./tools/forge-fuses-plugin.cjs');

// @electron/fuses@2 is ESM-only; keep Forge config in CJS by inlining the enum values.
const FuseVersion = { V1: '1' };
const FuseV1Options = {
  RunAsNode: 0,
  EnableCookieEncryption: 1,
  EnableNodeOptionsEnvironmentVariable: 2,
  EnableNodeCliInspectArguments: 3,
  EnableEmbeddedAsarIntegrityValidation: 4,
  OnlyLoadAppFromAsar: 5,
  LoadBrowserProcessSpecificV8Snapshot: 6,
  GrantFileProtocolExtraPrivileges: 7,
};

module.exports = {
  packagerConfig: {
    name: 'ESPConnect',
    executableName: 'espconnect',
    asar: true,
    // Ensure consistent executable name across platforms
    win32metadata: {
      FileDescription: 'ESPConnect - ESP Device Manager',
      ProductName: 'ESPConnect',
    },
    appBundleId: 'com.lastoutpostworkshop.espconnect',
    appCategoryType: 'public.app-category.developer-tools',
    // Files to exclude from the app
    ignore: [
      /^\/src/,
      /^\/\.github/,
      /^\/tools/,
      /^\/node_modules\/(?!electron)/,
      /\.git/,
      /\.vscode/,
      /\.DS_Store/,
      /tsconfig\.json/,
      /vite\.config\.(js|ts)$/,
      /^\/Dockerfile$/,
      /\.md$/,
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'ESPConnect',
        authors: 'The Last Outpost Workshop',
        description: 'Browser-based control center for ESP32 and ESP8266 boards',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux', 'win32'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          name: 'espconnect',
          bin: 'espconnect',
          maintainer: 'The Last Outpost Workshop',
          homepage: 'https://github.com/thelastoutpostworkshop/ESPConnect',
          categories: ['Development', 'Utility'],
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          name: 'espconnect',
          bin: 'espconnect',
          homepage: 'https://github.com/thelastoutpostworkshop/ESPConnect',
          categories: ['Development', 'Utility'],
        },
      },
    },
    {
      name: '@electron-forge/maker-dmg',
      config: (arch) => ({
        format: 'ULFO',
        name: `ESPConnect-${arch}`,
      }),
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: process.env.GITHUB_REPOSITORY_OWNER || 'thelastoutpostworkshop',
          name: (process.env.GITHUB_REPOSITORY || 'thelastoutpostworkshop/ESPConnect').split('/')[1]
        },
        prerelease: false,
        draft: true
      }
    }
  ]
};
