const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Xcode 26 (Apple clang 21) は consteval をより厳格に検査するため、
// React Native が依存する fmt ライブラリの FMT_STRING(format-inl.h) が
// "call to consteval function ... is not a constant expression" でビルド失敗する。
// fmt ターゲットだけを C++17 でコンパイルさせると consteval 経路が無効化され、
// fmt は実行時の書式チェックにフォールバックしてビルドが通る。
// expo prebuild が Podfile を毎回再生成するため、Config Plugin で post_install に注入する。
const MARKER = '# >>> withFmtCpp17';
const PATCH = `
${MARKER}
    installer.pods_project.targets.each do |target|
      if target.name == 'fmt'
        target.build_configurations.each do |bc|
          bc.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
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

      // 既存の post_install ブロックの先頭にパッチを差し込む
      const anchor = 'post_install do |installer|';
      if (contents.includes(anchor)) {
        contents = contents.replace(anchor, `${anchor}\n${PATCH}`);
      } else {
        // post_install が無ければ末尾に追加
        contents += `\npost_install do |installer|\n${PATCH}\nend\n`;
      }

      fs.writeFileSync(podfilePath, contents);
      return cfg;
    },
  ]);
};
