import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  CheckCircle,
  DollarSign,
  Megaphone,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Tags,
  Trash2,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { getAuthorizationHeader, getStoredUser } from "../utils/auth";
import { cepValido, fetchViaCep, formatCep, normalizeCep } from "../utils/cep";

type AdminTab =
  | "overview"
  | "usuarios"
  | "categorias"
  | "avisos"
  | "profissionais"
  | "pagamentos"
  | "relatorios";

type UserRole = "user" | "professional" | "admin";

type AdminStats = {
  totalUsers: number;
  totalProfessionals: number;
  monthlyRevenue: number;
  completedJobs: number;
  activeJobs: number;
  pendingApprovals: number;
  pendingAmount: number;
  refundedAmount: number;
  totalRevenue: number;
};

type PendingProfessional = {
  id: string;
  name: string;
  category: string;
  date: string;
  docs: boolean;
};

type AdminUser = {
  id: number;
  name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  estado: string | null;
  role: UserRole;
  joined: string;
};

type AdminCategory = {
  id: number;
  slug: string;
  label: string;
  icon: string | null;
  is_active: boolean;
};

type AdminAnnouncement = {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type AdminProfessional = {
  id: string;
  name: string;
  categoryLabel: string;
  rating: number;
  completedJobs: number;
  status: "online" | "offline";
  verified: boolean;
};

type AdminPayment = {
  id: string;
  user: string;
  professional: string;
  amount: number;
  date: string;
  method: string;
  status: "pago" | "pendente" | "reembolsado";
};

type CategoryReport = {
  label: string;
  value: number;
};

type MonthlyMetric = {
  label: string;
  value: string;
  trend: string;
  up: boolean;
};

type DashboardAnnouncementRecipient = {
  id: string;
  name: string;
  email: string;
};

type AnnouncementRecipient = {
  id: number;
  name: string;
  email: string;
};

type AdminDashboardResponse = {
  stats: AdminStats;
  pendingProfessionals: PendingProfessional[];
  professionals: AdminProfessional[];
  payments: AdminPayment[];
  categoryDistribution: CategoryReport[];
  monthlyMetrics: MonthlyMetric[];
  users?: DashboardAnnouncementRecipient[];
};

type ApiUser = {
  id: number;
  name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  estado: string | null;
  role: string;
  createdAt: string;
};

type ApiCategory = {
  id: number;
  slug: string;
  label: string;
  icon: string | null;
  is_active: boolean;
};

type ApiAnnouncement = {
  id: number | string;
  userId: number;
  userName: string;
  userEmail: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type PaginationState = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
};

type ApiPaginatedResponse<T> = {
  items?: T[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNext?: boolean;
};

const emptyStats: AdminStats = {
  totalUsers: 0,
  totalProfessionals: 0,
  monthlyRevenue: 0,
  completedJobs: 0,
  activeJobs: 0,
  pendingApprovals: 0,
  pendingAmount: 0,
  refundedAmount: 0,
  totalRevenue: 0,
};

const USERS_PAGE_LIMIT = 10;
const CATEGORIES_PAGE_LIMIT = 10;
const ANNOUNCEMENTS_PAGE_LIMIT = 10;

function buildAuthHeaders(withJson = false): HeadersInit {
  const headers: Record<string, string> = { ...getAuthorizationHeader() };
  if (withJson) headers["Content-Type"] = "application/json";
  return headers;
}

function toRole(value: string | null | undefined): UserRole {
  if (value === "admin" || value === "professional" || value === "user") {
    return value;
  }
  return "user";
}

function formatDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
}

function formatDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR");
}

function readCurrentUserId() {
  const stored = getStoredUser();
  if (!stored) return null;

  const rawId = stored.id;
  if (typeof rawId === "number" && Number.isSafeInteger(rawId) && rawId > 0) {
    return rawId;
  }
  if (typeof rawId === "string" && /^\d+$/.test(rawId)) {
    return Number(rawId);
  }
  return null;
}

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { message?: string };
    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message.trim();
    }
  } catch {
    // ignore
  }
  return fallback;
}

function compact(text: string, max = 90) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

function toPositiveInteger(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  return fallback;
}

function createInitialPagination(limit: number): PaginationState {
  return {
    page: 1,
    limit,
    total: 0,
    totalPages: 0,
    hasNext: false
  };
}

function parseListResponse<T>(
  payload: T[] | ApiPaginatedResponse<T>,
  fallbackPage: number,
  fallbackLimit: number
) {
  if (Array.isArray(payload)) {
    const total = payload.length;
    const totalPages = total === 0 ? 0 : 1;
    return {
      items: payload,
      pagination: {
        page: fallbackPage,
        limit: fallbackLimit,
        total,
        totalPages,
        hasNext: false
      }
    };
  }

  const items = Array.isArray(payload.items) ? payload.items : [];
  const page = toPositiveInteger(payload.page, fallbackPage);
  const limit = toPositiveInteger(payload.limit, fallbackLimit);
  const total =
    typeof payload.total === "number" && Number.isFinite(payload.total) && payload.total >= 0
      ? Math.floor(payload.total)
      : items.length;
  const computedTotalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const totalPages = toPositiveInteger(payload.totalPages, computedTotalPages);
  const hasNext = typeof payload.hasNext === "boolean" ? payload.hasNext : page < totalPages;

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext
    }
  };
}

function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [searchUser, setSearchUser] = useState("");

  const [stats, setStats] = useState<AdminStats>(emptyStats);
  const [pendingList, setPendingList] = useState<PendingProfessional[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [announcementRecipients, setAnnouncementRecipients] = useState<
    AnnouncementRecipient[]
  >([]);
  const [usersPage, setUsersPage] = useState(1);
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [announcementsPage, setAnnouncementsPage] = useState(1);
  const [usersPagination, setUsersPagination] = useState<PaginationState>(
    createInitialPagination(USERS_PAGE_LIMIT)
  );
  const [categoriesPagination, setCategoriesPagination] = useState<PaginationState>(
    createInitialPagination(CATEGORIES_PAGE_LIMIT)
  );
  const [announcementsPagination, setAnnouncementsPagination] = useState<PaginationState>(
    createInitialPagination(ANNOUNCEMENTS_PAGE_LIMIT)
  );
  const [professionals, setProfessionals] = useState<AdminProfessional[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryReport[]>([]);
  const [monthlyMetrics, setMonthlyMetrics] = useState<MonthlyMetric[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<string>("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [userCreateBusy, setUserCreateBusy] = useState(false);
  const [userUpdateBusy, setUserUpdateBusy] = useState(false);
  const [userDeleteId, setUserDeleteId] = useState<number | null>(null);
  const [createUserCepLookupLoading, setCreateUserCepLookupLoading] = useState(false);
  const [userCreateForm, setUserCreateForm] = useState({
    name: "",
    email: "",
    cpf: "",
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
    role: "user" as UserRole,
  });
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [userEditForm, setUserEditForm] = useState({
    name: "",
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
    role: "user" as UserRole,
  });

  const [categoryCreateBusy, setCategoryCreateBusy] = useState(false);
  const [categoryUpdateBusy, setCategoryUpdateBusy] = useState(false);
  const [categoryDeleteId, setCategoryDeleteId] = useState<number | null>(null);
  const [categoryCreateForm, setCategoryCreateForm] = useState({
    label: "",
    slug: "",
    icon: "",
    is_active: true,
  });
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categoryEditForm, setCategoryEditForm] = useState({
    label: "",
    slug: "",
    icon: "",
    is_active: true,
  });

  const [announcementCreateBusy, setAnnouncementCreateBusy] = useState(false);
  const [announcementUpdateBusy, setAnnouncementUpdateBusy] = useState(false);
  const [announcementDeleteId, setAnnouncementDeleteId] = useState<number | null>(null);
  const [announcementCreateForm, setAnnouncementCreateForm] = useState({
    userId: "",
    title: "",
    message: "",
  });
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<number | null>(null);
  const [announcementEditForm, setAnnouncementEditForm] = useState({
    userId: "",
    title: "",
    message: "",
  });

  const tabs = [
    { id: "overview" as AdminTab, label: "Visao geral", icon: BarChart3 },
    { id: "usuarios" as AdminTab, label: "Usuarios", icon: Users },
    { id: "categorias" as AdminTab, label: "Categorias", icon: Tags },
    { id: "avisos" as AdminTab, label: "Avisos", icon: Megaphone },
    { id: "profissionais" as AdminTab, label: "Profissionais", icon: Briefcase },
    { id: "pagamentos" as AdminTab, label: "Pagamentos", icon: DollarSign },
    { id: "relatorios" as AdminTab, label: "Relatorios", icon: TrendingUp },
  ];

  const currentUserId = useMemo(() => readCurrentUserId(), []);

  const filteredUsers = useMemo(() => {
    const query = searchUser.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.cpf ?? "").includes(query) ||
        (user.phone ?? "").includes(query)
      );
    });
  }, [users, searchUser]);

  const editingUser = useMemo(() => {
    if (editingUserId === null) return null;
    return users.find((user) => user.id === editingUserId) ?? null;
  }, [editingUserId, users]);

  const editingCategory = useMemo(() => {
    if (editingCategoryId === null) return null;
    return categories.find((item) => item.id === editingCategoryId) ?? null;
  }, [editingCategoryId, categories]);

  const editingAnnouncement = useMemo(() => {
    if (editingAnnouncementId === null) return null;
    return announcements.find((item) => item.id === editingAnnouncementId) ?? null;
  }, [editingAnnouncementId, announcements]);

  const shouldRequireCreateAddress = useMemo(() => {
    return normalizeCep(userCreateForm.cep).length > 0;
  }, [userCreateForm.cep]);

  async function loadAdminDashboard() {
    const response = await fetch("/api/admin/dashboard", {
      headers: buildAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "Nao foi possivel carregar o painel administrativo.")
      );
    }

    const data = (await response.json()) as AdminDashboardResponse;

    setStats(data.stats ?? emptyStats);
    setPendingList(Array.isArray(data.pendingProfessionals) ? data.pendingProfessionals : []);
    setProfessionals(Array.isArray(data.professionals) ? data.professionals : []);
    setPayments(Array.isArray(data.payments) ? data.payments : []);
    setCategoryDistribution(Array.isArray(data.categoryDistribution) ? data.categoryDistribution : []);
    setMonthlyMetrics(Array.isArray(data.monthlyMetrics) ? data.monthlyMetrics : []);
    setAnnouncementRecipients(
      Array.isArray(data.users)
        ? data.users
            .map((user) => ({
              id: Number(user.id),
              name: user.name,
              email: user.email
            }))
            .filter((user) => Number.isSafeInteger(user.id) && user.id > 0)
        : []
    );
  }

  async function loadUsers(targetPage = usersPage) {
    const queryParams = new URLSearchParams({
      page: String(targetPage),
      limit: String(USERS_PAGE_LIMIT)
    });
    const response = await fetch(`/api/users?${queryParams.toString()}`, {
      headers: buildAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Nao foi possivel carregar usuarios."));
    }

    const data = (await response.json()) as ApiUser[] | ApiPaginatedResponse<ApiUser>;
    const parsed = parseListResponse(data, targetPage, USERS_PAGE_LIMIT);

    setUsersPage(parsed.pagination.page);
    setUsersPagination(parsed.pagination);
    setUsers(
      parsed.items.map((item) => ({
        id: Number(item.id),
        name: item.name,
        email: item.email,
        cpf: item.cpf ?? null,
        phone: item.phone ?? null,
        cep: item.cep ?? null,
        endereco: item.endereco ?? null,
        numero: item.numero ?? null,
        complemento: item.complemento ?? null,
        bairro: item.bairro ?? null,
        cidade: item.cidade ?? null,
        uf: item.uf ?? null,
        estado: item.estado ?? null,
        role: toRole(item.role),
        joined: formatDate(item.createdAt),
      }))
    );
  }

  async function loadCategories(targetPage = categoriesPage) {
    const queryParams = new URLSearchParams({
      page: String(targetPage),
      limit: String(CATEGORIES_PAGE_LIMIT)
    });
    const response = await fetch(`/api/admin/categories?${queryParams.toString()}`, {
      headers: buildAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Nao foi possivel carregar categorias."));
    }

    const data = (await response.json()) as ApiCategory[] | ApiPaginatedResponse<ApiCategory>;
    const parsed = parseListResponse(data, targetPage, CATEGORIES_PAGE_LIMIT);

    setCategoriesPage(parsed.pagination.page);
    setCategoriesPagination(parsed.pagination);
    setCategories(
      parsed.items.map((item) => ({
        id: Number(item.id),
        slug: item.slug,
        label: item.label,
        icon: item.icon ?? null,
        is_active: Boolean(item.is_active),
      }))
    );
  }

  async function loadAnnouncements(targetPage = announcementsPage) {
    const queryParams = new URLSearchParams({
      page: String(targetPage),
      limit: String(ANNOUNCEMENTS_PAGE_LIMIT)
    });
    const response = await fetch(`/api/admin/announcements?${queryParams.toString()}`, {
      headers: buildAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Nao foi possivel carregar avisos."));
    }

    const data =
      (await response.json()) as ApiAnnouncement[] | ApiPaginatedResponse<ApiAnnouncement>;
    const parsed = parseListResponse(data, targetPage, ANNOUNCEMENTS_PAGE_LIMIT);

    setAnnouncementsPage(parsed.pagination.page);
    setAnnouncementsPagination(parsed.pagination);
    setAnnouncements(
      parsed.items.map((item) => ({
        id: typeof item.id === "string" ? Number(item.id) : item.id,
        userId: Number(item.userId),
        userName: item.userName,
        userEmail: item.userEmail,
        title: item.title,
        message: item.message,
        isRead: Boolean(item.isRead),
        createdAt: item.createdAt,
      }))
    );
  }

  async function loadAll() {
    setLoading(true);
    setError("");

    try {
      await Promise.all([loadAdminDashboard(), loadUsers(), loadCategories(), loadAnnouncements()]);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Erro ao carregar painel administrativo.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (announcementRecipients.length === 0) {
      setAnnouncementCreateForm((prev) => ({ ...prev, userId: "" }));
      return;
    }

    setAnnouncementCreateForm((prev) =>
      prev.userId ? prev : { ...prev, userId: String(announcementRecipients[0].id) }
    );
  }, [announcementRecipients]);

  async function approve(id: string) {
    try {
      setActionLoadingId(id);
      const response = await fetch(`/api/admin/professionals/${id}/approve`, {
        method: "POST",
        headers: buildAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Nao foi possivel aprovar o profissional."));
      }

      await Promise.all([loadAdminDashboard(), loadUsers(usersPage)]);
      setFeedback("Profissional aprovado com sucesso.");
    } catch (err) {
      console.error(err);
      setFeedback(err instanceof Error ? err.message : "Falha ao aprovar profissional.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function reject(id: string) {
    try {
      setActionLoadingId(id);
      const response = await fetch(`/api/admin/professionals/${id}/reject`, {
        method: "POST",
        headers: buildAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Nao foi possivel recusar o profissional."));
      }

      await Promise.all([loadAdminDashboard(), loadUsers(usersPage)]);
      setFeedback("Profissional recusado com sucesso.");
    } catch (err) {
      console.error(err);
      setFeedback(err instanceof Error ? err.message : "Falha ao recusar profissional.");
    } finally {
      setActionLoadingId(null);
    }
  }

  function startEditUser(user: AdminUser) {
    setEditingUserId(user.id);
    setUserEditForm({
      name: user.name,
      phone: user.phone ?? "",
      cep: user.cep ?? "",
      endereco: user.endereco ?? "",
      numero: user.numero ?? "",
      complemento: user.complemento ?? "",
      bairro: user.bairro ?? "",
      cidade: user.cidade ?? "",
      uf: user.uf ?? "",
      estado: user.estado ?? "",
      password: "",
      role: user.role,
    });
  }

  function startEditCategory(category: AdminCategory) {
    setEditingCategoryId(category.id);
    setCategoryEditForm({
      label: category.label,
      slug: category.slug,
      icon: category.icon ?? "",
      is_active: category.is_active,
    });
  }

  function startEditAnnouncement(item: AdminAnnouncement) {
    setEditingAnnouncementId(item.id);
    setAnnouncementEditForm({
      userId: String(item.userId),
      title: item.title,
      message: item.message,
    });
  }

  async function handleCreateUserCepBlur() {
    const normalizedCep = normalizeCep(userCreateForm.cep);
    if (!normalizedCep) return;
    if (!cepValido(normalizedCep)) {
      setFeedback("CEP invalido. Informe 8 digitos.");
      return;
    }

    try {
      setCreateUserCepLookupLoading(true);
      const enderecoViaCep = await fetchViaCep(normalizedCep);
      if (!enderecoViaCep) {
        setFeedback("CEP nao encontrado.");
        return;
      }

      setUserCreateForm((prev) => ({
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
      setFeedback("Falha ao buscar CEP.");
    } finally {
      setCreateUserCepLookupLoading(false);
    }
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (userCreateForm.role === "professional") {
      setFeedback("Perfil professional nao pode ser definido manualmente no painel.");
      return;
    }

    const name = userCreateForm.name.trim();
    const email = userCreateForm.email.trim();
    const cpf = userCreateForm.cpf.trim();
    const phone = userCreateForm.phone.trim();
    const password = userCreateForm.password.trim();
    const cep = normalizeCep(userCreateForm.cep);
    const endereco = userCreateForm.endereco.trim();
    const numero = userCreateForm.numero.trim();
    const complemento = userCreateForm.complemento.trim();
    const bairro = userCreateForm.bairro.trim();
    const cidade = userCreateForm.cidade.trim();
    const uf = userCreateForm.uf.trim().toUpperCase();
    const estado = userCreateForm.estado.trim();

    if (!name || !email || !cpf || !phone || !password) {
      setFeedback("Preencha nome, email, CPF, telefone e senha para criar usuario.");
      return;
    }

    if (cep && !cepValido(cep)) {
      setFeedback("CEP invalido. Informe 8 digitos.");
      return;
    }

    if (cep && (!endereco || !numero || !bairro || !cidade || !uf)) {
      setFeedback("Com CEP informado, endereco, numero, bairro, cidade e UF sao obrigatorios.");
      return;
    }

    const payload: Record<string, unknown> = {
      name,
      email,
      cpf,
      phone,
      password,
      role: userCreateForm.role
    };

    if (cep) payload.cep = cep;
    if (endereco) payload.endereco = endereco;
    if (numero) payload.numero = numero;
    if (complemento) payload.complemento = complemento;
    if (bairro) payload.bairro = bairro;
    if (cidade) payload.cidade = cidade;
    if (uf) payload.uf = uf;
    if (estado) payload.estado = estado;

    try {
      setUserCreateBusy(true);
      const response = await fetch("/api/users", {
        method: "POST",
        headers: buildAuthHeaders(true),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Nao foi possivel criar usuario."));
      }

      setUserCreateForm({
        name: "",
        email: "",
        cpf: "",
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
        role: "user"
      });
      await Promise.all([loadUsers(1), loadAdminDashboard()]);
      setFeedback("Usuario criado com sucesso.");
    } catch (err) {
      console.error(err);
      setFeedback(err instanceof Error ? err.message : "Falha ao criar usuario.");
    } finally {
      setUserCreateBusy(false);
    }
  }

  async function handleUpdateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingUserId) return;

    if (userEditForm.role === "professional" && editingUser?.role !== "professional") {
      setFeedback("Perfil professional so pode ser definido pela aprovacao de cadastro.");
      return;
    }
    const payload: Record<string, unknown> = {
      name: userEditForm.name.trim(),
      phone: userEditForm.phone.trim(),
      cep: userEditForm.cep.trim(),
      endereco: userEditForm.endereco.trim(),
      numero: userEditForm.numero.trim(),
      complemento: userEditForm.complemento.trim(),
      bairro: userEditForm.bairro.trim(),
      cidade: userEditForm.cidade.trim(),
      uf: userEditForm.uf.trim(),
      estado: userEditForm.estado.trim(),
      role: userEditForm.role,
    };

    if (userEditForm.password.trim()) {
      payload.password = userEditForm.password.trim();
    }

    try {
      setUserUpdateBusy(true);
      const response = await fetch(`/api/users/${editingUserId}`, {
        method: "PUT",
        headers: buildAuthHeaders(true),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Nao foi possivel atualizar usuario."));
      }

      setEditingUserId(null);
      setUserEditForm({
        name: "",
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
        role: "user",
      });
      await Promise.all([loadUsers(usersPage), loadAdminDashboard()]);
      setFeedback("Usuario atualizado com sucesso.");
    } catch (err) {
      console.error(err);
      setFeedback(err instanceof Error ? err.message : "Falha ao atualizar usuario.");
    } finally {
      setUserUpdateBusy(false);
    }
  }

  async function handleDeleteUser(user: AdminUser) {
    if (currentUserId !== null && user.id === currentUserId) {
      setFeedback("Nao e permitido deletar o proprio usuario logado.");
      return;
    }

    if (!window.confirm(`Deseja deletar o usuario ${user.name}?`)) return;

    try {
      setUserDeleteId(user.id);
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
        headers: buildAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Nao foi possivel deletar usuario."));
      }

      if (editingUserId === user.id) setEditingUserId(null);

      const nextUsersPage = users.length <= 1 && usersPage > 1 ? usersPage - 1 : usersPage;
      await Promise.all([
        loadUsers(nextUsersPage),
        loadAdminDashboard(),
        loadAnnouncements(announcementsPage)
      ]);
      setFeedback("Usuario deletado com sucesso.");
    } catch (err) {
      console.error(err);
      setFeedback(err instanceof Error ? err.message : "Falha ao deletar usuario.");
    } finally {
      setUserDeleteId(null);
    }
  }
  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: Record<string, unknown> = {
      label: categoryCreateForm.label.trim(),
      is_active: categoryCreateForm.is_active,
    };

    if (categoryCreateForm.slug.trim()) payload.slug = categoryCreateForm.slug.trim();
    if (categoryCreateForm.icon.trim()) payload.icon = categoryCreateForm.icon.trim();

    if (!payload.label) {
      setFeedback("Label e obrigatorio para categoria.");
      return;
    }

    try {
      setCategoryCreateBusy(true);
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: buildAuthHeaders(true),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Nao foi possivel criar categoria."));
      }

      setCategoryCreateForm({ label: "", slug: "", icon: "", is_active: true });
      await Promise.all([loadCategories(1), loadAdminDashboard()]);
      setFeedback("Categoria criada com sucesso.");
    } catch (err) {
      console.error(err);
      setFeedback(err instanceof Error ? err.message : "Falha ao criar categoria.");
    } finally {
      setCategoryCreateBusy(false);
    }
  }

  async function handleUpdateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCategoryId) return;

    const payload = {
      label: categoryEditForm.label.trim(),
      slug: categoryEditForm.slug.trim(),
      icon: categoryEditForm.icon.trim(),
      is_active: categoryEditForm.is_active,
    };

    if (!payload.label) {
      setFeedback("Label e obrigatorio para atualizar categoria.");
      return;
    }

    try {
      setCategoryUpdateBusy(true);
      const response = await fetch(`/api/admin/categories/${editingCategoryId}`, {
        method: "PUT",
        headers: buildAuthHeaders(true),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Nao foi possivel atualizar categoria."));
      }

      setEditingCategoryId(null);
      setCategoryEditForm({ label: "", slug: "", icon: "", is_active: true });
      await Promise.all([loadCategories(categoriesPage), loadAdminDashboard()]);
      setFeedback("Categoria atualizada com sucesso.");
    } catch (err) {
      console.error(err);
      setFeedback(err instanceof Error ? err.message : "Falha ao atualizar categoria.");
    } finally {
      setCategoryUpdateBusy(false);
    }
  }

  async function handleDeleteCategory(category: AdminCategory) {
    if (!window.confirm(`Deseja deletar a categoria ${category.label}?`)) return;

    try {
      setCategoryDeleteId(category.id);
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: "DELETE",
        headers: buildAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Nao foi possivel deletar categoria."));
      }

      if (editingCategoryId === category.id) setEditingCategoryId(null);

      const nextCategoriesPage =
        categories.length <= 1 && categoriesPage > 1 ? categoriesPage - 1 : categoriesPage;
      await Promise.all([loadCategories(nextCategoriesPage), loadAdminDashboard()]);
      setFeedback("Categoria deletada com sucesso.");
    } catch (err) {
      console.error(err);
      setFeedback(err instanceof Error ? err.message : "Falha ao deletar categoria.");
    } finally {
      setCategoryDeleteId(null);
    }
  }

  async function handleCreateAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const userId = Number(announcementCreateForm.userId);
    const payload = {
      userId,
      title: announcementCreateForm.title.trim(),
      message: announcementCreateForm.message.trim(),
    };

    if (!Number.isSafeInteger(userId) || userId <= 0 || !payload.title || !payload.message) {
      setFeedback("Selecione usuario e preencha titulo/mensagem do aviso.");
      return;
    }

    try {
      setAnnouncementCreateBusy(true);
      const response = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: buildAuthHeaders(true),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Nao foi possivel criar aviso."));
      }

      setAnnouncementCreateForm((prev) => ({ ...prev, title: "", message: "" }));
      await loadAnnouncements(1);
      setFeedback("Aviso criado com sucesso.");
    } catch (err) {
      console.error(err);
      setFeedback(err instanceof Error ? err.message : "Falha ao criar aviso.");
    } finally {
      setAnnouncementCreateBusy(false);
    }
  }

  async function handleUpdateAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingAnnouncementId) return;

    const userId = Number(announcementEditForm.userId);
    const payload = {
      userId,
      title: announcementEditForm.title.trim(),
      message: announcementEditForm.message.trim(),
    };

    if (!Number.isSafeInteger(userId) || userId <= 0 || !payload.title || !payload.message) {
      setFeedback("Selecione usuario e preencha titulo/mensagem do aviso.");
      return;
    }

    try {
      setAnnouncementUpdateBusy(true);
      const response = await fetch(`/api/admin/announcements/${editingAnnouncementId}`, {
        method: "PUT",
        headers: buildAuthHeaders(true),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Nao foi possivel atualizar aviso."));
      }

      setEditingAnnouncementId(null);
      setAnnouncementEditForm({ userId: "", title: "", message: "" });
      await loadAnnouncements(announcementsPage);
      setFeedback("Aviso atualizado com sucesso.");
    } catch (err) {
      console.error(err);
      setFeedback(err instanceof Error ? err.message : "Falha ao atualizar aviso.");
    } finally {
      setAnnouncementUpdateBusy(false);
    }
  }

  async function handleDeleteAnnouncement(item: AdminAnnouncement) {
    if (!window.confirm(`Deseja deletar o aviso ${item.title}?`)) return;

    try {
      setAnnouncementDeleteId(item.id);
      const response = await fetch(`/api/admin/announcements/${item.id}`, {
        method: "DELETE",
        headers: buildAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Nao foi possivel deletar aviso."));
      }

      if (editingAnnouncementId === item.id) setEditingAnnouncementId(null);

      const nextAnnouncementsPage =
        announcements.length <= 1 && announcementsPage > 1
          ? announcementsPage - 1
          : announcementsPage;
      await loadAnnouncements(nextAnnouncementsPage);
      setFeedback("Aviso deletado com sucesso.");
    } catch (err) {
      console.error(err);
      setFeedback(err instanceof Error ? err.message : "Falha ao deletar aviso.");
    } finally {
      setAnnouncementDeleteId(null);
    }
  }

  const cards = [
    { label: "Usuarios", value: stats.totalUsers, icon: Users },
    { label: "Profissionais", value: stats.totalProfessionals, icon: Briefcase },
    { label: "Pendentes", value: stats.pendingApprovals, icon: AlertTriangle },
    { label: "Receita/mes", value: stats.monthlyRevenue, icon: DollarSign },
  ];

  function getPaginationLabel(pagination: PaginationState) {
    if (pagination.total === 0) return "Pagina 0 de 0";
    const totalPages = pagination.totalPages > 0 ? pagination.totalPages : 1;
    return `Pagina ${pagination.page} de ${totalPages}`;
  }

  function goToUsersPage(nextPage: number) {
    if (nextPage < 1 || nextPage === usersPage) return;
    void loadUsers(nextPage);
  }

  function goToCategoriesPage(nextPage: number) {
    if (nextPage < 1 || nextPage === categoriesPage) return;
    void loadCategories(nextPage);
  }

  function goToAnnouncementsPage(nextPage: number) {
    if (nextPage < 1 || nextPage === announcementsPage) return;
    void loadAnnouncements(nextPage);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Carregando painel administrativo...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white border border-red-100 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-slate-900 text-lg mb-2">Falha ao carregar</h2>
          <p className="text-slate-500 text-sm mb-5">{error}</p>
          <button
            onClick={() => {
              void loadAll();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white" style={{ fontWeight: 700 }}>Painel Administrativo</h1>
              <p className="text-slate-400 text-sm">Zentry · Gestao</p>
            </div>
            {pendingList.length > 0 && (
              <div className="ml-auto flex items-center gap-2 bg-orange-500 text-white px-3 py-1.5 rounded-xl shadow-sm">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{pendingList.length} aprovacoes pendentes</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab.id
                    ? "text-white border-blue-400 bg-white/5"
                    : "text-slate-400 border-transparent hover:text-white hover:bg-white/5"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {feedback && <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">{feedback}</div>}
        {activeTab === "overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {cards.map((card) => (
                <div key={card.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                    <card.icon className="w-5 h-5 text-slate-700" />
                  </div>
                  <p className="text-slate-900 text-2xl font-bold">{card.label === "Receita/mes" ? `R$${card.value.toLocaleString("pt-BR")}` : card.value.toLocaleString("pt-BR")}</p>
                  <p className="text-xs text-slate-500 mt-1">{card.label}</p>
                </div>
              ))}
            </div>

            {pendingList.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-slate-900 mb-4">Aprovacoes pendentes</h3>
                <div className="space-y-3">
                  {pendingList.map((item) => (
                    <div key={item.id} className="border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">{item.name[0]}</div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-900 font-medium">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.category} · {item.date}</p>
                      </div>
                      <button
                        onClick={() => {
                          void reject(item.id);
                        }}
                        disabled={actionLoadingId === item.id}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl disabled:opacity-50"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          void approve(item.id);
                        }}
                        disabled={actionLoadingId === item.id}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-xl disabled:opacity-50"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "usuarios" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-slate-900 mb-4">Criar usuario</h3>
              <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                <input value={userCreateForm.name} onChange={(event) => setUserCreateForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Nome" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" required />
                <input value={userCreateForm.email} onChange={(event) => setUserCreateForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="Email" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" required />
                <input value={userCreateForm.cpf} onChange={(event) => setUserCreateForm((prev) => ({ ...prev, cpf: event.target.value }))} placeholder="CPF" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" required />
                <input value={userCreateForm.phone} onChange={(event) => setUserCreateForm((prev) => ({ ...prev, phone: event.target.value }))} placeholder="Telefone" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" required />
                <input value={userCreateForm.cep} onChange={(event) => setUserCreateForm((prev) => ({ ...prev, cep: formatCep(event.target.value) }))} onBlur={() => { void handleCreateUserCepBlur(); }} placeholder="CEP" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
                <input value={userCreateForm.endereco} onChange={(event) => setUserCreateForm((prev) => ({ ...prev, endereco: event.target.value }))} placeholder="Endereco" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" required={shouldRequireCreateAddress} />
                <input value={userCreateForm.numero} onChange={(event) => setUserCreateForm((prev) => ({ ...prev, numero: event.target.value }))} placeholder="Numero" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" required={shouldRequireCreateAddress} />
                <input value={userCreateForm.complemento} onChange={(event) => setUserCreateForm((prev) => ({ ...prev, complemento: event.target.value }))} placeholder="Complemento" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
                <input value={userCreateForm.bairro} onChange={(event) => setUserCreateForm((prev) => ({ ...prev, bairro: event.target.value }))} placeholder="Bairro" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" required={shouldRequireCreateAddress} />
                <input value={userCreateForm.cidade} onChange={(event) => setUserCreateForm((prev) => ({ ...prev, cidade: event.target.value }))} placeholder="Cidade" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" required={shouldRequireCreateAddress} />
                <input value={userCreateForm.uf} onChange={(event) => setUserCreateForm((prev) => ({ ...prev, uf: event.target.value.toUpperCase() }))} placeholder="UF" maxLength={2} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" required={shouldRequireCreateAddress} />
                <input value={userCreateForm.estado} onChange={(event) => setUserCreateForm((prev) => ({ ...prev, estado: event.target.value }))} placeholder="Estado" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
                <input type="password" value={userCreateForm.password} onChange={(event) => setUserCreateForm((prev) => ({ ...prev, password: event.target.value }))} placeholder="Senha" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" required />
                <select value={userCreateForm.role} onChange={(event) => setUserCreateForm((prev) => ({ ...prev, role: event.target.value as UserRole }))} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white">
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
                <div className="md:col-span-2 xl:col-span-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    {createUserCepLookupLoading
                      ? "Buscando endereco pelo CEP..."
                      : "Regra: telefone e obrigatorio. Se CEP for informado, endereco, numero, bairro, cidade e UF sao obrigatorios."}
                  </p>
                  <button type="submit" disabled={userCreateBusy} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
                    {userCreateBusy ? "Criando..." : "Criar usuario"}
                  </button>
                </div>
              </form>
            </div>

            {editingUser && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-slate-900 mb-4">Atualizar usuario</h3>
                <form onSubmit={handleUpdateUser} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  <input value={userEditForm.name} onChange={(event) => setUserEditForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Nome" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" required />
                  <input value={userEditForm.phone} onChange={(event) => setUserEditForm((prev) => ({ ...prev, phone: event.target.value }))} placeholder="Telefone" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
                  <input value={userEditForm.cep} onChange={(event) => setUserEditForm((prev) => ({ ...prev, cep: event.target.value }))} placeholder="CEP" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
                  <input value={userEditForm.endereco} onChange={(event) => setUserEditForm((prev) => ({ ...prev, endereco: event.target.value }))} placeholder="Endereco" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
                  <input value={userEditForm.numero} onChange={(event) => setUserEditForm((prev) => ({ ...prev, numero: event.target.value }))} placeholder="Numero" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
                  <input value={userEditForm.complemento} onChange={(event) => setUserEditForm((prev) => ({ ...prev, complemento: event.target.value }))} placeholder="Complemento" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
                  <input value={userEditForm.bairro} onChange={(event) => setUserEditForm((prev) => ({ ...prev, bairro: event.target.value }))} placeholder="Bairro" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
                  <input value={userEditForm.cidade} onChange={(event) => setUserEditForm((prev) => ({ ...prev, cidade: event.target.value }))} placeholder="Cidade" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
                  <input value={userEditForm.uf} onChange={(event) => setUserEditForm((prev) => ({ ...prev, uf: event.target.value }))} placeholder="UF" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
                  <input value={userEditForm.estado} onChange={(event) => setUserEditForm((prev) => ({ ...prev, estado: event.target.value }))} placeholder="Estado" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
                  <input type="password" value={userEditForm.password} onChange={(event) => setUserEditForm((prev) => ({ ...prev, password: event.target.value }))} placeholder="Nova senha (opcional)" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
                  <select value={userEditForm.role} onChange={(event) => setUserEditForm((prev) => ({ ...prev, role: event.target.value as UserRole }))} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white">
                    <option value="user">user</option>
                    {editingUser?.role === "professional" && (
                      <option value="professional" disabled>
                        professional (somente aprovacao)
                      </option>
                    )}
                    <option value="admin">admin</option>
                  </select>
                  <div className="md:col-span-2 xl:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600">Email bloqueado: {editingUser.email}</div>
                    <div className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600">CPF bloqueado: {editingUser.cpf ?? "-"}</div>
                  </div>
                  <div className="md:col-span-2 xl:col-span-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setEditingUserId(null)} className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100">Cancelar</button>
                    <button type="submit" disabled={userUpdateBusy} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
                      {userUpdateBusy ? "Salvando..." : "Salvar alteracoes"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center gap-3">
                <div className="flex-1">
                  <h3 className="text-slate-900">Gerenciar usuarios</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {getPaginationLabel(usersPagination)} · Total {usersPagination.total}
                  </p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar usuario..."
                    value={searchUser}
                    onChange={(event) => setSearchUser(event.target.value)}
                    className="pl-9 pr-4 py-2.5 bg-slate-100 rounded-xl text-sm outline-none w-64"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="text-left px-5 py-3">Nome</th>
                      <th className="text-left px-5 py-3">Email</th>
                      <th className="text-left px-5 py-3">CPF</th>
                      <th className="text-left px-5 py-3">Telefone</th>
                      <th className="text-left px-5 py-3">Perfil</th>
                      <th className="text-left px-5 py-3">Cadastro</th>
                      <th className="text-left px-5 py-3">Acoes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500">Nenhum usuario encontrado.</td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-5 py-4 text-sm text-slate-900">{user.name}</td>
                          <td className="px-5 py-4 text-sm text-slate-500">{user.email}</td>
                          <td className="px-5 py-4 text-sm text-slate-500">{user.cpf ?? "-"}</td>
                          <td className="px-5 py-4 text-sm text-slate-500">{user.phone ?? "-"}</td>
                          <td className="px-5 py-4 text-sm text-slate-700">{user.role}</td>
                          <td className="px-5 py-4 text-sm text-slate-500">{user.joined}</td>
                          <td className="px-5 py-4">
                            <div className="flex gap-2">
                              <button onClick={() => startEditUser(user)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  void handleDeleteUser(user);
                                }}
                                disabled={userDeleteId === user.id || (currentUserId !== null && currentUserId === user.id)}
                                className="p-2 hover:bg-red-50 text-red-500 rounded-xl disabled:opacity-40"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
                <p className="text-xs text-slate-500">
                  {searchUser.trim()
                    ? "Busca aplicada na pagina atual."
                    : `${getPaginationLabel(usersPagination)} · Total ${usersPagination.total}`}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToUsersPage(usersPage - 1)}
                    disabled={usersPage <= 1}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => goToUsersPage(usersPage + 1)}
                    disabled={!usersPagination.hasNext}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 disabled:opacity-40"
                  >
                    Proxima
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === "categorias" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-slate-900 mb-4">Criar categoria</h3>
              <form onSubmit={handleCreateCategory} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                <input value={categoryCreateForm.label} onChange={(event) => setCategoryCreateForm((prev) => ({ ...prev, label: event.target.value }))} placeholder="Label" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" required />
                <input value={categoryCreateForm.slug} onChange={(event) => setCategoryCreateForm((prev) => ({ ...prev, slug: event.target.value }))} placeholder="Slug (opcional)" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
                <input value={categoryCreateForm.icon} onChange={(event) => setCategoryCreateForm((prev) => ({ ...prev, icon: event.target.value }))} placeholder="Icone (opcional)" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
                <label className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm flex items-center gap-2 text-slate-600"><input type="checkbox" checked={categoryCreateForm.is_active} onChange={(event) => setCategoryCreateForm((prev) => ({ ...prev, is_active: event.target.checked }))} /> Ativa</label>
                <div className="md:col-span-2 xl:col-span-4 flex justify-end">
                  <button type="submit" disabled={categoryCreateBusy} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">{categoryCreateBusy ? "Criando..." : "Criar categoria"}</button>
                </div>
              </form>
            </div>

            {editingCategory && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-slate-900 mb-4">Atualizar categoria</h3>
                <form onSubmit={handleUpdateCategory} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  <input value={categoryEditForm.label} onChange={(event) => setCategoryEditForm((prev) => ({ ...prev, label: event.target.value }))} placeholder="Label" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" required />
                  <input value={categoryEditForm.slug} onChange={(event) => setCategoryEditForm((prev) => ({ ...prev, slug: event.target.value }))} placeholder="Slug" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
                  <input value={categoryEditForm.icon} onChange={(event) => setCategoryEditForm((prev) => ({ ...prev, icon: event.target.value }))} placeholder="Icone" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
                  <label className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm flex items-center gap-2 text-slate-600"><input type="checkbox" checked={categoryEditForm.is_active} onChange={(event) => setCategoryEditForm((prev) => ({ ...prev, is_active: event.target.checked }))} /> Ativa</label>
                  <div className="md:col-span-2 xl:col-span-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setEditingCategoryId(null)} className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100">Cancelar</button>
                    <button type="submit" disabled={categoryUpdateBusy} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">{categoryUpdateBusy ? "Salvando..." : "Salvar"}</button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200">
                <h3 className="text-slate-900">Categorias ({categoriesPagination.total})</h3>
                <p className="mt-1 text-xs text-slate-500">{getPaginationLabel(categoriesPagination)}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="text-left px-5 py-3">Label</th><th className="text-left px-5 py-3">Slug</th><th className="text-left px-5 py-3">Icone</th><th className="text-left px-5 py-3">Status</th><th className="text-left px-5 py-3">Acoes</th></tr></thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500">Nenhuma categoria encontrada.</td></tr>
                    ) : (
                      categories.map((item) => (
                        <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-5 py-4 text-sm text-slate-900">{item.label}</td>
                          <td className="px-5 py-4 text-sm text-slate-500">{item.slug}</td>
                          <td className="px-5 py-4 text-sm text-slate-500">{item.icon ?? "-"}</td>
                          <td className="px-5 py-4 text-sm text-slate-500">{item.is_active ? "Ativa" : "Inativa"}</td>
                          <td className="px-5 py-4"><div className="flex gap-2"><button onClick={() => startEditCategory(item)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl"><Pencil className="w-4 h-4" /></button><button onClick={() => { void handleDeleteCategory(item); }} disabled={categoryDeleteId === item.id} className="p-2 hover:bg-red-50 text-red-500 rounded-xl disabled:opacity-40"><Trash2 className="w-4 h-4" /></button></div></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
                <p className="text-xs text-slate-500">
                  {getPaginationLabel(categoriesPagination)} · Total {categoriesPagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToCategoriesPage(categoriesPage - 1)}
                    disabled={categoriesPage <= 1}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => goToCategoriesPage(categoriesPage + 1)}
                    disabled={!categoriesPagination.hasNext}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 disabled:opacity-40"
                  >
                    Proxima
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "avisos" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-slate-900 mb-4">Criar aviso</h3>
              <form onSubmit={handleCreateAnnouncement} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select value={announcementCreateForm.userId} onChange={(event) => setAnnouncementCreateForm((prev) => ({ ...prev, userId: event.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white" disabled={announcementRecipients.length === 0} required>
                    {announcementRecipients.length === 0 ? <option value="">Sem usuarios</option> : announcementRecipients.map((user) => <option key={user.id} value={user.id}>{user.name} ({user.email})</option>)}
                  </select>
                  <input value={announcementCreateForm.title} onChange={(event) => setAnnouncementCreateForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Titulo" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" required />
                </div>
                <textarea value={announcementCreateForm.message} onChange={(event) => setAnnouncementCreateForm((prev) => ({ ...prev, message: event.target.value }))} placeholder="Mensagem" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm min-h-[110px]" required />
                <div className="flex justify-end"><button type="submit" disabled={announcementCreateBusy || announcementRecipients.length === 0} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">{announcementCreateBusy ? "Criando..." : "Criar aviso"}</button></div>
              </form>
            </div>

            {editingAnnouncement && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-slate-900 mb-4">Atualizar aviso</h3>
                <form onSubmit={handleUpdateAnnouncement} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select value={announcementEditForm.userId} onChange={(event) => setAnnouncementEditForm((prev) => ({ ...prev, userId: event.target.value }))} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white" required>
                      {announcementRecipients.map((user) => <option key={user.id} value={user.id}>{user.name} ({user.email})</option>)}
                    </select>
                    <input value={announcementEditForm.title} onChange={(event) => setAnnouncementEditForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Titulo" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm" required />
                  </div>
                  <textarea value={announcementEditForm.message} onChange={(event) => setAnnouncementEditForm((prev) => ({ ...prev, message: event.target.value }))} placeholder="Mensagem" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm min-h-[110px]" required />
                  <div className="flex justify-end gap-3"><button type="button" onClick={() => setEditingAnnouncementId(null)} className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100">Cancelar</button><button type="submit" disabled={announcementUpdateBusy} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">{announcementUpdateBusy ? "Salvando..." : "Salvar"}</button></div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200">
                <h3 className="text-slate-900">Avisos ({announcementsPagination.total})</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {getPaginationLabel(announcementsPagination)}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="text-left px-5 py-3">Destino</th><th className="text-left px-5 py-3">Titulo</th><th className="text-left px-5 py-3">Mensagem</th><th className="text-left px-5 py-3">Lido</th><th className="text-left px-5 py-3">Criado em</th><th className="text-left px-5 py-3">Acoes</th></tr></thead>
                  <tbody>
                    {announcements.length === 0 ? (
                      <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">Nenhum aviso encontrado.</td></tr>
                    ) : (
                      announcements.map((item) => (
                        <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-5 py-4 text-sm text-slate-700"><p>{item.userName}</p><p className="text-xs text-slate-500">{item.userEmail}</p></td>
                          <td className="px-5 py-4 text-sm text-slate-900">{item.title}</td>
                          <td className="px-5 py-4 text-sm text-slate-500" title={item.message}>{compact(item.message)}</td>
                          <td className="px-5 py-4 text-sm text-slate-500">{item.isRead ? "Sim" : "Nao"}</td>
                          <td className="px-5 py-4 text-sm text-slate-500">{formatDateTime(item.createdAt)}</td>
                          <td className="px-5 py-4"><div className="flex gap-2"><button onClick={() => startEditAnnouncement(item)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl"><Pencil className="w-4 h-4" /></button><button onClick={() => { void handleDeleteAnnouncement(item); }} disabled={announcementDeleteId === item.id} className="p-2 hover:bg-red-50 text-red-500 rounded-xl disabled:opacity-40"><Trash2 className="w-4 h-4" /></button></div></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
                <p className="text-xs text-slate-500">
                  {getPaginationLabel(announcementsPagination)} · Total {announcementsPagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToAnnouncementsPage(announcementsPage - 1)}
                    disabled={announcementsPage <= 1}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => goToAnnouncementsPage(announcementsPage + 1)}
                    disabled={!announcementsPagination.hasNext}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 disabled:opacity-40"
                  >
                    Proxima
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "profissionais" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-slate-900 mb-3">Profissionais ativos ({professionals.length})</h3>
            {professionals.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum profissional encontrado.</p>
            ) : (
              <div className="space-y-2">
                {professionals.map((item) => (
                  <div key={item.id} className="border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.categoryLabel}</p>
                    </div>
                    <div className="text-xs text-slate-500">{item.status}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "pagamentos" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-slate-900 mb-3">Pagamentos ({payments.length})</h3>
            <p className="text-sm text-slate-500">Receita total: R${stats.totalRevenue.toLocaleString("pt-BR")}</p>
          </div>
        )}

        {activeTab === "relatorios" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-slate-900 mb-3">Categorias</h3>
              {categoryDistribution.length === 0 ? <p className="text-sm text-slate-500">Sem dados.</p> : categoryDistribution.map((item) => <p key={item.label} className="text-sm text-slate-600">{item.label}: {item.value}%</p>)}
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-slate-900 mb-3">Metricas do mes</h3>
              {monthlyMetrics.length === 0 ? <p className="text-sm text-slate-500">Sem dados.</p> : monthlyMetrics.map((item, index) => <p key={index} className="text-sm text-slate-600">{item.label}: {item.value} ({item.trend})</p>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;


