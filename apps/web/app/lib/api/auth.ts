import axios from "axios"

const api_url = "https://bookish-winner-pj6rxr4495pjf9x7-9000.app.github.dev"

export type LoginResponse =
  | { success: true; token: string }
  | { success: false; error: string }

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const res = await axios.post(`${api_url}/user/login`, { email, password })
    return { success: true, token: res.data.token }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Wrong email or password" }
  }
}