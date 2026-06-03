import api from './api'

export function getRoadChecks(params = {}) {
  return api.get('/controles-routiers/', { params })
}

export function createRoadCheck(data) {
  return api.post('/controles-routiers/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function updateRoadCheck(id, data) {
  return api.patch(`/controles-routiers/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function deleteRoadCheck(id) {
  return api.delete(`/controles-routiers/${id}/`)
}
