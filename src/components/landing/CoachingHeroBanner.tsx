import Image from "next/image";
import Link from "next/link";

import { SiteBrandLogo } from "@/src/components/landing/SiteBrandLogo";

type Props = {
  className?: string;
  /** Overlay the React wordmark (only if your PNG does not already include the logo). */
  brandOverlay?: boolean;
  /** Show full artwork without cropping — keeps logo + headline inside the frame. */
  fitArtwork?: boolean;
  /** Anchor `object-contain` so the logo side of the PNG stays left (pairs well with slides on the right). */
  artworkAlign?: "center" | "left";
};

/**
 * Primary marketing visual — supplied brand banner (human ↔ AI handshake).
 */
export function CoachingHeroBanner({
  className,
  brandOverlay = false,
  fitArtwork = false,
  artworkAlign = "center",
}: Props) {
  const containFrame = fitArtwork
    ? "relative aspect-[21/9] min-h-[240px] w-full flex-1 bg-slate-950 max-h-[min(68vh,560px)]"
    : "relative min-h-[280px] flex-1";

  const wrap = [
    "relative flex w-full max-w-none overflow-hidden rounded-2xl border border-slate-800/90 shadow-2xl shadow-black/45 ring-1 ring-white/5",
    fitArtwork ? "min-h-0 flex-1 flex-col" : "h-full min-h-[280px]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const imgFit = fitArtwork
    ? artworkAlign === "left"
      ? "object-contain object-left object-top"
      : "object-contain object-center"
    : "object-cover object-center";

  return (
    <div className={wrap}>
      <div className={containFrame}>
        <Image
          src="/branding/site-hero-banner.png"
          alt="AI Coaching Centre — The future of education combines human creativity with artificial intelligence"
          fill
          className={imgFit}
          sizes="(max-width: 1023px) 100vw, 45vw"
          priority
        />
        {brandOverlay ? (
          <>
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-24 bg-gradient-to-b from-black/60 via-black/15 to-transparent sm:h-28"
              aria-hidden
            />
            <Link
              href="/"
              title="AI Coaching Centre — home"
              className="absolute left-2.5 top-2.5 z-[2] max-w-[min(100%-1rem,17rem)] rounded-xl bg-slate-950/92 px-2.5 py-2 shadow-lg shadow-black/50 ring-1 ring-white/15 transition hover:bg-slate-950/98 sm:left-4 sm:top-4 sm:px-3 sm:py-2.5"
            >
              <SiteBrandLogo />
            </Link>
          </>
        ) : null}
      </div>
    </div>
  );
}
