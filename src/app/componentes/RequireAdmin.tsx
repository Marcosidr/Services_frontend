import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type RequireAdminProps = {
  children: ReactNode;
};

function RequireAdmin({ children }: RequireAdminProps) {
  const { isAuthenticated, isAdmin, refreshUser } = useAuth();
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAccess = async () => {
      if (!isAuthenticated) {
        if (!mounted) return;
        setCheckingAccess(false);
        return;
      }

      try {
        await refreshUser();
      } catch {
        // Se a rede falhar, mantem o dado local.
      }

      if (!mounted) return;
      setCheckingAccess(false);
    };

    void checkAccess();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, refreshUser]);

  if (!isAuthenticated) {
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
