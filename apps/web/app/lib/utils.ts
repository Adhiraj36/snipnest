const TOKEN_KEY = "login_cookie";

export function setToken(token: string, days = 7) {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);

  document.cookie = `${TOKEN_KEY}=${token}; 
    expires=${expires.toUTCString()}; 
    path=/; 
    secure; 
    samesite=strict`;
}

export function getToken(): string | null {
  const match = document.cookie.match(
    new RegExp("(^| )" + TOKEN_KEY + "=([^;]+)")
  );
  return match ? match[2] ?? null : null;
}

export function removeToken() {
  document.cookie = `${TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}