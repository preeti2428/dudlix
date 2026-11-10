import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WidgetPayload, WidgetTheme, WidgetSize } from '../shared/types';

const { DoodlixWidgetBridge } = NativeModules;

const CACHED_WIDGET_KEY = 'doodlix_cached_widget_payload';

class WidgetBridgeService {
  /**
   * Pushes the latest drawing, friend info, and metadata to the native home screen widgets
   * on both iOS (App Groups / WidgetKit) and Android (SharedPreferences / RemoteViews).
   */
  async updateNativeWidget(payload: WidgetPayload): Promise<boolean> {
    try {
      // 1. Cache locally for companion app live preview
      await AsyncStorage.setItem(CACHED_WIDGET_KEY, JSON.stringify(payload));

      // 2. Call Native Bridge if available
      if (DoodlixWidgetBridge && typeof DoodlixWidgetBridge.updateWidgetData === 'function') {
        await DoodlixWidgetBridge.updateWidgetData(payload);
        console.log(`📱 [WidgetBridge] Native widget updated on ${Platform.OS}`);
        return true;
      } else {
        // Running inside Expo Go or standard dev container
        console.log(`📱 [WidgetBridge] Stored widget payload in cache (${Platform.OS} preview mode active)`);
        return true;
      }
    } catch (err: any) {
      console.warn('⚠️ [WidgetBridge] Could not update native widget:', err.message);
      return false;
    }
  }

  async getCachedWidgetData(): Promise<WidgetPayload | null> {
    try {
      const stored = await AsyncStorage.getItem(CACHED_WIDGET_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return null;
  }

  /**
   * Triggers OS timeline / remote view refresh
   */
  async reloadAllTimelines(): Promise<void> {
    try {
      if (DoodlixWidgetBridge && typeof DoodlixWidgetBridge.reloadAllTimelines === 'function') {
        await DoodlixWidgetBridge.reloadAllTimelines();
      } else if (DoodlixWidgetBridge && typeof DoodlixWidgetBridge.reloadAllWidgets === 'function') {
        await DoodlixWidgetBridge.reloadAllWidgets();
      }
    } catch (err: any) {
      console.warn('⚠️ [WidgetBridge] reloadAllTimelines notice:', err.message);
    }
  }
}

export const widgetBridge = new WidgetBridgeService();

