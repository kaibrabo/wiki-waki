import WidgetKit
import SwiftUI

// MARK: - Shared Data
//
// These Codable structs mirror the WidgetData interface in src/lib/widget.ts.
// Keep the two in sync: the app writes this JSON into the App Group shared
// UserDefaults, and the widget decodes it here.

struct AlarmData: Codable {
    let label: String
    let time: String
    let locationName: String
    let timezone: String
    let fireEpoch: Double // Unix seconds of the next fire instant
    let enabled: Bool

    var fireDate: Date { Date(timeIntervalSince1970: fireEpoch) }
}

struct LocationData: Codable {
    let name: String
    let timezone: String
    let currentTime: String
}

struct WidgetData: Codable {
    let nextAlarm: AlarmData?
    let currentTime: String
    let currentTimezone: String
    let currentLocationName: String? // optional for forward/backward compatibility
    let theme: String? // "light" | "dark" — the app's effective theme
    let locations: [LocationData]
}

// MARK: - Theme (mirrors the Tamagui app palette)

extension Color {
    /// App accent blue (#3B82F6).
    static let moondialAccent = Color(red: 0.231, green: 0.510, blue: 0.965)
    /// App dark background (slate, #0F172A).
    static let moondialDarkBG = Color(red: 0.059, green: 0.090, blue: 0.165)
    /// App light background (near-white grey).
    static let moondialLightBG = Color(red: 0.96, green: 0.96, blue: 0.97)
}

/// "America/Los_Angeles" -> "Los Angeles".
private func cityName(from timezone: String) -> String {
    guard let last = timezone.split(separator: "/").last else { return timezone }
    return last.replacingOccurrences(of: "_", with: " ")
}

/// The current location's display name: prefer what the app sent, else the tz city.
private func currentLocationName(_ data: WidgetData?) -> String {
    if let name = data?.currentLocationName, !name.isEmpty { return name }
    return cityName(from: data?.currentTimezone ?? TimeZone.current.identifier)
}

// MARK: - Data Provider

struct Provider: TimelineProvider {
    private static let sample = WidgetData(
        nextAlarm: AlarmData(
            label: "Start work",
            time: "9:00 AM",
            locationName: "San Francisco",
            timezone: "America/Los_Angeles",
            fireEpoch: Date().addingTimeInterval(3 * 3600 + 12 * 60).timeIntervalSince1970,
            enabled: true
        ),
        currentTime: "9:41 AM",
        currentTimezone: TimeZone.current.identifier,
        currentLocationName: "San Francisco",
        theme: "light",
        locations: [
            LocationData(name: "San Francisco", timezone: "America/Los_Angeles", currentTime: "9:41 AM"),
            LocationData(name: "New York", timezone: "America/New_York", currentTime: "12:41 PM"),
            LocationData(name: "Tokyo", timezone: "Asia/Tokyo", currentTime: "1:41 AM")
        ]
    )

    func placeholder(in context: Context) -> MoondialEntry {
        MoondialEntry(date: Date(), data: Provider.sample)
    }

    func getSnapshot(in context: Context, completion: @escaping (MoondialEntry) -> Void) {
        completion(loadEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<MoondialEntry>) -> Void) {
        let entry = loadEntry()
        // The live clock and countdown update themselves via SwiftUI date-styled
        // Text, so we only need occasional reloads to refresh the world clocks.
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func loadEntry() -> MoondialEntry {
        // The app stores the payload as a JSON string, so read it as a string
        // (UserDefaults.data(forKey:) returns nil for a string value).
        if let sharedDefaults = UserDefaults(suiteName: "group.com.kaibrabo.moondial"),
           let jsonString = sharedDefaults.string(forKey: "widgetData"),
           let data = jsonString.data(using: .utf8),
           let widgetData = try? JSONDecoder().decode(WidgetData.self, from: data) {
            return MoondialEntry(date: Date(), data: widgetData)
        }
        return MoondialEntry(date: Date(), data: nil)
    }
}

// MARK: - Entry

struct MoondialEntry: TimelineEntry {
    let date: Date
    let data: WidgetData?
}

// MARK: - Reusable pieces

/// Current location: big live time on top, then the location name — like the
/// app's CURRENT card.
private struct CurrentHeader: View {
    var locationName: String
    var timeSize: CGFloat

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(Date(), style: .time)
                .font(.system(size: timeSize, weight: .thin, design: .rounded))
                .foregroundColor(.primary)
                .lineLimit(1)
                .minimumScaleFactor(0.6)
            HStack(spacing: 4) {
                Image(systemName: "location.fill")
                    .font(.system(size: max(9, timeSize * 0.24)))
                    .foregroundColor(.moondialAccent)
                Text(locationName)
                    .font(.system(size: max(12, timeSize * 0.30)))
                    .fontWeight(.semibold)
                    .foregroundColor(.secondary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
        }
    }
}

/// The "Next" alarm — label, clock time and a live countdown, like the home card.
private struct NextAlarm: View {
    var alarm: AlarmData?
    var timeSize: CGFloat = 22

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack(spacing: 4) {
                Image(systemName: "alarm.fill")
                    .font(.system(size: 10))
                    .foregroundColor(.moondialAccent)
                Text("NEXT")
                    .font(.system(size: 10))
                    .fontWeight(.bold)
                    .foregroundColor(.secondary)
            }
            if let alarm = alarm, alarm.enabled {
                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Text(alarm.time)
                        .font(.system(size: timeSize, weight: .light, design: .rounded))
                        .foregroundColor(.primary)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                    if !alarm.label.isEmpty {
                        Text(alarm.label)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                }
                Text(alarm.fireDate, style: .timer)
                    .font(.caption2.monospacedDigit())
                    .fontWeight(.semibold)
                    .foregroundColor(.moondialAccent)
            } else {
                Text("No upcoming alarms")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
    }
}

/// A world-clock row for the saved locations (large widget).
private struct ClockRow: View {
    var location: LocationData
    var body: some View {
        HStack {
            Text(location.name)
                .font(.caption)
                .foregroundColor(.secondary)
                .lineLimit(1)
            Spacer(minLength: 6)
            Text(location.currentTime)
                .font(.caption.monospacedDigit())
                .fontWeight(.medium)
                .foregroundColor(.primary)
        }
    }
}

// MARK: - Sizes

struct SmallWidgetView: View {
    let entry: MoondialEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            CurrentHeader(locationName: currentLocationName(entry.data), timeSize: 30)
            Spacer(minLength: 4)
            Divider()
            NextAlarm(alarm: entry.data?.nextAlarm, timeSize: 20)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding(EdgeInsets(top: 10, leading: 16, bottom: 10, trailing: 10))
    }
}

struct MediumWidgetView: View {
    let entry: MoondialEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            CurrentHeader(locationName: currentLocationName(entry.data), timeSize: 40)
            Spacer(minLength: 4)
            Divider()
            NextAlarm(alarm: entry.data?.nextAlarm, timeSize: 26)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding(EdgeInsets(top: 10, leading: 16, bottom: 10, trailing: 10))
    }
}

struct LargeWidgetView: View {
    let entry: MoondialEntry

    private var savedLocations: [LocationData] {
        let current = currentLocationName(entry.data)
        return (entry.data?.locations ?? []).filter { $0.name != current }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 5) {
                Image(systemName: "moon.stars.fill")
                    .font(.caption2)
                    .foregroundColor(.moondialAccent)
                Text("Moondial")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.secondary)
                Spacer()
            }

            CurrentHeader(locationName: currentLocationName(entry.data), timeSize: 52)

            NextAlarm(alarm: entry.data?.nextAlarm, timeSize: 30)
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.moondialAccent.opacity(0.10))
                .cornerRadius(12)

            if !savedLocations.isEmpty {
                Text("SAVED")
                    .font(.system(size: 10))
                    .fontWeight(.bold)
                    .foregroundColor(.secondary)
                VStack(spacing: 8) {
                    ForEach(Array(savedLocations.prefix(5)), id: \.timezone) { loc in
                        ClockRow(location: loc)
                    }
                }
            }

            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding(EdgeInsets(top: 10, leading: 16, bottom: 10, trailing: 10))
    }
}

// MARK: - Widget Configuration

struct MoondialWidget: Widget {
    let kind: String = "MoondialWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            MoondialWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Moondial")
        .description("Your current time and location, and your next alarm with a live countdown.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        .contentMarginsDisabled()
    }
}

struct MoondialWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: MoondialEntry

    private var isDark: Bool { entry.data?.theme == "dark" }

    var body: some View {
        // Force the widget to the app's effective theme (not the system
        // appearance), so it's light when the app is light.
        sized
            .environment(\.colorScheme, isDark ? .dark : .light)
            .containerBackground(for: .widget) {
                isDark ? Color.moondialDarkBG : Color.moondialLightBG
            }
    }

    @ViewBuilder private var sized: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        case .systemLarge:
            LargeWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }
}
