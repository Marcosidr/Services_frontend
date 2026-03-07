import { useLocation } from "react-router-dom";

function SearchPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const query = params.get("q");

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl text-gray-900 mb-2">Busca de profissionais</h1>
      <p className="text-gray-600">
        {query ? `Resultados para: ${query}` : "Use a busca da pagina inicial para filtrar profissionais."}
      </p>
    </section>
  );
}

export default SearchPage;
