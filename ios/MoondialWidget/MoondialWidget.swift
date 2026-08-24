import WidgetKit
import SwiftUI

// MARK: - Shared Data

struct AlarmData: Codable {
    let label: String
    let time: String
    let locationName: String
    let timezone: String
    let enabled: Bool
}

struct WidgetData: Codable {
    let nextAlarm: AlarmData?
    let currentTime: String
    let currentTimezone: String
    let locations: [LocationData]
}

struct LocationData: Codable {
    let name: String
    let timezone: String
    let currentTime: String
}

// MARK: - Data Provider

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> MoondialEntry {
        MoondialEntry(
            date: Date(),
            nextAlarm: nil,
            locations: [
                LocationData(name: "San Francisco", timezone: "America/Los_Angeles", currentTime: "9:00 AM"),
                LocationData(name: "New York", timezone: "America/New_York", currentTime: "12:00 PM"),
                LocationData(name: "Tokyo", timezone: "Asia/Tokyo", currentTime: "2:00 AM")
            ]
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (MoondialEntry) -> Void) {
        let entry = loadEntry()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<MoondialEntry>) -> Void) {
        let entry = loadEntry()
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 1, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
    
    private func loadEntry() -> MoondialEntry {
        if let sharedDefaults = UserDefaults(suiteName: "group.com.kaibrabo.moondial"),
           let data = sharedDefaults.data(forKey: "widgetData"),
           let widgetData = try? JSONDecoder().decode(WidgetData.self, from: data) {
            return MoondialEntry(
                date: Date(),
                nextAlarm: widgetData.nextAlarm,
                locations: widgetData.locations
            )
        }
        
        return MoondialEntry(
            date: Date(),
            nextAlarm: nil,
            locations: generateCurrentTimes()
        )
    }
    
    private func generateCurrentTimes() -> [LocationData] {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        
        return [
            LocationData(name: "Local", timezone: TimeZone.current.identifier, currentTime: formatter.string(from: Date()))
        ]
    }
}

// MARK: - Entry

struct MoondialEntry: TimelineEntry {
    let date: Date
    let nextAlarm: AlarmData?
    let locations: [LocationData]
}

// MARK: - Small Widget View

struct SmallWidgetView: View {
    let entry: MoondialEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Image(systemName: "moon.fill")
                    .font(.caption)
                    .foregroundColor(.blue)
                Text("Moondial")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            if let alarm = entry.nextAlarm, alarm.enabled {
                Text(alarm.time)
                    .font(.system(size: 28, weight: .light, design: .rounded))
                    .foregroundColor(.primary)
                
                Text(alarm.label)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Text(alarm.locationName)
                    .font(.caption2)
                    .foregroundColor(.blue)
            } else if let firstLocation = entry.locations.first {
                Text(firstLocation.currentTime)
                    .font(.system(size: 28, weight: .light, design: .rounded))
                    .foregroundColor(.primary)
                
                Text(firstLocation.name)
                    .font(.caption)
                    .foregroundColor(.secondary)
            } else {
                Text("No alarms")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
        .padding()
        .containerBackground(.fill.tertiary, for: .widget)
    }
}

// MARK: - Medium Widget View

struct MediumWidgetView: View {
    let entry: MoondialEntry
    
    var body: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Image(systemName: "moon.fill")
                        .font(.caption)
                        .foregroundColor(.blue)
                    Text("Next Alarm")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                if let alarm = entry.nextAlarm, alarm.enabled {
                    Text(alarm.time)
                        .font(.system(size: 32, weight: .light, design: .rounded))
                        .foregroundColor(.primary)
                    
                    Text(alarm.label)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    Text(alarm.locationName)
                        .font(.caption)
                        .foregroundColor(.blue)
                } else {
                    Text("--:--")
                        .font(.system(size: 32, weight: .light, design: .rounded))
                        .foregroundColor(.secondary)
                    
                    Text("No upcoming alarms")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
            }
            
            Divider()
            
            VStack(alignment: .leading, spacing: 6) {
                Text("World Clocks")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.secondary)
                
                ForEach(entry.locations.prefix(3), id: \.timezone) { location in
                    HStack {
                        Text(location.name)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                        Spacer()
                        Text(location.currentTime)
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(.primary)
                    }
                }
                
                Spacer()
            }
        }
        .padding()
        .containerBackground(.fill.tertiary, for: .widget)
    }
}

// MARK: - Large Widget View

struct LargeWidgetView: View {
    let entry: MoondialEntry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "moon.fill")
                    .font(.title3)
                    .foregroundColor(.blue)
                Text("Moondial")
                    .font(.headline)
                    .fontWeight(.semibold)
                Spacer()
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text("NEXT ALARM")
                    .font(.caption2)
                    .fontWeight(.bold)
                    .foregroundColor(.secondary)
                
                if let alarm = entry.nextAlarm, alarm.enabled {
                    HStack(alignment: .firstTextBaseline) {
                        Text(alarm.time)
                            .font(.system(size: 42, weight: .light, design: .rounded))
                            .foregroundColor(.primary)
                        
                        Spacer()
                        
                        VStack(alignment: .trailing) {
                            Text(alarm.label)
                                .font(.subheadline)
                                .fontWeight(.medium)
                            Text(alarm.locationName)
                                .font(.caption)
                                .foregroundColor(.blue)
                        }
                    }
                } else {
                    Text("No upcoming alarms")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .padding(.vertical, 8)
                }
            }
            .padding()
            .background(Color(.systemBackground).opacity(0.5))
            .cornerRadius(12)
            
            Text("WORLD CLOCKS")
                .font(.caption2)
                .fontWeight(.bold)
                .foregroundColor(.secondary)
            
            ForEach(entry.locations.prefix(5), id: \.timezone) { location in
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(location.name)
                            .font(.subheadline)
                            .fontWeight(.medium)
                        Text(location.timezone.replacingOccurrences(of: "_", with: " "))
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                    Text(location.currentTime)
                        .font(.title3)
                        .fontWeight(.light)
                        .monospacedDigit()
                }
                .padding(.vertical, 2)
            }
            
            Spacer()
        }
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
        .description("View your next alarm and world clocks at a glance.")
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
