import ExpoModulesCore
import StoreKit

// StoreKit 2 bridge for KTMPO's Pro unlock. Everything runs on-device with no
// backend: purchases and entitlements are validated by StoreKit against the
// user's Apple ID, so a single Pro purchase automatically works on ALL of the
// user's devices (iPhone, iPad, Apple Watch) — Apple ties entitlements to the
// account, not the device.

enum IapError: Error, LocalizedError {
  case productNotFound
  var errorDescription: String? { "Product not found" }
}

public class MoondialIapModule: Module {
  private var updatesTask: Task<Void, Never>?

  public func definition() -> ModuleDefinition {
    Name("MoondialIap")

    // Fired when entitlements change out-of-band (renewals, Ask-to-Buy approval,
    // refunds/revocations). Payload: { productIds: [String] }.
    Events("onEntitlementsChange")

    OnCreate {
      self.updatesTask = Task.detached { [weak self] in
        for await update in Transaction.updates {
          if case .verified(let transaction) = update {
            await transaction.finish()
            await self?.emitEntitlements()
          }
        }
      }
    }

    OnDestroy {
      self.updatesTask?.cancel()
    }

    // Load product metadata for display (localized price, name, type).
    AsyncFunction("getProducts") { (ids: [String]) -> [[String: Any]] in
      let products = try await Product.products(for: ids)
      return products.map { product in
        let type: String
        switch product.type {
        case .autoRenewable: type = "subscription"
        case .nonConsumable: type = "lifetime"
        default: type = "other"
        }
        return [
          "id": product.id,
          "displayName": product.displayName,
          "description": product.description,
          "displayPrice": product.displayPrice,
          "price": (product.price as NSDecimalNumber).doubleValue,
          "type": type,
        ]
      }
    }

    // Buy a product. Returns "purchased" | "pending" | "cancelled" | "unverified".
    AsyncFunction("purchase") { (id: String) -> String in
      let products = try await Product.products(for: [id])
      guard let product = products.first else { throw IapError.productNotFound }
      let result = try await product.purchase()
      switch result {
      case .success(let verification):
        if case .verified(let transaction) = verification {
          await transaction.finish()
          await self.emitEntitlements()
          return "purchased"
        }
        return "unverified"
      case .pending:
        return "pending"
      case .userCancelled:
        return "cancelled"
      @unknown default:
        return "unknown"
      }
    }

    // Restore across devices: pull the latest from the App Store, then report
    // the entitlements. (Apple requires a working restore path.)
    AsyncFunction("restore") { () -> [String] in
      try? await AppStore.sync()
      return await MoondialIapModule.entitledProductIds()
    }

    // The product ids the user is currently entitled to (owned lifetime +
    // active subscriptions), with revoked/refunded ones excluded.
    AsyncFunction("currentEntitlements") { () -> [String] in
      return await MoondialIapModule.entitledProductIds()
    }
  }

  private func emitEntitlements() async {
    let ids = await MoondialIapModule.entitledProductIds()
    sendEvent("onEntitlementsChange", ["productIds": ids])
  }

  private static func entitledProductIds() async -> [String] {
    var ids: [String] = []
    for await result in Transaction.currentEntitlements {
      if case .verified(let transaction) = result, transaction.revocationDate == nil {
        ids.append(transaction.productID)
      }
    }
    return ids
  }
}
