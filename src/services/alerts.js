import api from './api'

export function getAlerts(params = {}) {
  return api.get('/maintenance/', { params: { status: 'pending', ...params } })
}

export function resolveAlert(id) {
  return api.patch(`/maintenance/${id}/`, { status: 'completed' })
}

export function createAlert(data) {
  return api.post('/maintenance/', { status: 'pending', ...data })
}

export function getVehiclesList() {
  return api.get('/vehicles/?limit=100')
}

export function updateAlert(id, data) {
  return api.patch(`/maintenance/${id}/`, data)
}

export function deleteAlert(id) {
  return api.delete(`/maintenance/${id}/`)
}
