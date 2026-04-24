import { BRAND_CLOUDINARY_ROOT } from "@/constants/brand";

// ─── Cloudinary Image Optimization Helper ─────────────────────────────────────
//
// Transforms a Cloudinary URL to apply automatic format (WebP/AVIF),
// quality compression, and responsive resizing — without touching the
// upload preset or folder structure.
//
// Input:  https://res.cloudinary.com/dzbkeqaam/image/upload/v1773.../nexastore/la...
// Output: https://res.cloudinary.com/dzbkeqaam/image/upload/f_auto,q_auto,w_800/v1773.../nexastore/la...
//
// ─────────────────────────────────────────────────────────────────────────────

const CLOUDINARY_BASE = "https://res.cloudinary.com";

/**
 * Injects Cloudinary transformation parameters into an existing upload URL.
 * Safe to call with non-Cloudinary URLs — returns them unchanged.
 *
 * @param {string} src - Original image URL from Cloudinary or any other source
 * @param {object} opts
 * @param {number} [opts.width]      - Target width in pixels (e.g. 800)
 * @param {number} [opts.height]     - Target height in pixels
 * @param {"fill"|"crop"|"fit"|"scale"|"thumb"} [opts.crop] - Cloudinary crop mode
 * @param {number} [opts.quality]    - Quality 1-100, or omit for auto
 * @param {"auto"|"webp"|"avif"|"jpg"|"png"} [opts.format] - Image format
 * @returns {string} Optimized URL
 */
export function getCloudinaryUrl(src, opts = {}) {
  if (!src || typeof src !== "string") return src;
  if (!src.includes(CLOUDINARY_BASE)) return src;

  const {
    width,
    height,
    crop = "fill",
    quality = "auto",
    format = "auto",
  } = opts;

  // Build transformation string
  const parts = [];
  if (format) parts.push(`f_${format}`);
  if (quality) parts.push(`q_${quality}`);
  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);
  if (width || height) parts.push(`c_${crop}`);

  const transformation = parts.join(",");

  // Insert transformation after "/upload/" in the URL
  return src.replace("/image/upload/", `/image/upload/${transformation}/`);
}

/**
 * Generates a srcSet string for responsive images from a Cloudinary URL.
 * Uses WebP/AVIF via f_auto and multiple widths for srcSet.
 *
 * @param {string} src - Original Cloudinary URL
 * @param {number[]} widths - Array of widths e.g. [400, 800, 1200]
 * @param {object} [opts] - Additional transform options (crop, quality, etc.)
 * @returns {string} srcSet string
 */
export function getCloudinarySrcSet(src, widths = [400, 800, 1200], opts = {}) {
  if (!src || !src.includes(CLOUDINARY_BASE)) return "";
  return widths
    .map((w) => `${getCloudinaryUrl(src, { ...opts, width: w })} ${w}w`)
    .join(", ");
}

// ─── Upload utility ───────────────────────────────────────────────────────────

export async function uploadToCloudinary(file, options = {}) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary no esta configurado. Revisa el .env");
  }

  const { folder = BRAND_CLOUDINARY_ROOT, tags = [BRAND_CLOUDINARY_ROOT] } = options;
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  if (folder) {
    formData.append("folder", folder);
  }
  if (tags && tags.length) {
    formData.append("tags", tags.join(","));
  }

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload?.error?.message || "Error subiendo imagen a Cloudinary";
    throw new Error(message);
  }

  return response.json();
}
