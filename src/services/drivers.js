import api from './api'

export function getDrivers(params = {}) {
  return api.get('/drivers/', { params })
}

export function createDriver(data) {
  return api.post('/drivers/', data)
}

export function updateDriver(id, data) {
  return api.put(`/drivers/${id}/`, data)
}

export function deleteDriver(id) {
  return api.delete(`/drivers/${id}/`)
}
