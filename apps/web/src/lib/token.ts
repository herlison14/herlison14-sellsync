// Fonte única de verdade pro token de auth. Grava em dois lugares de
// propósito: localStorage (lido pelo interceptor do axios em api.ts, pra
// montar o header Authorization das chamadas à API) e um cookie comum
// (lido pelo middleware.ts, que roda no servidor/edge e não tem acesso a
// localStorage — é o único jeito dele saber se a rota deve liberar
// /dashboard ou redirecionar pra /login).
const COOKIE_NAME = 'sellsync:token'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 dias — mesmo prazo do JWT (expiresIn: '7d')

export function setAuthToken(token: string) {
  localStorage.setItem(COOKIE_NAME, token)
  document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

export function clearAuthToken() {
  localStorage.removeItem(COOKIE_NAME)
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`
}
