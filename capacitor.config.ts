/* eslint-disable quote-props */
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dlv.isale',
  appName: 'ISale',
  webDir: 'www',
  bundledWebRuntime: false,
  cordova: {
    preferences: {
      'SplashMaintainAspectRatio': 'true',
      'FadeSplashScreenDuration': '300',
      'SplashShowOnlyFirstTime': 'false',
      'SplashScreen': 'screen',
      'SplashScreenDelay': '3000',
      'loadUrlTimeoutValue': '700000'
    },
  },
  plugins: {
    FirebaseAnalytics: {
      'FIREBASE_ANALYTICS_COLLECTION_ENABLED': 'true',
      'FIREBASE_PERFORMANCE_COLLECTION_ENABLED': 'true',
      'FIREBASE_CRASHLYTICS_COLLECTION_ENABLED': 'true',
    },
    //some other plugins
    "CodePush": {
      "IOS_DEPLOY_KEY": "Da4iMw6kCDoXe8Enm6aIRl3foiJW4iLQiNoeS",
      "ANDROID_DEPLOY_KEY": "PaN8mAh0X6HEl6w13yx3qUoR8KUFdKcER1v9M",
      "SERVER_URL": "https://codepush.appcenter.ms/"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  }
};

export default config;
