import ExpoModulesCore
import WidgetKit
import WatchConnectivity

// Bridges Moondial's JS layer to the iOS home-screen widget AND the watch app.
//
// This module compiles into the main app target, so it inherits the app's
// `group.com.kaibrabo.moondial` App Group entitlement. `setWidgetData` writes the
// JSON payload into the shared UserDefaults suite that the widget extension reads;
// `reloadAllTimelines` nudges WidgetKit to re-render immediately.
//
// App Groups do NOT reach the paired Apple Watch (it has its own sandbox), so the
// same payload is also pushed to the watch over WatchConnectivity via
// `WatchBridge.shared.send`, which keeps only the latest snapshot on the watch.
public class MoondialWidgetModule: Module {
  private static let appGroup = "group.com.kaibrabo.moondial"
  private static let widgetDataKey = "widgetData"

  public func definition() -> ModuleDefinition {
    Name("MoondialWidget")

    OnCreate {
      WatchBridge.shared.activate()
    }

    Function("setWidgetData") { (json: String) -> Void in
      let defaults = UserDefaults(suiteName: MoondialWidgetModule.appGroup)
      defaults?.set(json, forKey: MoondialWidgetModule.widgetDataKey)
      WatchBridge.shared.send(json)
    }

    Function("reloadAllTimelines") { () -> Void in
      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadAllTimelines()
      }
    }
  }
}

// Sends the latest widget payload to the paired Apple Watch. `updateApplicationContext`
// always overwrites with the most recent snapshot and is delivered opportunistically
// in the background — ideal for "current state" the watch face renders.
final class WatchBridge: NSObject, WCSessionDelegate {
  static let shared = WatchBridge()
  private static let widgetDataKey = "widgetData"

  private var lastJSON: String?

  func activate() {
    guard WCSession.isSupported() else { return }
    let session = WCSession.default
    session.delegate = self
    if session.activationState != .activated {
      session.activate()
    }
  }

  func send(_ json: String) {
    lastJSON = json
    let session = WCSession.default
    guard WCSession.isSupported(), session.activationState == .activated else { return }
    try? session.updateApplicationContext([WatchBridge.widgetDataKey: json])
  }

  // MARK: WCSessionDelegate

  func session(_ session: WCSession, activationDidCompleteWith state: WCSessionActivationState, error: Error?) {
    // Flush the last snapshot once the session finishes activating.
    if state == .activated, let json = lastJSON {
      try? session.updateApplicationContext([WatchBridge.widgetDataKey: json])
    }
  }

  func sessionDidBecomeInactive(_ session: WCSession) {}

  func sessionDidDeactivate(_ session: WCSession) {
    // Re-activate so a newly paired/switched watch keeps receiving updates.
    session.activate()
  }
}
