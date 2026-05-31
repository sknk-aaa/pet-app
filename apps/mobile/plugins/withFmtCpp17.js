const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Xcode 26 (Apple clang 21) は consteval をより厳格に検査するため、
// React Native が依存する fmt の FMT_STRING(format-inl.h) が
// "call to consteval function ... is not a constant expression" でビルド失敗する。
// fmt ターゲットを C++17 でコンパイルし、かつ FMT_USE_CONSTEVAL=0 を定義すると
// consteval 経路が無効化され、fmt は実行時/constexpr の書式チェックにフォールバックする。
//
// 重要: react_native_post_install が C++ 標準を上書きするため、パッチは
// その呼び出しの「後」に注入する必要がある（前に入れると無効化される）。
// expo prebuild が Podfile を毎回再生成するため Config Plugin で注入する。
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
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      if (contents.includes(MARKER)) {
        return cfg;
      }

      // react_native_post_install( ... ) の閉じ括弧の直後に注入する。
      // 非貪欲マッチで複数行の引数をまたいで最初の "  )"（行頭の閉じ括弧）まで拾う。
      const re = /(react_native_post_install\([\s\S]*?\n\s*\)\n)/;
      if (re.test(contents)) {
        contents = contents.replace(re, `$1${PATCH}`);
      } else {
        throw new Error(
          'withFmtCpp17: react_native_post_install(...) が Podfile に見つかりませんでした。Podfile の構造変更を確認してください。'
        );
      }

      fs.writeFileSync(podfilePath, contents);
      return cfg;
    },
  ]);
};
