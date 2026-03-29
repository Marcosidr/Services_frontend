import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Briefcase,
  DollarSign,
  BarChart3,
  CheckCircle,
  XCircle,
  Search,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Eye,
  RefreshCw,
} from "lucide-react";
import { getAuthorizationHeader } from "../utils/auth";

type AdminTab =
  | "overview"
  | "usuarios"
  | "profissionais"
  | "pagamentos"
  | "relatorios";

type UserStatus = "ativo" | "bloqueado";
type PaymentStatus = "pago" | "pendente" | "reembolsado";
type ProfessionalStatus = "online" | "offline";

interface AdminStats {
  totalUsers: number;
  totalProfessionals: number;
  monthlyRevenue: number;
  completedJobs: number;
  activeJobs: number;
  pendingApprovals: number;
  pendingAmount: number;
  refundedAmount: number;
  totalRevenue: number;
}

interface PendingProfessional {
  id: string;
  name: string;
  category: string;
  date: string;
  docs: boolean;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  joined: string;
  orders: number;
  status: UserStatus;
}

interface AdminProfessional {
  id: string;
  name: string;
  photo?: string;
  categoryLabel: string;
  rating: number;
  completedJobs: number;
  status: ProfessionalStatus;
  verified: boolean;
}

interface AdminPayment {
  id: string;
  user: string;
  professional: string;
  amount: number;
  date: string;
  method: string;
  status: PaymentStatus;
}

interface CategoryReport {
  label: string;
  value: number;
}

interface MonthlyMetric {
  label: string;
  value: string;
  trend: string;
  up: boolean;
}

interface AdminDashboardResponse {
  stats: AdminStats;
  pendingProfessionals: PendingProfessional[];
  users: AdminUser[];
  professionals: AdminProfessional[];
  payments: AdminPayment[];
  categoryDistribution: CategoryReport[];
  monthlyMetrics: MonthlyMetric[];
}

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

const categoryColors = [
  "bg-blue-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-gray-400",
];

 function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [searchUser, setSearchUser] = useState("");
  const [stats, setStats] = useState<AdminStats>(emptyStats);
  const [pendingList, setPendingList] = useState<PendingProfessional[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [professionals, setProfessionals] = useState<AdminProfessional[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<
    CategoryReport[]
  >([]);
  const [monthlyMetrics, setMonthlyMetrics] = useState<MonthlyMetric[]>([]);

  const [approvedIds, setApprovedIds] = useState<string[]>([]);
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: "overview", label: "Visão geral", icon: BarChart3 },
    { id: "usuarios", label: "Usuários", icon: Users },
    { id: "profissionais", label: "Profissionais", icon: Briefcase },
    { id: "pagamentos", label: "Pagamentos", icon: DollarSign },
    { id: "relatorios", label: "Relatórios", icon: TrendingUp },
  ];

  async function loadAdminDashboard() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/dashboard", {
        headers: {
          ...getAuthorizationHeader(),
        },
      });

      if (!response.ok) {
        throw new Error("Não foi possível carregar o painel administrativo.");
      }

      const data: AdminDashboardResponse = await response.json();

      setStats(data.stats ?? emptyStats);
      setPendingList(
        Array.isArray(data.pendingProfessionals) ? data.pendingProfessionals : []
      );
      setUsers(Array.isArray(data.users) ? data.users : []);
      setProfessionals(Array.isArray(data.professionals) ? data.professionals : []);
      setPayments(Array.isArray(data.payments) ? data.payments : []);
      setCategoryDistribution(
        Array.isArray(data.categoryDistribution) ? data.categoryDistribution : []
      );
      setMonthlyMetrics(
        Array.isArray(data.monthlyMetrics) ? data.monthlyMetrics : []
      );
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar os dados administrativos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminDashboard();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchUser.toLowerCase()) ||
        user.email.toLowerCase().includes(searchUser.toLowerCase())
    );
  }, [users, searchUser]);

  async function approve(id: string) {
    try {
      setActionLoadingId(id);

      const response = await fetch(`/api/admin/professionals/${id}/approve`, {
        method: "POST",
        headers: {
          ...getAuthorizationHeader(),
        },
      });

      if (!response.ok) {
        throw new Error("Não foi possível aprovar o profissional.");
      }

      setApprovedIds((prev) => [...prev, id]);
      setPendingList((prev) => prev.filter((item) => item.id !== id));
      setStats((prev) => ({
        ...prev,
        pendingApprovals: Math.max(prev.pendingApprovals - 1, 0),
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  }

  async function reject(id: string) {
    try {
      setActionLoadingId(id);

      const response = await fetch(`/api/admin/professionals/${id}/reject`, {
        method: "POST",
        headers: {
          ...getAuthorizationHeader(),
        },
      });

      if (!response.ok) {
        throw new Error("Não foi possível recusar o profissional.");
      }

      setRejectedIds((prev) => [...prev, id]);
      setPendingList((prev) => prev.filter((item) => item.id !== id));
      setStats((prev) => ({
        ...prev,
        pendingApprovals: Math.max(prev.pendingApprovals - 1, 0),
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  }

  const overviewCards = [
    {
      label: "Usuários",
      value: stats.totalUsers.toLocaleString("pt-BR"),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      trend: "",
      up: true,
    },
    {
      label: "Profissionais",
      value: stats.totalProfessionals.toLocaleString("pt-BR"),
      icon: Briefcase,
      color: "text-purple-600",
      bg: "bg-purple-50",
      trend: "",
      up: true,
    },
    {
      label: "Pendentes",
      value: stats.pendingApprovals.toLocaleString("pt-BR"),
      icon: AlertTriangle,
      color: "text-orange-600",
      bg: "bg-orange-50",
      trend: "",
      up: false,
    },
    {
      label: "Receita/mês",
      value: `R$${stats.monthlyRevenue.toLocaleString("pt-BR")}`,
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-50",
      trend: "",
      up: true,
    },
    {
      label: "Jobs feitos",
      value: stats.completedJobs.toLocaleString("pt-BR"),
      icon: CheckCircle,
      color: "text-teal-600",
      bg: "bg-teal-50",
      trend: "",
      up: true,
    },
    {
      label: "Ativos agora",
      value: stats.activeJobs.toLocaleString("pt-BR"),
      icon: TrendingUp,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      trend: "",
      up: true,
    },
  ];

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
            onClick={loadAdminDashboard}
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
              <h1 className="text-white" style={{ fontWeight: 700 }}>
                Painel Administrativo
              </h1>
              <p className="text-slate-400 text-sm">Zentry · Gestão</p>
            </div>

            {pendingList.length > 0 && (
              <div className="ml-auto flex items-center gap-2 bg-orange-500 text-white px-3 py-1.5 rounded-xl shadow-sm">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">
                  {pendingList.length} aprovações pendentes
                </span>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              {overviewCards.map((card, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow"
                >
                  <div
                    className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-4`}
                  >
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>

                  <p
                    className="text-slate-900"
                    style={{ fontWeight: 700, fontSize: "1.35rem" }}
                  >
                    {card.value}
                  </p>

                  <p className="text-xs text-slate-500 mt-1">{card.label}</p>

                  {card.trend && (
                    <div
                      className={`flex items-center gap-1 mt-2 text-xs ${
                        card.up ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {card.up ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {card.trend}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {pendingList.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-slate-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  Aprovações pendentes ({pendingList.length})
                </h3>

                <div className="flex flex-col gap-3">
                  {pendingList.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors"
                    >
                      <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                        {item.name[0]}
                      </div>

                      <div className="flex-1">
                        <p
                          className="text-sm text-slate-900"
                          style={{ fontWeight: 600 }}
                        >
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.category} · {item.date}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            item.docs ? "text-green-600" : "text-orange-600"
                          }`}
                        >
                          {item.docs ? "✅ Documentos enviados" : "⚠️ Documentos pendentes"}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => reject(item.id)}
                          disabled={actionLoadingId === item.id}
                          className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-60"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() => approve(item.id)}
                          disabled={actionLoadingId === item.id}
                          className="p-2.5 text-green-600 hover:bg-green-50 rounded-xl transition-colors disabled:opacity-60"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "usuarios" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center gap-3">
              <h3 className="text-slate-900 flex-1">Gerenciar Usuários</h3>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar usuário..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="pl-9 pr-4 py-2.5 bg-slate-100 rounded-xl text-sm outline-none w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="text-left px-5 py-3">Nome</th>
                    <th className="text-left px-5 py-3">E-mail</th>
                    <th className="text-left px-5 py-3">Cadastro</th>
                    <th className="text-left px-5 py-3">Pedidos</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-left px-5 py-3">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-8 text-center text-sm text-slate-500"
                      >
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-t border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td
                          className="px-5 py-4 text-sm text-slate-900"
                          style={{ fontWeight: 500 }}
                        >
                          {user.name}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {user.email}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {user.joined}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700">
                          {user.orders}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full ${
                              user.status === "ativo"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>

                            <button className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "profissionais" && (
          <div className="flex flex-col gap-5">
            {pendingList.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
                <h3 className="text-orange-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Aguardando aprovação ({pendingList.length})
                </h3>

                <div className="flex flex-col gap-3">
                  {pendingList.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm"
                    >
                      <div
                        className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600"
                        style={{ fontWeight: 600 }}
                      >
                        {item.name[0]}
                      </div>

                      <div className="flex-1">
                        <p
                          className="text-sm text-slate-900"
                          style={{ fontWeight: 600 }}
                        >
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.category} · Solicitado em {item.date}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => reject(item.id)}
                          disabled={actionLoadingId === item.id}
                          className="px-3 py-2 text-sm bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-60"
                        >
                          Recusar
                        </button>

                        <button
                          onClick={() => approve(item.id)}
                          disabled={actionLoadingId === item.id}
                          className="px-3 py-2 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60"
                        >
                          Aprovar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200">
                <h3 className="text-slate-900">
                  Profissionais ativos ({professionals.length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="text-left px-5 py-3">Profissional</th>
                      <th className="text-left px-5 py-3">Categoria</th>
                      <th className="text-left px-5 py-3">Avaliação</th>
                      <th className="text-left px-5 py-3">Jobs</th>
                      <th className="text-left px-5 py-3">Status</th>
                      <th className="text-left px-5 py-3">Verificado</th>
                    </tr>
                  </thead>

                  <tbody>
                    {professionals.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-8 text-center text-sm text-slate-500"
                        >
                          Nenhum profissional encontrado.
                        </td>
                      </tr>
                    ) : (
                      professionals.map((professional) => (
                        <tr
                          key={professional.id}
                          className="border-t border-slate-100 hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {professional.photo ? (
                                <img
                                  src={professional.photo}
                                  alt={professional.name}
                                  className="w-9 h-9 rounded-xl object-cover"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                                  {professional.name[0]}
                                </div>
                              )}

                              <span className="text-sm text-slate-900">
                                {professional.name}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {professional.categoryLabel}
                          </td>

                          <td className="px-5 py-4 text-sm text-yellow-600">
                            ★ {professional.rating.toFixed(1)}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {professional.completedJobs}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full ${
                                professional.status === "online"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {professional.status === "online"
                                ? "Online"
                                : "Offline"}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            {professional.verified ? (
                              <CheckCircle className="w-4 h-4 text-blue-500" />
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "pagamentos" && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  label: "Receita total",
                  value: `R$${stats.totalRevenue.toLocaleString("pt-BR")}`,
                  color: "text-green-600",
                  bg: "bg-green-50",
                },
                {
                  label: "Pendente",
                  value: `R$${stats.pendingAmount.toLocaleString("pt-BR")}`,
                  color: "text-orange-600",
                  bg: "bg-orange-50",
                },
                {
                  label: "Reembolsos",
                  value: `R$${stats.refundedAmount.toLocaleString("pt-BR")}`,
                  color: "text-red-500",
                  bg: "bg-red-50",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className={`${item.bg} rounded-2xl p-5 border border-slate-200`}
                >
                  <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                  <p
                    className={item.color}
                    style={{ fontWeight: 700, fontSize: "1.5rem" }}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200">
                <h3 className="text-slate-900">Transações recentes</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="text-left px-5 py-3">ID</th>
                      <th className="text-left px-5 py-3">Cliente</th>
                      <th className="text-left px-5 py-3">Profissional</th>
                      <th className="text-left px-5 py-3">Valor</th>
                      <th className="text-left px-5 py-3">Data</th>
                      <th className="text-left px-5 py-3">Método</th>
                      <th className="text-left px-5 py-3">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-5 py-8 text-center text-sm text-slate-500"
                        >
                          Nenhuma transação encontrada.
                        </td>
                      </tr>
                    ) : (
                      payments.map((payment) => (
                        <tr
                          key={payment.id}
                          className="border-t border-slate-100 hover:bg-slate-50"
                        >
                          <td className="px-5 py-4 text-xs text-slate-400 font-mono">
                            #{payment.id}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {payment.user}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {payment.professional}
                          </td>

                          <td
                            className="px-5 py-4 text-sm text-slate-900"
                            style={{ fontWeight: 600 }}
                          >
                            R${payment.amount.toLocaleString("pt-BR")}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {payment.date}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {payment.method}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full ${
                                payment.status === "pago"
                                  ? "bg-green-100 text-green-700"
                                  : payment.status === "pendente"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-600"
                              }`}
                            >
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "relatorios" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-slate-900 mb-5">Serviços por categoria</h3>

              {categoryDistribution.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhum dado de categoria disponível.
                </p>
              ) : (
                categoryDistribution.map((item, index) => (
                  <div key={item.label} className="mb-4 last:mb-0">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="text-slate-900" style={{ fontWeight: 600 }}>
                        {item.value}%
                      </span>
                    </div>

                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          categoryColors[index % categoryColors.length]
                        } rounded-full transition-all`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-slate-900 mb-5">Métricas do mês</h3>

              {monthlyMetrics.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhuma métrica disponível.
                </p>
              ) : (
                monthlyMetrics.map((metric, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                  >
                    <span className="text-sm text-slate-600">{metric.label}</span>

                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm text-slate-900"
                        style={{ fontWeight: 600 }}
                      >
                        {metric.value}
                      </span>

                      <span
                        className={`text-xs ${
                          metric.up ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {metric.trend}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default AdminPanel;
