from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Compte administrateur unique de l'application."""
    ROLE_CHOICES = [
        ('admin', 'Administrateur'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='admin')

    def __str__(self):
        return self.username

    @property
    def is_app_admin(self):
        return self.role == 'admin' or self.is_superuser


class Vehicle(models.Model):
    """Fleet vehicle model."""
    ETAT_CHOICES = [
        ('active', 'Actif'),
        ('maintenance', 'En Maintenance'),
        ('inactive', 'Inactif'),
        ('disponible', 'Disponible'),
        ('en_mission', 'En Mission'),
    ]
    VEHICLE_TYPE_CHOICES = [
        ('tracteur', 'Tracteur'),
        ('remorque', 'Remorque'),
    ]
    type_vehicle = models.CharField(max_length=20, choices=VEHICLE_TYPE_CHOICES, default='tracteur')
    immatriculation = models.CharField(max_length=20, unique=True)
    marque = models.CharField(max_length=100)
    modele = models.CharField(max_length=100, blank=True, null=True)
    etat = models.CharField(max_length=20, choices=ETAT_CHOICES, default='active')
    kilometrage = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.marque} {self.modele or ''} - {self.immatriculation}"

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Véhicule'
        verbose_name_plural = 'Véhicules'


class VehicleDocument(models.Model):
    """Administrative document associated with a vehicle or driver."""
    DOCUMENT_TYPE_CHOICES = [
        ('visite_technique', 'Visite technique'),
        ('carte_grise', 'Carte grise'),
        ('assurance', 'Assurance'),
        ('carte_bleue', 'Carte bleue'),
        ('licence_de_transport', 'Licence de transport'),
        ('taxe', 'Taxe'),
        ('permis_de_conduire', 'Permis de conduire'),
    ]
    PERIODE_CHOICES = [
        ('3_mois', '3 mois'),
        ('6_mois', '6 mois'),
        ('1_an', '1 an'),
        ('autre', 'Autre'),
    ]
    STATUT_CHOICES = [
        ('valide', 'Valide'),
        ('expire_bientot', 'Expire bientôt'),
        ('expire', 'Expiré'),
    ]
    
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='documents', null=True, blank=True)
    chauffeur = models.ForeignKey('Chauffeur', on_delete=models.CASCADE, related_name='documents', null=True, blank=True)
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPE_CHOICES)
    numero_document = models.CharField(max_length=100, blank=True, null=True)
    date_debut = models.DateField()
    date_expiration = models.DateField()
    periode = models.CharField(max_length=20, choices=PERIODE_CHOICES)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='valide')
    remarque = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        target = self.vehicle.immatriculation if self.vehicle else (self.chauffeur.nom if self.chauffeur else "Inconnu")
        return f"{self.get_document_type_display()} - {target}"

    class Meta:
        ordering = ['-date_expiration']
        verbose_name = 'Document'
        verbose_name_plural = 'Documents'


class Notification(models.Model):
    """Notification for administrative expirations."""
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    chauffeur = models.ForeignKey('Chauffeur', on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    document = models.ForeignKey(VehicleDocument, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    is_closed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        target = self.vehicle.immatriculation if self.vehicle else (self.chauffeur.nom if self.chauffeur else "Inconnu")
        return f"Notification - {target} - {self.message[:30]}"

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'


class RenewalHistory(models.Model):
    """History of document renewals."""
    document = models.ForeignKey(VehicleDocument, on_delete=models.CASCADE, related_name='renewals')
    ancienne_date_expiration = models.DateField()
    nouvelle_date_expiration = models.DateField()
    modified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    modified_at = models.DateTimeField(auto_now_add=True)
    commentaire = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Renouvellement {self.document.get_document_type_display()} - {self.modified_at}"

    class Meta:
        ordering = ['-modified_at']
        verbose_name = 'Historique Renouvellement'
        verbose_name_plural = 'Historiques Renouvellement'


class Chauffeur(models.Model):
    """Driver model."""
    STATUT_CHOICES = [
        ('active', 'Actif'),
        ('inactive', 'Inactif'),
        ('suspended', 'Suspendu'),
    ]
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='chauffeur_profile')
    nom = models.CharField(max_length=200)
    telephone = models.CharField(max_length=20, blank=True, null=True)
    permis = models.CharField(max_length=50, unique=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nom

    class Meta:
        ordering = ['nom']
        verbose_name = 'Chauffeur'
        verbose_name_plural = 'Chauffeurs'


class Mission(models.Model):
    """Mission model linking vehicle and driver."""
    STATUT_CHOICES = [
        ('pending', 'En attente'),
        ('in_progress', 'En cours'),
        ('completed', 'Terminée'),
        ('cancelled', 'Annulée'),
        ('en_cours', 'En Cours'),
        ('terminee', 'Terminée'),
        ('annulee', 'Annulée'),
    ]
    reference = models.CharField(max_length=100, unique=True, blank=True, null=True)
    vehicule = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='missions')
    chauffeur = models.ForeignKey(Chauffeur, on_delete=models.CASCADE, related_name='missions')
    destination = models.CharField(max_length=300)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='pending')
    date_debut = models.DateField(null=True, blank=True)
    date_fin = models.DateField(null=True, blank=True)
    heure_depart = models.TimeField(null=True, blank=True)
    heure_arrivee_prevue = models.TimeField(null=True, blank=True)
    heure_arrivee_reelle = models.TimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Mission {self.reference or ''}: {self.vehicule} -> {self.destination}"

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Mission'
        verbose_name_plural = 'Missions'


class Carburant(models.Model):
    """Fuel record model."""
    vehicule = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='carburants')
    litres = models.FloatField()
    cout = models.FloatField()
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Carburant {self.vehicule} - {self.date}"

    class Meta:
        ordering = ['-date']
        verbose_name = 'Carburant'
        verbose_name_plural = 'Carburants'


class Maintenance(models.Model):
    """Maintenance record model."""
    STATUT_CHOICES = [
        ('pending', 'En attente'),
        ('completed', 'Terminé'),
    ]
    vehicule = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='maintenances')
    type_maintenance = models.CharField(max_length=200)
    cout = models.FloatField()  # Represents base labor/cost
    date = models.DateField()
    description = models.TextField(blank=True, null=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='pending')
    facture = models.FileField(upload_to='maintenances/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Maintenance {self.vehicule} - {self.type_maintenance}"

    class Meta:
        ordering = ['-date']
        verbose_name = 'Maintenance'
        verbose_name_plural = 'Maintenances'


class SparePart(models.Model):
    """Stock spare parts model."""
    nom = models.CharField(max_length=200)
    reference = models.CharField(max_length=100, unique=True)
    quantite_stock = models.IntegerField(default=0)
    seuil_alerte = models.IntegerField(default=5)
    prix_unitaire_moyen = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    fournisseur_principal = models.CharField(max_length=200, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nom} (Ref: {self.reference})"

    class Meta:
        ordering = ['nom']
        verbose_name = 'Pièce de rechange'
        verbose_name_plural = 'Pièces de rechange'


class Peage(models.Model):
    """Toll expenses model."""
    STATUT_PAIEMENT_CHOICES = [
        ('paye', 'Payé'),
        ('en_attente', 'En attente'),
        ('rembourse', 'Remboursé'),
    ]
    vehicule = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='peages')
    chauffeur = models.ForeignKey(Chauffeur, on_delete=models.CASCADE, related_name='peages')
    mission = models.ForeignKey(Mission, on_delete=models.SET_NULL, null=True, blank=True, related_name='peages')
    poste_peage = models.CharField(max_length=200)
    ville = models.CharField(max_length=200)
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    heure = models.TimeField()
    moyen_paiement = models.CharField(max_length=50)
    statut_paiement = models.CharField(max_length=20, choices=STATUT_PAIEMENT_CHOICES, default='paye')
    justificatif = models.FileField(upload_to='peages/', null=True, blank=True)
    observation = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Péage {self.poste_peage} - {self.vehicule.immatriculation} - {self.montant}€"

    class Meta:
        ordering = ['-date', '-heure']
        verbose_name = 'Péage'
        verbose_name_plural = 'Péages'


class ControleRoutier(models.Model):
    """Road check inspections model."""
    STATUT_CHOICES = [
        ('conforme', 'Conforme'),
        ('non_conforme', 'Non conforme'),
    ]
    STATUT_AMENDE_CHOICES = [
        ('non_payee', 'Non payée'),
        ('payee', 'Payée'),
        ('contestee', 'Contestée'),
    ]
    vehicule = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='controles_routiers')
    chauffeur = models.ForeignKey(Chauffeur, on_delete=models.CASCADE, related_name='controles_routiers')
    mission = models.ForeignKey(Mission, on_delete=models.SET_NULL, null=True, blank=True, related_name='controles_routiers')
    lieu = models.CharField(max_length=300)
    date = models.DateField()
    heure = models.TimeField()
    agent_controle = models.CharField(max_length=200)
    type_verification = models.CharField(max_length=300)
    documents_verifies = models.TextField()
    pieces_manquantes = models.JSONField(default=list, blank=True)
    montant_amende = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='conforme')
    statut_amende = models.CharField(max_length=20, choices=STATUT_AMENDE_CHOICES, default='payee')
    rapport = models.FileField(upload_to='controles/', null=True, blank=True)
    observation = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Contrôle {self.vehicule.immatriculation} - {self.date} - {self.statut}"

    class Meta:
        ordering = ['-date', '-heure']
        verbose_name = 'Contrôle Routier'
        verbose_name_plural = 'Contrôles Routiers'


class MaintenancePart(models.Model):
    """Parts used during a vehicle maintenance."""
    maintenance = models.ForeignKey(Maintenance, on_delete=models.CASCADE, related_name='pieces')
    spare_part = models.ForeignKey(SparePart, on_delete=models.SET_NULL, null=True, blank=True, related_name='utilisations')
    nom = models.CharField(max_length=200)
    quantite = models.IntegerField(default=1)
    prix_unitaire = models.DecimalField(max_digits=12, decimal_places=2)
    cout_total = models.DecimalField(max_digits=12, decimal_places=2)
    fournisseur = models.CharField(max_length=200, blank=True, null=True)
    observation = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nom} x {self.quantite} - {self.cout_total}€"

    def save(self, *args, **kwargs):
        # Automatically compute total cost on save
        self.cout_total = self.quantite * self.prix_unitaire
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['nom']
        verbose_name = 'Pièce utilisée'
        verbose_name_plural = 'Pièces utilisées'


class AuditLog(models.Model):
    """Audit log model to track CRUD operations on critical data."""
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=50)  # 'creation', 'modification', 'suppression'
    module = models.CharField(max_length=100)
    details = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        username = self.user.username if self.user else "Système"
        return f"{username} - {self.action} on {self.module} ({self.created_at})"

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Journal d\'audit'
        verbose_name_plural = 'Journaux d\'audit'

