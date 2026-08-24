import ExpoModulesCore
import WidgetKit

// Bridges Moondial's JS layer to the iOS home-screen widget.
//
// This module compiles into the main app target, so it inherits the app's
// `group.com.kaibrabo.moondial` App Group entitlement. `setWidgetData` writes the
// JSON payload into the shared UserDefaults suite that the widget extension reads;
// `reloadAllTimelines` nudges WidgetKit to re-render immediately.
public class MoondialWidgetModule: Module {
  private static let appGroup = "group.com.kaibrabo.moondial"
  private static let widgetDataKey = "widgetData"

  public func definition() -> ModuleDefinition {
    Name("MoondialWidget")

    Function("setWidgetData") { (json: String) -> Void in
      let defaults = UserDefaults(suiteName: MoondialWidgetModule.appGroup)
      defaults?.set(json, forKey: MoondialWidgetModule.widgetDataKey)
    }

    Function("reloadAllTimelines") { () -> Void in
      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadAllTimelines()
      }
    }
  }
}
