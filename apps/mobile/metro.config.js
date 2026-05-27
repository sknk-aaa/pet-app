const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules/.pnpm/node_modules'),
];

// モノレポに React 18/19 が混在するため、react/* を常にモバイル側の React 18 に固定
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react' || moduleName.startsWith('react/')) {
    try {
      const resolved = require.resolve(moduleName, { paths: [projectRoot] });
      return { type: 'sourceFile', filePath: resolved };
    } catch (_) {}
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
