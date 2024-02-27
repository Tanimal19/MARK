module.exports = {
  packagerConfig: {
    asar: true,
    extraResource: [
      "./src/extraResources/voice-editor-key.json",
      "./src/extraResources/victor.json"
    ], /* I know it's bad for safety... */
    icon: `./src/icon/Logo.ico`,
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
};
