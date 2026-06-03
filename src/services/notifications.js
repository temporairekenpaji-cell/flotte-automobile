import api from './api'

export function getNotifications(params = {}) {
  return api.get('/notifications/', { params })
}

export function updateNotification(id, data) {
  return api.patch(`/notifications/${id}/`, data)
}

export function markAllAsRead() {
  return api.post('/notifications/mark_all_as_read/')
}

export function getUnreadCount() {
  return api.get('/notifications/unread_count/')
}
