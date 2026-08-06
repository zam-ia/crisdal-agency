import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CartaLista 24h | Crisdal Agency",
  description:
    "Carta digital con QR y pedidos por WhatsApp para restaurantes de Huancayo. Lista en 24 horas.",
};

const whatsappUrl =
  "https://wa.me/551987088359?text=Hola%20Crisdal%2C%20quiero%20mi%20CartaLista%2024h.%20Mi%20negocio%20es%3A%20";

const Arrow = () => <span aria-hidden="true">↗</span>;

function Qr({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "fake-qr compact" : "fake-qr"} aria-hidden="true">
      {Array.from({ length: 9 }).map((_, index) => <i key={index} />)}
    </div>
  );
}

function MiniMenu({ tone = "yellow" }: { tone?: "yellow" | "wine" | "teal" }) {
  return (
    <div className={`mini-menu ${tone}`}>
      <div className="mini-cover"><small>MENÚ DIGITAL</small><b>Hoy se come rico.</b></div>
      <div className="mini-tabs"><span>Más pedidos</span><span>Combos</span><span>Bebidas</span></div>
      <div className="mini-dish"><i /><div><b>1/4 Pollo a la brasa</b><span>Papas + ensalada + cremas</span><strong>S/ 18.90</strong></div></div>
      <div className="mini-dish"><i /><div><b>Mostrito especial</b><span>Pollo + chaufa + papas</span><strong>S/ 22.00</strong></div></div>
      <div className="mini-wa">Pedir por WhatsApp</div>
    </div>
  );
}

export default function Home() {
  return (
    <main>
      <div className="launch-strip">
        <span className="strip-pulse" />
        <span>PRECIO DE LANZAMIENTO EN HUANCAYO</span>
        <span className="strip-dot" />
        <span>SOLO 10 CARTAS DISPONIBLES</span>
      </div>

      <header className="site-header shell">
        <a className="brand" href="#inicio" aria-label="Crisdal Agency, inicio">
          <img src="/brand/crisdal-imagotipo.png" alt="Crisdal Agency" />
          <span className="product-lockup"><b>CartaLista</b><small>24H</small></span>
        </a>
        <nav aria-label="Navegación principal">
          <a href="#demo">Demostración</a>
          <a href="#ejemplos">Ejemplos</a>
          <a href="#planes">Planes</a>
        </nav>
        <a className="button button-small" href={whatsappUrl} target="_blank" rel="noreferrer">
          Quiero mi CartaLista <Arrow />
        </a>
      </header>

      <section className="hero" id="inicio">
        <div className="shell hero-content">
          <div className="hero-copy">
            <div className="eyebrow"><i /> Carta digital express para restaurantes</div>
            <h1>Tu carta vende.<br /><em>Aunque tú estés cocinando.</em></h1>
            <p>Menú digital con QR y pedidos directos a WhatsApp. Profesional, fácil de compartir y listo en 24 horas.</p>
            <div className="hero-actions">
              <a className="button button-primary" href={whatsappUrl} target="_blank" rel="noreferrer">Quiero mi CartaLista <Arrow /></a>
              <a className="text-link" href="#demo">Ver demostración ↓</a>
            </div>
            <div className="proof-row" aria-label="Beneficios principales">
              <span>✓ Sin mensualidad obligatoria</span>
              <span>✓ QR listo para imprimir</span>
              <span>✓ Primera actualización incluida</span>
            </div>
          </div>

          <div className="hero-product" aria-label="Vista del producto CartaLista">
            <div className="hero-product-back" />
            <div className="hero-phone"><MiniMenu /></div>
            <div className="hero-qr"><Qr compact /><div><b>Tu QR</b><span>Listo para mesa o caja</span></div></div>
            <div className="order-toast"><i>✓</i><div><b>Nuevo pedido recibido</b><span>WhatsApp · ahora</span></div></div>
            <div className="print-card"><small>ESCANEA Y PIDE</small><Qr compact /></div>
            <div className="price-stamp" aria-label="Precio desde 59 soles"><small>DESDE</small><strong>S/ 59</strong><span>PAGO ÚNICO</span></div>
          </div>
        </div>
      </section>

      <section className="problem-section section shell">
        <div className="section-heading compact-heading">
          <div><div className="section-kicker">ANTES VS. CARTALISTA</div><h2>Menos preguntas repetidas.<br />Más facilidad para pedir.</h2></div>
          <p>El cambio no es solo visual: tu cliente encuentra precios, elige y llega a WhatsApp sin pedirte la carta otra vez.</p>
        </div>
        <div className="compare-grid">
          <article className="compare-card before-card">
            <div className="compare-label">ANTES</div>
            <div className="messy-gallery"><i /><i /><i /></div>
            <div className="message-stack"><span>¿Cuánto cuesta?</span><span>¿Qué incluye?</span><span>¿Tienen delivery?</span></div>
            <img src="/brand/avatar-preocupado.jpg" alt="Avatar Crisdal preocupado" />
            <p>Fotos sueltas, precios desactualizados y conversaciones repetidas.</p>
          </article>
          <article className="compare-card after-card">
            <div className="compare-label">CON CARTALISTA</div>
            <div className="compare-product"><MiniMenu tone="wine" /></div>
            <div className="compare-qr"><Qr compact /></div>
            <img src="/brand/avatar-seguro.jpg" alt="Avatar Crisdal seguro" />
            <p>Un enlace ordenado, QR visible y botón de pedido en un solo lugar.</p>
          </article>
        </div>
      </section>

      <section className="demo-section section" id="demo">
        <div className="shell demo-layout">
          <div className="demo-copy">
            <div className="section-kicker light">ASÍ LO VERÁ TU CLIENTE</div>
            <h2>Se siente como tu negocio. No como una plantilla.</h2>
            <p>Diseñamos la carta con tus colores, tus fotos y tu manera de vender. Cada plato puede llevar al cliente directo a WhatsApp con el pedido prellenado.</p>
            <ul className="feature-list">
              <li><span>01</span> Navegación pensada para celular</li>
              <li><span>02</span> Categorías, fotos y precios fáciles de leer</li>
              <li><span>03</span> Pedido por WhatsApp en un toque</li>
            </ul>
            <small className="honesty-note">* Concepto demostrativo creado para mostrar el formato del servicio.</small>
          </div>
          <div className="phone-stage" aria-label="Vista previa de carta digital">
            <div className="phone-glow" />
            <div className="phone-secondary"><MiniMenu tone="wine" /></div>
            <div className="phone"><MiniMenu /></div>
            <div className="qr-float"><Qr /><div><b>ESCANEA</b><span>y abre la carta</span></div></div>
            <div className="demo-toast"><i>✓</i><span>Pedido enviado a WhatsApp</span></div>
          </div>
        </div>
      </section>

      <section className="examples-section section" id="ejemplos">
        <div className="shell">
          <div className="section-heading">
            <div><div className="section-kicker">CONCEPTOS DEMOSTRATIVOS</div><h2>Mira cómo podría verse tu carta.</h2></div>
            <p>Tres estilos para mostrar que el sistema se adapta al negocio, no al revés. Los reemplazaremos por casos reales a medida que lleguen.</p>
          </div>
          <div className="examples-grid">
            <article className="example-card yellow"><div className="example-screen"><MiniMenu /></div><div><span>POLLERÍA</span><h3>Sazón Wanka</h3><p>Directa, sabrosa y enfocada en combos.</p></div><Qr compact /></article>
            <article className="example-card wine"><div className="example-screen"><MiniMenu tone="wine" /></div><div><span>CAFETERÍA</span><h3>Miga & Café</h3><p>Cálida, visual y pensada para antojos.</p></div><Qr compact /></article>
            <article className="example-card teal"><div className="example-screen"><MiniMenu tone="teal" /></div><div><span>COMIDA REGIONAL</span><h3>Sabores del Valle</h3><p>Ordenada por categorías y platos del día.</p></div><Qr compact /></article>
          </div>
        </div>
      </section>

      <section className="process-section section shell" id="proceso">
        <div className="section-heading"><div><div className="section-kicker">DE CERO A PUBLICADO</div><h2>Listo en tres pasos.</h2></div><p>No necesitas saber de diseño ni tecnología. Nos envías la información y te guiamos.</p></div>
        <div className="steps">
          <article><span>01</span><h3>Envías</h3><p>Fotos, precios, logo y WhatsApp. Puede ser en imágenes, Word o incluso escrito a mano.</p></article>
          <article><span>02</span><h3>Diseñamos</h3><p>Ordenamos la información, creamos el estilo y te enviamos una vista previa.</p></article>
          <article><span>03</span><h3>Publicas y recibes pedidos</h3><p>Recibes enlace, QR y piezas listas para redes, mesas y caja.</p></article>
        </div>
      </section>

      <section className="plans-section section" id="planes">
        <div className="shell">
          <div className="section-heading centered"><div><div className="section-kicker">PRECIO CLARO. ENTREGA RÁPIDA.</div><h2>Elige el plan según el tamaño de tu carta.</h2><p className="plans-subtitle">Todos incluyen enlace, QR y acceso directo a WhatsApp.</p></div></div>
          <div className="plans creation-plans">
            <article className="plan-card">
              <div className="plan-top"><span>EXPRESS</span><b>S/ 59</b><small>Pago único</small></div>
              <p>Para negocios con una carta pequeña.</p>
              <ul><li>Hasta 15 productos</li><li>Carta digital + enlace</li><li>QR listo para imprimir</li><li>Botón de WhatsApp</li><li>Una ronda de cambios</li></ul>
              <a className="button button-dark" href={whatsappUrl} target="_blank" rel="noreferrer">Elegir Express <Arrow /></a>
            </article>
            <article className="plan-card featured">
              <div className="popular">MÁS ELEGIDO</div>
              <div className="plan-top"><span>IMPULSO</span><b>S/ 99</b><small>Pago único</small></div>
              <p>La propuesta completa para lanzar tu carta y moverla en redes.</p>
              <ul><li>Hasta 30 productos</li><li>Todo lo del plan Express</li><li>Tres piezas para redes</li><li>Hoja QR para mesa o caja</li><li>Dos rondas de cambios</li></ul>
              <a className="button button-primary" href={whatsappUrl} target="_blank" rel="noreferrer">Elegir Impulso <Arrow /></a>
            </article>
          </div>
          <article className="maintenance-card">
            <div><span>COMPLEMENTO OPCIONAL</span><h3>Mantenimiento</h3><p>Añádelo después de recibir tu carta. Cambiamos precios, stock y promociones sin que tengas que rehacerla.</p></div>
            <ul><li>2 actualizaciones al mes</li><li>2 stories promocionales</li><li>Soporte por WhatsApp</li></ul>
            <div className="maintenance-price"><b>S/ 29</b><small>al mes · cancela cuando quieras</small><a className="text-link dark-link" href={whatsappUrl} target="_blank" rel="noreferrer">Consultar mantenimiento <Arrow /></a></div>
          </article>
        </div>
      </section>

      <section className="faq-section section shell">
        <div className="faq-intro"><div className="section-kicker">SIN LETRA PEQUEÑA</div><h2>Preguntas antes de empezar.</h2><img src="/brand/avatar-pensando.jpg" alt="Avatar Crisdal pensando" /></div>
        <div className="faqs">
          <details open><summary>¿Necesito tener fotos profesionales?</summary><p>No. Podemos trabajar con fotos de tu celular si tienen buena luz. También te damos una guía rápida para fotografiar tus platos.</p></details>
          <details><summary>¿Tengo que pagar todos los meses?</summary><p>No. Express e Impulso son pagos únicos. El mantenimiento mensual es opcional.</p></details>
          <details><summary>¿Qué pasa si cambio un precio?</summary><p>Tu primera actualización está incluida. Después puedes pedir cambios puntuales o elegir mantenimiento.</p></details>
          <details><summary>¿Realmente estará en 24 horas?</summary><p>El plazo corre desde que recibimos toda tu información y el adelanto. Pedidos de más de 30 productos se cotizan aparte.</p></details>
          <details><summary>¿La carta funciona en cualquier celular?</summary><p>Sí. Se abre desde un enlace en el navegador, sin instalar aplicaciones.</p></details>
          <details><summary>¿Puedo usarla en Instagram y Facebook?</summary><p>Sí. El mismo enlace puede compartirse en redes, WhatsApp y código QR.</p></details>
        </div>
      </section>

      <section className="closing-section">
        <div className="shell closing-layout">
          <img className="closing-avatar" src="/brand/avatar-celebrando.jpg" alt="Avatar Crisdal celebrando" />
          <div><div className="section-kicker light">TU PRÓXIMO PEDIDO PUEDE EMPEZAR CON UN QR</div><h2>Tu carta lista.<br /><em>Tus clientes más cerca de pedir.</em></h2></div>
          <div className="closing-action"><p>Cuéntanos qué vendes y te recomendamos el plan adecuado.</p><a className="button button-primary" href={whatsappUrl} target="_blank" rel="noreferrer">Quiero mi CartaLista <Arrow /></a><small>Respuesta directa · Sin compromiso</small></div>
        </div>
      </section>

      <footer className="site-footer shell">
        <div className="footer-brand"><img src="/brand/crisdal-imagotipo.png" alt="Crisdal Agency" /><span>CartaLista 24h</span></div>
        <p>Transformamos ideas en resultados.</p>
        <div><span>Huancayo, Perú</span><span>© 2026 Crisdal Agency</span></div>
      </footer>

      <a className="floating-wa" href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="Cotizar CartaLista por WhatsApp"><span>●</span><b>Cotizar por WhatsApp</b></a>
    </main>
  );
}
