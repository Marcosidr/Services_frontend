import { Outlet } from "react-router-dom";
import Header from "../componentes/Header";
import Footer from "../componentes/Footer";

function Root() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default Root;
