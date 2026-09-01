import WidgetKit
import SwiftUI

// Watch-face complications for Moondial. They live ON Apple's watch faces (the
// only supported way to put app content on a face) and show the next alarm with a
// live countdown. Data comes from the watch's App Group container, which the watch
// app fills from the phone over WatchConnectivity — so the complications track the
// iPhone app just like the watch app does.

// MARK: - Shared payload (subset of what the phone sends; extra keys are ignored)

struct CompAlarm: Codable {
    let label: String
    let time: String
    let code: String?
    let fireEpoch: Double
    let enabled: Bool

    var fireDate: Date { Date(timeIntervalSince1970: fireEpoch) }
}

struct CompPayload: Codable {
    let nextAlarm: CompAlarm?
    let upcomingAlarms: [CompAlarm]?
    let currentLocationName: String?
}

private let appGroup = "group.com.kaibrabo.moondial"
private let dataKey = "widgetData"

private func loadPayload() -> CompPayload? {
    guard let defaults = UserDefaults(suiteName: appGroup),
          let json = defaults.string(forKey: dataKey),
          let data = json.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(CompPayload.self, from: data)
}

// MARK: - Timeline

struct CompEntry: TimelineEntry {
    let date: Date
    let alarm: CompAlarm?
    let locationName: String?
}

struct CompProvider: TimelineProvider {
    private static let sample = CompEntry(
        date: Date(),
        alarm: CompAlarm(label: "Start work", time: "9:00 AM", code: "SFO",
                         fireEpoch: Date().addingTimeInterval(3 * 3600 + 12 * 60).timeIntervalSince1970,
                         enabled: true),
        locationName: "San Francisco"
    )

    func placeholder(in context: Context) -> CompEntry { CompProvider.sample }

    func getSnapshot(in context: Context, completion: @escaping (CompEntry) -> Void) {
        completion(entry(at: Date()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<CompEntry>) -> Void) {
        let payload = loadPayload()
        let now = Date()
        let fires = (payload?.upcomingAlarms ?? [])
            .filter { $0.enabled && $0.fireDate > now }
            .sorted { $0.fireDate < $1.fireDate }

        // One entry now, then one just after each alarm fires so the displayed
        // alarm rolls forward to the next one (and the countdown never runs up).
        var dates = [now]
        dates.append(contentsOf: fires.map { $0.fireDate.addingTimeInterval(1) })

        let entries = dates.map { d -> CompEntry in
            let next = (payload?.upcomingAlarms ?? [])
                .filter { $0.enabled && $0.fireDate > d }
                .sorted { $0.fireDate < $1.fireDate }
                .first ?? (fires.isEmpty ? payload?.nextAlarm : nil)
            return CompEntry(date: d, alarm: next, locationName: payload?.currentLocationName)
        }

        let reloadAt = max((fires.last?.fireDate ?? now).addingTimeInterval(60),
                           now.addingTimeInterval(15 * 60))
        completion(Timeline(entries: entries, policy: .after(reloadAt)))
    }

    private func entry(at date: Date) -> CompEntry {
        let payload = loadPayload()
        let next = (payload?.upcomingAlarms ?? [])
            .filter { $0.enabled && $0.fireDate > date }
            .sorted { $0.fireDate < $1.fireDate }
            .first ?? payload?.nextAlarm
        return CompEntry(date: date, alarm: next, locationName: payload?.currentLocationName)
    }
}

// MARK: - Views

/// Rectangular: the richest — "NEXT", the time + live countdown, then the label.
struct RectangularView: View {
    let entry: CompEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 1) {
            Label("NEXT", systemImage: "alarm.fill")
                .font(.caption2)
                .foregroundStyle(.secondary)
            if let alarm = entry.alarm {
                HStack(spacing: 4) {
                    Text(alarm.time)
                        .font(.headline)
                    Text(alarm.fireDate, style: .timer)
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(.secondary)
                }
                .widgetAccentable()
                if !alarm.label.isEmpty {
                    Text(alarm.label)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            } else {
                Text("No alarms").font(.caption).foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .containerBackground(for: .widget) { Color.clear }
    }
}

/// Circular: alarm glyph + a short countdown to the next alarm.
struct CircularView: View {
    let entry: CompEntry

    var body: some View {
        ZStack {
            if let alarm = entry.alarm {
                VStack(spacing: 0) {
                    Image(systemName: "alarm.fill")
                        .font(.system(size: 11))
                    Text(alarm.fireDate, style: .timer)
                        .font(.system(size: 11).monospacedDigit())
                        .minimumScaleFactor(0.5)
                        .lineLimit(1)
                }
                .widgetAccentable()
            } else {
                Image(systemName: "alarm").font(.title3)
            }
        }
        .containerBackground(for: .widget) { Color.clear }
    }
}

/// Inline: a single line that sits next to the time on the face.
struct InlineView: View {
    let entry: CompEntry

    var body: some View {
        if let alarm = entry.alarm {
            // e.g. "⏰ 9:00 AM in 1:03:12"
            Label {
                Text("\(alarm.time) in \(alarm.fireDate, style: .timer)")
            } icon: {
                Image(systemName: "alarm.fill")
            }
        } else {
            Label("No alarms", systemImage: "alarm")
        }
    }
}

struct MoondialComplicationEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: CompEntry

    var body: some View {
        switch family {
        case .accessoryRectangular: RectangularView(entry: entry)
        case .accessoryCircular: CircularView(entry: entry)
        case .accessoryInline: InlineView(entry: entry)
        default: RectangularView(entry: entry)
        }
    }
}

// MARK: - Widget

struct MoondialComplication: Widget {
    let kind = "MoondialComplication"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: CompProvider()) { entry in
            MoondialComplicationEntryView(entry: entry)
        }
        .configurationDisplayName("Next Alarm")
        .description("Your next Waimea alarm with a live countdown.")
        .supportedFamilies([.accessoryRectangular, .accessoryCircular, .accessoryInline])
    }
}

@main
struct MoondialComplicationBundle: WidgetBundle {
    var body: some Widget {
        MoondialComplication()
    }
}
