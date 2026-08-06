# CartaLista 24h — Crisdal Agency

Landing comercial lista para GitHub y Vercel.

## Datos confirmados

- WhatsApp: `+55 19 8708-8359`
- Enlace de contacto: `https://wa.me/551987088359`
- Oferta: carta digital con QR desde S/59
- Mercado inicial: restaurantes y pollerías de Huancayo

## Probar en una computadora

Instala Node.js 20.9 o superior y ejecuta:

```bash
npm install
npm run dev
```

Luego abre `http://localhost:3000`.

## Subir a GitHub desde la web

1. En GitHub pulsa **New repository**.
2. Nómbralo `cartalista-24h` y elige **Private** o **Public**.
3. Crea el repositorio sin README, licencia ni `.gitignore` adicionales.
4. Descomprime el ZIP de entrega en tu computadora.
5. En el repositorio vacío pulsa **uploading an existing file**.
6. Arrastra el contenido interno de la carpeta `CartaLista-24h-Vercel`.
7. Escribe `Primera versión CartaLista 24h` y pulsa **Commit changes**.

Si GitHub no permite arrastrar carpetas correctamente, usa GitHub Desktop o los comandos indicados más abajo.

## Publicar en Vercel desde GitHub

1. Entra a `https://vercel.com/new` e inicia sesión.
2. Conecta tu cuenta de GitHub cuando Vercel lo solicite.
3. Busca el repositorio `cartalista-24h` y pulsa **Import**.
4. Vercel debe detectar **Next.js** automáticamente.
5. Deja vacías las variables de entorno: esta versión no necesita ninguna.
6. Pulsa **Deploy**.
7. Al terminar, abre el dominio que Vercel entrega y prueba todos los botones de WhatsApp desde un celular.

Cada cambio posterior enviado a la rama principal de GitHub generará una nueva versión en Vercel.

## Subir a GitHub con GitHub Desktop

1. Descomprime el ZIP.
2. Abre GitHub Desktop y elige **Add an Existing Repository from your Hard Drive**.
3. Selecciona la carpeta `CartaLista-24h-Vercel`.
4. Si indica que aún no es un repositorio, acepta **create a repository**.
5. Pulsa **Publish repository**.

## Subir a GitHub con terminal

```bash
git init
git add .
git commit -m "Primera versión CartaLista 24h"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/cartalista-24h.git
git push -u origin main
```

## Archivos principales

- `app/page.tsx`: contenido y botones de WhatsApp.
- `app/globals.css`: diseño responsive.
- `app/layout.tsx`: SEO e imagen social.
- `public/brand/`: recursos de marca y fotografía.
- `public/og.png`: imagen al compartir el enlace.

## Mejoras recomendadas

1. Conectar un dominio propio.
2. Instalar Meta Pixel y medir los eventos `ViewContent` y `Contact`.
3. Reemplazar “Sazón Wanka”, marcado como demo ficticia, por el primer cliente real.
4. Incorporar testimonios únicamente cuando sean verificables.
