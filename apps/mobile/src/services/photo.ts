import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

const PHOTOS_DIR = `${FileSystem.documentDirectory}photos/`;
const PET_ICONS_DIR = `${FileSystem.documentDirectory}pet_icons/`;
const TMP_DIR = `${FileSystem.documentDirectory}tmp/`;

// iOS のアプリコンテナ UUID はアップデート等で変わるため、DB に保存した
// 絶対パス（古い documentDirectory を含む）は翌日リンク切れになる。
// 表示時にファイル名以降を抽出し、現在の documentDirectory で組み直して救済する。
export function resolveLocalUri(uri: string | null | undefined): string | null {
  if (!uri) return null;
  // 既に有効な現行パス、または外部 URL はそのまま
  if (uri.startsWith('http')) return uri;
  const docDir = FileSystem.documentDirectory ?? '';
  if (uri.startsWith(docDir) && docDir) return uri;
  // 旧 documentDirectory を含む絶対パス → photos/ または pet_icons/ 以降を取り出す
  const m = uri.match(/(photos|pet_icons|tmp)\/[^/]+$/);
  if (m) return `${docDir}${m[0]}`;
  return uri;
}

async function ensureDir(dir: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

export async function pickPhoto(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
    allowsEditing: false,
  });
  if (result.canceled) return null;
  return result.assets[0].uri;
}

export async function takePhoto(): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 1,
    allowsEditing: false,
  });
  if (result.canceled) return null;
  return result.assets[0].uri;
}

async function getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
  // ImageManipulator で一度操作して width/height を取得
  const result = await ImageManipulator.manipulateAsync(uri, [], {});
  return { width: result.width, height: result.height };
}

// 原画像 + サムネイル生成してファイルを配置
export async function processPhoto(
  sourceUri: string,
  entryId: string
): Promise<{ imageUri: string; thumbnailUri: string }> {
  await ensureDir(PHOTOS_DIR);

  const { width, height } = await getImageDimensions(sourceUri);
  const isLandscape = width >= height;

  // 原画像: 長辺 1600px, quality 0.85
  const resized = await ImageManipulator.manipulateAsync(
    sourceUri,
    [isLandscape ? { resize: { width: 1600 } } : { resize: { height: 1600 } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
  );
  const imageUri = `${PHOTOS_DIR}${entryId}.jpg`;
  await FileSystem.moveAsync({ from: resized.uri, to: imageUri });

  // サムネイル: 長辺 400px, quality 0.7
  const thumb = await ImageManipulator.manipulateAsync(
    imageUri,
    [isLandscape ? { resize: { width: 400 } } : { resize: { height: 400 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  const thumbnailUri = `${PHOTOS_DIR}${entryId}_thumb.jpg`;
  await FileSystem.moveAsync({ from: thumb.uri, to: thumbnailUri });

  return { imageUri, thumbnailUri };
}

// ペットアイコン処理: 正方形 400px
export async function processIcon(
  sourceUri: string,
  petId: string
): Promise<string> {
  await ensureDir(PET_ICONS_DIR);

  const { width, height } = await getImageDimensions(sourceUri);
  const size = Math.min(width, height);
  const originX = Math.floor((width - size) / 2);
  const originY = Math.floor((height - size) / 2);

  const result = await ImageManipulator.manipulateAsync(
    sourceUri,
    [
      { crop: { originX, originY, width: size, height: size } },
      { resize: { width: 400 } },
    ],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
  );
  const iconUri = `${PET_ICONS_DIR}${petId}.jpg`;
  await FileSystem.moveAsync({ from: result.uri, to: iconUri });
  return iconUri;
}

// カメラロールに保存 (元データをそのまま保存)
export async function saveToMediaLibrary(sourceUri: string): Promise<void> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') return;

  const asset = await MediaLibrary.createAssetAsync(sourceUri);
  const albums = await MediaLibrary.getAlbumsAsync();
  const album = albums.find(a => a.title === 'Pet Diary');
  if (album) {
    await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
  } else {
    await MediaLibrary.createAlbumAsync('Pet Diary', asset, false);
  }
}

export async function deletePhotoFiles(entryId: string): Promise<void> {
  await FileSystem.deleteAsync(`${PHOTOS_DIR}${entryId}.jpg`, { idempotent: true });
  await FileSystem.deleteAsync(`${PHOTOS_DIR}${entryId}_thumb.jpg`, { idempotent: true });
}

export async function deleteIconFile(petId: string): Promise<void> {
  await FileSystem.deleteAsync(`${PET_ICONS_DIR}${petId}.jpg`, { idempotent: true });
}

export async function checkFileExists(uri: string): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists;
}
