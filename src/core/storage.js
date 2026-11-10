export function load(key, fallback) {
  try {
    return JSON.parse(localStorage[key]) || fallback;
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage[key] = JSON.stringify(value);
  } catch {
    // sin almacenamiento (modo privado): el juego sigue sin guardar
  }
}
