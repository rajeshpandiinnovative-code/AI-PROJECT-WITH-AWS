import Image from "next/image";

type Props = {
  /** PNG under `public/` — default matches `public/branding/handshake-hero.png` */
  src?: string;
};

/**
 * Human ↔ AI handshake hero visual.
 * Drop your PNG at `public/branding/handshake-hero.png`, or pass a different `src`.
 */
export function HandshakeHeroArt({ src = "/branding/handshake-hero.png" }: Props) {
  return (
    <div className="relative mx-auto w-full max-w-md select-none overflow-hidden rounded-2xl ring-1 ring-white/5">
      <div className="relative aspect-[400/280] w-full">
        <Image
          src={src}
          alt=""
          fill
          className="object-contain object-center drop-shadow-[0_20px_50px_rgba(16,185,129,0.15)]"
          sizes="(max-width: 768px) 100vw, 448px"
        />
      </div>
      <p className="sr-only">Illustration: partnership between educator insight and AI precision</p>
    </div>
  );
}
