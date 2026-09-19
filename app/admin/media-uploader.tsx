"use client";

/* eslint-disable @next/next/no-img-element -- CMS previews use administrator-provided URLs. */
import { createClient } from "@supabase/supabase-js";
import { useId, useState } from "react";

export function MediaUploader({
  label,
  kind,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  kind: "image" | "video" | "caption";
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  async function selectFile(file: File | undefined) {
    if (!file) return;
    setMessage("");
    setProgress(1);
    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });
      const upload = (await response.json()) as {
        error?: string;
        bucket: string;
        path: string;
        token: string;
        publicUrl: string;
        supabaseUrl: string;
        publishableKey: string;
        contentType: string;
      };
      if (!response.ok) throw new Error(upload.error || "No se pudo autorizar la carga");

      setProgress(15);
      const supabase = createClient(upload.supabaseUrl, upload.publishableKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error } = await supabase.storage
        .from(upload.bucket)
        .uploadToSignedUrl(upload.path, upload.token, file, {
          cacheControl: "31536000",
          contentType: upload.contentType,
        });
      if (error) throw error;

      setProgress(100);
      onChange(upload.publicUrl);
      setMessage("Archivo subido. Guarda los cambios para publicarlo.");
    } catch {
      setMessage("No se pudo subir. Revisa el formato y la configuración de Supabase.");
    } finally {
      setProgress(0);
    }
  }

  return (
    <div className="media-field">
      <label htmlFor={id}>{label}</label>
      <div className="media-field-row">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={kind === "video" ? "https://youtube.com/..." : "https://..."}
        />
        <label className={`admin-upload-button${disabled ? " is-disabled" : ""}`}>
          Subir {kind === "video" ? "video" : kind === "caption" ? "VTT" : "imagen"}
          <input
            type="file"
            accept={
              kind === "video"
                ? "video/mp4,video/webm"
                : kind === "caption"
                  ? ".vtt,text/vtt"
                  : "image/jpeg,image/png,image/webp,image/avif"
            }
            onChange={(event) => void selectFile(event.target.files?.[0])}
            disabled={disabled}
          />
        </label>
      </div>
      {progress ? <progress max="100" value={progress}>{progress}%</progress> : null}
      {message ? <small className="admin-field-message">{message}</small> : null}
      {kind === "image" && value ? (
        <img className="admin-media-preview" src={value} alt="Vista previa" />
      ) : null}
    </div>
  );
}
