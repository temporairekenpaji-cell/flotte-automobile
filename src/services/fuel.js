import api from './api'

export function getFuelRecords(params = {}) {
  return api.get('/fuel/', { params })
}

export function createFuelRecord(data) {
  return api.post('/fuel/', data)
}

export function updateFuelRecord(id, data) {
  return api.put(`/fuel/${id}/`, data)
}

export function deleteFuelRecord(id) {
  return api.delete(`/fuel/${id}/`)
}
