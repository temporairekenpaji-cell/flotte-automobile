from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db.models import Sum, Q
from django.utils import timezone

from .models import (
    User, Vehicle, VehicleDocument, Notification, RenewalHistory,
    Chauffeur, Mission, Carburant, Maintenance,
    SparePart, Peage, ControleRoutier, MaintenancePart, AuditLog
)
from .serializers import (
    UserSerializer,
    VehicleSerializer, ChauffeurSerializer,
    MissionSerializer, CarburantSerializer,
    MaintenanceSerializer, DashboardStatsSerializer,
    CustomTokenObtainPairSerializer,
    VehicleDocumentSerializer, NotificationSerializer, RenewalHistorySerializer,
    SparePartSerializer, PeageSerializer, ControleRoutierSerializer, MaintenancePartSerializer,
    AuditLogSerializer,
)


class AuditLogMixin:
    """Mixin to automatically log create, update, and delete actions in ViewSets."""
    def perform_create(self, serializer):
        instance = serializer.save()
        self.log_action('creation', instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        self.log_action('modification', instance)

    def perform_destroy(self, instance):
        instance_repr = str(instance)
        instance_id = instance.id
        instance.delete()
        self.log_action_raw('suppression', instance_id, instance_repr)

    def log_action(self, action, instance):
        user = self.request.user if self.request.user and self.request.user.is_authenticated else None
        module = self.queryset.model._meta.verbose_name or self.queryset.model.__name__
        details = f"Action: {action} | ID: {instance.id} | Représentation: {str(instance)}"
        AuditLog.objects.create(
            user=user,
            action=action,
            module=module,
            details=details
        )

    def log_action_raw(self, action, instance_id, instance_repr):
        user = self.request.user if self.request.user and self.request.user.is_authenticated else None
        module = self.queryset.model._meta.verbose_name or self.queryset.model.__name__
        details = f"Action: {action} | ID: {instance_id} | Représentation: {instance_repr}"
        AuditLog.objects.create(
            user=user,
            action=action,
            module=module,
            details=details
        )


# ─── Custom Auth View ─────────────────────────────────────────────────────────

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# ─── Profil administrateur ──────────────────────────────────────────────────────

class AdminProfileView(APIView):
    """Profil du compte administrateur connecté (lecture / mise à jour)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def put(self, request):
        return self._update(request, partial=False)

    def patch(self, request):
        return self._update(request, partial=True)

    def _update(self, request, partial):
        serializer = UserSerializer(request.user, data=request.data, partial=partial)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        if request.data.get('password'):
            request.user.set_password(request.data['password'])
        serializer.save()
        return Response(UserSerializer(request.user).data)


# ─── Vehicle ViewSet ──────────────────────────────────────────────────────────

class VehicleViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['immatriculation', 'marque', 'modele', 'etat']
    ordering_fields = ['marque', 'immatriculation', 'etat', 'created_at']

    def get_queryset(self):
        queryset = Vehicle.objects.all()
        etat = self.request.query_params.get('status') or self.request.query_params.get('etat')
        type_vehicle = self.request.query_params.get('type_vehicle')
        expired_docs_only = self.request.query_params.get('expired_docs_only')
        search = self.request.query_params.get('search')
        
        if etat and etat != 'all':
            queryset = queryset.filter(etat=etat)
        if type_vehicle and type_vehicle != 'all':
            queryset = queryset.filter(type_vehicle=type_vehicle)
        if expired_docs_only == 'true':
            queryset = queryset.filter(documents__statut='expire').distinct()
        if search:
            queryset = queryset.filter(
                Q(immatriculation__icontains=search) |
                Q(marque__icontains=search) |
                Q(modele__icontains=search)
            )
        return queryset


# ─── VehicleDocument ViewSet ──────────────────────────────────────────────────

class VehicleDocumentViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = VehicleDocument.objects.all()
    serializer_class = VehicleDocumentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['document_type', 'remarque']
    ordering_fields = ['date_expiration', 'created_at']

    def get_queryset(self):
        queryset = VehicleDocument.objects.all()
        vehicle_id = self.request.query_params.get('vehicle_id') or self.request.query_params.get('vehicle')
        chauffeur_id = self.request.query_params.get('chauffeur_id') or self.request.query_params.get('chauffeur')
        expired_only = self.request.query_params.get('expired_only')
        
        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)
        if chauffeur_id:
            queryset = queryset.filter(chauffeur_id=chauffeur_id)
        if expired_only == 'true':
            queryset = queryset.filter(statut='expire')
        return queryset

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def renew(self, request, pk=None):
        """Renew the document by creating a renewal history and updating dates."""
        doc = self.get_object()
        date_debut = request.data.get('date_debut')
        date_expiration = request.data.get('date_expiration')
        periode = request.data.get('periode')
        remarque = request.data.get('remarque', '')

        if not date_debut or not date_expiration or not periode:
            return Response(
                {"error": "Veuillez fournir date_debut, date_expiration et periode."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Archive current state
        RenewalHistory.objects.create(
            document=doc,
            ancienne_date_expiration=doc.date_expiration,
            nouvelle_date_expiration=date_expiration,
            modified_by=request.user,
            commentaire=remarque
        )

        # Close all active notifications for this document before updating
        Notification.objects.filter(document=doc, is_closed=False).update(is_closed=True)

        # Update active document
        doc.date_debut = date_debut
        doc.date_expiration = date_expiration
        doc.periode = periode
        if remarque:
            doc.remarque = remarque

        # Recalculate status
        from datetime import date as datetime_date
        today = datetime_date.today()
        diff_days = (doc.date_expiration - today).days
        new_status = 'valide'
        if diff_days <= 0:
            new_status = 'expire'
        else:
            if doc.periode in ['1_an', '6_mois']:
                if diff_days <= 90:
                    new_status = 'expire_bientot'
            elif doc.periode in ['3_mois', 'autre']:
                if diff_days <= 30:
                    new_status = 'expire_bientot'
        doc.statut = new_status
        doc.save()

        serializer = self.get_serializer(doc)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ─── Notification ViewSet ─────────────────────────────────────────────────────

class NotificationViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Notification.objects.filter(is_closed=False)
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at']

    def get_queryset(self):
        queryset = Notification.objects.filter(is_closed=False)
        is_read = self.request.query_params.get('is_read')
        urgency = self.request.query_params.get('urgency')
        
        if is_read is not None:
            queryset = queryset.filter(is_read=(is_read.lower() == 'true'))
            
        # Urgency sorting: Expired (message containing 'expiré') > Expires soon > Read status
        if urgency == 'true':
            queryset = queryset.order_by('is_read', '-created_at')
        return queryset

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_all_as_read(self, request):
        Notification.objects.filter(is_read=False, is_closed=False).update(is_read=True)
        return Response({"status": "success"}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def unread_count(self, request):
        count = Notification.objects.filter(is_read=False, is_closed=False).count()
        return Response({"count": count}, status=status.HTTP_200_OK)


# ─── RenewalHistory ViewSet ───────────────────────────────────────────────────

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Journal d'audit — lecture seule, réservé aux administrateurs."""
    queryset = AuditLog.objects.select_related('user').all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['module', 'action', 'details', 'user__username', 'user__email']
    ordering_fields = ['created_at', 'module', 'action']

    def get_queryset(self):
        queryset = AuditLog.objects.select_related('user').all()
        module = self.request.query_params.get('module')
        action = self.request.query_params.get('action')
        if module:
            queryset = queryset.filter(module__icontains=module)
        if action:
            queryset = queryset.filter(action=action)
        return queryset


class RenewalHistoryViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = RenewalHistory.objects.all()
    serializer_class = RenewalHistorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['modified_at']

    def get_queryset(self):
        queryset = RenewalHistory.objects.all()
        document_id = self.request.query_params.get('document_id')
        vehicle_id = self.request.query_params.get('vehicle_id') or self.request.query_params.get('vehicle')
        
        if document_id:
            queryset = queryset.filter(document_id=document_id)
        if vehicle_id:
            queryset = queryset.filter(document__vehicle_id=vehicle_id)
        return queryset


# ─── Chauffeur ViewSet ────────────────────────────────────────────────────────

class ChauffeurViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Chauffeur.objects.all()
    serializer_class = ChauffeurSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nom', 'telephone', 'permis']
    ordering_fields = ['nom', 'created_at']

    def get_queryset(self):
        queryset = Chauffeur.objects.all()
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(nom__icontains=search) |
                Q(permis__icontains=search) |
                Q(telephone__icontains=search)
            )
        return queryset


# ─── Mission ViewSet ──────────────────────────────────────────────────────────

class MissionViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Mission.objects.select_related('vehicule', 'chauffeur').all()
    serializer_class = MissionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['destination', 'reference', 'vehicule__immatriculation', 'chauffeur__nom']
    ordering_fields = ['created_at', 'statut', 'date_debut']

    def get_queryset(self):
        queryset = Mission.objects.select_related('vehicule', 'chauffeur').all()
        statut = self.request.query_params.get('status') or self.request.query_params.get('statut')
        vehicle_id = self.request.query_params.get('vehicle_id')
        chauffeur_id = self.request.query_params.get('chauffeur_id')
        if statut and statut != 'all':
            queryset = queryset.filter(statut=statut)
        if vehicle_id:
            queryset = queryset.filter(vehicule_id=vehicle_id)
        if chauffeur_id:
            queryset = queryset.filter(chauffeur_id=chauffeur_id)
        if self.request.query_params.get('recent', '').lower() == 'true':
            queryset = queryset.order_by('-created_at')
            limit = self.request.query_params.get('limit')
            if limit and limit.isdigit():
                queryset = queryset[: int(limit)]
        return queryset


# ─── Carburant ViewSet ────────────────────────────────────────────────────────

class CarburantViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Carburant.objects.select_related('vehicule').all()
    serializer_class = CarburantSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['vehicule__immatriculation', 'vehicule__marque']
    ordering_fields = ['date', 'cout', 'litres']


# ─── Maintenance ViewSet ──────────────────────────────────────────────────────

class MaintenanceViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Maintenance.objects.select_related('vehicule').prefetch_related('pieces').all()
    serializer_class = MaintenanceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['vehicule__immatriculation', 'type_maintenance', 'description']
    ordering_fields = ['date', 'cout']

    def get_queryset(self):
        queryset = Maintenance.objects.select_related('vehicule').prefetch_related('pieces').all()
        statut = self.request.query_params.get('status') or self.request.query_params.get('statut')
        if statut and statut != 'all':
            queryset = queryset.filter(statut=statut)
        return queryset


# ─── MaintenancePart ViewSet ──────────────────────────────────────────────────

class MaintenancePartViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = MaintenancePart.objects.all()
    serializer_class = MaintenancePartSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = MaintenancePart.objects.all()
        maintenance_id = self.request.query_params.get('maintenance_id')
        if maintenance_id:
            queryset = queryset.filter(maintenance_id=maintenance_id)
        return queryset


# ─── SparePart ViewSet ────────────────────────────────────────────────────────

class SparePartViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = SparePart.objects.all()
    serializer_class = SparePartSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nom', 'reference', 'fournisseur_principal']
    ordering_fields = ['nom', 'quantite_stock']


# ─── Peage ViewSet ────────────────────────────────────────────────────────────

class PeageViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = Peage.objects.select_related('vehicule', 'chauffeur', 'mission').all()
    serializer_class = PeageSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['poste_peage', 'ville', 'vehicule__immatriculation', 'chauffeur__nom']
    ordering_fields = ['date', 'montant', 'created_at']

    def get_queryset(self):
        queryset = Peage.objects.select_related('vehicule', 'chauffeur', 'mission').all()
        vehicle_id = self.request.query_params.get('vehicle_id')
        chauffeur_id = self.request.query_params.get('chauffeur_id')
        statut = self.request.query_params.get('statut_paiement')
        search = self.request.query_params.get('search')
        if vehicle_id:
            queryset = queryset.filter(vehicule_id=vehicle_id)
        if chauffeur_id:
            queryset = queryset.filter(chauffeur_id=chauffeur_id)
        if statut and statut != 'all':
            queryset = queryset.filter(statut_paiement=statut)
        if search:
            queryset = queryset.filter(
                Q(poste_peage__icontains=search) |
                Q(ville__icontains=search) |
                Q(vehicule__immatriculation__icontains=search) |
                Q(chauffeur__nom__icontains=search)
            )
        return queryset


# ─── ControleRoutier ViewSet ──────────────────────────────────────────────────

class ControleRoutierViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = ControleRoutier.objects.select_related('vehicule', 'chauffeur', 'mission').all()
    serializer_class = ControleRoutierSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['lieu', 'vehicule__immatriculation', 'chauffeur__nom', 'agent_controle']
    ordering_fields = ['date', 'montant_amende', 'created_at']

    def get_queryset(self):
        queryset = ControleRoutier.objects.select_related('vehicule', 'chauffeur', 'mission').all()
        vehicle_id = self.request.query_params.get('vehicle_id')
        chauffeur_id = self.request.query_params.get('chauffeur_id')
        statut = self.request.query_params.get('statut')
        statut_amende = self.request.query_params.get('statut_amende')
        search = self.request.query_params.get('search')
        if vehicle_id:
            queryset = queryset.filter(vehicule_id=vehicle_id)
        if chauffeur_id:
            queryset = queryset.filter(chauffeur_id=chauffeur_id)
        if statut and statut != 'all':
            queryset = queryset.filter(statut=statut)
        if statut_amende and statut_amende != 'all':
            queryset = queryset.filter(statut_amende=statut_amende)
        if search:
            queryset = queryset.filter(
                Q(lieu__icontains=search) |
                Q(vehicule__immatriculation__icontains=search) |
                Q(chauffeur__nom__icontains=search) |
                Q(agent_controle__icontains=search)
            )
        return queryset


# ─── Dashboard Stats View ─────────────────────────────────────────────────────

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        total_vehicles = Vehicle.objects.count()
        vehicles_available = Vehicle.objects.filter(etat__in=['active', 'disponible']).count()
        vehicles_unavailable = total_vehicles - vehicles_available
        total_drivers = Chauffeur.objects.count()
        active_missions = Mission.objects.filter(statut__in=['in_progress', 'en_cours']).count()
        total_missions = Mission.objects.count()

        fuel_cost = Carburant.objects.aggregate(total=Sum('cout'))['total'] or 0.0

        alerts_list = [
            {
                'id': m.id,
                'title': f"Maintenance - {m.vehicule.immatriculation}",
                'message': f"Intervention: {m.type_maintenance}",
                'details': f"Prévu le {m.date} ({m.cout:,.0f} FCFA)".replace(',', ' '),
                'status': m.statut,
                'date': m.date,
                'cost': m.cout,
            }
            for m in Maintenance.objects.select_related('vehicule').filter(statut='pending').order_by('-date')[:10]
        ]

        valid_documents = VehicleDocument.objects.filter(statut='valide').count()
        expiring_documents = VehicleDocument.objects.filter(statut='expire_bientot').count()
        expired_documents = VehicleDocument.objects.filter(statut='expire').count()
        unread_notifications = Notification.objects.filter(is_read=False, is_closed=False).count()

        from itertools import chain
        expired_docs_qs = VehicleDocument.objects.select_related('vehicle', 'chauffeur').filter(statut='expire').order_by('date_expiration')[:10]
        expiring_docs_qs = VehicleDocument.objects.select_related('vehicle', 'chauffeur').filter(statut='expire_bientot').order_by('date_expiration')[:10]
        urgent_documents = []
        for doc in chain(expired_docs_qs, expiring_docs_qs):
            urgent_documents.append({
                'id': doc.id,
                'document_type': doc.document_type,
                'document_type_display': doc.get_document_type_display(),
                'vehicle_plate': doc.vehicle.immatriculation if doc.vehicle else None,
                'chauffeur_name': doc.chauffeur.nom if doc.chauffeur else None,
                'date_expiration': str(doc.date_expiration),
                'statut': doc.statut,
                'numero_document': doc.numero_document or '',
            })
            if len(urgent_documents) >= 10:
                break

        tolls_month_cost = float(Peage.objects.filter(date__gte=month_start).aggregate(total=Sum('montant'))['total'] or 0)
        fines_month_cost = float(ControleRoutier.objects.filter(date__gte=month_start).aggregate(total=Sum('montant_amende'))['total'] or 0)
        road_checks_month_count = ControleRoutier.objects.filter(date__gte=month_start).count()
        missions_active_count = active_missions
        missions_completed_count = Mission.objects.filter(statut__in=['completed', 'terminee']).count()
        missions_late_count = Mission.objects.filter(
            statut__in=['in_progress', 'en_cours'],
            date_fin__lt=now.date()
        ).count()
        maintenances_month_cost = float(Maintenance.objects.filter(date__gte=month_start).aggregate(total=Sum('cout'))['total'] or 0)
        parts_month_cost = float(MaintenancePart.objects.filter(created_at__gte=month_start).aggregate(total=Sum('cout_total'))['total'] or 0)

        data = {
            'total_vehicles': total_vehicles,
            'active_vehicles': vehicles_available,
            'maintenance_vehicles': vehicles_unavailable,
            'total_drivers': total_drivers,
            'active_missions': active_missions,
            'total_missions': total_missions,
            'fuel_consumption': f"{round(float(fuel_cost), 2):,.0f} FCFA".replace(',', ' ') if fuel_cost > 0 else "0 FCFA",
            'fleet_utilization': round((vehicles_available / (total_vehicles or 1)) * 100),
            'alerts': alerts_list,
            'valid_documents': valid_documents,
            'expiring_documents': expiring_documents,
            'expired_documents': expired_documents,
            'unread_notifications': unread_notifications,
            'urgent_documents': urgent_documents,
            'tolls_month_cost': tolls_month_cost,
            'fines_month_cost': fines_month_cost,
            'road_checks_month_count': road_checks_month_count,
            'missions_active_count': missions_active_count,
            'missions_completed_count': missions_completed_count,
            'missions_late_count': missions_late_count,
            'maintenances_month_cost': maintenances_month_cost,
            'parts_month_cost': parts_month_cost,
        }

        serializer = DashboardStatsSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)
