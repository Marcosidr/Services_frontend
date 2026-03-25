const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 64;

export function getPasswordValidationError(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `A senha deve ter no minimo ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return `A senha deve ter no maximo ${MAX_PASSWORD_LENGTH} caracteres.`;
  }

  if (/\s/.test(password)) {
    return "A senha nao pode conter espacos.";
  }

  if (!/[a-z]/.test(password)) {
    return "A senha deve conter ao menos 1 letra minuscula.";
  }

  if (!/[A-Z]/.test(password)) {
    return "A senha deve conter ao menos 1 letra maiuscula.";
  }

  if (!/\d/.test(password)) {
    return "A senha deve conter ao menos 1 numero.";
  }

  if (!/[!@#$%^&*()_\-+=[\]{};:'",.<>/?\\|`~]/.test(password)) {
    return "A senha deve conter ao menos 1 caractere especial.";
  }

  return "";
}
