from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AdminProfileView, VehicleViewSet, ChauffeurViewSet,
    MissionViewSet, CarburantViewSet, MaintenanceViewSet,
    VehicleDocumentViewSet, NotificationViewSet, RenewalHistoryViewSet,
    DashboardStatsView, AuditLogViewSet,
    PeageViewSet, ControleRoutierViewSet, MaintenancePartViewSet, SparePartViewSet
)

router = DefaultRouter()
router.register(r'vehicules', VehicleViewSet, basename='vehicule_fr')
router.register(r'vehicles', VehicleViewSet, basename='vehicule_en')
router.register(r'documents', VehicleDocumentViewSet, basename='document')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'renewal-history', RenewalHistoryViewSet, basename='renewal-history')
router.register(r'chauffeurs', ChauffeurViewSet, basename='chauffeur_fr')
router.register(r'drivers', ChauffeurViewSet, basename='chauffeur_en')
router.register(r'missions', MissionViewSet, basename='mission')
router.register(r'carburants', CarburantViewSet, basename='carburant_fr')
router.register(r'fuel', CarburantViewSet, basename='carburant_en')
router.register(r'maintenances', MaintenanceViewSet, basename='maintenance_fr')
router.register(r'maintenance', MaintenanceViewSet, basename='maintenance_en')
router.register(r'peages', PeageViewSet, basename='peage')
router.register(r'controles-routiers', ControleRoutierViewSet, basename='controle-routier')
router.register(r'maintenance-parts', MaintenancePartViewSet, basename='maintenance-part')
router.register(r'spare-parts', SparePartViewSet, basename='spare-part')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')

urlpatterns = [
    path('', include(router.urls)),
    path('users/me/', AdminProfileView.as_view(), name='admin-profile'),
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard-en'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
]

