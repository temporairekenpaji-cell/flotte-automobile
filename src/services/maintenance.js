import api from './api'

export function getMaintenanceRecords(params = {}) {
  return api.get('/maintenance/', { params })
}

export function createMaintenanceRecord(data) {
  const isFormData = data instanceof FormData
  return api.post('/maintenance/', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined)
}

export function updateMaintenanceRecord(id, data) {
  const isFormData = data instanceof FormData
  // Use PATCH instead of PUT to support partial updates with multipart uploads
  return api.patch(`/maintenance/${id}/`, data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined)
}

export function deleteMaintenanceRecord(id) {
  return api.delete(`/maintenance/${id}/`)
}

