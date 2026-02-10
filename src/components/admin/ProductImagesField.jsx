import React, { useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { uploadToCloudinary } from "@/utils/cloudinary";

export default function ProductImagesField({ images, onChange, folder = "techking/products" }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const result = await uploadToCloudinary(file, { folder, tags: [folder] });
      onChange([...(images || []), result.secure_url]);
    } catch (err) {
      setError(err.message || "No se pudo subir la imagen");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleRemove = (url) => {
    onChange((images || []).filter((img) => img !== url));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.25em] text-white/60">Imagenes</p>
        <label className="text-xs text-white/60 hover:text-white cursor-pointer flex items-center gap-2">
          <UploadCloud className="w-3 h-3" />
          {uploading ? "Subiendo..." : "Agregar imagen"}
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      {images?.length ? (
        <div className="grid grid-cols-3 gap-3">
          {images.map((img) => (
            <div key={img} className="relative rounded-xl overflow-hidden border border-white/10">
              <img src={img} alt="Producto" className="w-full h-24 object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(img)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-sm text-white/50">
          Todavia no hay imagenes cargadas.
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
