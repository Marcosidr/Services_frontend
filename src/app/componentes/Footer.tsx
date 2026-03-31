import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Instagram,
  Facebook,
  Linkedin,
  Mail,
  Phone,
  ShieldCheck,
  Clock3,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const baseServiceLinks = [
  { to: "/profissionais", label: "Buscar profissionais" },
  { to: "/cadastrar-profissional", label: "Seja um profissional" },
  { to: "/login", label: "Minha conta" },
];
const adminServiceLink = { to: "/admin", label: "Painel administrativo" };

const companyLinks = [
  { to: "/", label: "Como funciona" },
  { to: "/", label: "Politica de privacidade" },
  { to: "/", label: "Termos de uso" },
];

function Footer() {
  const { isAdmin, isAuthenticated, refreshUser } = useAuth();

  useEffect(() => {
    const syncFromApi = async () => {
      if (!isAuthenticated) return;

      try {
        await refreshUser();
      } catch {
        // Mantem o papel atual quando houver falha de rede.
      }
    };

    void syncFromApi();
  }, [isAuthenticated, refreshUser]);

  const serviceLinks = isAdmin ? [...baseServiceLinks, adminServiceLink] : baseServiceLinks;

  return (
    <footer className="relative mt-12 overflow-hidden border-t border-primary/25 bg-gradient-to-b from-slate-950 via-slate-900 to-primary text-primary-foreground">
      <div className="pointer-events-none absolute -left-20 top-0 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-52 w-52 rounded-full bg-secondary/25 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

      <div className="section-container py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <section>
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/25 bg-white/20 shadow-sm">
                <MapPin className="w-4 h-4 text-white" />
              </span>
              <span className="text-gradient-brand text-lg" style={{ fontWeight: 700 }}>
                Zen<span className="text-accent">try</span>
              </span>
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-primary-foreground/90">
              Conectamos clientes a profissionais de confianca, com seguranca e
              agilidade em toda a sua regiao.
            </p>

            <div className="mt-5 flex items-center gap-2">
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/30 text-primary-foreground hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-primary"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/30 text-primary-foreground hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-primary"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/30 text-primary-foreground hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-primary"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </section>

          <section>
            <h3
              className="text-sm tracking-wide text-white uppercase"
              style={{ fontWeight: 700 }}
            >
              Servicos
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {serviceLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-sm text-primary-foreground/90 hover:text-accent"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3
              className="text-sm tracking-wide text-white uppercase"
              style={{ fontWeight: 700 }}
            >
              Empresa
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {companyLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-sm text-primary-foreground/90 hover:text-accent"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3
              className="text-sm tracking-wide text-white uppercase"
              style={{ fontWeight: 700 }}
            >
              Contato
            </h3>
            <div className="mt-4 flex flex-col gap-3 text-sm text-primary-foreground/90">
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent" />
                zentry@resolveaqui.com
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-accent" />
                (11) 4000-2222
              </p>
              <p className="flex items-center gap-2">
                <Clock3 className="w-4 h-4 text-accent" />
                Seg a Sab, 8h as 20h
              </p>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-blue-50">
              <ShieldCheck className="w-3.5 h-3.5" />
              Pagamento seguro e suporte dedicado
            </div>
          </section>
        </div>

        <div className="mt-10 pt-5 border-t border-white/20 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-primary-foreground/80">
            © {new Date().getFullYear()} Zentry. Todos os direitos reservados.
          </p>
          <p className="text-xs text-primary-foreground/80">
            Desenvolvido para conectar quem precisa com quem resolve.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
