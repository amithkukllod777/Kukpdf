import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

/** Opens the native camera on Android (falls back to a file picker in a plain browser). */
export async function captureFromCamera(): Promise<string | null> {
  try {
    const photo = await Camera.getPhoto({
      quality: 88,
      width: 2200,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      saveToGallery: false,
      correctOrientation: true,
    });
    return photo.dataUrl ?? null;
  } catch {
    return null; // user cancelled or permission denied
  }
}

/** Opens the native gallery picker, supports multi-select where the platform allows it. */
export async function pickFromGallery(multiple = true): Promise<string[]> {
  try {
    if (multiple && (Camera as any).pickImages) {
      const result = await (Camera as any).pickImages({ quality: 88, limit: 20 });
      return (result.photos ?? []).map((p: any) => p.webPath ?? p.dataUrl).filter(Boolean);
    }
    const photo = await Camera.getPhoto({ quality: 88, width: 2200, resultType: CameraResultType.DataUrl, source: CameraSource.Photos });
    return photo.dataUrl ? [photo.dataUrl] : [];
  } catch {
    return [];
  }
}
