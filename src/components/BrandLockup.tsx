// BuLLM logo lockup (2 Nov 2026, per user): the supplied logo image (bull mark + wordmark + tagline), reused in the top bar
// and on login. Sized by height from `--bl` (brand.css).
import './brand.css'
import logo from '../assets/brand-logo.png'

export function BrandLockup({ className = '' }: { className?: string }) {
  return <img className={`brand-lockup ${className}`} src={logo} alt="BuLLM. Scaffold. Accelerate. Automate." />
}
