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
    let code: String? // location/airport code like "SFO" (may be empty)
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
    let upcomingAlarms: [AlarmData]? // the next few alarms (queue), soonest first
    let currentTime: String
    let currentDate: String? // current date, pre-formatted per the app's setting
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

/// Saved locations = every location except the current one.
private func savedLocations(_ data: WidgetData?) -> [LocationData] {
    let current = currentLocationName(data)
    return (data?.locations ?? []).filter { $0.name != current }
}

// MARK: - Data Provider

struct Provider: TimelineProvider {
    private static let sample = WidgetData(
        nextAlarm: AlarmData(
            label: "Start work",
            time: "9:00 AM",
            locationName: "San Francisco",
            code: "SFO",
            timezone: "America/Los_Angeles",
            fireEpoch: Date().addingTimeInterval(3 * 3600 + 12 * 60).timeIntervalSince1970,
            enabled: true
        ),
        upcomingAlarms: [
            AlarmData(label: "Start work", time: "9:00 AM", locationName: "San Francisco", code: "SFO", timezone: "America/Los_Angeles", fireEpoch: Date().addingTimeInterval(3 * 3600).timeIntervalSince1970, enabled: true),
            AlarmData(label: "Lunch", time: "12:00 PM", locationName: "San Francisco", code: "SFO", timezone: "America/Los_Angeles", fireEpoch: Date().addingTimeInterval(6 * 3600).timeIntervalSince1970, enabled: true),
            AlarmData(label: "End work", time: "5:00 PM", locationName: "San Francisco", code: "SFO", timezone: "America/Los_Angeles", fireEpoch: Date().addingTimeInterval(11 * 3600).timeIntervalSince1970, enabled: true)
        ],
        currentTime: "9:41 AM",
        currentDate: "08/25/2025",
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
        let base = loadData()
        let now = Date()

        // Re-render just after each alarm fires so the fired alarm drops out and
        // the countdown moves to the next one (otherwise .timer counts UP past a
        // fire time). Each entry only shows alarms still in the future.
        let fireTimes = (base?.upcomingAlarms ?? [])
            .map { $0.fireDate }
            .filter { $0 > now }
            .sorted()

        var renderDates = [now]
        renderDates.append(contentsOf: fireTimes.map { $0.addingTimeInterval(1) })

        let entries = renderDates.map { date in
            MoondialEntry(date: date, data: Provider.futureOnly(base, after: date))
        }

        // Reload after the last known alarm (or in 15 min) so the app can refill
        // the queue for the following days.
        let reloadAt = max((fireTimes.last ?? now).addingTimeInterval(60),
                           now.addingTimeInterval(15 * 60))
        completion(Timeline(entries: entries, policy: .after(reloadAt)))
    }

    /// A copy of the payload keeping only alarms that fire after `date`.
    private static func futureOnly(_ data: WidgetData?, after date: Date) -> WidgetData? {
        guard let data = data else { return nil }
        let future = (data.upcomingAlarms ?? []).filter { $0.fireDate > date }
        return WidgetData(
            nextAlarm: future.first,
            upcomingAlarms: future,
            currentTime: data.currentTime,
            currentDate: data.currentDate,
            currentTimezone: data.currentTimezone,
            currentLocationName: data.currentLocationName,
            theme: data.theme,
            locations: data.locations
        )
    }

    // The app stores the payload as a JSON string, so read it as a string
    // (UserDefaults.data(forKey:) returns nil for a string value).
    private func loadData() -> WidgetData? {
        if let sharedDefaults = UserDefaults(suiteName: "group.com.kaibrabo.moondial"),
           let jsonString = sharedDefaults.string(forKey: "widgetData"),
           let data = jsonString.data(using: .utf8),
           let widgetData = try? JSONDecoder().decode(WidgetData.self, from: data) {
            return widgetData
        }
        return nil
    }

    private func loadEntry() -> MoondialEntry {
        MoondialEntry(date: Date(), data: Provider.futureOnly(loadData(), after: Date()))
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
    var date: String = ""
    var dateSize: CGFloat = 12
    var dateOnRight: Bool = false
    var alignment: HorizontalAlignment = .leading

    private var timeText: some View {
        Text(Date(), style: .time)
            .font(.system(size: timeSize, weight: .regular, design: .rounded))
            .foregroundColor(.primary)
            .lineLimit(1)
            .minimumScaleFactor(0.6)
    }

    private var dateText: some View {
        Text(date)
            .font(.system(size: dateSize))
            .foregroundColor(.secondary)
            .lineLimit(1)
            .minimumScaleFactor(0.7)
    }

    var body: some View {
        VStack(alignment: alignment, spacing: 2) {
            if dateOnRight && !date.isEmpty {
                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    timeText
                    dateText
                        .padding(.leading, 8)
                }
            } else {
                timeText
                if !date.isEmpty { dateText }
            }
            HStack(spacing: 4) {
                Image(systemName: "location.fill")
                    .font(.system(size: max(10, timeSize * 0.26)))
                    .foregroundColor(.moondialAccent)
                Text(locationName)
                    .font(.system(size: max(13, timeSize * 0.34)))
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
                // Line 1: "XX:XX in (countdown)"
                HStack(alignment: .firstTextBaseline, spacing: 5) {
                    Text(alarm.time)
                        .font(.system(size: timeSize, weight: .light, design: .rounded))
                        .foregroundColor(.primary)
                    Text("in")
                        .font(.caption)
                        .foregroundColor(.moondialAccent)
                    Text(alarm.fireDate, style: .timer)
                        .font(.caption.monospacedDigit())
                        .fontWeight(.semibold)
                        .foregroundColor(.moondialAccent)
                }
                .lineLimit(1)
                .minimumScaleFactor(0.6)
                // Line 2: the label, on its own line for more space.
                if !alarm.label.isEmpty {
                    Text(alarm.label)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                        .truncationMode(.tail)
                }
            } else {
                Text("No upcoming alarms")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
    }
}

/// One column in the horizontal upcoming-alarm queue: time / label / countdown.
private struct NextQueueItem: View {
    var alarm: AlarmData
    var timeSize: CGFloat

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(alarm.time)
                    .font(.system(size: timeSize, weight: .semibold, design: .rounded))
                    .foregroundColor(.primary)
                if let code = alarm.code, !code.isEmpty {
                    Text("(\(code))")
                        .font(.system(size: timeSize))
                        .foregroundColor(.secondary)
                }
            }
            .lineLimit(1)
            HStack(spacing: 3) {
                Text("in")
                    .font(.system(size: timeSize))
                    .foregroundColor(.moondialAccent)
                Text(alarm.fireDate, style: .timer)
                    .font(.system(size: timeSize).monospacedDigit())
                    .foregroundColor(.moondialAccent)
            }
            .lineLimit(1)
            if !alarm.label.isEmpty {
                Text(alarm.label)
                    .font(.system(size: timeSize))
                    .foregroundColor(.secondary)
                    .lineLimit(1)
                    .truncationMode(.tail)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// The upcoming-alarm queue (up to `count`), laid out horizontally.
private struct NextQueue: View {
    var alarms: [AlarmData]
    var count: Int = 3
    var timeSize: CGFloat = 20

    var body: some View {
        let active = alarms.filter { $0.enabled }
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 4) {
                Image(systemName: "alarm.fill")
                    .font(.system(size: 10))
                    .foregroundColor(.moondialAccent)
                Text("NEXT")
                    .font(.system(size: 10))
                    .fontWeight(.bold)
                    .foregroundColor(.secondary)
            }
            if active.isEmpty {
                Text("No upcoming alarms")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            } else {
                HStack(alignment: .top, spacing: 10) {
                    ForEach(Array(active.prefix(count).enumerated()), id: \.offset) { _, alarm in
                        NextQueueItem(alarm: alarm, timeSize: timeSize)
                    }
                }
            }
        }
    }
}

/// A world-clock row for the saved locations.
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

/// The "SAVED" world-clock list, shared by the medium and large widgets.
private struct SavedSection: View {
    var locations: [LocationData]
    var limit: Int
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("SAVED")
                .font(.system(size: 10))
                .fontWeight(.bold)
                .foregroundColor(.secondary)
            ForEach(Array(locations.prefix(limit)), id: \.timezone) { loc in
                ClockRow(location: loc)
            }
        }
    }
}

// MARK: - Sizes

struct SmallWidgetView: View {
    let entry: MoondialEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            CurrentHeader(locationName: currentLocationName(entry.data), timeSize: 38, date: entry.data?.currentDate ?? "", dateSize: 14)
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
        let saved = savedLocations(entry.data)
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .top, spacing: 12) {
                CurrentHeader(locationName: currentLocationName(entry.data), timeSize: 36, date: entry.data?.currentDate ?? "", dateSize: 15, dateOnRight: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                if !saved.isEmpty {
                    SavedSection(locations: saved, limit: 2)
                        .frame(width: 108, alignment: .leading)
                }
            }
            Divider()
            NextQueue(alarms: entry.data?.upcomingAlarms ?? [], count: 3, timeSize: 14)
            Spacer(minLength: 0)
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
        VStack(alignment: .leading, spacing: 8) {
            Text("Moondial")
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(.secondary)
                .frame(maxWidth: .infinity, alignment: .center)

            CurrentHeader(locationName: currentLocationName(entry.data), timeSize: 52, date: entry.data?.currentDate ?? "", dateSize: 15, alignment: .center)
                .frame(maxWidth: .infinity, alignment: .center)

            NextQueue(alarms: entry.data?.upcomingAlarms ?? [], count: 3, timeSize: 13)
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.moondialAccent.opacity(0.10))
                .cornerRadius(12)

            if !savedLocations.isEmpty {
                SavedSection(locations: savedLocations, limit: 4)
                    .padding(.top, 6)
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
