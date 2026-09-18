import { Icons } from './icons'

type Variant = 'student' | 'teacher' | 'admin'

/** Pictogramme IA / éducation — même langage visuel sur les 3 en-têtes. */
export function HeroArt({ variant }: { variant: Variant }) {
  return (
    <div className={`hero-art hero-art-${variant}`} aria-hidden="true">
      <div className="hero-art-ring" />
      <div className="hero-art-icon">
        {variant === 'student' && <Icons.spark size={36} />}
        {variant === 'teacher' && <Icons.grad size={36} />}
        {variant === 'admin' && <Icons.cpu size={36} />}
      </div>
    </div>
  )
}
