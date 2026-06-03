import api from './api'

export function getMissions(params = {}) {
  return api.get('/missions/', { params })
}

export function createMission(data) {
  return api.post('/missions/', data)
}

export function updateMission(id, data) {
  return api.put(`/missions/${id}/`, data)
}

export function deleteMission(id) {
  return api.delete(`/missions/${id}/`)
}
