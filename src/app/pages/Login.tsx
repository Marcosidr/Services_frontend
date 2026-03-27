import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, MapPin, Phone, AlertCircle, CheckCircle } from "lucide-react";
import { formatCep, fetchViaCep, normalizeCep, cepValido } from "../utils/cep";
import { formatCpf, isValidCpf, normalizeCpf } from "../utils/cpf";
import { getEmailValidationError, normalizeEmail } from "../utils/email";
import { getPasswordValidationError } from "../utils/password";
import { formatPhone, getPhoneValidationError, normalizePhone } from "../utils/phone";

type AuthTab = "login" | "register";
type FormField =
  | "cpf"
  | "name"
  | "email"
  | "phone"
  | "cep"
  | "endereco"
  | "numero"
  | "complemento"
  | "bairro"
  | "cidade"
  | "uf"
  | "estado"
  | "password"
  | "confirmPassword";

type AuthForm = {
  cpf: string;
  name: string;
  email: string;
  phone: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  estado: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<FormField, string>>;

interface AuthResponse {
  message?: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    cep?: string | null;
    endereco?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    uf?: string | null;
    estado?: string | null;
    role?: string;
  };
}

const registerFieldOrder: FormField[] = [
  "cpf",
  "name",
  "email",
  "phone",
  "cep",
  "endereco",
  "numero",
  "bairro",
  "cidade",
  "uf",
  "password",
  "confirmPassword"
];

const loginFieldOrder: FormField[] = ["email", "password"];

function validateAuthForm(form: AuthForm, tab: AuthTab) {
  const errors: FormErrors = {};

  const emailValidationError = getEmailValidationError(form.email);
  if (emailValidationError) {
    errors.email = emailValidationError;
  }

  if (!form.password.trim()) {
    errors.password = "Informe sua senha.";
  } else if (tab === "register") {
    const passwordValidationError = getPasswordValidationError(form.password);
    if (passwordValidationError) {
      errors.password = passwordValidationError;
    }
  }

  if (tab === "register") {
    if (!form.cpf.trim()) {
      errors.cpf = "Informe seu CPF.";
    } else if (!isValidCpf(form.cpf)) {
      errors.cpf = "Informe um CPF valido.";
    }

    if (!form.name.trim()) {
      errors.name = "Informe seu nome completo.";
    }

    if (!form.phone.trim()) {
      errors.phone = "Informe seu telefone.";
    } else {
      const phoneValidationError = getPhoneValidationError(form.phone);
      if (phoneValidationError) {
        errors.phone = phoneValidationError;
      }
    }

    if (!form.cep.trim()) {
      errors.cep = "Informe seu CEP.";
    } else if (!cepValido(form.cep)) {
      errors.cep = "Informe um CEP valido.";
    }

    if (!form.endereco.trim()) errors.endereco = "Informe o endereco.";
    if (!form.numero.trim()) errors.numero = "Informe o numero.";
    if (!form.bairro.trim()) errors.bairro = "Informe o bairro.";
    if (!form.cidade.trim()) errors.cidade = "Informe a cidade.";

    if (!form.uf.trim()) {
      errors.uf = "Informe a UF.";
    } else if (!/^[a-zA-Z]{2}$/.test(form.uf.trim())) {
      errors.uf = "A UF deve conter 2 letras.";
    }

    if (!form.confirmPassword.trim()) {
      errors.confirmPassword = "Confirme sua senha.";
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "As senhas nao coincidem.";
    }
  }

  return errors;
}

function getFirstValidationError(errors: FormErrors, tab: AuthTab) {
  const order = tab === "login" ? loginFieldOrder : registerFieldOrder;

  for (const field of order) {
    const currentError = errors[field];
    if (currentError) return currentError;
  }

  return "";
}

function Login() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<AuthTab>("login");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [cpfLookupLoading, setCpfLookupLoading] = useState(false);
  const [cpfLookupMessage, setCpfLookupMessage] = useState("");
  const [cpfAlreadyRegistered, setCpfAlreadyRegistered] = useState(false);
  const [lastCpfLookup, setLastCpfLookup] = useState("");
  const [cepLookupLoading, setCepLookupLoading] = useState(false);

  const [form, setForm] = useState<AuthForm>({
    cpf: "",
    name: "",
    email: "",
    phone: "",
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    estado: "",
    password: "",
    confirmPassword: ""
  });

  const [touched, setTouched] = useState<Partial<Record<FormField, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const validationErrors = useMemo(() => validateAuthForm(form, tab), [form, tab]);

  const updateField = (field: FormField, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));

    setTouched((prev) => ({
      ...prev,
      [field]: true
    }));

    if (field === "cpf") {
      setCpfLookupMessage("");
      setCpfAlreadyRegistered(false);
      if (!isValidCpf(value)) {
        setLastCpfLookup("");
      }
    }

    if (error) setError("");
  };

  const touchField = (field: FormField) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true
    }));
  };

  const shouldShowFieldError = (field: FormField) =>
    Boolean((submitAttempted || touched[field]) && validationErrors[field]);

  const resetMessages = () => {
    setError("");
    setSuccessMessage("");
  };

  const resetValidationState = () => {
    setSubmitAttempted(false);
    setTouched({});
    setCpfAlreadyRegistered(false);
  };

  const lookupCpf = async (normalizedCpf: string) => {
    try {
      setCpfLookupLoading(true);
      setCpfLookupMessage("");

      const response = await fetch(`/api/auth/cpf/${normalizedCpf}`);
      if (!response.ok) {
        setCpfLookupMessage("");
        setCpfAlreadyRegistered(false);
        return;
      }

      const data = (await response.json()) as {
        exists?: boolean;
        user?: AuthResponse["user"];
      };

      if (!data?.exists || !data.user) {
        setCpfLookupMessage("");
        setCpfAlreadyRegistered(false);
        return;
      }

      setCpfAlreadyRegistered(true);
      setCpfLookupMessage("CPF ja cadastrado.");
    } catch {
      setCpfLookupMessage("");
      setCpfAlreadyRegistered(false);
    } finally {
      setCpfLookupLoading(false);
    }
  };

  useEffect(() => {
    if (tab !== "register") return;

    const normalizedCpf = normalizeCpf(form.cpf);
    if (!isValidCpf(normalizedCpf) || normalizedCpf === lastCpfLookup) return;

    setLastCpfLookup(normalizedCpf);
    void lookupCpf(normalizedCpf);
  }, [form.cpf, lastCpfLookup, tab]);

  const buscarCep = async () => {
    if (tab !== "register") return;

    const normalizedCep = normalizeCep(form.cep);
    if (!cepValido(normalizedCep)) {
      return;
    }

    try {
      setCepLookupLoading(true);
      const enderecoViaCep = await fetchViaCep(normalizedCep);

      if (!enderecoViaCep) {
        setError("CEP nao encontrado.");
        return;
      }

      setForm((prev) => ({
        ...prev,
        cep: formatCep(normalizedCep),
        endereco: enderecoViaCep.logradouro || prev.endereco,
        bairro: enderecoViaCep.bairro || prev.bairro,
        cidade: enderecoViaCep.localidade || prev.cidade,
        uf: enderecoViaCep.uf || prev.uf,
        estado: enderecoViaCep.estado || prev.estado,
        complemento: prev.complemento || enderecoViaCep.complemento || ""
      }));
    } catch {
      setError("Falha ao buscar o CEP.");
    } finally {
      setCepLookupLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setSubmitAttempted(true);

    const currentErrors = validateAuthForm(form, tab);
    const validationError = getFirstValidationError(currentErrors, tab);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (tab === "register" && cpfAlreadyRegistered) {
      setError("CPF ja cadastrado");
      return;
    }

    try {
      setLoading(true);

      const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";

      const payload =
        tab === "login"
          ? {
              email: normalizeEmail(form.email),
              password: form.password
            }
          : {
              cpf: normalizeCpf(form.cpf),
              name: form.name.trim(),
              email: normalizeEmail(form.email),
              phone: normalizePhone(form.phone),
              cep: normalizeCep(form.cep),
              endereco: form.endereco.trim(),
              numero: form.numero.trim(),
              complemento: form.complemento.trim(),
              bairro: form.bairro.trim(),
              cidade: form.cidade.trim(),
              uf: form.uf.trim().toUpperCase(),
              estado: form.estado.trim(),
              password: form.password
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
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
              ? "Nao foi possivel entrar na sua conta."
              : "Nao foi possivel criar sua conta.")
        );
      }

      if (data?.token) {
        localStorage.setItem("token", data.token);
      }

      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      setSuccessMessage(tab === "login" ? "Login realizado com sucesso!" : "Conta criada com sucesso!");

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
        err instanceof Error ? err.message : "Ocorreu um erro ao processar sua solicitacao."
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

          <h1 className="text-primary tracking-tight" style={{ fontWeight: 800, fontSize: "1.15rem" }}>
            Zen<span className="text-accent">try</span>
          </h1>

          <p className="text-gray-500 text-sm mt-1">Encontre profissionais perto de voce</p>
        </div>

        <div className="bg-white rounded-2xl border border-primary/10 shadow-lg overflow-hidden">
          <div className="flex border-b border-primary/10">
            <button
              onClick={() => {
                setTab("login");
                resetMessages();
                resetValidationState();
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
                resetValidationState();
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
                <label className="text-xs text-gray-500 mb-1.5 block">CPF</label>
                <input
                  type="text"
                  required
                  placeholder="000.000.000-00"
                  value={form.cpf}
                  onChange={(e) => updateField("cpf", formatCpf(e.target.value))}
                  onBlur={() => touchField("cpf")}
                  maxLength={14}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm outline-none transition-colors ${
                    shouldShowFieldError("cpf")
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-primary"
                  }`}
                />
                {shouldShowFieldError("cpf") && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.cpf}</p>
                )}
                {cpfLookupLoading && (
                  <p className="mt-1 text-xs text-gray-500">Buscando cadastro por CPF...</p>
                )}
                {!cpfLookupLoading && cpfLookupMessage && (
                  <p className={`mt-1 text-xs ${cpfAlreadyRegistered ? "text-red-600" : "text-green-600"}`}>
                    {cpfLookupMessage}
                  </p>
                )}
              </div>
            )}

            {tab === "register" && (
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Nome completo</label>
                <input
                  type="text"
                  required
                  placeholder="Joao da Silva"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  onBlur={() => touchField("name")}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm outline-none transition-colors ${
                    shouldShowFieldError("name")
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-primary"
                  }`}
                />
                {shouldShowFieldError("name") && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.name}</p>
                )}
              </div>
            )}

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">E-mail</label>
              <input
                type="email"
                required
                placeholder="joao@email.com"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                onBlur={() => touchField("email")}
                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm outline-none transition-colors ${
                  shouldShowFieldError("email")
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-200 focus:border-primary"
                }`}
              />
              {shouldShowFieldError("email") && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.email}</p>
              )}
            </div>

            {tab === "register" && (
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Telefone / WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={form.phone}
                    onChange={(e) => updateField("phone", formatPhone(e.target.value))}
                    onBlur={() => touchField("phone")}
                    maxLength={15}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl text-sm outline-none transition-colors ${
                      shouldShowFieldError("phone")
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-primary"
                    }`}
                  />
                </div>
                {shouldShowFieldError("phone") && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.phone}</p>
                )}
              </div>
            )}

            {tab === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 mb-1.5 block">CEP</label>
                  <input
                    type="text"
                    required
                    placeholder="00000-000"
                    value={form.cep}
                    onChange={(e) => updateField("cep", formatCep(e.target.value))}
                    onBlur={() => {
                      touchField("cep");
                      void buscarCep();
                    }}
                    maxLength={9}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm outline-none transition-colors ${
                      shouldShowFieldError("cep")
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-primary"
                    }`}
                  />
                  {shouldShowFieldError("cep") && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.cep}</p>
                  )}
                  {cepLookupLoading && (
                    <p className="mt-1 text-xs text-gray-500">Buscando endereco pelo CEP...</p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="text-xs text-gray-500 mb-1.5 block">Endereco</label>
                  <input
                    type="text"
                    required
                    placeholder="Rua, avenida, praca..."
                    value={form.endereco}
                    onChange={(e) => updateField("endereco", e.target.value)}
                    onBlur={() => touchField("endereco")}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm outline-none transition-colors ${
                      shouldShowFieldError("endereco")
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-primary"
                    }`}
                  />
                  {shouldShowFieldError("endereco") && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.endereco}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Numero</label>
                  <input
                    type="text"
                    required
                    placeholder="123"
                    value={form.numero}
                    onChange={(e) => updateField("numero", e.target.value)}
                    onBlur={() => touchField("numero")}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm outline-none transition-colors ${
                      shouldShowFieldError("numero")
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-primary"
                    }`}
                  />
                  {shouldShowFieldError("numero") && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.numero}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Complemento</label>
                  <input
                    type="text"
                    placeholder="Apto, bloco, casa..."
                    value={form.complemento}
                    onChange={(e) => updateField("complemento", e.target.value)}
                    onBlur={() => touchField("complemento")}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none transition-colors focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Bairro</label>
                  <input
                    type="text"
                    required
                    value={form.bairro}
                    onChange={(e) => updateField("bairro", e.target.value)}
                    onBlur={() => touchField("bairro")}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm outline-none transition-colors ${
                      shouldShowFieldError("bairro")
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-primary"
                    }`}
                  />
                  {shouldShowFieldError("bairro") && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.bairro}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Cidade</label>
                  <input
                    type="text"
                    required
                    value={form.cidade}
                    onChange={(e) => updateField("cidade", e.target.value)}
                    onBlur={() => touchField("cidade")}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm outline-none transition-colors ${
                      shouldShowFieldError("cidade")
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-primary"
                    }`}
                  />
                  {shouldShowFieldError("cidade") && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.cidade}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">UF</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    placeholder="SP"
                    value={form.uf}
                    onChange={(e) => updateField("uf", e.target.value.toUpperCase())}
                    onBlur={() => touchField("uf")}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm outline-none transition-colors ${
                      shouldShowFieldError("uf")
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-primary"
                    }`}
                  />
                  {shouldShowFieldError("uf") && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.uf}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Estado</label>
                  <input
                    type="text"
                    value={form.estado}
                    onChange={(e) => updateField("estado", e.target.value)}
                    onBlur={() => touchField("estado")}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none transition-colors focus:border-primary"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  placeholder="********"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  onBlur={() => touchField("password")}
                  className={`w-full px-4 py-3 pr-10 bg-gray-50 border rounded-xl text-sm outline-none transition-colors ${
                    shouldShowFieldError("password")
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-primary"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {shouldShowFieldError("password") && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.password}</p>
              )}
            </div>

            {tab === "register" && (
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Confirmar senha</label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    placeholder="********"
                    value={form.confirmPassword}
                    onChange={(e) => updateField("confirmPassword", e.target.value)}
                    onBlur={() => touchField("confirmPassword")}
                    className={`w-full px-4 py-3 pr-10 bg-gray-50 border rounded-xl text-sm outline-none transition-colors ${
                      shouldShowFieldError("confirmPassword")
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-primary"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {shouldShowFieldError("confirmPassword") && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.confirmPassword}</p>
                )}
              </div>
            )}

            {tab === "login" && (
              <div className="text-right">
                <button type="button" className="text-xs text-primary hover:underline">
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
          E profissional?{" "}
          <button onClick={() => navigate("/cadastrar-profissional")} className="text-primary hover:underline">
            Cadastre-se como parceiro
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
