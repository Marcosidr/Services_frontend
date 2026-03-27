export type ViaCepAddress = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  estado: string;
};

type ViaCepResponse = Partial<ViaCepAddress> & {
  erro?: boolean;
};

export function normalizeCep(cep: string) {
  return cep.replace(/\D/g, "");
}

export function eNumero(numero: string) {
  return /^[0-9]+$/.test(numero);
}

export function cepValido(cep: string) {
  const normalizedCep = normalizeCep(cep);
  return normalizedCep.length === 8 && eNumero(normalizedCep);
}

export function formatCep(cep: string) {
  const normalizedCep = normalizeCep(cep).slice(0, 8);
  if (normalizedCep.length <= 5) return normalizedCep;
  return `${normalizedCep.slice(0, 5)}-${normalizedCep.slice(5)}`;
}

export async function fetchViaCep(cep: string) {
  const normalizedCep = normalizeCep(cep);
  if (!cepValido(normalizedCep)) return null;

  const response = await fetch(`https://viacep.com.br/ws/${normalizedCep}/json/`);
  if (!response.ok) return null;

  const data = (await response.json()) as ViaCepResponse;
  if (data.erro) return null;

  if (
    typeof data.logradouro !== "string" ||
    typeof data.bairro !== "string" ||
    typeof data.localidade !== "string" ||
    typeof data.uf !== "string"
  ) {
    return null;
  }

  return {
    cep: typeof data.cep === "string" ? data.cep : normalizedCep,
    logradouro: data.logradouro,
    complemento: typeof data.complemento === "string" ? data.complemento : "",
    bairro: data.bairro,
    localidade: data.localidade,
    uf: data.uf,
    estado: typeof data.estado === "string" ? data.estado : ""
  } as ViaCepAddress;
}

