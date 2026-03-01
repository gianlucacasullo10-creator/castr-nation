//
//  PurchasesManager.swift
//  App
//
//  Created by Gianluca Casullo on 2026-02-28.
//

import Foundation
import RevenueCat
import RevenueCatUI

@MainActor
final class PurchasesManager: NSObject, ObservableObject {

    // MARK: - Published state
    @Published var customerInfo: CustomerInfo?
    @Published var offerings: Offerings?
    @Published var isPro: Bool = false
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?

    static let entitlementID = "pro"

    // MARK: - Init
    override init() {
        super.init()
        Purchases.shared.delegate = self
        Task {
            await refresh()
        }
    }

    // MARK: - Load state
    func refresh() async {
        do {
            async let info = Purchases.shared.customerInfo()
            async let fetchedOfferings = Purchases.shared.offerings()
            let (ci, off) = try await (info, fetchedOfferings)
            customerInfo = ci
            offerings = off
            isPro = ci.entitlements[Self.entitlementID]?.isActive == true
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Purchase a package
    func purchase(package: Package) async throws {
        isLoading = true
        defer { isLoading = false }
        let result = try await Purchases.shared.purchase(package: package)
        guard !result.userCancelled else { return }
        customerInfo = result.customerInfo
        isPro = result.customerInfo.entitlements[Self.entitlementID]?.isActive == true
    }

    // MARK: - Restore (App Store requirement)
    func restore() async throws {
        isLoading = true
        defer { isLoading = false }
        let ci = try await Purchases.shared.restorePurchases()
        customerInfo = ci
        isPro = ci.entitlements[Self.entitlementID]?.isActive == true
    }

    // MARK: - Sync with Supabase user ID
    /// Call this right after Supabase auth confirms a user session.
    func logIn(userId: String) async {
        do {
            let (ci, _) = try await Purchases.shared.logIn(userId)
            customerInfo = ci
            isPro = ci.entitlements[Self.entitlementID]?.isActive == true
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func logOut() async {
        do {
            customerInfo = try await Purchases.shared.logOut()
            isPro = false
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

// MARK: - Delegate (real-time updates — e.g. renewal fires in background)
extension PurchasesManager: PurchasesDelegate {
    func purchases(_ purchases: Purchases, receivedUpdated customerInfo: CustomerInfo) {
        self.customerInfo = customerInfo
        isPro = customerInfo.entitlements[Self.entitlementID]?.isActive == true
    }
}
