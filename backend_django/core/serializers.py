from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Vehicle, VehicleDocument, Notification, RenewalHistory, Chauffeur, Mission, Carburant, Maintenance, SparePart, Peage, ControleRoutier, MaintenancePart


# ─── Auth / JWT Custom Serializer ─────────────────────────────────────────────

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['username'] = serializers.CharField(required=False)
        self.fields['email'] = serializers.CharField(required=False)

    def validate(self, attrs):
        email = attrs.get('email')
        username = attrs.get('username')
        if email and not username:
            attrs['username'] = email
        
        # If user entered an email, look up their username
        val = attrs.get('username', '')
        if val and '@' in val:
            user = User.objects.filter(email=val).first()
            if user:
                attrs['username'] = user.username

        data = super().validate(attrs)
        # React AuthContext expects response.token or response.access
        data['token'] = data['access']
        return data


# ─── User Serializers ────────────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'password', 'password2']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


# ─── Vehicule Serializers ─────────────────────────────────────────────────────

# ─── Vehicle Serializers ──────────────────────────────────────────────────────

class VehicleSerializer(serializers.ModelSerializer):
    registration = serializers.CharField(source='immatriculation')
    brand = serializers.CharField(source='marque')
    model = serializers.CharField(source='modele', required=False, allow_blank=True, allow_null=True)
    status = serializers.CharField(source='etat', required=False)
    mileage = serializers.IntegerField(source='kilometrage', required=False, allow_null=True)

    class Meta:
        model = Vehicle
        fields = [
            'id', 'registration', 'brand', 'model', 'status', 'mileage',
            'type_vehicle', 'created_at', 'updated_at',
            'immatriculation', 'marque', 'etat'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'immatriculation', 'marque', 'etat']


# ─── VehicleDocument Serializer ──────────────────────────────────────────────

class VehicleDocumentSerializer(serializers.ModelSerializer):
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    periode_display = serializers.CharField(source='get_periode_display', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    vehicle_plate = serializers.CharField(source='vehicle.immatriculation', read_only=True)

    class Meta:
        model = VehicleDocument
        fields = '__all__'


# ─── Notification Serializer ──────────────────────────────────────────────────

class NotificationSerializer(serializers.ModelSerializer):
    vehicle_plate = serializers.CharField(source='vehicle.immatriculation', read_only=True)
    document_type_display = serializers.CharField(source='document.get_document_type_display', read_only=True, default=None)

    class Meta:
        model = Notification
        fields = '__all__'


# ─── RenewalHistory Serializer ───────────────────────────────────────────────

class RenewalHistorySerializer(serializers.ModelSerializer):
    document_type_display = serializers.CharField(source='document.get_document_type_display', read_only=True)
    modified_by_username = serializers.CharField(source='modified_by.username', read_only=True, default='Système')
    vehicle_plate = serializers.CharField(source='document.vehicle.immatriculation', read_only=True)

    class Meta:
        model = RenewalHistory
        fields = '__all__'


# ─── Chauffeur Serializers ────────────────────────────────────────────────────

class ChauffeurSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='nom')
    license_number = serializers.CharField(source='permis')
    phone = serializers.CharField(source='telephone', required=False, allow_blank=True, allow_null=True)
    status = serializers.CharField(source='statut', required=False)

    class Meta:
        model = Chauffeur
        fields = [
            'id', 'name', 'license_number', 'phone', 'status', 'created_at', 'updated_at',
            'nom', 'permis', 'telephone'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'nom', 'permis', 'telephone']


# ─── Mission Serializers ──────────────────────────────────────────────────────

class MissionSerializer(serializers.ModelSerializer):
    driver = serializers.PrimaryKeyRelatedField(source='chauffeur', queryset=Chauffeur.objects.all())
    driver_name = serializers.CharField(source='chauffeur.nom', read_only=True)
    vehicle = serializers.PrimaryKeyRelatedField(source='vehicule', queryset=Vehicle.objects.all())
    vehicle_plate = serializers.CharField(source='vehicule.immatriculation', read_only=True)
    destination = serializers.CharField()
    departure_date = serializers.DateField(source='date_debut', required=False, allow_null=True)
    return_date = serializers.DateField(source='date_fin', required=False, allow_null=True)
    departure_time = serializers.TimeField(source='heure_depart', required=False, allow_null=True)
    arrival_planned_time = serializers.TimeField(source='heure_arrivee_prevue', required=False, allow_null=True)
    arrival_actual_time = serializers.TimeField(source='heure_arrivee_reelle', required=False, allow_null=True)
    duree_mission = serializers.SerializerMethodField()
    status = serializers.CharField(source='statut', required=False)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model = Mission
        fields = [
            'id', 'reference', 'driver', 'driver_name', 'vehicle', 'vehicle_plate',
            'destination', 'departure_date', 'return_date', 'departure_time',
            'arrival_planned_time', 'arrival_actual_time', 'duree_mission',
            'status', 'statut_display', 'created_at', 'updated_at',
            'vehicule', 'chauffeur', 'statut', 'heure_depart', 'heure_arrivee_prevue', 'heure_arrivee_reelle'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'vehicule', 'chauffeur', 'statut', 'heure_depart', 'heure_arrivee_prevue', 'heure_arrivee_reelle']

    def get_duree_mission(self, obj):
        if obj.date_debut and obj.heure_depart and obj.date_fin and obj.heure_arrivee_reelle:
            import datetime
            start = datetime.datetime.combine(obj.date_debut, obj.heure_depart)
            end = datetime.datetime.combine(obj.date_fin, obj.heure_arrivee_reelle)
            delta = end - start
            return round(delta.total_seconds() / 3600.0, 1)
        return None


# ─── Carburant Serializers ────────────────────────────────────────────────────

class CarburantSerializer(serializers.ModelSerializer):
    vehicle_id = serializers.PrimaryKeyRelatedField(source='vehicule', queryset=Vehicle.objects.all())
    liters = serializers.FloatField(source='litres')
    cost = serializers.FloatField(source='cout')
    date = serializers.DateField()

    class Meta:
        model = Carburant
        fields = ['id', 'vehicle_id', 'liters', 'cost', 'date', 'created_at', 'vehicule', 'litres', 'cout']
        read_only_fields = ['id', 'created_at', 'vehicule', 'litres', 'cout']


# ─── SparePart Serializer ────────────────────────────────────────────────────

class SparePartSerializer(serializers.ModelSerializer):
    class Meta:
        model = SparePart
        fields = '__all__'


# ─── MaintenancePart Serializer ──────────────────────────────────────────────

class MaintenancePartSerializer(serializers.ModelSerializer):
    cout_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = MaintenancePart
        fields = '__all__'


# ─── Maintenance Serializers ──────────────────────────────────────────────────

class MaintenanceSerializer(serializers.ModelSerializer):
    vehicle_id = serializers.PrimaryKeyRelatedField(source='vehicule', queryset=Vehicle.objects.all())
    vehicle_plate = serializers.CharField(source='vehicule.immatriculation', read_only=True)
    type = serializers.CharField(source='type_maintenance')
    cost = serializers.FloatField(source='cout')
    status = serializers.CharField(source='statut', required=False)
    pieces = MaintenancePartSerializer(many=True, read_only=True)
    cout_pieces = serializers.SerializerMethodField()
    cout_total_global = serializers.SerializerMethodField()

    class Meta:
        model = Maintenance
        fields = [
            'id', 'vehicle_id', 'vehicle_plate', 'type', 'cost', 'date', 'description', 
            'status', 'facture', 'pieces', 'cout_pieces', 'cout_total_global', 
            'created_at', 'vehicule', 'type_maintenance', 'cout'
        ]
        read_only_fields = ['id', 'created_at', 'vehicule', 'type_maintenance', 'cout']

    def get_cout_pieces(self, obj):
        return float(sum(p.cout_total for p in obj.pieces.all()))

    def get_cout_total_global(self, obj):
        return float(obj.cout) + self.get_cout_pieces(obj)

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'type_maintenance' in data and 'type' not in data:
            data['type'] = data['type_maintenance']
        if 'cout' in data and 'cost' not in data:
            data['cost'] = data['cout']
        if 'statut' in data and 'status' not in data:
            data['status'] = data['statut']
        return super().to_internal_value(data)


# ─── Peage Serializer ────────────────────────────────────────────────────────

class PeageSerializer(serializers.ModelSerializer):
    vehicle_plate = serializers.CharField(source='vehicule.immatriculation', read_only=True)
    driver_name = serializers.CharField(source='chauffeur.nom', read_only=True)
    mission_ref = serializers.CharField(source='mission.reference', read_only=True, default=None)
    statut_paiement_display = serializers.CharField(source='get_statut_paiement_display', read_only=True)

    class Meta:
        model = Peage
        fields = '__all__'


# ─── ControleRoutier Serializer ──────────────────────────────────────────────

class ControleRoutierSerializer(serializers.ModelSerializer):
    vehicle_plate = serializers.CharField(source='vehicule.immatriculation', read_only=True)
    driver_name = serializers.CharField(source='chauffeur.nom', read_only=True)
    mission_ref = serializers.CharField(source='mission.reference', read_only=True, default=None)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    statut_amende_display = serializers.CharField(source='get_statut_amende_display', read_only=True)

    class Meta:
        model = ControleRoutier
        fields = '__all__'


# ─── Dashboard Serializer ─────────────────────────────────────────────────────

class DashboardStatsSerializer(serializers.Serializer):
    total_vehicles = serializers.IntegerField()
    active_vehicles = serializers.IntegerField()
    maintenance_vehicles = serializers.IntegerField()
    total_drivers = serializers.IntegerField()
    active_missions = serializers.IntegerField()
    total_missions = serializers.IntegerField()
    fuel_consumption = serializers.CharField()
    fleet_utilization = serializers.IntegerField()
    alerts = serializers.ListField()
    
    # New statistics for document administration
    valid_documents = serializers.IntegerField()
    expiring_documents = serializers.IntegerField()
    expired_documents = serializers.IntegerField()
    unread_notifications = serializers.IntegerField()

    # New monthly operational KPIs
    tolls_month_cost = serializers.FloatField()
    fines_month_cost = serializers.FloatField()
    road_checks_month_count = serializers.IntegerField()
    missions_active_count = serializers.IntegerField()
    missions_completed_count = serializers.IntegerField()
    missions_late_count = serializers.IntegerField()
    maintenances_month_cost = serializers.FloatField()
    parts_month_cost = serializers.FloatField()

