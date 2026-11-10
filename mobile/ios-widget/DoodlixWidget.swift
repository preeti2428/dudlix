import WidgetKit
import SwiftUI

// App Group identifier shared between Doodlix iOS Companion App and Widget Extension
let APP_GROUP_ID = "group.com.doodlix.app"

struct DoodlixWidgetEntry: TimelineEntry {
    let date: Date
    let roomId: String
    let roomName: String
    let friendName: String
    let friendInitials: String
    let lastUpdatedFormatted: String
    let drawingImageData: Data?
    let themeName: String
    let isConnected: Bool
    let deepLinkUrl: String
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> DoodlixWidgetEntry {
        DoodlixWidgetEntry(
            date: Date(),
            roomId: "demo_room",
            roomName: "Doodlix Canvas",
            friendName: "Taylor (Person B)",
            friendInitials: "TB",
            lastUpdatedFormatted: "Just now",
            drawingImageData: nil,
            themeName: "lavender",
            isConnected: true,
            deepLinkUrl: "doodlix://draw/demo_room"
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (DoodlixWidgetEntry) -> ()) {
        let entry = loadCurrentWidgetData()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DoodlixWidgetEntry>) -> ()) {
        let entry = loadCurrentWidgetData()
        // Refresh policy: OS refreshes when app triggers reloadAllTimelines, plus backup refresh every 30 mins
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadCurrentWidgetData() -> DoodlixWidgetEntry {
        guard let userDefaults = UserDefaults(suiteName: APP_GROUP_ID) else {
            return placeholder(in: Context())
        }

        let roomId = userDefaults.string(forKey: "widget_room_id") ?? "demo_room"
        let roomName = userDefaults.string(forKey: "widget_room_name") ?? "Doodlix"
        let friendName = userDefaults.string(forKey: "widget_friend_name") ?? "Connect Friend"
        let friendInitials = userDefaults.string(forKey: "widget_friend_initials") ?? "DX"
        let lastUpdated = userDefaults.string(forKey: "widget_last_updated") ?? "Just now"
        let themeName = userDefaults.string(forKey: "widget_theme") ?? "lavender"
        let isConnected = userDefaults.bool(forKey: "widget_is_connected")
        let deepLink = userDefaults.string(forKey: "widget_deeplink") ?? "doodlix://draw/\(roomId)"

        var imageData: Data? = nil
        if let base64String = userDefaults.string(forKey: "widget_image_base64") {
            // Strip data:image/... prefix if present
            let cleanBase64 = base64String.contains(",") ? String(base64String.split(separator: ",")[1]) : base64String
            imageData = Data(base64Encoded: cleanBase64)
        }

        return DoodlixWidgetEntry(
            date: Date(),
            roomId: roomId,
            roomName: roomName,
            friendName: friendName,
            friendInitials: friendInitials,
            lastUpdatedFormatted: lastUpdated,
            drawingImageData: imageData,
            themeName: themeName,
            isConnected: isConnected,
            deepLinkUrl: deepLink
        )
    }
}

// Brand Colors
extension Color {
    static let doodlixPurple = Color(red: 0.46, green: 0.40, blue: 0.91) // #7665E8
    static let doodlixLavender = Color(red: 0.93, green: 0.92, blue: 0.99) // #EEEAFE
    static let doodlixSoftPink = Color(red: 1.00, green: 0.86, blue: 0.91) // #FFDCE8
    static let doodlixBg = Color(red: 0.98, green: 0.98, blue: 1.00) // #FAF9FF
    static let doodlixText = Color(red: 0.14, green: 0.13, blue: 0.23) // #24213A
}

// MARK: - Widget Views by Size

struct DoodlixWidgetSmallView: View {
    var entry: DoodlixWidgetEntry

    var body: some View {
        ZStack {
            backgroundColor(for: entry.themeName)

            VStack(alignment: .leading, spacing: 6) {
                // Header: Initials Avatar + App Branding
                HStack {
                    ZStack {
                        Circle()
                            .fill(Color.doodlixPurple.opacity(0.18))
                            .frame(width: 26, height: 26)
                        Text(entry.friendInitials)
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.doodlixPurple)
                    }

                    Spacer()

                    Text("Doodlix")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.doodlixPurple)
                }

                // Drawing Preview Canvas
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color.white)
                        .shadow(color: Color.black.opacity(0.04), radius: 3, x: 0, y: 1)

                    if let imgData = entry.drawingImageData, let uiImage = UIImage(data: imgData) {
                        Image(uiImage: uiImage)
                            .resizable()
                            .scaledToFit()
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .padding(4)
                    } else {
                        // Empty / Connect placeholder
                        VStack(spacing: 3) {
                            Image(systemName: entry.isConnected ? "pencil.and.outline" : "person.badge.plus")
                                .font(.system(size: 20))
                                .foregroundColor(.doodlixPurple.opacity(0.7))
                            Text(entry.isConnected ? "Tap to draw" : "Tap to connect")
                                .font(.system(size: 9, weight: .medium))
                                .foregroundColor(Color.doodlixText.opacity(0.6))
                        }
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)

                // Footer: Last updated time
                HStack {
                    Circle()
                        .fill(entry.isConnected ? Color.green : Color.orange)
                        .frame(width: 5, height: 5)
                    Text(entry.lastUpdatedFormatted)
                        .font(.system(size: 9, weight: .regular))
                        .foregroundColor(Color.doodlixText.opacity(0.55))
                    Spacer()
                }
            }
            .padding(12)
        }
    }
}

struct DoodlixWidgetMediumView: View {
    var entry: DoodlixWidgetEntry

    var body: some View {
        ZStack {
            backgroundColor(for: entry.themeName)

            HStack(spacing: 12) {
                // Left: Shared Drawing Preview (Square canvas)
                ZStack {
                    RoundedRectangle(cornerRadius: 14)
                        .fill(Color.white)
                        .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 2)

                    if let imgData = entry.drawingImageData, let uiImage = UIImage(data: imgData) {
                        Image(uiImage: uiImage)
                            .resizable()
                            .scaledToFit()
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                            .padding(6)
                    } else {
                        VStack(spacing: 4) {
                            Image(systemName: "hand.draw.fill")
                                .font(.system(size: 26))
                                .foregroundColor(.doodlixPurple.opacity(0.7))
                            Text("Canvas empty")
                                .font(.system(size: 10, weight: .medium))
                                .foregroundColor(Color.doodlixText.opacity(0.5))
                        }
                    }
                }
                .frame(width: 128, height: 128)

                // Right: Friend Info, Status & Quick Draw Action
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 6) {
                        ZStack {
                            Circle()
                                .fill(Color.doodlixPurple)
                                .frame(width: 28, height: 28)
                            Text(entry.friendInitials)
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(.white)
                        }

                        VStack(alignment: .leading, spacing: 1) {
                            Text(entry.friendName)
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(.doodlixText)
                                .lineLimit(1)
                            Text(entry.isConnected ? "Connected" : "Waiting for friend")
                                .font(.system(size: 10))
                                .foregroundColor(entry.isConnected ? Color.green : Color.orange)
                        }
                    }

                    Spacer()

                    // Last Synced Timestamp
                    HStack(spacing: 4) {
                        Image(systemName: "clock.arrow.circlepath")
                            .font(.system(size: 10))
                            .foregroundColor(Color.doodlixText.opacity(0.5))
                        Text("Synced \(entry.lastUpdatedFormatted)")
                            .font(.system(size: 10))
                            .foregroundColor(Color.doodlixText.opacity(0.6))
                    }

                    // Interactive Tap Action Button
                    HStack {
                        Image(systemName: "pencil.tip.crop.circle")
                            .font(.system(size: 12))
                        Text("Open Canvas")
                            .font(.system(size: 11, weight: .semibold))
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Color.doodlixPurple)
                    .foregroundColor(.white)
                    .clipShape(Capsule())
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(14)
        }
    }
}

struct DoodlixWidgetLargeView: View {
    var entry: DoodlixWidgetEntry

    var body: some View {
        ZStack {
            backgroundColor(for: entry.themeName)

            VStack(spacing: 12) {
                // Top Header: Friend Bar + Doodlix Logo
                HStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(Color.doodlixPurple)
                            .frame(width: 32, height: 32)
                        Text(entry.friendInitials)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.white)
                    }

                    VStack(alignment: .leading, spacing: 2) {
                        Text(entry.friendName)
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.doodlixText)
                        HStack(spacing: 4) {
                            Circle()
                                .fill(entry.isConnected ? Color.green : Color.orange)
                                .frame(width: 6, height: 6)
                            Text(entry.isConnected ? "Live Sync Active" : "Waiting for pairing")
                                .font(.system(size: 11))
                                .foregroundColor(Color.doodlixText.opacity(0.6))
                        }
                    }

                    Spacer()

                    Text("Doodlix")
                        .font(.system(size: 12, weight: .black))
                        .foregroundColor(.doodlixPurple)
                }

                // Center: Large Shared Drawing Canvas
                ZStack {
                    RoundedRectangle(cornerRadius: 18)
                        .fill(Color.white)
                        .shadow(color: Color.black.opacity(0.06), radius: 6, x: 0, y: 3)

                    if let imgData = entry.drawingImageData, let uiImage = UIImage(data: imgData) {
                        Image(uiImage: uiImage)
                            .resizable()
                            .scaledToFit()
                            .clipShape(RoundedRectangle(cornerRadius: 18))
                            .padding(8)
                    } else {
                        VStack(spacing: 8) {
                            Image(systemName: "paintbrush.pointed.fill")
                                .font(.system(size: 38))
                                .foregroundColor(.doodlixPurple.opacity(0.6))
                            Text("Your shared canvas is ready.")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundColor(Color.doodlixText)
                            Text("Tap anywhere to send a drawing to \(entry.friendName)")
                                .font(.system(size: 11))
                                .foregroundColor(Color.doodlixText.opacity(0.5))
                                .multilineTextAlignment(.center)
                        }
                        .padding()
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)

                // Bottom Footer: Synced status + Quick Action
                HStack {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.triangle.2.circlepath")
                            .font(.system(size: 11))
                            .foregroundColor(Color.doodlixText.opacity(0.5))
                        Text("Updated \(entry.lastUpdatedFormatted)")
                            .font(.system(size: 11))
                            .foregroundColor(Color.doodlixText.opacity(0.6))
                    }

                    Spacer()

                    HStack(spacing: 4) {
                        Image(systemName: "pencil")
                        Text("Draw Together")
                    }
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.doodlixPurple)
                    .clipShape(Capsule())
                }
            }
            .padding(16)
        }
    }
}

// Background Theme Helper
func backgroundColor(for theme: String) -> Color {
    switch theme {
    case "soft-pink":
        return Color.doodlixSoftPink.opacity(0.4)
    case "purple":
        return Color.doodlixLavender
    case "midnight-dark":
        return Color(red: 0.12, green: 0.11, blue: 0.18)
    case "minimal-light":
        return Color.white
    default:
        return Color.doodlixBg
    }
}

// MARK: - Main Widget Entrypoint

struct DoodlixWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    var entry: Provider.Entry

    var body: some View {
        Group {
            switch family {
            case .systemSmall:
                DoodlixWidgetSmallView(entry: entry)
            case .systemMedium:
                DoodlixWidgetMediumView(entry: entry)
            case .systemLarge:
                DoodlixWidgetLargeView(entry: entry)
            default:
                DoodlixWidgetMediumView(entry: entry)
            }
        }
        // Deep link into full shared drawing experience
        .widgetURL(URL(string: entry.deepLinkUrl))
    }
}

@main
struct DoodlixWidget: Widget {
    let kind: String = "DoodlixWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            DoodlixWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Doodlix Shared Drawing")
        .description("See your friend's latest drawing directly on your home screen.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

