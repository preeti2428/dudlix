const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo Config Plugin for Android Doodlix Home-Screen Widget
 */
const withDoodlixAndroidWidget = (config) => {
  return withAndroidManifest(config, (manifestConfig) => {
    const mainApplication = manifestConfig.modResults.manifest.application[0];

    // Ensure receivers array exists
    if (!mainApplication.receiver) {
      mainApplication.receiver = [];
    }

    // Check if DoodlixWidgetProvider already added
    const alreadyRegistered = mainApplication.receiver.some(
      (r) => r.$['android:name'] === '.widget.DoodlixWidgetProvider'
    );

    if (!alreadyRegistered) {
      mainApplication.receiver.push({
        $: {
          'android:name': '.widget.DoodlixWidgetProvider',
          'android:exported': 'true',
          'android:label': 'Doodlix Shared Drawing',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.appwidget.action.APPWIDGET_UPDATE',
                },
              },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/doodlix_widget_info',
            },
          },
        ],
      });
    }

    return manifestConfig;
  });
};

module.exports = withDoodlixAndroidWidget;

