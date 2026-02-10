import React, { useMemo, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { uploadToCloudinary } from "@/utils/cloudinary";

export default function ImageUploadField({ label, value, onChange, folder = "techking" }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const preview = useMemo(() => value, [value]);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const result = await uploadToCloudinary(file, { folder, tags: [folder] });
      onChange(result.secure_url);
    } catch (err) {
      setError(err.message || "No se pudo subir la imagen");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.25em] text-white/60">{label}</p>
        {preview && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-white/50 hover:text-white flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Quitar
          </button>
        )}
      </div>

      <label className="group relative flex items-center justify-center h-40 rounded-2xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition cursor-pointer overflow-hidden">
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-white/60">
            <UploadCloud className="w-6 h-6 text-cyan-300" />
            <span className="text-xs uppercase tracking-[0.2em]">
              {uploading ? "Subiendo..." : "Subir imagen"}
            </span>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
