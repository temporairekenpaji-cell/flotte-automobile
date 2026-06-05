from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Vehicle, VehicleDocument, Notification, RenewalHistory, Chauffeur, Mission, Carburant, Maintenance, AuditLog


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'is_active', 'is_staff', 'date_joined']
    list_filter = ['is_active', 'is_staff']


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ['immatriculation', 'marque', 'type_vehicle', 'etat', 'created_at']
    list_filter = ['etat', 'type_vehicle', 'marque']
    search_fields = ['immatriculation', 'marque', 'modele']


@admin.register(VehicleDocument)
class VehicleDocumentAdmin(admin.ModelAdmin):
    list_display = ['vehicle', 'document_type', 'date_expiration', 'periode', 'statut']
    list_filter = ['document_type', 'periode', 'statut']
    search_fields = ['vehicle__immatriculation', 'document_type']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['vehicle', 'document', 'message', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['vehicle__immatriculation', 'message']


@admin.register(RenewalHistory)
class RenewalHistoryAdmin(admin.ModelAdmin):
    list_display = ['document', 'ancienne_date_expiration', 'nouvelle_date_expiration', 'modified_by', 'modified_at']
    list_filter = ['modified_at']
    search_fields = ['document__vehicle__immatriculation']


@admin.register(Chauffeur)
class ChauffeurAdmin(admin.ModelAdmin):
    list_display = ['nom', 'telephone', 'permis', 'user', 'created_at']
    search_fields = ['nom', 'telephone', 'permis']
    list_filter = ['statut']


@admin.register(Mission)
class MissionAdmin(admin.ModelAdmin):
    list_display = ['vehicule', 'chauffeur', 'destination', 'statut', 'date_debut', 'date_fin']
    list_filter = ['statut']
    search_fields = ['destination', 'vehicule__immatriculation', 'chauffeur__nom']


@admin.register(Carburant)
class CarburantAdmin(admin.ModelAdmin):
    list_display = ['vehicule', 'litres', 'cout', 'date']
    list_filter = ['date']
    search_fields = ['vehicule__immatriculation']


@admin.register(Maintenance)
class MaintenanceAdmin(admin.ModelAdmin):
    list_display = ['vehicule', 'type_maintenance', 'cout', 'date']
    list_filter = ['date', 'type_maintenance']
    search_fields = ['vehicule__immatriculation', 'type_maintenance']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'module', 'created_at']
    list_filter = ['action', 'module', 'created_at']
    search_fields = ['user__username', 'module', 'details']
    readonly_fields = ['user', 'action', 'module', 'details', 'created_at']
