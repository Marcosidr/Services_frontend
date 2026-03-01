import { useState } from "react";
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
} from "lucide-react";
import { professionals, adminStats } from "../data/mockData";

type AdminTab = "overview" | "usuarios" | "profissionais" | "pagamentos" | "relatorios";

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [searchUser, setSearchUser] = useState("");
  const [pendingList, setPendingList] = useState(pendingPros);
  const [approvedIds, setApprovedIds] = useState<string[]>([]);
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);

  const approve = (id: string) => {
    setApprovedIds((a) => [...a, id]);
    setTimeout(
      () => setPendingList((p) => p.filter((x) => x.id !== id)),
      800
    );
  };

  const reject = (id: string) => {
    setRejectedIds((r) => [...r, id]);
    setTimeout(
      () => setPendingList((p) => p.filter((x) => x.id !== id)),
      800
    );
  };

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: "overview", label: "Visão geral", icon: BarChart3 },
    { id: "usuarios", label: "Usuários", icon: Users },
    { id: "profissionais", label: "Profissionais", icon: Briefcase },
    { id: "pagamentos", label: "Pagamentos", icon: DollarSign },
    { id: "relatorios", label: "Relatórios", icon: TrendingUp },
  ];

  const filteredUsers = mockUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin header */}
      <div className="bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white" style={{ fontWeight: 700 }}>
                Painel Administrativo
              </h1>
              <p className="text-blue-300 text-sm">ResolveAqui · Admin</p>
            </div>
            {pendingList.length > 0 && (
              <div className="ml-auto flex items-center gap-2 bg-orange-500 px-3 py-1.5 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{pendingList.length} aprovações pendentes</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm whitespace-nowrap transition-all ${
                  activeTab === t.id
                    ? "bg-white/20 text-white border-b-2 border-orange-400"
                    : "text-blue-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Overview */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6">
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                {
                  label: "Usuários",
                  value: adminStats.totalUsers.toLocaleString("pt-BR"),
                  icon: Users,
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                  trend: "+12%",
                  up: true,
                },
                {
                  label: "Profissionais",
                  value: adminStats.totalProfessionals,
                  icon: Briefcase,
                  color: "text-purple-600",
                  bg: "bg-purple-50",
                  trend: "+8%",
                  up: true,
                },
                {
                  label: "Pendentes",
                  value: pendingList.length,
                  icon: AlertTriangle,
                  color: "text-orange-600",
                  bg: "bg-orange-50",
                  trend: "",
                  up: false,
                },
                {
                  label: "Receita/mês",
                  value: `R$${adminStats.monthlyRevenue.toLocaleString("pt-BR")}`,
                  icon: DollarSign,
                  color: "text-green-600",
                  bg: "bg-green-50",
                  trend: "+24%",
                  up: true,
                },
                {
                  label: "Jobs feitos",
                  value: adminStats.completedJobs,
                  icon: CheckCircle,
                  color: "text-teal-600",
                  bg: "bg-teal-50",
                  trend: "+18%",
                  up: true,
                },
                {
                  label: "Ativos agora",
                  value: adminStats.activeJobs,
                  icon: TrendingUp,
                  color: "text-indigo-600",
                  bg: "bg-indigo-50",
                  trend: "",
                  up: true,
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
                >
                  <div
                    className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mb-3`}
                  >
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <p
                    className="text-gray-900"
                    style={{ fontWeight: 700, fontSize: "1.25rem" }}
                  >
                    {s.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  {s.trend && (
                    <div
                      className={`flex items-center gap-1 mt-1 text-xs ${
                        s.up ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {s.up ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {s.trend}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pending approvals */}
            {pendingList.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  Aprovações pendentes ({pendingList.length})
                </h3>
                <div className="flex flex-col gap-3">
                  {pendingList.map((p) => (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        approvedIds.includes(p.id)
                          ? "border-green-200 bg-green-50"
                          : rejectedIds.includes(p.id)
                          ? "border-red-200 bg-red-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0">
                        {p.name[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>
                          {p.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {p.category} · {p.date}
                        </p>
                        <span
                          className={`text-xs ${
                            p.docs ? "text-green-600" : "text-orange-600"
                          }`}
                        >
                          {p.docs ? "✅ Docs enviados" : "⚠️ Docs pendentes"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => reject(p.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => approve(p.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
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

        {/* Usuários tab */}
        {activeTab === "usuarios" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center gap-3">
              <h3 className="text-gray-900 flex-1">Gerenciar Usuários</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar usuário..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-sm outline-none w-48"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-xs text-gray-500">
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
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3 text-sm text-gray-800" style={{ fontWeight: 500 }}>
                        {u.name}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {u.email}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {u.joined}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700">
                        {u.orders}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            u.status === "ativo"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Profissionais tab */}
        {activeTab === "profissionais" && (
          <div className="flex flex-col gap-4">
            {/* Pending section */}
            {pendingList.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
                <h3 className="text-orange-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Aguardando aprovação ({pendingList.length})
                </h3>
                <div className="flex flex-col gap-3">
                  {pendingList.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm"
                    >
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600" style={{ fontWeight: 600 }}>
                        {p.name[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>
                          {p.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {p.category} · Solicitado em {p.date}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => reject(p.id)}
                          className="px-3 py-1.5 text-sm bg-red-50 text-red-500 rounded-lg hover:bg-red-100"
                        >
                          Recusar
                        </button>
                        <button
                          onClick={() => approve(p.id)}
                          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Aprovar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approved professionals */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="text-gray-900">Profissionais ativos ({professionals.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-xs text-gray-500">
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
                    {professionals.map((p) => (
                      <tr
                        key={p.id}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={p.photo}
                              alt={p.name}
                              className="w-8 h-8 rounded-lg object-cover"
                            />
                            <span className="text-sm text-gray-800">
                              {p.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-500">
                          {p.categoryLabel}
                        </td>
                        <td className="px-5 py-3 text-sm text-yellow-600">
                          ★ {p.rating}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-700">
                          {p.completedJobs}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              p.online
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {p.online ? "Online" : "Offline"}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {p.verified ? (
                            <CheckCircle className="w-4 h-4 text-blue-500" />
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Pagamentos tab */}
        {activeTab === "pagamentos" && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  label: "Receita total",
                  value: "R$48.750",
                  color: "text-green-600",
                  bg: "bg-green-50",
                },
                {
                  label: "Pendente",
                  value: "R$360",
                  color: "text-orange-600",
                  bg: "bg-orange-50",
                },
                {
                  label: "Reembolsos",
                  value: "R$200",
                  color: "text-red-500",
                  bg: "bg-red-50",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className={`${s.bg} rounded-2xl p-5 border border-opacity-20`}
                >
                  <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                  <p className={s.color} style={{ fontWeight: 700, fontSize: "1.5rem" }}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="text-gray-900">Transações recentes</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-xs text-gray-500">
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
                    {mockPayments.map((p) => (
                      <tr
                        key={p.id}
                        className="border-t border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-5 py-3 text-xs text-gray-400 font-mono">
                          #{p.id}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-700">{p.user}</td>
                        <td className="px-5 py-3 text-sm text-gray-700">{p.pro}</td>
                        <td className="px-5 py-3 text-sm text-gray-800" style={{ fontWeight: 600 }}>
                          R${p.amount}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-500">{p.date}</td>
                        <td className="px-5 py-3 text-sm text-gray-500">{p.method}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              p.status === "pago"
                                ? "bg-green-100 text-green-700"
                                : p.status === "pendente"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Relatórios tab */}
        {activeTab === "relatorios" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category distribution */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-gray-900 mb-4">Serviços por categoria</h3>
              {[
                { label: "Diarista", value: 35, color: "bg-blue-500" },
                { label: "Marido de Aluguel", value: 22, color: "bg-orange-500" },
                { label: "Eletricista", value: 18, color: "bg-yellow-500" },
                { label: "Encanador", value: 12, color: "bg-purple-500" },
                { label: "Montador", value: 8, color: "bg-green-500" },
                { label: "Outros", value: 5, color: "bg-gray-400" },
              ].map((item) => (
                <div key={item.label} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="text-gray-800" style={{ fontWeight: 600 }}>
                      {item.value}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Monthly metrics */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-gray-900 mb-4">Métricas do mês</h3>
              {[
                {
                  label: "Taxa de conclusão",
                  value: "94.2%",
                  trend: "+2.1%",
                  up: true,
                },
                {
                  label: "Tempo médio resposta",
                  value: "8 min",
                  trend: "-1.3 min",
                  up: true,
                },
                {
                  label: "NPS (satisfação)",
                  value: "87",
                  trend: "+5",
                  up: true,
                },
                {
                  label: "Cancelamentos",
                  value: "5.8%",
                  trend: "-0.3%",
                  up: true,
                },
                {
                  label: "Novos profissionais",
                  value: "34",
                  trend: "+12",
                  up: true,
                },
                {
                  label: "Novos usuários",
                  value: "142",
                  trend: "+28%",
                  up: true,
                },
              ].map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0"
                >
                  <span className="text-sm text-gray-600">{m.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>
                      {m.value}
                    </span>
                    <span
                      className={`text-xs ${
                        m.up ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {m.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
