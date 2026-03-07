import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Upload,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  User,
  Briefcase,
  DollarSign,
  FileText,
  Camera,
} from "lucide-react";

interface Category {
  id: string;
  label: string;
  icon?: string;
}

interface RegisterForm {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  photo: File | null;
  category: string;
  description: string;
  experience: string;
  price: string;
  priceUnit: string;
  area: string;
  cep: string;
  city: string;
  rg: File | null;
  cpfDoc: File | null;
  selfie: File | null;
  online: boolean;
}

const steps = [
  { id: 1, label: "Dados pessoais", icon: User },
  { id: 2, label: "Profissão", icon: Briefcase },
  { id: 3, label: "Preços e área", icon: DollarSign },
  { id: 4, label: "Documentos", icon: FileText },
];

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function RegisterProfessional() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    photo: null,
    category: "",
    description: "",
    experience: "",
    price: "",
    priceUnit: "hora",
    area: "10",
    cep: "",
    city: "",
    rg: null,
    cpfDoc: null,
    selfie: null,
    online: false,
  });

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoadingCategories(true);
        setCategoriesError("");

        const response = await fetch("/api/categories");

        if (!response.ok) {
          throw new Error("Não foi possível carregar as categorias.");
        }

        const data: Category[] = await response.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setCategoriesError("Erro ao carregar categorias.");
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  const update = <K extends keyof RegisterForm>(field: K, value: RegisterForm[K]) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const validateStep = () => {
    if (step === 1) {
      if (!form.name.trim()) return "Informe o nome completo.";
      if (!form.email.trim()) return "Informe o e-mail.";
      if (!form.phone.trim()) return "Informe o telefone.";
      if (!form.cpf.trim()) return "Informe o CPF.";
      if (!form.photo) return "Envie uma foto profissional.";
    }

    if (step === 2) {
      if (!form.category) return "Selecione uma categoria.";
      if (!form.description.trim()) return "Descreva seus serviços.";
    }

    if (step === 3) {
      if (!form.price.trim()) return "Informe o valor médio.";
    }

    if (step === 4) {
      if (!form.rg) return "Envie o RG ou CNH.";
      if (!form.cpfDoc) return "Envie o documento de CPF.";
      if (!form.selfie) return "Envie a selfie com documento.";
    }

    return "";
  };

  const nextStep = () => {
    const error = validateStep();

    if (error) {
      setSubmitError(error);
      return;
    }

    setSubmitError("");
    setStep((current) => Math.min(current + 1, 4));
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

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("cpf", form.cpf);
      formData.append("category", form.category);
      formData.append("description", form.description);
      formData.append("experience", form.experience);
      formData.append("price", form.price);
      formData.append("priceUnit", form.priceUnit);
      formData.append("area", form.area);
      formData.append("cep", form.cep);
      formData.append("city", form.city);
      formData.append("online", String(form.online));

      if (form.photo) formData.append("photo", form.photo);
      if (form.rg) formData.append("rg", form.rg);
      if (form.cpfDoc) formData.append("cpfDoc", form.cpfDoc);
      if (form.selfie) formData.append("selfie", form.selfie);

      const response = await fetch("/api/professionals/register", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let message = "Não foi possível enviar o cadastro.";

        try {
          const errorData = await response.json();
          if (errorData?.message) {
            message = errorData.message;
          }
        } catch {
          // sem json
        }

        throw new Error(message);
      }

      setDone(true);
    } catch (error) {
      console.error(error);
      setSubmitError(
        error instanceof Error ? error.message : "Erro ao enviar cadastro."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderFileName = (file: File | null) => {
    if (!file) return "Clique para enviar (JPG, PNG, PDF)";
    return `✅ ${file.name}`;
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>

          <h2 className="text-gray-900 mb-2">Cadastro enviado!</h2>

          <p className="text-gray-500 text-sm mb-2">
            Sua solicitação foi recebida. Nossa equipe irá analisar seus documentos.
          </p>

          <p className="text-gray-400 text-xs mb-6">
            Você receberá uma resposta assim que a análise for concluída.
          </p>

          <button
            onClick={() => navigate("/")}
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-gray-900 mb-1">Cadastro de Profissional</h1>
          <p className="text-gray-500 text-sm">
            Comece a receber clientes perto de você
          </p>
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
                  {step > currentStep.id ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <currentStep.icon className="w-4 h-4" />
                  )}
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
            <div className="flex flex-col gap-4">
              <h3 className="text-gray-900 mb-2">Seus dados pessoais</h3>

              <div className="flex flex-col items-center mb-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                    {form.photo ? (
                      <img
                        src={URL.createObjectURL(form.photo)}
                        alt="Foto do profissional"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-8 h-8 text-gray-400" />
                    )}
                  </div>

                  <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-blue-700 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => update("photo", e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>

                <p className="text-xs text-gray-400 mt-3">
                  Foto profissional (obrigatório)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">
                    Nome completo *
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Carlos Eduardo Silva"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">E-mail *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="email@exemplo.com"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">CPF *</label>
                  <input
                    value={form.cpf}
                    onChange={(e) => update("cpf", e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">CEP</label>
                  <input
                    value={form.cep}
                    onChange={(e) => update("cep", e.target.value)}
                    placeholder="00000-000"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-gray-900 mb-2">Sua profissão</h3>

              <div>
                <label className="text-xs text-gray-500 mb-2 block">
                  Categoria *
                </label>

                {loadingCategories ? (
                  <div className="p-4 border border-gray-200 rounded-xl text-sm text-gray-500">
                    Carregando categorias...
                  </div>
                ) : categoriesError ? (
                  <div className="p-4 border border-red-200 bg-red-50 rounded-xl text-sm text-red-600">
                    {categoriesError}
                  </div>
                ) : categories.length === 0 ? (
                  <div className="p-4 border border-gray-200 rounded-xl text-sm text-gray-500">
                    Nenhuma categoria disponível.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => update("category", category.id)}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm text-left transition-all ${
                          form.category === category.id
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {category.icon && (
                          <span className="text-lg">{category.icon}</span>
                        )}
                        <span>{category.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Anos de experiência
                </label>
                <select
                  value={form.experience}
                  onChange={(e) => update("experience", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                >
                  <option value="">Selecionar...</option>
                  <option value="1">Menos de 1 ano</option>
                  <option value="2">1 a 3 anos</option>
                  <option value="5">3 a 5 anos</option>
                  <option value="10">5 a 10 anos</option>
                  <option value="10+">Mais de 10 anos</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Descrição dos serviços *
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Descreva seus serviços, especialidades e diferenciais..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 resize-none"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-gray-900 mb-2">Preços e área de atendimento</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Valor médio (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      R$
                    </span>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => update("price", e.target.value)}
                      placeholder="100"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Por</label>
                  <select
                    value={form.priceUnit}
                    onChange={(e) => update("priceUnit", e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                  >
                    <option value="hora">Hora</option>
                    <option value="dia">Dia</option>
                    <option value="serviço">Serviço</option>
                    <option value="diária">Diária</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-2 block">
                  Raio de atendimento:{" "}
                  <span className="text-gray-700 font-semibold">{form.area} km</span>
                </label>

                <input
                  type="range"
                  min={1}
                  max={50}
                  value={form.area}
                  onChange={(e) => update("area", e.target.value)}
                  className="w-full accent-blue-600"
                />

                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1 km</span>
                  <span>25 km</span>
                  <span>50 km</span>
                </div>
              </div>

              <div className="flex items-center justify-center mt-2">
                <div
                  className="relative flex items-center justify-center rounded-full bg-blue-100 border-2 border-blue-300"
                  style={{
                    width: `${Math.min(Number(form.area) * 4, 200)}px`,
                    height: `${Math.min(Number(form.area) * 4, 200)}px`,
                    transition: "all 0.3s ease",
                  }}
                >
                  <div className="absolute w-4 h-4 bg-blue-600 rounded-full" />
                  <span className="absolute bottom-2 text-xs text-blue-600 font-semibold">
                    {form.area} km
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-2 block">
                  Disponibilidade
                </label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map((day) => (
                    <button
                      key={day}
                      type="button"
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-gray-900 mb-1">Documentos para verificação</h3>

              <p className="text-sm text-gray-500 mb-3">
                Seus documentos são analisados pela nossa equipe e não são exibidos
                publicamente.
              </p>

              {[
                {
                  key: "rg" as const,
                  label: "RG ou CNH (frente e verso)",
                  icon: "🪪",
                  file: form.rg,
                },
                {
                  key: "cpfDoc" as const,
                  label: "CPF (foto ou PDF)",
                  icon: "📄",
                  file: form.cpfDoc,
                },
                {
                  key: "selfie" as const,
                  label: "Selfie segurando o RG",
                  icon: "🤳",
                  file: form.selfie,
                },
              ].map((doc) => (
                <label
                  key={doc.key}
                  className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                >
                  <span className="text-2xl">{doc.icon}</span>

                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{doc.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {renderFileName(doc.file)}
                    </p>
                  </div>

                  <Upload className="w-4 h-4 text-gray-400" />

                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => update(doc.key, e.target.files?.[0] ?? null)}
                  />
                </label>
              ))}

              <div className="bg-blue-50 rounded-xl p-4 mt-2">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800 font-semibold">
                    Badge "Profissional Verificado"
                  </span>
                </div>

                <p className="text-xs text-blue-600">
                  Após aprovação, seu perfil poderá receber o selo de verificação.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm text-gray-700 font-semibold">
                    Ficar online após aprovação
                  </p>
                  <p className="text-xs text-gray-400">
                    Receba solicitações automaticamente
                  </p>
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
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {submitError}
            </div>
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

            {step < 4 ? (
              <button
                onClick={nextStep}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                Próximo
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