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
    <footer className="relative border-t border-primary/60 bg-gradient-to-b from-primary via-primary/90 to-secondary text-primary-foreground">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <section>
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="w-9 h-9 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center shadow-sm">
                <MapPin className="w-4 h-4 text-white" />
              </span>
              <span className="text-lg text-white" style={{ fontWeight: 700 }}>
                Zen<span className="text-accent">try</span>
              </span>
            </Link>

            <p className="mt-4 text-sm leading-relaxed text-primary-foreground/90 max-w-xs">
              Conectamos clientes a profissionais de confianca, com seguranca e
              agilidade em toda a sua regiao.
            </p>

            <div className="mt-5 flex items-center gap-2">
              <a
                href="#"
                className="w-9 h-9 rounded-lg border border-white/30 text-primary-foreground hover:bg-white hover:text-primary hover:border-white transition-colors flex items-center justify-center"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg border border-white/30 text-primary-foreground hover:bg-white hover:text-primary hover:border-white transition-colors flex items-center justify-center"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg border border-white/30 text-primary-foreground hover:bg-white hover:text-primary hover:border-white transition-colors flex items-center justify-center"
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
                    className="text-sm text-primary-foreground/90 hover:text-accent transition-colors"
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
                    className="text-sm text-primary-foreground/90 hover:text-accent transition-colors"
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

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1.5 text-xs text-blue-50">
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
