const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return EMAIL_REGEX.test(normalizeEmail(email));
}

export function getEmailValidationError(email: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return "Informe seu e-mail.";
  }

  if (!isValidEmail(normalizedEmail)) {
    return "Informe um e-mail valido.";
  }

  return "";
}
