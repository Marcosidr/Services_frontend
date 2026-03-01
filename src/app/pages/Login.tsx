import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, MapPin, Phone } from "lucide-react";

export function Login() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => navigate("/"), 1500);
    }, 1200);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-gray-900 mb-2">
            {tab === "login" ? "Bem-vindo de volta!" : "Conta criada!"}
          </h2>
          <p className="text-gray-500">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-gray-900" style={{ fontWeight: 700 }}>
            Resolve<span className="text-blue-600">Aqui</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Encontre profissionais perto de você
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-4 text-sm transition-colors ${
                tab === "login"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setTab("register")}
              className={`flex-1 py-4 text-sm transition-colors ${
                tab === "register"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Criar conta
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            {tab === "register" && (
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">
                  Nome completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="João da Silva"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">
                E-mail
              </label>
              <input
                type="email"
                required
                placeholder="joao@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors"
              />
            </div>

            {tab === "register" && (
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">
                  Telefone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {tab === "register" && (
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">
                  Confirmar senha
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({ ...form, confirmPassword: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors"
                />
              </div>
            )}

            {tab === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : null}
              {tab === "login" ? "Entrar" : "Criar minha conta"}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center text-xs text-gray-400">
                <span className="bg-white px-3">ou continue com</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {["Google", "Facebook"].map((p) => (
                <button
                  key={p}
                  type="button"
                  className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          É profissional?{" "}
          <button
            onClick={() => navigate("/cadastrar-profissional")}
            className="text-blue-600 hover:underline"
          >
            Cadastre-se como parceiro
          </button>
        </p>
      </div>
    </div>
  );
}
