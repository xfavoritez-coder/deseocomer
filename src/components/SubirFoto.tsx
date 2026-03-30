"use client";
import { useState, useRef } from "react";

interface Props {
  onUpload: (url: string) => void;
  folder?: string;
  label?: string;
  preview?: string | null;
  circular?: boolean;
  height?: string;
}

export default function SubirFoto({ onUpload, folder = "general", label = "Subir foto", preview, circular = false, height = "120px" }: Props) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(preview || "");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);

    // Show preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setPreviewUrl(data.url);
        onUpload(data.url);
      }
    } catch {
      setPreviewUrl(preview || "");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />

      {previewUrl ? (
        <div style={{ position: "relative", display: "inline-block" }}>
          <img src={previewUrl} alt="" style={{
            width: circular ? "80px" : "100%", height: circular ? "80px" : height,
            objectFit: "cover", borderRadius: circular ? "50%" : "10px",
            border: "1px solid var(--border-color)", display: "block",
          }} />
          <button onClick={() => inputRef.current?.click()} disabled={uploading} style={{
            position: "absolute", bottom: circular ? "-4px" : "8px", right: circular ? "-4px" : "8px",
            background: "var(--accent)", border: "none", borderRadius: "50%",
            width: "28px", height: "28px", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: "0.7rem", color: "var(--bg-primary)",
          }}>
            {uploading ? "..." : "📷"}
          </button>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} disabled={uploading} style={{
          width: circular ? "80px" : "100%", height: circular ? "80px" : height,
          borderRadius: circular ? "50%" : "10px",
          background: "rgba(45,26,8,0.85)", border: "2px dashed rgba(232,168,76,0.3)",
          cursor: "pointer", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "6px",
          color: "var(--text-muted)", fontFamily: "var(--font-lato)", fontSize: "0.8rem",
        }}>
          {uploading ? "Subiendo..." : <><span style={{ fontSize: "1.2rem" }}>📷</span>{label}</>}
        </button>
      )}
    </div>
  );
}
