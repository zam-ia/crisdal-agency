import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "../../../lib/admin-auth";
import {
  getSupabaseAdmin,
  getSupabaseUploadConfig,
  isSupabaseConfigured,
} from "../../../lib/supabase-admin";

export const runtime = "nodejs";

const BUCKET = "landing-media";
const MAXIMUM_SIZE = 500 * 1024 * 1024;
const allowedContentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "video/mp4",
  "video/webm",
  "text/vtt",
];

const uploadRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  contentType: z.enum(allowedContentTypes as [string, ...string[]]),
  size: z.number().int().positive().max(MAXIMUM_SIZE),
});

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase no está configurado" },
      { status: 503 },
    );
  }

  try {
    const input = uploadRequestSchema.parse(await request.json());
    const extension = input.fileName.split(".").pop()?.toLowerCase() || "bin";
    const safeBaseName = input.fileName
      .replace(/\.[^.]+$/, "")
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "archivo";
    const path = `media/${Date.now()}-${randomUUID()}-${safeBaseName}.${extension}`;
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);
    if (error) throw error;

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const uploadConfig = getSupabaseUploadConfig();

    return NextResponse.json({
      bucket: BUCKET,
      path,
      token: data.token,
      publicUrl: publicData.publicUrl,
      supabaseUrl: uploadConfig.url,
      publishableKey: uploadConfig.publishableKey,
      contentType: input.contentType,
    });
  } catch (error) {
    console.error("Error de carga en el panel", error);
    return NextResponse.json({ error: "No se pudo subir el archivo" }, { status: 400 });
  }
}
