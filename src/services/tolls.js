import api from './api'

export function getTolls(params = {}) {
  return api.get('/peages/', { params })
}

export function createToll(data) {
  return api.post('/peages/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function updateToll(id, data) {
  return api.patch(`/peages/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function deleteToll(id) {
  return api.delete(`/peages/${id}/`)
}
