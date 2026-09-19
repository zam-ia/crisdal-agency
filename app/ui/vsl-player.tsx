"use client";

/* eslint-disable @next/next/no-img-element -- CMS images can come from the connected Blob store. */
import { useMemo, useRef } from "react";
import { trackMarketingEvent } from "./site-events";

function youtubeId(url: string) {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  );
  return match?.[1] || "";
}

export function VslPlayer({
  url,
  posterUrl,
  posterAlt,
  captionsUrl,
}: {
  url: string;
  posterUrl: string;
  posterAlt: string;
  captionsUrl: string;
}) {
  const sentPlay = useRef(false);
  const sentProgress = useRef(new Set<number>());
  const id = useMemo(() => youtubeId(url), [url]);

  function trackProgress(currentTime: number, duration: number) {
    if (!duration) return;
    const percentage = (currentTime / duration) * 100;
    for (const milestone of [25, 50, 75, 95]) {
      if (percentage >= milestone && !sentProgress.current.has(milestone)) {
        sentProgress.current.add(milestone);
        trackMarketingEvent(`vsl_${milestone}`, { source: "uploaded" });
      }
    }
  }

  function trackUploadedPlay() {
    if (sentPlay.current) return;
    sentPlay.current = true;
    trackMarketingEvent("vsl_play", { source: "uploaded" });
  }

  function trackYoutubePlay() {
    if (sentPlay.current) return;
    sentPlay.current = true;
    trackMarketingEvent("vsl_play", { source: "youtube" });
  }

  if (!url) {
    return (
      <div className="vsl-facade vsl-empty" aria-label="Video pendiente de publicación">
        {posterUrl ? <img src={posterUrl} alt={posterAlt} /> : null}
        <div className="vsl-overlay">
          <span className="play-button" aria-hidden="true">▶</span>
          <strong>¿Cómo convertimos contenido en conversaciones?</strong>
          <small>Mini VSL en preparación · publícala desde el panel</small>
        </div>
      </div>
    );
  }

  if (id) {
    return (
      <div className="vsl-frame vsl-autoplay">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&playsinline=1&rel=0`}
          title="Video de presentación de Crisdal Agency"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onLoad={trackYoutubePlay}
        />
      </div>
    );
  }

  return (
    <div className="vsl-frame">
      <video
        controls
        autoPlay
        muted
        playsInline
        preload="auto"
        poster={posterUrl || undefined}
        onPlay={trackUploadedPlay}
        onTimeUpdate={(event) =>
          trackProgress(event.currentTarget.currentTime, event.currentTarget.duration)
        }
      >
        <source src={url} />
        <track
          kind="captions"
          src={captionsUrl || "/captions/empty.vtt"}
          srcLang="es"
          label="Español"
          default
        />
        Tu navegador no puede reproducir este video.
      </video>
    </div>
  );
}
