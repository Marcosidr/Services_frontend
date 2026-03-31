import { Outlet } from "react-router-dom";
import Header from "../componentes/Header";
import Footer from "../componentes/Footer";

function Root() {
  return (
    <div className="page-shell flex min-h-screen flex-col">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="animate-float-slow absolute -top-24 -left-28 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div
          className="animate-float-slow absolute top-1/3 -right-20 h-72 w-72 rounded-full bg-secondary/15 blur-3xl"
          style={{ animationDelay: "1.2s" }}
        />
        <div
          className="animate-float-slow absolute bottom-[-8rem] left-1/3 h-72 w-72 rounded-full bg-accent/15 blur-3xl"
          style={{ animationDelay: "2.1s" }}
        />
      </div>
      <Header />
      <main className="relative z-10 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default Root;
