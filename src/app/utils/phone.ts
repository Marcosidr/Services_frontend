const BRAZIL_COUNTRY_CODE = "55";
const MAX_LOCAL_PHONE_LENGTH = 11;

export function normalizePhone(phone: string) {
  const digitsOnly = phone.replace(/\D/g, "");

  if (
    digitsOnly.startsWith(BRAZIL_COUNTRY_CODE) &&
    digitsOnly.length > MAX_LOCAL_PHONE_LENGTH
  ) {
    return digitsOnly.slice(BRAZIL_COUNTRY_CODE.length, BRAZIL_COUNTRY_CODE.length + MAX_LOCAL_PHONE_LENGTH);
  }

  return digitsOnly.slice(0, MAX_LOCAL_PHONE_LENGTH);
}

export function formatPhone(phone: string) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return "";

  if (normalizedPhone.length <= 2) {
    return `(${normalizedPhone}`;
  }

  const ddd = normalizedPhone.slice(0, 2);
  const remaining = normalizedPhone.slice(2);

  if (remaining.length <= 4) {
    return `(${ddd}) ${remaining}`;
  }

  const firstPartLength = normalizedPhone.length >= 11 ? 5 : 4;
  const firstPart = remaining.slice(0, firstPartLength);
  const secondPart = remaining.slice(firstPartLength);

  return `(${ddd}) ${firstPart}${secondPart ? `-${secondPart}` : ""}`;
}

export function isValidPhone(phone: string) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return false;
  if (/^(\d)\1+$/.test(normalizedPhone)) return false;

  const brazilPhoneRegex = /^(?:[1-9]{2}9\d{8}|[1-9]{2}[2-9]\d{7})$/;
  return brazilPhoneRegex.test(normalizedPhone);
}

export function getPhoneValidationError(phone: string) {
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone) {
    return "Informe o telefone.";
  }

  if (!isValidPhone(normalizedPhone)) {
    return "Telefone invalido. Use DDD + numero com 10 ou 11 digitos.";
  }

  return "";
}
