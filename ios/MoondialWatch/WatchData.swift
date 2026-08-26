import Foundation
import WatchConnectivity
import WidgetKit

// MARK: - Shared payload
//
// These Codable structs mirror the WidgetData interface in src/lib/widget.ts and
// the widget's structs in MoondialWidgetExtension/MoondialWidget.swift. The phone
// sends this same JSON to the watch over WatchConnectivity (App Groups do NOT
// cross the phone/watch boundary, so we can't just read the shared UserDefaults).

struct WatchAlarmData: Codable {
    let label: String
    let time: String
    let locationName: String
    let code: String?
    let timezone: String
    let fireEpoch: Double
    let enabled: Bool

    var fireDate: Date { Date(timeIntervalSince1970: fireEpoch) }
}

struct WatchLocationData: Codable {
    let name: String
    let timezone: String
    let currentTime: String
}

struct WatchStrings: Codable {
    let next: String
    let saved: String
    let noAlarms: String
}

struct WatchPayload: Codable {
    let nextAlarm: WatchAlarmData?
    let upcomingAlarms: [WatchAlarmData]?
    let currentTime: String
    let use24Hour: Bool?
    let currentDate: String?
    let currentTimezone: String
    let currentLocationName: String?
    let theme: String?
    let strings: WatchStrings?
    let locations: [WatchLocationData]
}

// MARK: - Store
//
// Activates a WCSession, keeps the latest payload the phone sent, and persists it
// to the watch's own UserDefaults so the screen survives a relaunch offline. The
// phone pushes via `updateApplicationContext`, which always delivers just the most
// recent snapshot — exactly the "current state" the watch face wants.

final class WatchStore: NSObject, ObservableObject, WCSessionDelegate {
    @Published var payload: WatchPayload?

    static let key = "widgetData"
    // Shared with the complication extension via the watch's App Group container,
    // so the same snapshot the app receives drives the watch-face complications.
    static let appGroup = "group.com.kaibrabo.moondial"

    private var defaults: UserDefaults {
        UserDefaults(suiteName: WatchStore.appGroup) ?? .standard
    }

    override init() {
        super.init()
        payload = decode(defaults.string(forKey: WatchStore.key))
        if WCSession.isSupported() {
            let session = WCSession.default
            session.delegate = self
            session.activate()
        }
    }

    private func decode(_ json: String?) -> WatchPayload? {
        guard let json, let data = json.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(WatchPayload.self, from: data)
    }

    private func ingest(_ context: [String: Any]) {
        guard let json = context[WatchStore.key] as? String else { return }
        defaults.set(json, forKey: WatchStore.key)
        let decoded = decode(json)
        DispatchQueue.main.async { self.payload = decoded }
        // Refresh the watch-face complications with the new snapshot.
        WidgetCenter.shared.reloadAllTimelines()
    }

    /// Pull the latest stored application context. `didReceiveApplicationContext`
    /// only fires for contexts that arrive while the app is active; one delivered
    /// while the app was suspended/backgrounded (common on watchOS, incl. the
    /// suspended launch the simulator does) just populates `receivedApplicationContext`
    /// silently. Call this whenever the scene becomes active so those are picked up.
    func refreshFromContext() {
        guard WCSession.isSupported() else { return }
        let context = WCSession.default.receivedApplicationContext
        if !context.isEmpty { ingest(context) }
    }

    // MARK: WCSessionDelegate

    func session(_ session: WCSession, activationDidCompleteWith state: WCSessionActivationState, error: Error?) {
        // On activation, pick up the last snapshot the phone already delivered.
        if !session.receivedApplicationContext.isEmpty {
            ingest(session.receivedApplicationContext)
        }
    }

    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        ingest(applicationContext)
    }

    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any]) {
        ingest(userInfo)
    }

    // iOS-only WCSessionDelegate requirements. They don't exist on watchOS, but
    // defining them keeps the type conforming if the target is ever compiled for
    // iOS (e.g. a build that forces -sdk iphoneos across every target).
    #if os(iOS)
    func sessionDidBecomeInactive(_ session: WCSession) {}
    func sessionDidDeactivate(_ session: WCSession) { session.activate() }
    #endif
}
