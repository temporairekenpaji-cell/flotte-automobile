import api from './api'

export function getProfile() {
  return api.get('/users/me/')
}

export function updateProfile(data) {
  return api.put('/users/me/', data)
}
