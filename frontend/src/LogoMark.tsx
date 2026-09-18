import logo from './assets/logo.jpg'

/** Logo officiel CampusConnect AI (toque + C circuit + wordmark). */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <img
      className="brand-logo"
      src={logo}
      height={size}
      alt="CampusConnect AI"
    />
  )
}
