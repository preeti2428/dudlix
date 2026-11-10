import Foundation
import WidgetKit

@objc(DoodlixWidgetBridge)
class DoodlixWidgetBridge: NSObject {
    private let appGroupId = "group.com.doodlix.app"

    @objc
    func updateWidgetData(
        _ data: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard let userDefaults = UserDefaults(suiteName: appGroupId) else {
            reject("E_APP_GROUP", "Failed to access App Group: \(appGroupId)", nil)
            return
        }

        if let roomId = data["roomId"] as? String {
            userDefaults.set(roomId, forKey: "widget_room_id")
        }
        if let roomName = data["roomName"] as? String {
            userDefaults.set(roomName, forKey: "widget_room_name")
        }
        if let friendName = data["friendName"] as? String {
            userDefaults.set(friendName, forKey: "widget_friend_name")
        }
        if let friendInitials = data["friendInitials"] as? String {
            userDefaults.set(friendInitials, forKey: "widget_friend_initials")
        }
        if let lastUpdated = data["lastUpdatedFormatted"] as? String {
            userDefaults.set(lastUpdated, forKey: "widget_last_updated")
        }
        if let theme = data["theme"] as? String {
            userDefaults.set(theme, forKey: "widget_theme")
        }
        if let isConnected = data["isConnected"] as? Bool {
            userDefaults.set(isConnected, forKey: "widget_is_connected")
        }
        if let deepLink = data["deepLinkUrl"] as? String {
            userDefaults.set(deepLink, forKey: "widget_deeplink")
        }
        if let imageBase64 = data["drawingBase64"] as? String {
            userDefaults.set(imageBase64, forKey: "widget_image_base64")
        }

        userDefaults.synchronize()

        // Trigger native WidgetKit timeline reload immediately
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }

        resolve(["success": true, "message": "Widget updated and timelines reloaded."])
    }

    @objc
    func reloadAllTimelines(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
            resolve(["success": true])
        } else {
            reject("E_UNSUPPORTED", "WidgetKit requires iOS 14.0+", nil)
        }
    }

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}

