const fs = require('fs');
const path = require('path');

// @expo/config-plugins を直接 require すると、expo-constants の
// "Generate app.config" ビルドスクリプトが app.config.js を再評価する際、
// pnpm の厳格な node_modules 配置のためモジュールを解決できず
// "Cannot find module '@expo/config-plugins'" でビルドが落ちる。
// expo の依存ツリー経由で解決することで CI(pnpm)でも確実に読み込む。
function loadWithDangerousMod() {
  const paths = [__dirname, process.cwd()];
  try {
    paths.push(path.dirname(require.resolve('expo/package.json', { paths })));
  } catch {}
  try {
    paths.push(path.dirname(require.resolve('@expo/config/package.json', { paths })));
  } catch {}
  const resolved = require.resolve('@expo/config-plugins', { paths });
  return require(resolved).withDangerousMod;
}

// Xcode 26 (Apple clang 21) は consteval をより厳格に検査するため、
// React Native が依存する fmt の FMT_STRING(format-inl.h) が
// "call to consteval function ... is not a constant expression" でビルド失敗する。
// fmt ターゲットを C++17 でコンパイルし FMT_USE_CONSTEVAL=0 を定義すると、
// consteval 経路が無効化され実行時/constexpr の書式チェックにフォールバックする。
// react_native_post_install が C++ 標準を上書きするため、その呼び出しの後に注入する。
const MARKER = '# >>> withFmtCpp17 (do not edit)';
const PATCH = `
${MARKER}
    installer.pods_project.targets.each do |target|
      if target.name == 'fmt'
        target.build_configurations.each do |bc|
          bc.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
          defs = bc.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] || ['$(inherited)']
          defs = [defs] unless defs.is_a?(Array)
          defs << 'FMT_USE_CONSTEVAL=0' unless defs.include?('FMT_USE_CONSTEVAL=0')
          bc.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = defs
        end
      end
    end
    # <<< withFmtCpp17
`;

module.exports = function withFmtCpp17(config) {
  const withDangerousMod = loadWithDangerousMod();
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      if (contents.includes(MARKER)) {
        return cfg;
      }

      const re = /(react_native_post_install\([\s\S]*?\n\s*\)\n)/;
      if (re.test(contents)) {
        contents = contents.replace(re, `$1${PATCH}`);
      } else {
        throw new Error(
          'withFmtCpp17: react_native_post_install(...) が Podfile に見つかりませんでした。'
        );
      }

      fs.writeFileSync(podfilePath, contents);
      return cfg;
    },
  ]);
};
