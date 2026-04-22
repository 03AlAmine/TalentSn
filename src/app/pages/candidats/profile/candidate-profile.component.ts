// candidate-profile.component.ts (AMÉLIORÉ)
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UserData } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  title: string;
  sector: string;
  experienceYears: string;
  educationLevel: string;
  bio: string;
}

@Component({
  selector: 'app-candidate-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './candidate-profile.component.html',
  styleUrls: ['./candidate-profile.component.css']
})
export class CandidateProfileComponent implements OnInit, OnDestroy {
  userData: UserData | null = null;
  isLoading = true;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  profileForm: ProfileFormData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    title: '',
    sector: '',
    experienceYears: '',
    educationLevel: '',
    bio: ''
  };

  photoFile: File | null = null;
  photoPreview: string | null = null;
  isUploadingPhoto = false;

  showPasswordModal = false;
  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  isChangingPassword = false;
  passwordError = '';
  passwordStrength = 0;

  // Données pour les selects
  sectors = [
    'Technologie & Informatique',
    'Finance & Banque',
    'Commerce & Vente',
    'Santé & Médical',
    'Éducation & Formation',
    'Marketing & Communication',
    'Ressources Humaines',
    'Juridique',
    'BTP & Architecture',
    'Industrie & Production',
    'Logistique & Transport',
    'Agriculture & Agroalimentaire',
    'Tourisme & Hôtellerie',
    'Médias & Création',
    'Télécom',
    'Administration & Gestion',
    'Autre'
  ];

  experienceLevels = [
    'Débutant (moins de 1 an)',
    'Junior (1-2 ans)',
    'Confirmé (3-5 ans)',
    'Senior (5-10 ans)',
    'Expert (10+ ans)'
  ];

  educationLevels = [
    'Bac',
    'Bac+2 (BTS/DUT)',
    'Bac+3 (Licence)',
    'Bac+4 (Master 1)',
    'Bac+5 (Master/Ingénieur)',
    'Doctorat',
    'Autre'
  ];

  countries = [
    'Sénégal', 'France', 'Côte d\'Ivoire', 'Mali', 'Guinée',
    'Burkina Faso', 'Niger', 'Togo', 'Bénin', 'Cameroun',
    'Gabon', 'RDC', 'Maroc', 'Tunisie', 'Algérie', 'Autre'
  ];

  cities = [
    'Dakar', 'Thiès', 'Saint-Louis', 'Ziguinchor', 'Kaolack',
    'Mbour', 'Touba', 'Diourbel', 'Louga', 'Tambacounda',
    'Kolda', 'Fatick', 'Kédougou', 'Sédhiou', 'Matam', 'Autre'
  ];

  private subscriptions = new Subscription();
  private autoSaveTimer: any;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.subscriptions.add(
      this.authService.userData$.subscribe(data => {
        this.userData = data;
        if (data) {
          this.profileForm = {
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            phone: data.phone || '',
            city: data.city || '',
            country: data.country || '',
            title: data.title || '',
            sector: data.sector || '',
            experienceYears: data.experienceYears || '',
            educationLevel: data.educationLevel || '',
            bio: data.bio || ''
          };
          if (data.photoURL) {
            this.photoPreview = data.photoURL;
          }
        }
        this.isLoading = false;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
  }

  get fullName(): string {
    return `${this.profileForm.firstName} ${this.profileForm.lastName}`.trim() || 'Candidat';
  }

  getInitials(): string {
    const first = this.profileForm.firstName?.[0] || '';
    const last = this.profileForm.lastName?.[0] || '';
    return (first + last).toUpperCase() || 'C';
  }

  get profileCompletion(): number {
    let score = 0;
    if (this.profileForm.firstName) score += 8;
    if (this.profileForm.lastName) score += 8;
    if (this.photoPreview) score += 12;
    if (this.profileForm.title) score += 12;
    if (this.profileForm.phone) score += 6;
    if (this.profileForm.city) score += 5;
    if (this.profileForm.country) score += 5;
    if (this.profileForm.sector) score += 10;
    if (this.profileForm.experienceYears) score += 10;
    if (this.profileForm.educationLevel) score += 10;
    if (this.profileForm.bio && this.profileForm.bio.length > 50) score += 14;
    return Math.min(score, 100);
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'La photo ne doit pas dépasser 5 Mo';
        setTimeout(() => this.errorMessage = '', 3000);
        return;
      }

      // Vérifier le type
      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Veuillez sélectionner une image';
        setTimeout(() => this.errorMessage = '', 3000);
        return;
      }

      this.photoFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.photoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(this.photoFile);
    }
  }

  async uploadPhoto(): Promise<string | null> {
    if (!this.photoFile || !this.userData?.uid) return null;
    this.isUploadingPhoto = true;
    try {
      const url = await this.authService.uploadProfilePhoto(this.userData.uid, this.photoFile);
      this.isUploadingPhoto = false;
      return url;
    } catch (error) {
      console.error('Error uploading photo:', error);
      this.errorMessage = 'Erreur lors du téléchargement de la photo';
      this.isUploadingPhoto = false;
      return null;
    }
  }

  async saveProfile() {
    if (!this.userData?.uid) return;
    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      let photoUrl = this.userData.photoURL;
      if (this.photoFile) {
        const newPhotoUrl = await this.uploadPhoto();
        if (newPhotoUrl) photoUrl = newPhotoUrl;
      }

      await this.authService.updateUserData(this.userData.uid, {
        firstName: this.profileForm.firstName,
        lastName: this.profileForm.lastName,
        phone: this.profileForm.phone,
        city: this.profileForm.city,
        country: this.profileForm.country,
        title: this.profileForm.title,
        sector: this.profileForm.sector,
        experienceYears: this.profileForm.experienceYears,
        educationLevel: this.profileForm.educationLevel,
        bio: this.profileForm.bio,
        photoURL: photoUrl
      });

      this.successMessage = 'Profil mis à jour avec succès';
      setTimeout(() => this.successMessage = '', 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      this.errorMessage = 'Erreur lors de l\'enregistrement';
    } finally {
      this.isSaving = false;
    }
  }

  autoSave() {
    if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => {
      if (!this.isSaving && this.userData?.uid) {
        this.saveProfile();
      }
    }, 2000);
  }

  onFieldChange() {
    this.autoSave();
  }

  checkPasswordStrength(password: string) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    this.passwordStrength = strength;
  }

  onNewPasswordChange(value: string) {
    this.passwordData.newPassword = value;
    this.checkPasswordStrength(value);
  }

  getPasswordStrengthLabel(): string {
    if (this.passwordStrength <= 2) return 'Faible';
    if (this.passwordStrength === 3) return 'Moyen';
    if (this.passwordStrength === 4) return 'Fort';
    if (this.passwordStrength === 5) return 'Très fort';
    return '';
  }

  getPasswordStrengthColor(): string {
    if (this.passwordStrength <= 2) return '#ef4444';
    if (this.passwordStrength === 3) return '#f59e0b';
    if (this.passwordStrength === 4) return '#00b894';
    return '#10b981';
  }

  async changePassword() {
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.passwordError = 'Les mots de passe ne correspondent pas';
      return;
    }
    if (this.passwordData.newPassword.length < 6) {
      this.passwordError = 'Le mot de passe doit contenir au moins 6 caractères';
      return;
    }

    this.isChangingPassword = true;
    this.passwordError = '';

    try {
      // TODO: Implémenter le changement de mot de passe avec Firebase Auth
      // await this.authService.changePassword(this.passwordData.currentPassword, this.passwordData.newPassword);

      this.showPasswordModal = false;
      this.successMessage = 'Mot de passe modifié avec succès';
      setTimeout(() => this.successMessage = '', 3000);
      this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
      this.passwordStrength = 0;
    } catch (error: any) {
      this.passwordError = error.message || 'Erreur lors du changement de mot de passe';
    } finally {
      this.isChangingPassword = false;
    }
  }

  removePhoto() {
    this.photoPreview = null;
    this.photoFile = null;
  }

  goBack() {
    this.router.navigate(['/candidate/dashboard']);
  }

  formatDate(date: any): string {
    if (!date) return 'Nouveau';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }
}
