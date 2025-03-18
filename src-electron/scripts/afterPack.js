import { writeFile } from "fs";

const _default = async function afterPack(context) {
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName !== 'darwin') {
    return;
  }

  const {
    productFilename, info: {
      _metadata: { electronLanguagesInfoPlistStrings },
    },
  } = context.packager.appInfo;

  const resPath = `${appOutDir}/${productFilename}.app/Contents/Resources/`;

  await Promise.all(
    Object.keys(electronLanguagesInfoPlistStrings).map((langKey) => {
      const infoPlistStringsPath = `${langKey}.lproj/InfoPlist.strings`;
      const langItem = electronLanguagesInfoPlistStrings[langKey];

      const content = Object.entries(langItem)
        .map(([key, value]) => `"${key}" = "${value}";`)
        .join("\n");

      return new Promise((resolve) => {
        writeFile(
          `${resPath}${infoPlistStringsPath}`,
          content,
          error => {
            resolve();
            if (error) throw error;
          }
        );
      });
    })
  );

  console.log(
    "  \x1b[34m•\x1b[0m",
    "finished        generating localized InfoPlist.strings files"
  );

  return;
};

export { _default as default };
