export interface DocumentScannerPlugin {
  /** Whether VisionKit document scanning is supported on this device
   *  (true on real iOS 13+ hardware; false on the simulator). */
  isAvailable(): Promise<{ available: boolean }>;
  /** Present the native VisionKit scanner. Resolves with the captured pages as
   *  `file://` URIs (empty array if the user cancelled). */
  scan(): Promise<{ scannedImages: string[] }>;
}

export declare const DocumentScanner: DocumentScannerPlugin;
