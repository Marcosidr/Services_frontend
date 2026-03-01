import Header from "./app/componentes/header";
import Footer from "./app/componentes/Footer";
import Home from "./app/pages/Home";

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1">
        <Home />
      </div>
      <Footer />
    </div>
  );
}

export default App;
