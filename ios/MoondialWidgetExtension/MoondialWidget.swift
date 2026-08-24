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
    let locations: [LocationData]
}

// MARK: - Theme (mirrors the Tamagui app palette)

extension Color {
    /// App accent blue (#3B82F6).
    static let moondialAccent = Color(red: 0.231, green: 0.510, blue: 0.965)
    /// App brand slate (#0F172A) used for the splash/background.
    static let moondialBrand = Color(red: 0.059, green: 0.090, blue: 0.165)
}

/// "America/Los_Angeles" -> "Los Angeles".
private func cityName(from timezone: String) -> String {
    guard let last = timezone.split(separator: "/").last else { return timezone }
    return last.replacingOccurrences(of: "_", with: " ")
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
        if let sharedDefaults = UserDefaults(suiteName: "group.com.kaibrabo.moondial"),
           let data = sharedDefaults.data(forKey: "widgetData"),
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

/// Header row: moon glyph + a title/subtitle.
private struct BrandHeader: View {
    var title: String
    var body: some View {
        HStack(spacing: 5) {
            Image(systemName: "moon.stars.fill")
                .font(.caption2)
                .foregroundColor(.moondialAccent)
            Text(title)
                .font(.caption2)
                .fontWeight(.semibold)
                .foregroundColor(.secondary)
                .lineLimit(1)
        }
    }
}

/// Live clock for the device's current location (updates itself).
private struct CurrentClock: View {
    var timezone: String
    var size: CGFloat
    var showCity: Bool = true

    var body: some View {
        VStack(alignment: .leading, spacing: 1) {
            if showCity {
                HStack(spacing: 3) {
                    Image(systemName: "location.fill")
                        .font(.system(size: max(9, size * 0.22)))
                        .foregroundColor(.moondialAccent)
                    Text(cityName(from: timezone))
                        .font(.system(size: max(11, size * 0.28)))
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }
            Text(Date(), style: .time)
                .font(.system(size: size, weight: .thin, design: .rounded))
                .foregroundColor(.primary)
                .lineLimit(1)
                .minimumScaleFactor(0.6)
        }
    }
}

/// Next-alarm block: label, clock time + a live countdown. Falls back gracefully.
private struct NextAlarm: View {
    var alarm: AlarmData?
    var compact: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: compact ? 2 : 4) {
            HStack(spacing: 4) {
                Image(systemName: "alarm.fill")
                    .font(.system(size: 10))
                    .foregroundColor(.moondialAccent)
                Text("NEXT ALARM")
                    .font(.system(size: 10))
                    .fontWeight(.bold)
                    .foregroundColor(.secondary)
            }
            if let alarm = alarm, alarm.enabled {
                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Text(alarm.time)
                        .font(.system(size: compact ? 22 : 28, weight: .light, design: .rounded))
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
                HStack(spacing: 4) {
                    if !alarm.locationName.isEmpty {
                        Text(alarm.locationName)
                            .font(.caption2)
                            .foregroundColor(.moondialAccent)
                            .lineLimit(1)
                    }
                    Text(alarm.fireDate, style: .timer)
                        .font(.caption2.monospacedDigit())
                        .fontWeight(.semibold)
                        .foregroundColor(.secondary)
                }
            } else {
                Text("No upcoming alarms")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
    }
}

/// A world-clock row mirroring the home-screen location card.
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
    private var tz: String { entry.data?.currentTimezone ?? TimeZone.current.identifier }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            CurrentClock(timezone: tz, size: 30)
            Spacer(minLength: 4)
            Divider()
            NextAlarm(alarm: entry.data?.nextAlarm, compact: true)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding()
        .containerBackground(.fill.tertiary, for: .widget)
    }
}

struct MediumWidgetView: View {
    let entry: MoondialEntry
    private var tz: String { entry.data?.currentTimezone ?? TimeZone.current.identifier }

    var body: some View {
        HStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 8) {
                CurrentClock(timezone: tz, size: 30)
                Spacer(minLength: 2)
                NextAlarm(alarm: entry.data?.nextAlarm, compact: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Divider()

            VStack(alignment: .leading, spacing: 6) {
                BrandHeader(title: "World Clocks")
                ForEach(Array((entry.data?.locations ?? []).prefix(4)), id: \.timezone) { loc in
                    ClockRow(location: loc)
                }
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding()
        .containerBackground(.fill.tertiary, for: .widget)
    }
}

struct LargeWidgetView: View {
    let entry: MoondialEntry
    private var tz: String { entry.data?.currentTimezone ?? TimeZone.current.identifier }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                BrandHeader(title: "Moondial")
                Spacer()
            }

            CurrentClock(timezone: tz, size: 46)

            NextAlarm(alarm: entry.data?.nextAlarm)
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.moondialAccent.opacity(0.10))
                .cornerRadius(12)

            if let locations = entry.data?.locations, !locations.isEmpty {
                Text("WORLD CLOCKS")
                    .font(.system(size: 10))
                    .fontWeight(.bold)
                    .foregroundColor(.secondary)
                VStack(spacing: 8) {
                    ForEach(Array(locations.prefix(6)), id: \.timezone) { loc in
                        ClockRow(location: loc)
                    }
                }
            }

            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding()
        .containerBackground(.fill.tertiary, for: .widget)
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
        .description("Your current time and next alarm, with a live countdown.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

struct MoondialWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: MoondialEntry

    var body: some View {
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
