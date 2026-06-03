import api from './api'

export function getMaintenanceParts(params = {}) {
  return api.get('/maintenance-parts/', { params })
}

export function createMaintenancePart(data) {
  return api.post('/maintenance-parts/', data)
}

export function updateMaintenancePart(id, data) {
  return api.patch(`/maintenance-parts/${id}/`, data)
}

export function deleteMaintenancePart(id) {
  return api.delete(`/maintenance-parts/${id}/`)
}
