import Link from 'next/link';
import { GoingLogo } from '../GoingLogo';

const SOCIAL_LINKS = [
  { icon: '📸', label: 'Instagram', href: 'https://instagram.com/goingecuador' },
  { icon: '🐦', label: 'Twitter / X', href: 'https://x.com/goingecuador' },
  { icon: '💼', label: 'LinkedIn', href: 'https://linkedin.com/company/goingecuador' },
  { icon: '▶️', label: 'YouTube', href: 'https://youtube.com/@goingecuador' },
];

const FOOTER_COLS = [
  {
    title: 'Viajes',
    links: [
      { label: 'Compartido', href: '/destinos' },
      { label: 'Privado en SUV', href: 'https://app.goingec.com/transport?mode=private' },
      { label: 'Envíos', href: 'https://app.goingec.com/envios' },
      { label: 'Corporativo', href: 'https://app.goingec.com/corporate' },
      { label: 'Tours', href: '/destinos' },
    ],
  },
  {
    title: 'Editorial',
    links: [
      { label: 'Noticiero Going', href: '/noticiero' },
      { label: 'Revista', href: '/revista' },
      { label: 'Blog', href: '/blog' },
      { label: 'Destinos', href: '/destinos' },
      { label: 'Promociones', href: '/promociones' },
    ],
  },
  {
    title: 'Comunidad',
    links: [
      { label: 'Soy pasajero', href: 'https://app.goingec.com/register' },
      { label: 'Quiero ser conductor', href: '/comunidad#conductores' },
      { label: 'Anfitriones', href: '/comunidad#anfitriones' },
      { label: 'Academia Going', href: '/academia' },
      { label: 'Sostenibilidad', href: '/quienes-somos#sostenibilidad' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Quiénes somos', href: '/quienes-somos' },
      { label: 'Trabaja con nosotros', href: '/quienes-somos#careers' },
      { label: 'Prensa', href: '/noticiero' },
      { label: 'Contacto', href: 'mailto:hola@goingec.com' },
      { label: 'Seguridad', href: '/legal#seguridad' },
    ],
  },
];

const LEGAL_LINKS = [
  { label: 'Términos y condiciones', href: '/legal#terminos' },
  { label: 'Política de privacidad', href: '/legal#privacidad' },
  { label: 'Cookies', href: '/legal#cookies' },
  { label: 'Contrato del conductor', href: '/legal#conductor' },
];

export function Footer() {
  return (
    <footer className="bg-[#011627] text-white">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        {/* Top grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-10 pb-12 border-b border-white/[0.07]">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <GoingLogo size={22} />
              <span className="text-xl font-black">Going</span>
            </div>
            <p className="text-sm text-white/40 leading-relaxed mb-5">
              Nos movemos contigo.<br />
              Transporte, tours y envíos en Ecuador.<br />
              Est. MMXXVI
            </p>
            <div className="flex gap-2.5">
              {SOCIAL_LINKS.map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.09] flex items-center justify-center text-base hover:bg-red-500/20 hover:border-red-500/30 transition-all"
                >
                  {s.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <div className="text-[11px] font-black uppercase tracking-[1.5px] text-white/30 mb-4">
                {col.title}
              </div>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] font-semibold text-white/50 hover:text-[#ff4c41] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Legal strip */}
        <div className="py-6 border-b border-white/[0.06] flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-5">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.label} href={l.href} className="text-[12px] font-bold text-white/35 hover:text-white/60 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex gap-3">
            <span className="flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-1.5 text-[11px] font-bold text-white/60">
              🇪🇨 Empresa ecuatoriana
            </span>
            <span className="flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-1.5 text-[11px] font-bold text-white/60">
              🔐 SSL seguro
            </span>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-white/25">
            © 2026 Going Ecuador S.A.S. — Todos los derechos reservados
          </p>
          <div className="flex gap-2">
            <Link href="https://app.goingec.com" className="text-[12px] text-white/35 hover:text-white/60 transition-colors">
              app.goingec.com
            </Link>
            <span className="text-white/15">·</span>
            <Link href="mailto:hola@goingec.com" className="text-[12px] text-white/35 hover:text-white/60 transition-colors">
              hola@goingec.com
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
