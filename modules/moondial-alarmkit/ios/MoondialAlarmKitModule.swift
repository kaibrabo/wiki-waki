import ExpoModulesCore
import SwiftUI
#if canImport(AlarmKit)
import AlarmKit
#endif

// Empty metadata payload for our alarms. AlarmAttributes is generic over an
// AlarmMetadata type; we don't need extra data for the basic ring + Stop flow.
@available(iOS 26.0, *)
struct MoondialAlarmMetadata: AlarmMetadata {}

public class MoondialAlarmKitModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MoondialAlarmKit")

    AsyncFunction("isSupported") { () -> Bool in
      if #available(iOS 26.0, *) { return true }
      return false
    }

    AsyncFunction("requestAuthorization") { () async throws -> String in
      guard #available(iOS 26.0, *) else { return "unsupported" }
      let state = try await AlarmManager.shared.requestAuthorization()
      return MoondialAlarmKitModule.authString(state)
    }

    AsyncFunction("authorizationState") { () -> String in
      guard #available(iOS 26.0, *) else { return "unsupported" }
      return MoondialAlarmKitModule.authString(AlarmManager.shared.authorizationState)
    }

    AsyncFunction("scheduleFixed") { (idStr: String, epoch: Double, title: String, soundName: String?) async throws -> Void in
      guard #available(iOS 26.0, *) else {
        throw Exception(name: "Unsupported", description: "AlarmKit requires iOS 26+")
      }
      let id = UUID(uuidString: idStr) ?? UUID()
      let date = Date(timeIntervalSince1970: epoch)

      let stopButton = AlarmButton(
        text: "Stop",
        textColor: .white,
        systemImageName: "stop.fill"
      )
      let alert = AlarmPresentation.Alert(
        title: LocalizedStringResource(stringLiteral: title),
        stopButton: stopButton
      )
      let attributes = AlarmAttributes<MoondialAlarmMetadata>(
        presentation: AlarmPresentation(alert: alert),
        tintColor: Color.blue
      )

      let config = AlarmManager.AlarmConfiguration(
        schedule: .fixed(date),
        attributes: attributes,
        sound: soundName.map { .named($0) } ?? .default
      )
      _ = try await AlarmManager.shared.schedule(id: id, configuration: config)
    }

    AsyncFunction("cancel") { (idStr: String) async throws -> Void in
      guard #available(iOS 26.0, *) else { return }
      guard let id = UUID(uuidString: idStr) else { return }
      try AlarmManager.shared.cancel(id: id)
    }

    // Cancel every alarm this app has scheduled (used to reconcile before
    // re-scheduling the current set).
    AsyncFunction("cancelAll") { () async throws -> Void in
      guard #available(iOS 26.0, *) else { return }
      for alarm in try AlarmManager.shared.alarms {
        try? AlarmManager.shared.cancel(id: alarm.id)
      }
    }
  }

  @available(iOS 26.0, *)
  static func authString(_ state: AlarmManager.AuthorizationState) -> String {
    switch state {
    case .authorized: return "authorized"
    case .denied: return "denied"
    case .notDetermined: return "notDetermined"
    @unknown default: return "notDetermined"
    }
  }
}
