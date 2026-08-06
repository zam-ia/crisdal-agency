import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CartaLista 24h | Crisdal Agency",
  description:
    "Carta digital con QR y pedidos por WhatsApp para restaurantes de Huancayo. Lista en 24 horas.",
};

const whatsappUrl =
  "https://wa.me/551987088359?text=Hola%20Crisdal%2C%20quiero%20mi%20CartaLista%2024h.%20Mi%20negocio%20es%3A%20";

const Arrow = () => <span aria-hidden="true">↗</span>;

export default function Home() {
  return (
    <main>
      <div className="launch-strip">
        <span>LANZAMIENTO HUANCAYO</span>
        <span className="strip-dot" />
        <span>10 CUPOS DE PRODUCCIÓN</span>
      </div>

      <header className="site-header shell">
        <a className="brand" href="#inicio" aria-label="Crisdal Agency, inicio">
          <img src="/brand/crisdal-imagotipo.png" alt="Crisdal Agency" />
          <span className="product-lockup">
            <b>CartaLista</b>
            <small>24H</small>
          </span>
        </a>
        <nav aria-label="Navegación principal">
          <a href="#demo">Demo</a>
          <a href="#proceso">Cómo funciona</a>
          <a href="#planes">Planes</a>
        </nav>
        <a className="button button-small" href={whatsappUrl} target="_blank" rel="noreferrer">
          Cotizar por WhatsApp <Arrow />
        </a>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-photo" aria-hidden="true" />
        <div className="hero-vignette" aria-hidden="true" />
        <div className="shell hero-content">
          <div className="hero-copy">
            <div className="eyebrow"><i /> Carta digital express para restaurantes</div>
            <h1>Tu carta vende.<br /><em>Aunque tú estés cocinando.</em></h1>
            <p>
              Menú digital con QR y botón directo a WhatsApp. Se ve profesional,
              evita preguntas repetidas y queda listo en 24 horas.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href={whatsappUrl} target="_blank" rel="noreferrer">
                Quiero mi CartaLista <Arrow />
              </a>
              <a className="text-link" href="#demo">Ver demo realista ↓</a>
            </div>
            <div className="proof-row" aria-label="Beneficios principales">
              <span>✓ Sin mensualidad obligatoria</span>
              <span>✓ 1 actualización incluida</span>
              <span>✓ QR listo para imprimir</span>
            </div>
          </div>
          <div className="price-stamp" aria-label="Precio desde 59 soles">
            <small>DESDE</small><strong>S/59</strong><span>LANZAMIENTO</span>
          </div>
        </div>
      </section>

      <section className="problem-section section shell">
        <div className="section-kicker">EL PROBLEMA NO ES TU COMIDA</div>
        <div className="problem-grid">
          <div>
            <h2>Si respondes precios todo el día, tu carta todavía no trabaja por ti.</h2>
            <p className="lead">
              Centraliza platos, precios, horarios y pedidos en un enlace que tus clientes
              pueden abrir desde Instagram, Facebook o WhatsApp.
            </p>
          </div>
          <div className="problem-card">
            <img src="/brand/avatar-preocupado.jpg" alt="Avatar Crisdal preocupado" />
            <div>
              <b>ANTES</b>
              <p>Fotos sueltas, precios desactualizados y el mismo “¿cuánto cuesta?” cada hora.</p>
            </div>
          </div>
          <div className="problem-card after">
            <img src="/brand/avatar-seguro.jpg" alt="Avatar Crisdal seguro" />
            <div>
              <b>CON CARTALISTA</b>
              <p>Un QR, una carta clara y un botón de pedido listo para convertir.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="demo-section section" id="demo">
        <div className="shell demo-layout">
          <div className="demo-copy">
            <div className="section-kicker light">DEMO CONCEPTUAL · POLLERÍA</div>
            <h2>Se siente como tu negocio. No como una plantilla.</h2>
            <p>
              Diseñamos la carta con tus colores, tus fotos y tu manera de vender. Cada plato
              puede llevar al cliente directo a WhatsApp con el pedido prellenado.
            </p>
            <ul className="feature-list">
              <li><span>01</span> Navegación pensada para celular</li>
              <li><span>02</span> Fotos, precios y promociones fáciles de leer</li>
              <li><span>03</span> Pedido por WhatsApp en un toque</li>
            </ul>
            <small className="honesty-note">* Ejemplo ficticio creado para demostrar el formato del servicio.</small>
          </div>
          <div className="phone-stage" aria-label="Vista previa de carta digital">
            <div className="phone-glow" />
            <div className="phone">
              <div className="phone-top"><span /><i /></div>
              <div className="menu-hero">
                <div className="menu-nav"><b>SAZÓN WANKA</b><span>•••</span></div>
                <div className="menu-title"><small>POLLERÍA & SABOR LOCAL</small><strong>Hoy se come rico.</strong></div>
              </div>
              <div className="menu-body">
                <div className="category-row"><b>Los más pedidos</b><span>Ver todo</span></div>
                <article className="dish-card">
                  <div className="dish-photo dish-one" />
                  <div><b>1/4 Pollo a la brasa</b><p>Papas, ensalada y cremas.</p><strong>S/ 18.90</strong></div>
                  <button aria-label="Agregar un cuarto de pollo">+</button>
                </article>
                <article className="dish-card">
                  <div className="dish-photo dish-two" />
                  <div><b>Mostrito especial</b><p>Pollo, chaufa y papas.</p><strong>S/ 22.00</strong></div>
                  <button aria-label="Agregar mostrito">+</button>
                </article>
                <div className="wa-bar"><span>◉</span><b>Hacer pedido por WhatsApp</b></div>
              </div>
              <div className="phone-home" />
            </div>
            <div className="qr-float">
              <div className="fake-qr" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/><i/></div>
              <div><b>ESCANEA</b><span>Y mira la carta</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="process-section section shell" id="proceso">
        <div className="section-heading">
          <div><div className="section-kicker">DE CERO A VENDIENDO</div><h2>Listo en tres pasos.</h2></div>
          <p>No necesitas saber de diseño ni tecnología. Nos envías la información y te guiamos.</p>
        </div>
        <div className="steps">
          <article><span>01</span><h3>Envías tu carta</h3><p>Fotos, precios, logo y WhatsApp. Puede ser en fotos, Word o incluso escrito a mano.</p></article>
          <article><span>02</span><h3>Diseñamos</h3><p>Ordenamos la información, creamos el estilo y te enviamos una vista previa.</p></article>
          <article><span>03</span><h3>Escanean y piden</h3><p>Recibes el enlace, QR y piezas listas para compartir en tus redes y mesas.</p></article>
        </div>
      </section>

      <section className="plans-section section" id="planes">
        <div className="shell">
          <div className="section-heading centered">
            <div><div className="section-kicker">PRECIO CLARO. ENTREGA RÁPIDA.</div><h2>Elige cuánto quieres vender.</h2></div>
          </div>
          <div className="plans">
            <article className="plan-card">
              <div className="plan-top"><span>EXPRESS</span><b>S/59</b><small>pago único</small></div>
              <p>Para empezar profesional sin complicarte.</p>
              <ul><li>Hasta 15 productos</li><li>Link de carta digital</li><li>QR listo para imprimir</li><li>Botón de WhatsApp</li><li>1 ronda de cambios</li></ul>
              <a className="button button-dark" href={whatsappUrl} target="_blank" rel="noreferrer">Elegir Express <Arrow /></a>
            </article>
            <article className="plan-card featured">
              <div className="popular">RECOMENDADO</div>
              <div className="plan-top"><span>IMPULSO</span><b>S/99</b><small>pago único</small></div>
              <p>La oferta completa para lanzar y moverla en redes.</p>
              <ul><li>Hasta 30 productos</li><li>Todo lo del plan Express</li><li>3 posts de lanzamiento</li><li>Hoja QR para mesa/caja</li><li>2 rondas de cambios</li></ul>
              <a className="button button-primary" href={whatsappUrl} target="_blank" rel="noreferrer">Quiero Impulso <Arrow /></a>
            </article>
            <article className="plan-card">
              <div className="plan-top"><span>MANTENIMIENTO</span><b>S/29</b><small>al mes</small></div>
              <p>Para que tu carta siempre esté actualizada.</p>
              <ul><li>2 actualizaciones al mes</li><li>Cambios de precio y stock</li><li>2 stories promocionales</li><li>Soporte por WhatsApp</li><li>Cancela cuando quieras</li></ul>
              <a className="button button-dark" href={whatsappUrl} target="_blank" rel="noreferrer">Consultar plan <Arrow /></a>
            </article>
          </div>
        </div>
      </section>

      <section className="faq-section section shell">
        <div className="faq-intro">
          <div className="section-kicker">SIN LETRA PEQUEÑA</div>
          <h2>Preguntas antes de empezar.</h2>
          <img src="/brand/avatar-pensando.jpg" alt="Avatar Crisdal pensando" />
        </div>
        <div className="faqs">
          <details open><summary>¿Necesito tener fotos profesionales?</summary><p>No. Podemos trabajar con fotos de tu celular si tienen buena luz. También te damos una guía rápida para fotografiar tus platos.</p></details>
          <details><summary>¿Tengo que pagar todos los meses?</summary><p>No. Express e Impulso son pagos únicos. El mantenimiento mensual es opcional.</p></details>
          <details><summary>¿Qué pasa si cambio un precio?</summary><p>Tu primera actualización está incluida. Después puedes pedir cambios puntuales o elegir mantenimiento.</p></details>
          <details><summary>¿Realmente estará en 24 horas?</summary><p>El plazo corre desde que recibimos toda tu información y el adelanto. Pedidos de más de 30 productos se cotizan aparte.</p></details>
        </div>
      </section>

      <section className="closing-section">
        <div className="shell closing-layout">
          <img className="closing-avatar" src="/brand/avatar-celebrando.jpg" alt="Avatar Crisdal celebrando" />
          <div>
            <div className="section-kicker dark">TU PRÓXIMO PEDIDO PUEDE EMPEZAR CON UN QR</div>
            <h2>Tu carta lista.<br />Tu negocio más ligero.</h2>
          </div>
          <div className="closing-action">
            <p>Cuéntanos qué vendes y recibe una recomendación sin compromiso.</p>
            <a className="button button-dark" href={whatsappUrl} target="_blank" rel="noreferrer">Hablar con Crisdal <Arrow /></a>
          </div>
        </div>
      </section>

      <footer className="site-footer shell">
        <div className="footer-brand"><img src="/brand/crisdal-imagotipo.png" alt="Crisdal Agency" /><span>CartaLista 24h</span></div>
        <p>Transformamos ideas en resultados.</p>
        <div><span>Huancayo, Perú</span><span>© 2026 Crisdal Agency</span></div>
      </footer>

      <a className="floating-wa" href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="Escribir a Crisdal por WhatsApp">
        <span>◉</span><b>¿Te ayudamos?</b>
      </a>
    </main>
  );
}
