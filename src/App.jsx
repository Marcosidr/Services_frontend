import { RouterProvider } from "react-router-dom";
import { router } from "./app/routes";
import { AuthProvider } from "./app/context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
