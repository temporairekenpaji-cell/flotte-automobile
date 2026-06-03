import api from './api'

export function getDocuments(params = {}) {
  return api.get('/documents/', { params })
}

export function createDocument(data) {
  return api.post('/documents/', data)
}

export function updateDocument(id, data) {
  return api.put(`/documents/${id}/`, data)
}

export function deleteDocument(id) {
  return api.delete(`/documents/${id}/`)
}

export function renewDocument(id, data) {
  return api.post(`/documents/${id}/renew/`, data)
}

export function getRenewalHistory(params = {}) {
  return api.get('/renewal-history/', { params })
}
