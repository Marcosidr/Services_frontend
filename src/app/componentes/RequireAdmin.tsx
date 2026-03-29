import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import {
  isAuthenticated,
  isStoredUserAdmin,
  refreshStoredUserFromApi
} from "../utils/auth";

type RequireAdminProps = {
  children: ReactNode;
};

function RequireAdmin({ children }: RequireAdminProps) {
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAccess = async () => {
      if (!isAuthenticated()) {
        if (!mounted) return;
        setIsAdmin(false);
        setCheckingAccess(false);
        return;
      }

      setIsAdmin(isStoredUserAdmin());

      try {
        await refreshStoredUserFromApi();
      } catch {
        // Se a rede falhar, mantem o dado local.
      }

      if (!mounted) return;
      setIsAdmin(isStoredUserAdmin());
      setCheckingAccess(false);
    };

    void checkAccess();

    return () => {
      mounted = false;
    };
  }, []);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Validando acesso...
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default RequireAdmin;
