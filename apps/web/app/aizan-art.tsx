/** Only decorative regions are drawn: the reference's controls and body text
 * are outside these viewBoxes. All application text and actions remain native. */
const regions = {
  brand: { source: "home", box: "350 130 245 250", width: 941, height: 1672 },
  microphone: { source: "home", box: "225 535 495 475", width: 941, height: 1672 },
  voice: { source: "voice", box: "68 398 720 470", width: 852, height: 1846 },
  analysis: { source: "analysis", box: "200 220 445 295", width: 852, height: 1846 },
  upload: { source: "upload", box: "215 327 430 355", width: 852, height: 1846 },
  authBrand: { source: "login", box: "40 70 860 575", width: 941, height: 1672 },
} as const;

export function AizanArt({ name, className = "" }: { name: keyof typeof regions; className?: string }) {
  const region = regions[name];
  return <svg className={`aizanArt aizanArt-${name} ${className}`} viewBox={region.box} aria-hidden="true" focusable="false">
    {name === "authBrand" && <defs><clipPath id="aizan-auth-decoration"><path d="M230 70H715V295H900V645H40V295H230Z" /></clipPath></defs>}
    <image href={`/aizan/${region.source}.png`} width={region.width} height={region.height} clipPath={name === "authBrand" ? "url(#aizan-auth-decoration)" : undefined} />
  </svg>;
}
