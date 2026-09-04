import Image from "next/image";
import { WhatsAppLink } from "./ui/whatsapp-link";
import { Icon } from "./ui/symbol";

const benefits = [
  {
    icon: "video",
    count: "01",
    title: "1 video publicitario",
    text: "Una pieza que presenta tu oferta y le da a tu cliente una razón para escribirte.",
  },
  {
    icon: "layers",
    count: "06",
    title: "6 flyers promocionales",
    text: "Tu promoción, clara y con una imagen consistente para destacar en redes.",
  },
  {
    icon: "chart",
    count: "01",
    title: "Monitoreo de 1 campaña",
    text: "Revisamos el desempeño para entender qué funciona y qué conviene ajustar.",
  },
  {
    icon: "headphones",
    count: "+",
    title: "Asesoramiento continuo",
    text: "Acompañamiento para resolver tus dudas durante la campaña acordada.",
  },
  {
    icon: "whatsapp",
    count: "↗",
    title: "Ruta directa a WhatsApp",
    text: "Del interés a la conversación: facilita que te consulten, coticen o hagan un pedido.",
  },
];
const faqs = [
  [
    "¿Los S/380 incluyen la inversión en anuncios?",
    "No. Los S/380 son el pago único por el servicio Impulso Local. La inversión publicitaria en Meta Ads se paga aparte. Antes de empezar, acordamos contigo el presupuesto de anuncios y el alcance de la campaña.",
  ],
  [
    "¿En cuánto tiempo podemos empezar y ver resultados?",
    "Primero revisamos tu negocio, tu oferta y el material disponible. Con eso acordamos la fecha de lanzamiento. Los resultados dependen de la oferta, el público, el presupuesto y la atención a los mensajes; no prometemos una cantidad fija de ventas.",
  ],
  [
    "¿Y si mi negocio todavía no tiene redes sociales?",
    "Puedes escribirnos igual. Revisamos qué tienes y te indicamos qué necesitas para empezar. Si hace falta crear o configurar cuentas, confirmamos contigo el alcance y cualquier costo adicional antes de contratar.",
  ],
  [
    "¿Cuánto dura el monitoreo y el asesoramiento?",
    "El plan incluye el monitoreo de una campaña y asesoramiento durante el periodo acordado. La duración, las fechas y los entregables se confirman por WhatsApp antes del pago.",
  ],
  [
    "¿Tengo que seguir pagando cada mes?",
    "Impulso Local es un pago único de S/380. Si después quieres otra campaña o más contenido, acordamos una nueva propuesta contigo. No hay una renovación mensual automática.",
  ],
];

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <header className="site-header shell">
        <div className="brand" aria-label="Crisdal Agency">
          <Image
            src="/brand/crisdal-imagotipo.png"
            width={54}
            height={62}
            alt=""
            className="brand-logo"
          />
          <span>
            CRISDAL<small>AGENCY</small>
          </span>
        </div>
        <span className="header-note">
          <span className="status-dot" /> Marketing para negocios locales
        </span>
        <WhatsAppLink placement="header" className="header-cta">
          Hablemos de tu negocio <Icon name="arrow" />
        </WhatsAppLink>
      </header>
      <main id="contenido">
        <section className="hero shell" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow">
              <span /> TU NEGOCIO, EN EL RADAR CORRECTO
            </div>
            <h1 id="hero-title">
              IMPULSO
              <br />
              <span>
                LOCAL<span className="title-dot">.</span>
              </span>
            </h1>
            <h2>
              Empieza con una oferta real.
              <br />
              <span>Y mide resultados.</span>
            </h2>
            <p className="hero-description">
              Convierte lo que vendes en una oferta que invite a escribirte.
              Contenido, campaña y acompañamiento para dar el siguiente paso.
            </p>
            <div className="hero-price">
              <span className="price">
                <small>S/</small>380
              </span>
              <div>
                <strong>Pago único</strong>
                <span>Inversión en Meta Ads aparte</span>
              </div>
            </div>
            <WhatsAppLink placement="hero" className="button button-gold">
              <Icon name="whatsapp" /> Escríbenos hoy <Icon name="arrow" />
            </WhatsAppLink>
            <p className="cta-note">
              <Icon name="check" /> Hablemos de tu negocio. Sin compromiso.
            </p>
          </div>
          <div className="hero-visual">
            <div className="portrait-frame">
              <div className="portrait-label">
                <span className="status-dot" /> ESTRATEGIA CON ROSTRO HUMANO
              </div>
              <Image
                className="advisor-image"
                src="/brand/asesora-impulso.webp"
                alt="Asesora de Crisdal Agency con el polo de la marca"
                fill
                sizes="(max-width: 760px) 92vw, 46vw"
                preload
              />
              <div className="portrait-bottom">
                <span>Tu negocio tiene potencial.</span>
                <strong>Hagamos que se vea.</strong>
              </div>
            </div>
            <div className="floating-tag">
              <span className="tag-icon">
                <Icon name="target" />
              </span>
              <div>
                <small>EL OBJETIVO</small>
                <strong>
                  De tu anuncio
                  <br />a su WhatsApp.
                </strong>
              </div>
              <Icon name="arrow" />
            </div>
            <span className="visual-index">CRISDAL / IMPULSO LOCAL — 01</span>
          </div>
        </section>
        <div className="trust-strip">
          <div className="shell trust-items">
            <span>
              <Icon name="check" /> Un solo pago por el servicio
            </span>
            <span>
              <Icon name="headphones" /> Trato directo, de persona a persona
            </span>
            <span>
              <Icon name="target" /> Una oferta. Un objetivo claro.
            </span>
          </div>
        </div>
        <section
          className="section problem shell"
          aria-labelledby="problem-title"
        >
          <div>
            <p className="eyebrow">PUBLICAR ES SOLO EL COMIENZO</p>
            <h2 id="problem-title">
              Que tu próxima promoción
              <br />
              tenga <em>un propósito.</em>
            </h2>
          </div>
          <div className="problem-copy">
            <p>
              ¿Publicas y no sabes si funciona? ¿Inviertes sin tener claro qué
              está pasando?
            </p>
            <p>
              Con <strong>Impulso Local</strong> conectamos una oferta concreta,
              contenido que la explica y una campaña que podemos medir. Para que
              tu siguiente decisión tenga una base.
            </p>
          </div>
        </section>
        <section
          className="offer-section section"
          aria-labelledby="offer-title"
        >
          <div className="shell offer-layout">
            <div className="offer-intro">
              <p className="eyebrow">MENOS VUELTAS. MÁS DIRECCIÓN.</p>
              <h2 id="offer-title">
                Todo conectado.
                <br />
                <em>Desde el inicio.</em>
              </h2>
              <p>
                Cinco piezas de un mismo plan: presentar tu oferta y abrir
                conversaciones con posibles clientes.
              </p>
              <div className="offer-price-card">
                <span className="plan-label">TU PLAN · IMPULSO LOCAL</span>
                <div className="price">
                  <small>S/</small>380
                </div>
                <strong>Un solo pago. Un primer paso claro.</strong>
                <span className="ad-disclosure">
                  La inversión en anuncios de Meta se paga aparte.
                </span>
                <WhatsAppLink placement="offer" className="button button-gold">
                  <Icon name="whatsapp" /> Quiero impulsar mi negocio{" "}
                  <Icon name="arrow" />
                </WhatsAppLink>
              </div>
            </div>
            <div className="deliverables">
              {benefits.map((item) => (
                <article className="deliverable" key={item.title}>
                  <span className="deliverable-icon">
                    <Icon name={item.icon} />
                  </span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                  <span className="deliverable-count">{item.count}</span>
                </article>
              ))}
              <p className="scope-note">
                Acordamos el plazo y el alcance de la campaña contigo antes de
                empezar.
              </p>
            </div>
          </div>
        </section>
        <section
          className="section shell process"
          aria-labelledby="process-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">DE “QUIERO EMPEZAR” A UN PLAN CLARO</p>
              <h2 id="process-title">
                Pequeño primer paso.
                <br />
                <em>Una dirección real.</em>
              </h2>
            </div>
            <p>
              No necesitas saber de marketing.
              <br />
              Necesitas conocer tu negocio.
              <br />
              Lo demás, lo trabajamos contigo.
            </p>
          </div>
          <div className="pillars">
            <article>
              <span className="pillar-top">
                <Icon name="shield" />
                <small>01 / BAJO RIESGO</small>
              </span>
              <h3>Empieza a tu medida.</h3>
              <p>
                S/380 por el servicio y un presupuesto de anuncios acordado
                contigo. Sabes qué contratas antes de pagar.
              </p>
            </article>
            <article>
              <span className="pillar-top">
                <Icon name="bolt" />
                <small>02 / INICIO RÁPIDO</small>
              </span>
              <h3>Del mensaje a la acción.</h3>
              <p>
                Nos cuentas qué vendes. Definimos la oferta, reunimos el
                material y acordamos la fecha de lanzamiento.
              </p>
            </article>
            <article>
              <span className="pillar-top">
                <Icon name="chart" />
                <small>03 / RESULTADOS REALES</small>
              </span>
              <h3>Mide para decidir.</h3>
              <p>
                Observamos el desempeño de la campaña. Identificamos qué ajustar
                antes de dar el siguiente paso.
              </p>
            </article>
          </div>
        </section>
        <section className="real-work shell" aria-labelledby="work-title">
          <div className="real-work-image">
            <Image
              src="/brand/plan-380.webp"
              width={1080}
              height={1440}
              sizes="(max-width: 760px) 80vw, 300px"
              alt="Anuncio real de Crisdal: Impulso Local, S/380, con los cinco entregables del plan"
            />
          </div>
          <div className="real-work-copy">
            <p className="eyebrow">
              LA OFERTA QUE VISTE. EL EQUIPO QUE LA HACE.
            </p>
            <h2 id="work-title">
              Coherencia desde
              <br />
              <em>el primer clic.</em>
            </h2>
            <p>
              Este es nuestro propio anuncio de Impulso Local. El mismo mensaje,
              la misma identidad y una invitación clara a conversar.
            </p>
            <p className="work-principle">
              Así queremos presentar tu negocio: con claridad, intención y una
              ruta directa al siguiente paso.
            </p>
            <WhatsAppLink placement="work" className="text-cta">
              Conversemos sobre tu oferta <Icon name="arrow" />
            </WhatsAppLink>
          </div>
        </section>
        <section
          className="section shell faq-section"
          aria-labelledby="faq-title"
        >
          <div>
            <p className="eyebrow">HABLEMOS CLARO</p>
            <h2 id="faq-title">
              Antes de dar
              <br />
              <em>el primer paso.</em>
            </h2>
            <p className="faq-intro">Tu inversión merece respuestas claras.</p>
          </div>
          <div className="faqs">
            {faqs.map(([q, a], i) => (
              <details key={q} name="preguntas" open={i === 0}>
                <summary>
                  {q}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="closing-section">
          <div className="shell closing-content">
            <p className="eyebrow">TU NEGOCIO LOCAL, EN EL RADAR CORRECTO.</p>
            <h2>
              Tu próximo impulso
              <br />
              <em>empieza conversando.</em>
            </h2>
            <p>
              Cuéntanos qué vendes y dónde está tu negocio.
              <br />
              Veamos juntos cómo poner tu oferta en marcha.
            </p>
            <WhatsAppLink placement="closing" className="button button-gold">
              <Icon name="whatsapp" /> Escríbenos hoy <Icon name="arrow" />
            </WhatsAppLink>
            <span className="closing-price">
              S/380 · Pago único <span> / </span> Meta Ads aparte
            </span>
          </div>
        </section>
      </main>
      <footer className="site-footer shell">
        <div className="brand footer-brand">
          <Image
            src="/brand/crisdal-imagotipo.png"
            width={36}
            height={42}
            alt=""
            className="brand-logo"
          />
          <span>
            CRISDAL<small>AGENCY</small>
          </span>
        </div>
        <p>
          Marketing con dirección.
          <br />
          <span>© 2026 Crisdal Agency · Perú</span>
        </p>
        <details className="privacy">
          <summary>Privacidad y medición</summary>
          <p>
            Usamos el píxel de Meta para medir visitas y clics en WhatsApp. Meta
            puede utilizar cookies para atribuir estas acciones a anuncios. No
            recibimos el contenido de tus conversaciones a través de esta web.
            Al abrir WhatsApp, tú decides qué información enviarnos. Puedes
            consultarnos sobre tus datos en el +51 992 566 725.
          </p>
        </details>
      </footer>
      <div className="mobile-dock">
        <div>
          <strong>
            S/380 <small>pago único</small>
          </strong>
          <span>Meta Ads aparte</span>
        </div>
        <WhatsAppLink placement="sticky" className="button button-gold">
          <Icon name="whatsapp" /> Escríbenos hoy
        </WhatsAppLink>
      </div>
    </>
  );
}
