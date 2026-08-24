import SwiftUI

@main
struct MoondialWatchApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

struct ContentView: View {
    @State private var locations: [WatchLocation] = []
    @State private var nextAlarm: WatchAlarm?
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 12) {
                    if let alarm = nextAlarm {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("NEXT")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                            
                            Text(alarm.time)
                                .font(.system(size: 28, weight: .light, design: .rounded))
                            
                            Text(alarm.label)
                                .font(.caption)
                                .foregroundColor(.blue)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(Color(.darkGray).opacity(0.3))
                        .cornerRadius(12)
                    }
                    
                    ForEach(locations, id: \.timezone) { location in
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(location.name)
                                    .font(.caption)
                                    .lineLimit(1)
                            }
                            Spacer()
                            Text(location.currentTime)
                                .font(.system(.body, design: .rounded))
                                .monospacedDigit()
                        }
                        .padding(.horizontal, 8)
                        .padding(.vertical, 6)
                    }
                }
                .padding(.horizontal)
            }
            .navigationTitle("Moondial")
            .navigationBarTitleDisplayMode(.inline)
        }
        .onAppear {
            loadData()
        }
    }
    
    private func loadData() {
        if let sharedDefaults = UserDefaults(suiteName: "group.com.kaibrabo.moondial"),
           let data = sharedDefaults.data(forKey: "widgetData"),
           let widgetData = try? JSONDecoder().decode(WatchWidgetData.self, from: data) {
            
            self.locations = widgetData.locations.map { loc in
                WatchLocation(name: loc.name, timezone: loc.timezone, currentTime: loc.currentTime)
            }
            
            if let alarm = widgetData.nextAlarm {
                self.nextAlarm = WatchAlarm(label: alarm.label, time: alarm.time, location: alarm.locationName)
            }
        } else {
            let formatter = DateFormatter()
            formatter.dateFormat = "h:mm a"
            
            self.locations = [
                WatchLocation(name: "Local", timezone: TimeZone.current.identifier, currentTime: formatter.string(from: Date()))
            ]
        }
    }
}

struct WatchLocation {
    let name: String
    let timezone: String
    let currentTime: String
}

struct WatchAlarm {
    let label: String
    let time: String
    let location: String
}

struct WatchWidgetData: Codable {
    let nextAlarm: WatchAlarmData?
    let currentTime: String
    let currentTimezone: String
    let locations: [WatchLocationData]
}

struct WatchAlarmData: Codable {
    let label: String
    let time: String
    let locationName: String
    let timezone: String
    let enabled: Bool
}

struct WatchLocationData: Codable {
    let name: String
    let timezone: String
    let currentTime: String
}
