"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearAdminSession,
  createAdminSession,
  isAdminAuthenticated,
  verifyAdminPassword,
} from "../lib/admin-auth";
import { saveSiteContent } from "../lib/site-content";

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") || "");
  if (!verifyAdminPassword(password)) {
    redirect("/admin/login?error=credenciales");
  }
  await createAdminSession();
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function saveContentAction(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const serialized = formData.get("content");
  if (typeof serialized !== "string" || serialized.length > 150_000) {
    redirect("/admin?error=contenido");
  }

  try {
    await saveSiteContent(JSON.parse(serialized));
  } catch (error) {
    console.error("No se pudo guardar el contenido", error);
    redirect("/admin?error=guardado");
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin?saved=1");
}
