import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'まいにちペット',
  slug: 'mainichi-pet',
  version: '1.0.0',
  orientation: 'portrait',
  platforms: ['ios'],
  scheme: 'mainichipet',
  experiments: {
    typedRoutes: true,
  },
  plugins: [
    'expo-router',
    [
      'expo-camera',
      { cameraPermission: 'ペットの写真を撮影します' },
    ],
    [
      'expo-image-picker',
      { photosPermission: 'アルバムからペットの写真を選びます' },
    ],
    [
      'expo-media-library',
      {
        photosPermission: 'アルバムからペットの写真を選びます',
        savePhotosPermission: 'カメラロールに保存します',
      },
    ],
    [
      'expo-notifications',
      { icon: './assets/notification-icon.png', color: '#E8824A' },
    ],
  ],
  ios: {
    bundleIdentifier: 'com.mainichipet.app',
    supportsTablet: true,
    usesAppleSignIn: true,
    infoPlist: {
      NSCameraUsageDescription: 'ペットの写真を撮影します',
      NSPhotoLibraryUsageDescription: 'アルバムからペットの写真を選びます',
      NSPhotoLibraryAddUsageDescription: 'カメラロールに保存します',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  extra: {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    eas: {
      projectId: 'c1a5e2b7-800b-48d0-8d8f-ead54e05a1d9',
    },
  },
});
