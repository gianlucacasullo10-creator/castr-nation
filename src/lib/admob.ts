import { Capacitor } from "@capacitor/core";
import { AdMob, type AdOptions, AdMobRewardItem, RewardAdPluginEvents } from "@capacitor-community/admob";

const REWARDED_AD_ID = "ca-app-pub-3944372044734468/2940678746";

export async function initAdMob(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await AdMob.initialize({ requestTrackingAuthorization: true });
}

export async function showRewardedAd(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    // Browser fallback — simulate ad for dev/PWA testing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return true;
  }

  const options: AdOptions = { adId: REWARDED_AD_ID };

  await AdMob.prepareRewardVideoAd(options);

  return new Promise((resolve) => {
    let rewarded = false;

    AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
      rewarded = true;
    });

    AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
      resolve(rewarded);
    });

    AdMob.addListener(RewardAdPluginEvents.FailedToLoad, () => {
      resolve(false);
    });

    AdMob.showRewardVideoAd();
  });
}
