"use client";

import { useState } from "react";
import type { SiteContent } from "../lib/site-content";
import { saveContentAction } from "./actions";
import { MediaUploader } from "./media-uploader";

type Path = Array<string | number>;

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "tel";
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="admin-field admin-field-wide">
      <span>{label}</span>
      <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ListEditor({
  label,
  value,
  onChange,
  help,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  help?: string;
}) {
  return (
    <label className="admin-field admin-field-wide">
      <span>{label}</span>
      <textarea
        rows={Math.max(4, value.length + 1)}
        value={value.join("\n")}
        onChange={(event) =>
          onChange(event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))
        }
      />
      <small>{help || "Escribe un elemento por línea."}</small>
    </label>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <details className="admin-section">
      <summary>
        <span>{title}</span>
        <small>{description}</small>
      </summary>
      <div className="admin-section-body">{children}</div>
    </details>
  );
}

export function AdminForm({
  initialContent,
  cmsConfigured,
}: {
  initialContent: SiteContent;
  cmsConfigured: boolean;
}) {
  const [content, setContent] = useState(initialContent);

  function update(path: Path, value: unknown) {
    setContent((current) => {
      const next = structuredClone(current) as unknown as Record<string | number, unknown>;
      let cursor = next;
      for (let index = 0; index < path.length - 1; index += 1) {
        cursor = cursor[path[index]] as Record<string | number, unknown>;
      }
      cursor[path[path.length - 1]] = value;
      return next as unknown as SiteContent;
    });
  }

  function updateStep(
    section: "paradigm" | "mechanism" | "process",
    index: number,
    key: "title" | "text",
    value: string,
  ) {
    update([section, "steps", index, key], value);
  }

  return (
    <form action={saveContentAction} className="admin-editor">
      <input type="hidden" name="content" value={JSON.stringify(content)} />

      <Section title="Marca y contacto" description="Logo, teléfono y mensaje del header">
        <div className="admin-grid">
          <MediaUploader
            label="Logo"
            kind="image"
            value={content.brand.logoUrl}
            onChange={(value) => update(["brand", "logoUrl"], value)}
            disabled={!cmsConfigured}
          />
          <Field
            label="Número de WhatsApp con código de país"
            value={content.brand.whatsappNumber}
            onChange={(value) => update(["brand", "whatsappNumber"], value.replace(/\D/g, ""))}
            type="tel"
          />
          <Field
            label="Texto breve del header"
            value={content.brand.headerLabel}
            onChange={(value) => update(["brand", "headerLabel"], value)}
          />
        </div>
      </Section>

      <Section title="Hero" description="Primer mensaje y llamada a la acción">
        <div className="admin-grid">
          <Field label="Etiqueta" value={content.hero.eyebrow} onChange={(value) => update(["hero", "eyebrow"], value)} />
          <Field label="Título" value={content.hero.title} onChange={(value) => update(["hero", "title"], value)} />
          <Field label="Frase destacada" value={content.hero.accent} onChange={(value) => update(["hero", "accent"], value)} />
          <TextArea label="Descripción" value={content.hero.description} onChange={(value) => update(["hero", "description"], value)} />
          <Field label="Texto del botón" value={content.hero.cta} onChange={(value) => update(["hero", "cta"], value)} />
          <TextArea label="Microcopy" value={content.hero.microcopy} onChange={(value) => update(["hero", "microcopy"], value)} rows={2} />
          <TextArea label="Prueba o promesa operativa" value={content.hero.proof} onChange={(value) => update(["hero", "proof"], value)} rows={2} />
        </div>
      </Section>

      <Section title="VSL" description="Video, portada y texto de presentación">
        <div className="admin-grid">
          <Field label="Etiqueta" value={content.vsl.eyebrow} onChange={(value) => update(["vsl", "eyebrow"], value)} />
          <Field label="Título" value={content.vsl.title} onChange={(value) => update(["vsl", "title"], value)} />
          <TextArea label="Descripción" value={content.vsl.description} onChange={(value) => update(["vsl", "description"], value)} />
          <MediaUploader label="URL de YouTube o video" kind="video" value={content.vsl.url} onChange={(value) => update(["vsl", "url"], value)} disabled={!cmsConfigured} />
          <MediaUploader label="Portada del video" kind="image" value={content.vsl.posterUrl} onChange={(value) => update(["vsl", "posterUrl"], value)} disabled={!cmsConfigured} />
          <Field label="Texto alternativo de la portada" value={content.vsl.posterAlt} onChange={(value) => update(["vsl", "posterAlt"], value)} />
          <MediaUploader label="Subtítulos en formato VTT" kind="caption" value={content.vsl.captionsUrl} onChange={(value) => update(["vsl", "captionsUrl"], value)} disabled={!cmsConfigured} />
        </div>
      </Section>

      <Section title="Dolor específico" description="Problema y síntomas que reconoce el visitante">
        <div className="admin-grid">
          <Field label="Etiqueta" value={content.pain.eyebrow} onChange={(value) => update(["pain", "eyebrow"], value)} />
          <Field label="Título" value={content.pain.title} onChange={(value) => update(["pain", "title"], value)} />
          <TextArea label="Introducción" value={content.pain.intro} onChange={(value) => update(["pain", "intro"], value)} />
          <ListEditor label="Síntomas" value={content.pain.symptoms} onChange={(value) => update(["pain", "symptoms"], value)} />
          <TextArea label="Cierre" value={content.pain.closing} onChange={(value) => update(["pain", "closing"], value)} />
        </div>
      </Section>

      <Section title="Ruta Crisdal" description="El mecanismo que conecta mensaje, contenido, Meta Ads y WhatsApp">
        <div className="admin-grid">
          <Field label="Etiqueta" value={content.paradigm.eyebrow} onChange={(value) => update(["paradigm", "eyebrow"], value)} />
          <Field label="Título" value={content.paradigm.title} onChange={(value) => update(["paradigm", "title"], value)} />
          <TextArea label="Descripción" value={content.paradigm.description} onChange={(value) => update(["paradigm", "description"], value)} />
        </div>
        <div className="admin-repeaters">
          {content.paradigm.steps.map((step, index) => (
            <div className="admin-repeater" key={`${step.title}-${index}`}>
              <Field label={`Paso ${index + 1}`} value={step.title} onChange={(value) => updateStep("paradigm", index, "title", value)} />
              <TextArea label="Explicación" value={step.text} onChange={(value) => updateStep("paradigm", index, "text", value)} rows={3} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Resultados y evidencia" description="Presentación visible mientras no existan casos autorizados">
        <div className="admin-grid">
          <Field label="Etiqueta" value={content.authority.eyebrow} onChange={(value) => update(["authority", "eyebrow"], value)} />
          <Field label="Título" value={content.authority.title} onChange={(value) => update(["authority", "title"], value)} />
          <TextArea label="Descripción" value={content.authority.description} onChange={(value) => update(["authority", "description"], value)} />
          <TextArea label="Nota verificable" value={content.authority.note} onChange={(value) => update(["authority", "note"], value)} rows={3} />
          <MediaUploader label="Foto de producción real" kind="image" value={content.authority.image.url} onChange={(value) => update(["authority", "image", "url"], value)} disabled={!cmsConfigured} />
          <Field label="Texto alternativo" value={content.authority.image.alt} onChange={(value) => update(["authority", "image", "alt"], value)} />
        </div>
      </Section>

      <Section title="Casos reales" description="Solo deben activarse con evidencia autorizada">
        <label className="admin-check">
          <input type="checkbox" checked={content.cases.enabled} onChange={(event) => update(["cases", "enabled"], event.target.checked)} />
          Mostrar casos en la landing
        </label>
        <div className="admin-grid">
          <Field label="Etiqueta" value={content.cases.eyebrow} onChange={(value) => update(["cases", "eyebrow"], value)} />
          <Field label="Título" value={content.cases.title} onChange={(value) => update(["cases", "title"], value)} />
          <TextArea label="Introducción" value={content.cases.intro} onChange={(value) => update(["cases", "intro"], value)} />
        </div>
        <div className="admin-repeaters">
          {content.cases.items.map((item, index) => (
            <div className="admin-repeater" key={`${item.title}-${index}`}>
              <Field label="Nombre del caso" value={item.title} onChange={(value) => update(["cases", "items", index, "title"], value)} />
              <TextArea label="Antes" value={item.before} onChange={(value) => update(["cases", "items", index, "before"], value)} />
              <TextArea label="Intervención" value={item.intervention} onChange={(value) => update(["cases", "items", index, "intervention"], value)} />
              <TextArea label="Resultado y periodo" value={item.result} onChange={(value) => update(["cases", "items", index, "result"], value)} />
              <TextArea label="Prueba o autorización" value={item.proof} onChange={(value) => update(["cases", "items", index, "proof"], value)} rows={2} />
              <button type="button" className="admin-remove" onClick={() => update(["cases", "items"], content.cases.items.filter((_, itemIndex) => itemIndex !== index))}>Eliminar caso</button>
            </div>
          ))}
        </div>
        <button type="button" className="admin-secondary" onClick={() => update(["cases", "items"], [...content.cases.items, { title: "Nuevo caso", before: "Situación inicial verificable", intervention: "Trabajo realizado", result: "Resultado con periodo exacto", proof: "Evidencia y autorización" }])}>Agregar caso</button>
      </Section>

      <Section title="Cómo funciona" description="Los cuatro pasos de trabajo visibles en la landing">
        <div className="admin-grid">
          <Field label="Etiqueta" value={content.mechanism.eyebrow} onChange={(value) => update(["mechanism", "eyebrow"], value)} />
          <Field label="Título" value={content.mechanism.title} onChange={(value) => update(["mechanism", "title"], value)} />
          <TextArea label="Descripción" value={content.mechanism.description} onChange={(value) => update(["mechanism", "description"], value)} />
        </div>
        <div className="admin-repeaters">
          {content.mechanism.steps.map((step, index) => (
            <div className="admin-repeater" key={`${step.title}-${index}`}>
              <Field label={`Paso ${index + 1}`} value={step.title} onChange={(value) => updateStep("mechanism", index, "title", value)} />
              <TextArea label="Explicación" value={step.text} onChange={(value) => updateStep("mechanism", index, "text", value)} rows={3} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Beneficios" description="Impactos que se presentan antes de los entregables">
        <div className="admin-grid">
          <Field label="Etiqueta" value={content.benefits.eyebrow} onChange={(value) => update(["benefits", "eyebrow"], value)} />
          <Field label="Título" value={content.benefits.title} onChange={(value) => update(["benefits", "title"], value)} />
          <ListEditor label="Beneficios" value={content.benefits.items} onChange={(value) => update(["benefits", "items"], value)} />
        </div>
      </Section>

      <Section title="Planes" description="Precios, alcances, CTA y mensajes de WhatsApp">
        <div className="admin-grid">
          <Field label="Etiqueta" value={content.plans.eyebrow} onChange={(value) => update(["plans", "eyebrow"], value)} />
          <Field label="Título" value={content.plans.title} onChange={(value) => update(["plans", "title"], value)} />
          <TextArea label="Introducción" value={content.plans.intro} onChange={(value) => update(["plans", "intro"], value)} />
        </div>
        <div className="admin-repeaters admin-plan-editors">
          {content.plans.items.map((plan, index) => (
            <div className="admin-repeater" key={plan.slug}>
              <h3>{plan.name}</h3>
              <Field label="Nombre" value={plan.name} onChange={(value) => update(["plans", "items", index, "name"], value)} />
              <Field label="Precio" value={plan.price} onChange={(value) => update(["plans", "items", index, "price"], value)} />
              <Field label="Periodo" value={plan.period} onChange={(value) => update(["plans", "items", index, "period"], value)} />
              <TextArea label="Para quién es" value={plan.audience} onChange={(value) => update(["plans", "items", index, "audience"], value)} />
              <TextArea label="Descripción del plan" value={plan.description} onChange={(value) => update(["plans", "items", index, "description"], value)} />
              <ListEditor label="Incluye" value={plan.features} onChange={(value) => update(["plans", "items", index, "features"], value)} />
              <label className="admin-check"><input type="checkbox" checked={plan.highlighted} onChange={(event) => update(["plans", "items", index, "highlighted"], event.target.checked)} />Dar énfasis visual</label>
              <Field label="Etiqueta de énfasis" value={plan.badge} onChange={(value) => update(["plans", "items", index, "badge"], value)} />
              <Field label="Aclaración de pauta" value={plan.disclaimer} onChange={(value) => update(["plans", "items", index, "disclaimer"], value)} />
              <Field label="Texto del botón" value={plan.cta} onChange={(value) => update(["plans", "items", index, "cta"], value)} />
              <TextArea label="Mensaje de WhatsApp" value={plan.whatsappMessage} onChange={(value) => update(["plans", "items", index, "whatsappMessage"], value)} rows={3} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Preguntas frecuentes" description="Objeciones, condiciones y respuestas">
        <div className="admin-grid">
          <Field label="Etiqueta" value={content.faq.eyebrow} onChange={(value) => update(["faq", "eyebrow"], value)} />
          <Field label="Título" value={content.faq.title} onChange={(value) => update(["faq", "title"], value)} />
          <TextArea label="Introducción" value={content.faq.intro} onChange={(value) => update(["faq", "intro"], value)} />
        </div>
        <div className="admin-repeaters">
          {content.faq.items.map((item, index) => (
            <div className="admin-repeater" key={`${item.question}-${index}`}>
              <Field label="Pregunta" value={item.question} onChange={(value) => update(["faq", "items", index, "question"], value)} />
              <TextArea label="Respuesta" value={item.answer} onChange={(value) => update(["faq", "items", index, "answer"], value)} rows={4} />
              <button type="button" className="admin-remove" onClick={() => update(["faq", "items"], content.faq.items.filter((_, itemIndex) => itemIndex !== index))}>Eliminar pregunta</button>
            </div>
          ))}
        </div>
        <button type="button" className="admin-secondary" onClick={() => update(["faq", "items"], [...content.faq.items, { question: "Nueva pregunta", answer: "Respuesta clara y verificable." }])}>Agregar pregunta</button>
      </Section>

      <Section title="Cierre y pie de página" description="CTA final, mensajes legales y privacidad">
        <div className="admin-grid">
          <Field label="Etiqueta final" value={content.finalCta.eyebrow} onChange={(value) => update(["finalCta", "eyebrow"], value)} />
          <Field label="Título final" value={content.finalCta.title} onChange={(value) => update(["finalCta", "title"], value)} />
          <TextArea label="Descripción final" value={content.finalCta.description} onChange={(value) => update(["finalCta", "description"], value)} />
          <Field label="Texto del CTA final" value={content.finalCta.cta} onChange={(value) => update(["finalCta", "cta"], value)} />
          <TextArea label="Mensaje de WhatsApp final" value={content.finalCta.whatsappMessage} onChange={(value) => update(["finalCta", "whatsappMessage"], value)} />
          <Field label="Frase del footer" value={content.footer.tagline} onChange={(value) => update(["footer", "tagline"], value)} />
          <Field label="Texto legal" value={content.footer.legal} onChange={(value) => update(["footer", "legal"], value)} />
          <TextArea label="Privacidad y medición" value={content.footer.privacy} onChange={(value) => update(["footer", "privacy"], value)} rows={6} />
        </div>
      </Section>

      <Section title="SEO y compartir" description="Título, descripción e imagen de Open Graph">
        <div className="admin-grid">
          <Field label="Título SEO" value={content.seo.title} onChange={(value) => update(["seo", "title"], value)} />
          <TextArea label="Meta descripción" value={content.seo.description} onChange={(value) => update(["seo", "description"], value)} rows={3} />
          <MediaUploader label="Imagen para compartir" kind="image" value={content.seo.ogImageUrl} onChange={(value) => update(["seo", "ogImageUrl"], value)} disabled={!cmsConfigured} />
        </div>
      </Section>

      <div className="admin-save-bar">
        <div>
          <strong>{cmsConfigured ? "Listo para publicar" : "Falta configurar Supabase"}</strong>
          <span>{cmsConfigured ? "Los cambios se verán al guardar." : "Configura las claves privadas de Supabase para habilitar guardado y cargas."}</span>
        </div>
        <button type="submit" disabled={!cmsConfigured}>Guardar y publicar</button>
      </div>
    </form>
  );
}
