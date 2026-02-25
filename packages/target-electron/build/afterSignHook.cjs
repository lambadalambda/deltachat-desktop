const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName === 'darwin') {
    const { appleApiKey, appleApiIssuer, appleApiKeyId } = process.env;
    if (!appleApiKey || !appleApiIssuer || !appleApiKeyId) {
      console.log('Skipping notarization: missing Apple notarization credentials');
      return;
    }

    //non appstore - mac os (dmg)
    const appName = context.packager.appInfo.productFilename;
    return await notarize({
      tool: 'notarytool',
      appPath: `${appOutDir}/${appName}.app`,
      appleApiKey,
      appleApiIssuer,
      appleApiKeyId
    });
  }
};
