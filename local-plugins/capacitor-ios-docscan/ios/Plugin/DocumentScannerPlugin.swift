import Foundation
import Capacitor
import VisionKit
import UIKit

/**
 * VisionKit document scanner for KukPDF (iOS).
 *
 * Wraps Apple's `VNDocumentCameraViewController` — the exact scanner used by the
 * Notes and Files apps: live camera preview, automatic edge/boundary detection,
 * auto-capture, perspective correction and multi-page capture, all native. This
 * is the iOS counterpart of the Google ML Kit Document Scanner used on Android.
 *
 * Swift-only registration via CAPBridgedPlugin (no .m file needed on Capacitor 6+).
 */
@objc(DocumentScannerPlugin)
public class DocumentScannerPlugin: CAPPlugin, CAPBridgedPlugin, VNDocumentCameraViewControllerDelegate {
    public let identifier = "DocumentScannerPlugin"
    public let jsName = "DocumentScanner"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "scan", returnType: CAPPluginReturnPromise),
    ]

    private var pendingCall: CAPPluginCall?

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": VNDocumentCameraViewController.isSupported])
    }

    @objc func scan(_ call: CAPPluginCall) {
        guard VNDocumentCameraViewController.isSupported else {
            call.reject("Document scanning is not supported on this device.")
            return
        }
        // One scan at a time; a second call while one is open is rejected.
        if self.pendingCall != nil {
            call.reject("A scan is already in progress.")
            return
        }
        self.pendingCall = call
        DispatchQueue.main.async {
            let scannerVC = VNDocumentCameraViewController()
            scannerVC.delegate = self
            self.bridge?.viewController?.present(scannerVC, animated: true)
        }
    }

    public func documentCameraViewController(_ controller: VNDocumentCameraViewController,
                                             didFinishWith scan: VNDocumentCameraScan) {
        var images: [String] = []
        let fm = FileManager.default
        let dir = fm.temporaryDirectory
        for i in 0..<scan.pageCount {
            let image = scan.imageOfPage(at: i)
            if let data = image.jpegData(compressionQuality: 0.8) {
                let url = dir.appendingPathComponent("kukpdf-scan-\(UUID().uuidString).jpg")
                do {
                    try data.write(to: url)
                    images.append(url.absoluteString) // file:// URL — JS converts to a data URL
                } catch {
                    // Skip a page that fails to persist; the rest still return.
                }
            }
        }
        let call = self.pendingCall
        self.pendingCall = nil
        controller.dismiss(animated: true) {
            call?.resolve(["scannedImages": images])
        }
    }

    public func documentCameraViewControllerDidCancel(_ controller: VNDocumentCameraViewController) {
        let call = self.pendingCall
        self.pendingCall = nil
        controller.dismiss(animated: true) {
            call?.resolve(["scannedImages": []]) // user cancelled
        }
    }

    public func documentCameraViewController(_ controller: VNDocumentCameraViewController,
                                             didFailWithError error: Error) {
        let call = self.pendingCall
        self.pendingCall = nil
        controller.dismiss(animated: true) {
            call?.reject(error.localizedDescription)
        }
    }
}
