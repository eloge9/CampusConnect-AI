/** Monogramme d’origine (C + circuit + toque), une seule fois dans la sidebar. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <img
      className="brand-logo"
      src="/logo.svg"
      width={size}
      height={size}
      alt=""
    />
  )
}
