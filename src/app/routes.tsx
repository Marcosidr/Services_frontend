import { createBrowserRouter } from "react-router-dom";

import Root from "./pages/Root";
import Home from "./pages/Home";
import SearchPage from "./pages/Search";
import ProfessionalProfile from "./pages/ProfessionalProfile";
import Login from "./pages/Login";
import RegisterProfessional from "./pages/RegisterProfessional";
import UserDashboard from "./pages/UserDashboard";
import AdminPainel from "./pages/AdminPainel";
import Contato from "./pages/contato";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      { index: true, element: <Home /> },
      { path: "profissionais", element: <SearchPage /> },
      { path: "contato", element: <Contato /> },
      { path: "profissional/:id", element: <ProfessionalProfile /> },
      { path: "painel", element: <UserDashboard /> },
      { path: "admin", element: <AdminPainel /> },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/cadastrar-profissional",
    element: <RegisterProfessional />,
  },
]);
