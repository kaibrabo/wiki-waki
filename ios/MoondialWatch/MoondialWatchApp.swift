import SwiftUI

@main
struct MoondialWatchApp: App {
    @StateObject private var store = WatchStore()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            ContentView(store: store)
        }
        .onChange(of: scenePhase) { _, phase in
            // Pick up any context delivered while we were suspended/backgrounded.
            if phase == .active { store.refreshFromContext() }
        }
    }
}

// MARK: - Theme (mirrors the Tamagui app palette / the home-screen widget)

extension Color {
    static let moondialAccent = Color(red: 0.231, green: 0.510, blue: 0.965) // #3B82F6
    static let moondialDarkBG = Color(red: 0.059, green: 0.090, blue: 0.165) // #0F172A
    static let moondialLightBG = Color(red: 0.96, green: 0.96, blue: 0.97)

    // Explicit text colors per theme. watchOS is dark-first and keeps `.primary`/
    // `.secondary` light even under `preferredColorScheme(.light)`, so on the light
    // theme the text washed out — we set the colors directly instead.
    static func moondialPrimaryText(_ isDark: Bool) -> Color {
        isDark ? .white : Color(red: 0.09, green: 0.11, blue: 0.16) // near-black slate
    }
    static func moondialSecondaryText(_ isDark: Bool) -> Color {
        isDark ? Color(white: 0.72) : Color(white: 0.38)
    }
}

/// "America/Los_Angeles" -> "Los Angeles".
private func cityName(from timezone: String) -> String {
    guard let last = timezone.split(separator: "/").last else { return timezone }
    return last.replacingOccurrences(of: "_", with: " ")
}

// MARK: - Content
//
// Mirrors the small home-screen widget: live current-location clock on top, then
// the date and location, a divider, and the next alarm with a live countdown.

struct ContentView: View {
    @ObservedObject var store: WatchStore

    private var data: WatchPayload? { store.payload }
    private var isDark: Bool { data?.theme != "light" }

    private var locationName: String {
        if let name = data?.currentLocationName, !name.isEmpty { return name }
        return cityName(from: data?.currentTimezone ?? TimeZone.current.identifier)
    }

    private var labels: (next: String, noAlarms: String) {
        ( (data?.strings?.next ?? "Next").uppercased(),
          data?.strings?.noAlarms ?? "No upcoming alarms" )
    }

    var body: some View {
        ZStack {
            (isDark ? Color.moondialDarkBG : Color.moondialLightBG)
                .ignoresSafeArea()
            VStack(alignment: .leading, spacing: 6) {
                CurrentHeader(
                    locationName: locationName,
                    date: data?.currentDate ?? "",
                    use24Hour: data?.use24Hour ?? false,
                    isDark: isDark
                )
                Divider()
                NextAlarm(
                    alarm: data?.nextAlarm,
                    isDark: isDark,
                    nextLabel: labels.next,
                    noAlarmsLabel: labels.noAlarms
                )
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .padding(.leading, 16)
            .padding(.trailing, 4)
        }
        .preferredColorScheme(isDark ? .dark : .light)
    }
}

/// Current location: live time on top, then date and the location name.
private struct CurrentHeader: View {
    var locationName: String
    var date: String
    var use24Hour: Bool
    var isDark: Bool

    // Force the live clock's 12/24h formatting from the app setting rather than
    // the device locale, while keeping the auto-updating .time style.
    private var clockLocale: Locale {
        var comps = Locale.Components(locale: .current)
        comps.hourCycle = use24Hour ? .zeroToTwentyThree : .oneToTwelve
        return Locale(components: comps)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(Date(), style: .time)
                .font(.system(size: 34, weight: .regular, design: .rounded))
                .foregroundColor(.moondialPrimaryText(isDark))
                .lineLimit(1)
                .minimumScaleFactor(0.6)
                .environment(\.locale, clockLocale)
            if !date.isEmpty {
                Text(date)
                    .font(.system(size: 13))
                    .foregroundColor(.moondialSecondaryText(isDark))
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
            HStack(spacing: 4) {
                Image(systemName: "location.fill")
                    .font(.system(size: 10))
                    .foregroundColor(.moondialAccent)
                Text(locationName)
                    .font(.system(size: 13))
                    .fontWeight(.semibold)
                    .foregroundColor(.moondialSecondaryText(isDark))
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
        }
    }
}

/// The "Next" alarm — label, clock time and a live countdown, like the home card.
private struct NextAlarm: View {
    var alarm: WatchAlarmData?
    var isDark: Bool
    var nextLabel: String
    var noAlarmsLabel: String

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack(spacing: 4) {
                Image(systemName: "alarm.fill")
                    .font(.system(size: 10))
                    .foregroundColor(.moondialAccent)
                Text(nextLabel)
                    .font(.system(size: 10))
                    .fontWeight(.bold)
                    .foregroundColor(.moondialSecondaryText(isDark))
            }
            if let alarm = alarm, alarm.enabled {
                HStack(alignment: .firstTextBaseline, spacing: 5) {
                    Text(alarm.time)
                        .font(.system(size: 20, weight: .light, design: .rounded))
                        .foregroundColor(.moondialPrimaryText(isDark))
                    Text("in")
                        .font(.caption2)
                        .foregroundColor(.moondialAccent)
                    Text(alarm.fireDate, style: .timer)
                        .font(.caption2.monospacedDigit())
                        .fontWeight(.semibold)
                        .foregroundColor(.moondialAccent)
                }
                .lineLimit(1)
                .minimumScaleFactor(0.6)
                if !alarm.label.isEmpty {
                    Text(alarm.label)
                        .font(.caption2)
                        .foregroundColor(.moondialSecondaryText(isDark))
                        .lineLimit(1)
                        .truncationMode(.tail)
                }
            } else {
                Text(noAlarmsLabel)
                    .font(.footnote)
                    .foregroundColor(.moondialSecondaryText(isDark))
            }
        }
    }
}
