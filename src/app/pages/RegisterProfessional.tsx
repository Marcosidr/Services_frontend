import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { CheckCircle, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { cepValido, fetchViaCep, formatCep, normalizeCep } from "../utils/cep";
import { formatCpf, isValidCpf, normalizeCpf } from "../utils/cpf";
import { getEmailValidationError, normalizeEmail } from "../utils/email";
import { getPasswordValidationError } from "../utils/password";
import { formatPhone, getPhoneValidationError, normalizePhone } from "../utils/phone";

interface Category {
  id: number | string;
  label: string;
}

interface RegisterForm {
  cpf: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  city: string;
  uf: string;
  estado: string;
  categoryIds: string[];
  description: string;
  experience: string;
  price: string;
  priceUnit: string;
  area: string;
  online: boolean;
}

type StepOneField =
  | "cpf"
  | "name"
  | "email"
  | "phone"
  | "password"
  | "confirmPassword"
  | "cep"
  | "endereco"
  | "numero"
  | "bairro"
  | "city"
  | "uf";

type StepOneErrors = Partial<Record<StepOneField, string>>;

const stepOneFields: StepOneField[] = [
  "cpf",
  "name",
  "email",
  "phone",
  "password",
  "confirmPassword",
  "cep",
  "endereco",
  "numero",
  "bairro",
  "city",
  "uf"
];

const steps = [
  { id: 1, label: "Dados pessoais" },
  { id: 2, label: "Profissao" },
  { id: 3, label: "Precos e area" }
];

const rawApiBaseUrl = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_API_BASE_URL;
const apiBaseUrl = typeof rawApiBaseUrl === "string" ? rawApiBaseUrl.replace(/\/$/, "") : "";
const apiPath = (path: string) => `${apiBaseUrl}${path}`;

function getStepOneErrors(form: RegisterForm) {
  const errors: StepOneErrors = {};

  if (!form.cpf.trim()) errors.cpf = "Informe o CPF.";
  else if (!isValidCpf(form.cpf)) errors.cpf = "Informe um CPF valido.";

  if (!form.name.trim()) errors.name = "Informe o nome completo.";

  const emailValidationError = getEmailValidationError(form.email);
  if (emailValidationError) errors.email = emailValidationError;

  if (!form.phone.trim()) errors.phone = "Informe o telefone.";
  else {
    const phoneValidationError = getPhoneValidationError(form.phone);
    if (phoneValidationError) errors.phone = phoneValidationError;
  }

  if (!form.password.trim()) errors.password = "Informe a senha.";
  else {
    const passwordValidationError = getPasswordValidationError(form.password);
    if (passwordValidationError) errors.password = passwordValidationError;
  }

  if (!form.confirmPassword.trim()) errors.confirmPassword = "Confirme a senha.";
  else if (form.confirmPassword !== form.password) errors.confirmPassword = "As senhas nao coincidem.";

  if (!form.cep.trim()) errors.cep = "Informe o CEP.";
  else if (!cepValido(form.cep)) errors.cep = "Informe um CEP valido.";

  if (!form.endereco.trim()) errors.endereco = "Informe o endereco.";
  if (!form.numero.trim()) errors.numero = "Informe o numero.";
  if (!form.bairro.trim()) errors.bairro = "Informe o bairro.";
  if (!form.city.trim()) errors.city = "Informe a cidade.";
  if (!form.uf.trim()) errors.uf = "Informe a UF.";
  else if (!/^[a-zA-Z]{2}$/.test(form.uf.trim())) errors.uf = "A UF deve conter 2 letras.";

  return errors;
}

export function RegisterProfessional() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [stepOneTouched, setStepOneTouched] = useState<Partial<Record<StepOneField, boolean>>>({});
  const [lastCpfLookup, setLastCpfLookup] = useState("");
  const [cpfLookupLoading, setCpfLookupLoading] = useState(false);
  const [cpfLookupMessage, setCpfLookupMessage] = useState("");
  const [cepLookupLoading, setCepLookupLoading] = useState(false);

  const [form, setForm] = useState<RegisterForm>({
    cpf: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    city: "",
    uf: "",
    estado: "",
    categoryIds: [],
    description: "",
    experience: "",
    price: "",
    priceUnit: "hora",
    area: "10",
    online: false
  });

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoadingCategories(true);
        setCategoriesError("");
        const response = await fetch(apiPath("/api/categories"));
        if (!response.ok) throw new Error();
        const data: Category[] = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch {
        setCategories([]);
        setCategoriesError("Erro ao carregar categorias.");
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  useEffect(() => {
    const normalizedCpf = normalizeCpf(form.cpf);
    if (!isValidCpf(normalizedCpf) || normalizedCpf === lastCpfLookup) return;

    async function lookupByCpf() {
      try {
        setCpfLookupLoading(true);
        setLastCpfLookup(normalizedCpf);
        setCpfLookupMessage("");

        const response = await fetch(apiPath(`/api/auth/cpf/${normalizedCpf}`));
        if (!response.ok) return;

        const data = (await response.json()) as {
          exists?: boolean;
          user?: {
            name?: string;
            email?: string;
            phone?: string | null;
            cep?: string | null;
            endereco?: string | null;
            numero?: string | null;
            complemento?: string | null;
            bairro?: string | null;
            cidade?: string | null;
            uf?: string | null;
            estado?: string | null;
          };
        };

        if (!data?.exists || !data.user) return;

        setForm((prev) => ({
          ...prev,
          name: data.user?.name || prev.name,
          email: data.user?.email || prev.email,
          phone: data.user?.phone ? formatPhone(data.user.phone) : prev.phone,
          cep: data.user?.cep ? formatCep(data.user.cep) : prev.cep,
          endereco: data.user?.endereco || prev.endereco,
          numero: data.user?.numero || prev.numero,
          complemento: data.user?.complemento || prev.complemento,
          bairro: data.user?.bairro || prev.bairro,
          city: data.user?.cidade || prev.city,
          uf: data.user?.uf || prev.uf,
          estado: data.user?.estado || prev.estado
        }));

        setCpfLookupMessage("CPF encontrado. Campos preenchidos automaticamente.");
      } catch {
        setCpfLookupMessage("");
      } finally {
        setCpfLookupLoading(false);
      }
    }

    void lookupByCpf();
  }, [form.cpf, lastCpfLookup]);

  const update = <K extends keyof RegisterForm>(field: K, value: RegisterForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    if ((stepOneFields as Array<keyof RegisterForm>).includes(field)) {
      setStepOneTouched((prev) => ({ ...prev, [field as StepOneField]: true }));
    }

    if (field === "cpf") {
      setCpfLookupMessage("");
      if (!isValidCpf(String(value))) setLastCpfLookup("");
    }

    if (submitError) setSubmitError("");
  };

  const touchStepOneField = (field: StepOneField) => {
    setStepOneTouched((prev) => ({ ...prev, [field]: true }));
  };

  const stepOneErrors = getStepOneErrors(form);
  const shouldShowStepOneError = (field: StepOneField) =>
    step === 1 && Boolean(stepOneTouched[field] && stepOneErrors[field]);

  const toggleCategory = (categoryId: number | string) => {
    const normalizedId = String(categoryId);
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(normalizedId)
        ? prev.categoryIds.filter((id) => id !== normalizedId)
        : [...prev.categoryIds, normalizedId]
    }));
  };

  const buscarCep = async () => {
    const normalized = normalizeCep(form.cep);
    if (!cepValido(normalized)) return;

    try {
      setCepLookupLoading(true);
      const enderecoViaCep = await fetchViaCep(normalized);
      if (!enderecoViaCep) {
        setSubmitError("CEP nao encontrado.");
        return;
      }

      setForm((prev) => ({
        ...prev,
        cep: formatCep(normalized),
        endereco: enderecoViaCep.logradouro || prev.endereco,
        bairro: enderecoViaCep.bairro || prev.bairro,
        city: enderecoViaCep.localidade || prev.city,
        uf: enderecoViaCep.uf || prev.uf,
        estado: enderecoViaCep.estado || prev.estado,
        complemento: prev.complemento || enderecoViaCep.complemento || ""
      }));
    } catch {
      setSubmitError("Falha ao buscar CEP.");
    } finally {
      setCepLookupLoading(false);
    }
  };

  const validateStep = () => {
    if (step === 1) {
      for (const field of stepOneFields) {
        if (stepOneErrors[field]) return stepOneErrors[field] as string;
      }
    }

    if (step === 2) {
      if (form.categoryIds.length === 0) return "Selecione ao menos uma categoria.";
      if (!form.description.trim()) return "Descreva seus servicos.";
    }

    if (step === 3 && !form.price.trim()) {
      return "Informe o valor medio.";
    }

    return "";
  };

  const nextStep = () => {
    if (step === 1) {
      const touched: Partial<Record<StepOneField, boolean>> = {};
      for (const field of stepOneFields) touched[field] = true;
      setStepOneTouched(touched);
    }

    const error = validateStep();
    if (error) {
      setSubmitError(error);
      return;
    }

    setSubmitError("");
    setStep((current) => Math.min(current + 1, 3));
  };

  const prevStep = () => {
    setSubmitError("");
    setStep((current) => Math.max(current - 1, 1));
  };

  const handleSubmit = async () => {
    const error = validateStep();
    if (error) {
      setSubmitError(error);
      return;
    }

    try {
      setLoading(true);
      setSubmitError("");

      const payload = {
        cpf: normalizeCpf(form.cpf),
        name: form.name.trim(),
        email: normalizeEmail(form.email),
        phone: normalizePhone(form.phone),
        password: form.password,
        cep: normalizeCep(form.cep),
        endereco: form.endereco.trim(),
        numero: form.numero.trim(),
        complemento: form.complemento.trim(),
        bairro: form.bairro.trim(),
        city: form.city.trim(),
        uf: form.uf.trim().toUpperCase(),
        estado: form.estado.trim(),
        categoryIds: form.categoryIds,
        description: form.description.trim(),
        experience: form.experience,
        price: form.price,
        priceUnit: form.priceUnit,
        area: form.area,
        online: form.online
      };

      const response = await fetch(apiPath("/api/professionals/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let message = "Nao foi possivel enviar o cadastro.";
        try {
          const errorData = await response.json();
          if (errorData?.message) message = errorData.message;
        } catch {
          // sem json
        }
        throw new Error(message);
      }

      setDone(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Erro ao enviar cadastro.");
    } finally {
      setLoading(false);
    }
  };
  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>

          <h2 className="text-gray-900 mb-2">Cadastro enviado!</h2>
          <p className="text-gray-500 text-sm mb-6">Sua solicitacao foi recebida.</p>

          <button
            onClick={() => navigate("/")}
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Voltar ao inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-3 transition-transform duration-200 hover:scale-105 active:scale-100"
          >
            <span className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-sm">
              <MapPin className="w-9 h-9" />
            </span>

            <span className="text-primary tracking-tight" style={{ fontWeight: 800, fontSize: "3.15rem" }}>
              Zen<span className="text-accent">try</span>
            </span>
          </button>
          <p className="mt-2 text-xs text-gray-500">Clique na logo para voltar ao site</p>
        </div>

        <div className="flex items-center justify-center mb-8">
          {steps.map((currentStep, index) => (
            <div key={currentStep.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    step > currentStep.id
                      ? "bg-green-500 text-white"
                      : step === currentStep.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {step > currentStep.id ? <CheckCircle className="w-5 h-5" /> : currentStep.id}
                </div>

                <span
                  className={`text-xs mt-1 hidden sm:block ${
                    step === currentStep.id ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  {currentStep.label}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 w-12 sm:w-20 mx-1 transition-all ${
                    step > currentStep.id ? "bg-green-400" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">CPF *</label>
                <input
                  value={form.cpf}
                  onChange={(e) => update("cpf", formatCpf(e.target.value))}
                  onBlur={() => touchStepOneField("cpf")}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                />
                {shouldShowStepOneError("cpf") && <p className="mt-1 text-xs text-red-600">{stepOneErrors.cpf}</p>}
                {cpfLookupLoading && <p className="mt-1 text-xs text-gray-500">Buscando cadastro por CPF...</p>}
                {!cpfLookupLoading && cpfLookupMessage && <p className="mt-1 text-xs text-green-600">{cpfLookupMessage}</p>}
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nome completo *</label>
                <input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  onBlur={() => touchStepOneField("name")}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                />
                {shouldShowStepOneError("name") && <p className="mt-1 text-xs text-red-600">{stepOneErrors.name}</p>}
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">E-mail *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  onBlur={() => touchStepOneField("email")}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                />
                {shouldShowStepOneError("email") && <p className="mt-1 text-xs text-red-600">{stepOneErrors.email}</p>}
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Telefone *</label>
                <input
                  value={form.phone}
                  onChange={(e) => update("phone", formatPhone(e.target.value))}
                  onBlur={() => touchStepOneField("phone")}
                  maxLength={15}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                />
                {shouldShowStepOneError("phone") && <p className="mt-1 text-xs text-red-600">{stepOneErrors.phone}</p>}
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Senha *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  onBlur={() => touchStepOneField("password")}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                />
                {shouldShowStepOneError("password") && <p className="mt-1 text-xs text-red-600">{stepOneErrors.password}</p>}
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Confirmar senha *</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  onBlur={() => touchStepOneField("confirmPassword")}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                />
                {shouldShowStepOneError("confirmPassword") && <p className="mt-1 text-xs text-red-600">{stepOneErrors.confirmPassword}</p>}
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">CEP *</label>
                <input
                  value={form.cep}
                  onChange={(e) => update("cep", formatCep(e.target.value))}
                  onBlur={() => {
                    touchStepOneField("cep");
                    void buscarCep();
                  }}
                  maxLength={9}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                />
                {shouldShowStepOneError("cep") && <p className="mt-1 text-xs text-red-600">{stepOneErrors.cep}</p>}
                {cepLookupLoading && <p className="mt-1 text-xs text-gray-500">Buscando endereco pelo CEP...</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">Endereco *</label>
                <input
                  value={form.endereco}
                  onChange={(e) => update("endereco", e.target.value)}
                  onBlur={() => touchStepOneField("endereco")}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                />
                {shouldShowStepOneError("endereco") && <p className="mt-1 text-xs text-red-600">{stepOneErrors.endereco}</p>}
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Numero *</label>
                <input
                  value={form.numero}
                  onChange={(e) => update("numero", e.target.value)}
                  onBlur={() => touchStepOneField("numero")}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                />
                {shouldShowStepOneError("numero") && <p className="mt-1 text-xs text-red-600">{stepOneErrors.numero}</p>}
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Complemento</label>
                <input
                  value={form.complemento}
                  onChange={(e) => update("complemento", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Bairro *</label>
                <input
                  value={form.bairro}
                  onChange={(e) => update("bairro", e.target.value)}
                  onBlur={() => touchStepOneField("bairro")}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                />
                {shouldShowStepOneError("bairro") && <p className="mt-1 text-xs text-red-600">{stepOneErrors.bairro}</p>}
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Cidade *</label>
                <input
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  onBlur={() => touchStepOneField("city")}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                />
                {shouldShowStepOneError("city") && <p className="mt-1 text-xs text-red-600">{stepOneErrors.city}</p>}
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">UF *</label>
                <input
                  value={form.uf}
                  onChange={(e) => update("uf", e.target.value.toUpperCase())}
                  onBlur={() => touchStepOneField("uf")}
                  maxLength={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                />
                {shouldShowStepOneError("uf") && <p className="mt-1 text-xs text-red-600">{stepOneErrors.uf}</p>}
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Estado</label>
                <input
                  value={form.estado}
                  onChange={(e) => update("estado", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-gray-900">Sua profissao</h3>

              {loadingCategories ? (
                <div className="p-4 border border-gray-200 rounded-xl text-sm text-gray-500">Carregando categorias...</div>
              ) : categoriesError ? (
                <div className="p-4 border border-red-200 bg-red-50 rounded-xl text-sm text-red-600">{categoriesError}</div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      className={`p-3 rounded-xl border-2 text-sm text-left transition-all ${
                        form.categoryIds.includes(String(category.id))
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              )}

              <select
                value={form.experience}
                onChange={(e) => update("experience", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
              >
                <option value="">Selecionar experiencia...</option>
                <option value="1">Menos de 1 ano</option>
                <option value="2">1 a 3 anos</option>
                <option value="5">3 a 5 anos</option>
                <option value="10">5 a 10 anos</option>
                <option value="10+">Mais de 10 anos</option>
              </select>

              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Descreva seus servicos, especialidades e diferenciais..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 resize-none"
              />
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-gray-900">Precos e area de atendimento</h3>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => update("price", e.target.value)}
                  placeholder="Valor medio em R$"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                />

                <select
                  value={form.priceUnit}
                  onChange={(e) => update("priceUnit", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                >
                  <option value="hora">Hora</option>
                  <option value="dia">Dia</option>
                  <option value="servico">Servico</option>
                  <option value="diaria">Diaria</option>
                </select>
              </div>

              <input
                type="range"
                min={1}
                max={50}
                value={form.area}
                onChange={(e) => update("area", e.target.value)}
                className="w-full accent-blue-600"
              />

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm text-gray-700 font-semibold">Ficar online apos aprovacao</p>
                  <p className="text-xs text-gray-400">Receba solicitacoes automaticamente</p>
                </div>

                <button
                  type="button"
                  onClick={() => update("online", !form.online)}
                  className={`w-12 h-6 rounded-full cursor-pointer transition-colors relative ${
                    form.online ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      form.online ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {submitError && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</div>
          )}

          <div className="flex justify-between mt-8 pt-5 border-t border-gray-100">
            <button
              onClick={prevStep}
              disabled={step === 1 || loading}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </button>

            {step < 3 ? (
              <button
                onClick={nextStep}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                Proximo
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Enviar Cadastro
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterProfessional;
