const { withEntitlementsPlist, withXcodeProject } = require('@expo/config-plugins');

const APP_GROUP_IDENTIFIER = 'group.com.doodlix.app';

/**
 * Expo Config Plugin to configure iOS App Group & Widget Extension for Doodlix
 */
const withDoodlixWidget = (config) => {
  // 1. Configure App Group Entitlements
  config = withEntitlementsPlist(config, (plistConfig) => {
    const existing = plistConfig.modResults['com.apple.security.application-groups'] || [];
    if (!existing.includes(APP_GROUP_IDENTIFIER)) {
      plistConfig.modResults['com.apple.security.application-groups'] = [...existing, APP_GROUP_IDENTIFIER];
    }
    return plistConfig;
  });

  return config;
};

module.exports = withDoodlixWidget;

