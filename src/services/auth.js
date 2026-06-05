import api from './api'

export async function login(email, password) {
  const response = await api.post('/auth/login/', {
    email,
    username: email,
    password,
  })
  return response.data
}

export function logout() {
  return Promise.resolve()
}
