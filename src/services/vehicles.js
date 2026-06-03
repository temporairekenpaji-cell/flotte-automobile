import api from './api'

export function getVehicles(params = {}) {
  return api.get('/vehicles/', { params })
}

export function createVehicle(data) {
  return api.post('/vehicles/', data)
}

export function updateVehicle(id, data) {
  return api.put(`/vehicles/${id}/`, data)
}

export function deleteVehicle(id) {
  return api.delete(`/vehicles/${id}/`)
}
