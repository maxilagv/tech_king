import { BRAND_LOGO_URL } from "@/constants/brand";

export async function fetchImageDataUrl(url) {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function getImageTypeFromDataUrl(dataUrl) {
  const value = String(dataUrl || "").toLowerCase();
  if (value.includes("image/png")) return "PNG";
  if (value.includes("image/webp")) return "WEBP";
  return "JPEG";
}

let brandLogoCache;

export async function getBrandLogoDataUrl() {
  if (brandLogoCache !== undefined) return brandLogoCache;
  brandLogoCache = await fetchImageDataUrl(BRAND_LOGO_URL);
  return brandLogoCache;
}
