import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  MapPin,
  Phone,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { formatCpf, isValidCpf, normalizeCpf } from "../utils/cpf";
import { getEmailValidationError, normalizeEmail } from "../utils/email";
import { getPasswordValidationError } from "../utils/password";
import { formatPhone, getPhoneValidationError, normalizePhone } from "../utils/phone";

type AuthTab = "login" | "register";

interface AuthResponse {
  message?: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
}

 function Login() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<AuthTab>("login");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    cpf: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetMessages = () => {
    setError("");
    setSuccessMessage("");
  };

  const validateForm = () => {
    const emailValidationError = getEmailValidationError(form.email);
    if (emailValidationError) {
      return emailValidationError;
    }

    if (!form.password.trim()) {
      return "Informe sua senha.";
    }

    if (tab === "register") {
      if (!form.name.trim()) {
        return "Informe seu nome completo.";
      }

      if (!form.phone.trim()) {
        return "Informe seu telefone.";
      }

      const phoneValidationError = getPhoneValidationError(form.phone);
      if (phoneValidationError) {
        return phoneValidationError;
      }

      if (!form.cpf.trim()) {
        return "Informe seu CPF.";
      }

      if (!isValidCpf(form.cpf)) {
        return "Informe um CPF valido.";
      }

      if (!form.confirmPassword.trim()) {
        return "Confirme sua senha.";
      }

      const passwordValidationError = getPasswordValidationError(form.password);
      if (passwordValidationError) {
        return passwordValidationError;
      }

      if (form.password !== form.confirmPassword) {
        return "As senhas não coincidem.";
      }
    }

    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const endpoint =
        tab === "login" ? "/api/auth/login" : "/api/auth/register";

      const payload =
        tab === "login"
          ? {
              email: normalizeEmail(form.email),
              password: form.password,
            }
          : {
              name: form.name,
              email: normalizeEmail(form.email),
              cpf: normalizeCpf(form.cpf),
              phone: normalizePhone(form.phone),
              password: form.password,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let data: AuthResponse | null = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            (tab === "login"
              ? "Não foi possível entrar na sua conta."
              : "Não foi possível criar sua conta.")
        );
      }

      if (data?.token) {
        localStorage.setItem("token", data.token);
      }

      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      setSuccessMessage(
        tab === "login"
          ? "Login realizado com sucesso!"
          : "Conta criada com sucesso!"
      );

      setTimeout(() => {
        if (data?.user?.role === "admin") {
          navigate("/admin");
          return;
        }

        navigate("/");
      }, 1200);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao processar sua solicitação."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-secondary/15 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-6 h-6 text-white" />
          </div>

          <h1
            className="text-primary tracking-tight"
            style={{ fontWeight: 800, fontSize: "1.15rem" }}
          >
          Zen<span className="text-accent">try</span>
          </h1>

          <p className="text-gray-500 text-sm mt-1">
            Encontre profissionais perto de você
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-primary/10 shadow-lg overflow-hidden">
          <div className="flex border-b border-primary/10">
            <button
              onClick={() => {
                setTab("login");
                resetMessages();
              }}
              className={`flex-1 py-4 text-sm transition-colors ${
                tab === "login"
                  ? "text-primary border-b-2 border-primary bg-primary/10"
                  : "text-gray-500 hover:text-primary"
              }`}
            >
              Entrar
            </button>

            <button
              onClick={() => {
                setTab("register");
                resetMessages();
              }}
              className={`flex-1 py-4 text-sm transition-colors ${
                tab === "register"
                  ? "text-primary border-b-2 border-primary bg-primary/10"
                  : "text-gray-500 hover:text-primary"
              }`}
            >
              Criar conta
            </button>
          </div>

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
                  onChange={(e) => updateField("name", e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary transition-colors"
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
                onChange={(e) => updateField("email", e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary transition-colors"
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
                    onChange={(e) => updateField("phone", formatPhone(e.target.value))}
                    maxLength={15}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            )}

            {tab === "register" && (
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">
                  CPF
                </label>
                <input
                  type="text"
                  required
                  placeholder="000.000.000-00"
                  value={form.cpf}
                  onChange={(e) => updateField("cpf", formatCpf(e.target.value))}
                  maxLength={14}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary transition-colors"
                />
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
                  onChange={(e) => updateField("password", e.target.value)}
                  className="w-full px-4 py-3 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {tab === "register" && (
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">
                  Confirmar senha
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={(e) =>
                      updateField("confirmPassword", e.target.value)
                    }
                    className="w-full px-4 py-3 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {tab === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/60 text-white py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {loading && (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
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
              {["Google", "Facebook"].map((provider) => (
                <button
                  key={provider}
                  type="button"
                  className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {provider}
                </button>
              ))}
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          É profissional?{" "}
          <button
            onClick={() => navigate("/cadastrar-profissional")}
            className="text-primary hover:underline"
          >
            Cadastre-se como parceiro
          </button>
        </p>
      </div>
    </div>
  );
}
export default Login;


