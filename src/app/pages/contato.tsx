import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Navigation,
  Shield,
  Clock,
  ChevronRight,
} from "lucide-react";

export function Contato() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: "",
    email: "",
    assunto: "",
    mensagem: "",
  });

  const [enviado, setEnviado] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // aqui depois você pode trocar por API real
    console.log("Dados enviados:", form);

    setEnviado(true);

    setForm({
      nome: "",
      email: "",
      assunto: "",
      mensagem: "",
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.10),transparent_30%)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/80 px-3 py-1.5 text-sm text-primary shadow-sm">
                <Shield className="w-4 h-4" />
                Atendimento seguro e rápido
              </div>

              <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Entre em contato com a{" "}
                <span className="text-primary">Zentry</span>
              </h1>

              <p className="mt-4 text-lg text-slate-600 max-w-xl leading-relaxed">
                Fale com a nossa equipe, tire dúvidas, solicite suporte ou envie
                sua mensagem. Estamos aqui para ajudar você a encontrar o que
                precisa de forma simples e rápida.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate("/profissionais")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-white font-medium shadow-md hover:bg-primary/90 transition-colors"
                >
                  Ver profissionais
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    const formSection = document.getElementById("form-contato");
                    formSection?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  Falar com a equipe
                </button>
              </div>

              <div className="mt-8 relative max-w-xl">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>

                <input
                  type="text"
                  placeholder="Pesquise dúvidas, suporte, atendimento..."
                  className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-4 text-sm text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  Endereço
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Atendimento digital e suporte para sua região com praticidade
                  e agilidade.
                </p>
              </div>

              <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Navigation className="w-5 h-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  Resposta rápida
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Nossa equipe acompanha seu contato para responder de forma
                  clara e eficiente.
                </p>
              </div>

              <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  Segurança
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Suas informações são tratadas com cuidado, privacidade e
                  responsabilidade.
                </p>
              </div>

              <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  Atendimento
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Envie sua solicitação e acompanhe seu atendimento com mais
                  tranquilidade.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="form-contato" className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <div className="sticky top-24 rounded-3xl bg-slate-900 text-white p-8 shadow-xl">
                <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
                  Contato Zentry
                </span>

                <h2 className="mt-4 text-3xl font-bold leading-tight">
                  Vamos conversar sobre o que você precisa
                </h2>

                <p className="mt-4 text-slate-300 leading-relaxed">
                  Use o formulário ao lado para falar com a nossa equipe.
                  Podemos ajudar com dúvidas, suporte, parcerias ou informações
                  gerais.
                </p>

                <div className="mt-8 space-y-4">
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <p className="text-sm text-slate-300">Atendimento</p>
                    <p className="mt-1 font-medium">Segunda a sábado</p>
                  </div>

                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <p className="text-sm text-slate-300">Canal principal</p>
                    <p className="mt-1 font-medium">Formulário de contato</p>
                  </div>

                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <p className="text-sm text-slate-300">Retorno</p>
                    <p className="mt-1 font-medium">O mais rápido possível</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6 sm:p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Envie sua mensagem
                  </h2>
                  <p className="mt-2 text-slate-600">
                    Preencha os dados abaixo para entrar em contato conosco.
                  </p>
                </div>

                {enviado && (
                  <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    Sua mensagem foi enviada com sucesso.
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nome
                      </label>
                      <input
                        type="text"
                        name="nome"
                        value={form.nome}
                        onChange={handleChange}
                        placeholder="Digite seu nome"
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        E-mail
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Digite seu e-mail"
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Assunto
                    </label>
                    <input
                      type="text"
                      name="assunto"
                      value={form.assunto}
                      onChange={handleChange}
                      placeholder="Sobre o que deseja falar?"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Mensagem
                    </label>
                    <textarea
                      name="mensagem"
                      value={form.mensagem}
                      onChange={handleChange}
                      placeholder="Digite sua mensagem"
                      rows={6}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      required
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-white font-medium shadow-md hover:bg-primary/90 transition-colors"
                    >
                      Enviar mensagem
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate("/profissionais")}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                    >
                      Explorar profissionais
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Contato;