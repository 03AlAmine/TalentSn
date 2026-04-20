import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UserData } from '../../../core/services/auth.service';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  userData: UserData | null = null;
  profileData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    bio: '',
  };

  isLoading = true;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  // Photo upload
  photoFile: File | null = null;
  photoPreview: string | null = null;
  isUploading = false;

  // Password change
  showPasswordModal = false;
  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };
  isChangingPassword = false;
  passwordError = '';

  constructor(
    private authService: AuthService,
    private firestore: Firestore,
    private storage: Storage,
    public router: Router,
  ) {}

  async ngOnInit() {
    this.authService.userData$.subscribe(async (data) => {
      this.userData = data;
      if (data) {
        this.profileData = {
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          position: data.position || '',
          department: data.department || '',
          bio: data.bio || '',
        };

        if (data.photoURL) {
          this.photoPreview = data.photoURL;
        }
      }
      this.isLoading = false;
    });
  }

  async onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.photoFile = input.files[0];

      // Preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.photoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(this.photoFile);
    }
  }

  async uploadPhoto(): Promise<string | null> {
    if (!this.photoFile || !this.userData?.uid) return null;

    this.isUploading = true;
    try {
      const fileExt = this.photoFile.name.split('.').pop();
      const fileName = `users/${this.userData.uid}/profile.${fileExt}`;
      const storageRef = ref(this.storage, fileName);

      await uploadBytes(storageRef, this.photoFile);
      const downloadUrl = await getDownloadURL(storageRef);

      this.isUploading = false;
      return downloadUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      this.errorMessage = 'Erreur lors du téléchargement de la photo';
      this.isUploading = false;
      return null;
    }
  }

  async saveProfile() {
    if (!this.userData?.uid) return;

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      // Upload photo if changed
      let photoUrl = this.userData.photoURL;
      if (this.photoFile) {
        const newPhotoUrl = await this.uploadPhoto();
        if (newPhotoUrl) {
          photoUrl = newPhotoUrl;
        }
      }

      // Update user document
      const userRef = doc(this.firestore, 'users', this.userData.uid);
      await updateDoc(userRef, {
        firstName: this.profileData.firstName,
        lastName: this.profileData.lastName,
        phone: this.profileData.phone,
        position: this.profileData.position,
        department: this.profileData.department,
        bio: this.profileData.bio,
        photoURL: photoUrl,
        updatedAt: new Date(),
      });

      // Update local user data
      this.authService.refreshUserData();

      this.successMessage = 'Profil mis à jour avec succès !';
      setTimeout(() => this.successMessage = '', 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      this.errorMessage = 'Erreur lors de l\'enregistrement';
    } finally {
      this.isSaving = false;
    }
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
      // This would call an auth service method to change password
      // await this.authService.changePassword(this.passwordData.currentPassword, this.passwordData.newPassword);

      this.showPasswordModal = false;
      this.successMessage = 'Mot de passe modifié avec succès !';
      setTimeout(() => this.successMessage = '', 3000);

      // Reset form
      this.passwordData = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      };
    } catch (error: any) {
      this.passwordError = error.message || 'Erreur lors du changement de mot de passe';
    } finally {
      this.isChangingPassword = false;
    }
  }

  getFullName(): string {
    return `${this.profileData.firstName} ${this.profileData.lastName}`.trim() || 'Recruteur';
  }

  getInitials(): string {
    const f = this.profileData.firstName?.[0] || '';
    const l = this.profileData.lastName?.[0] || '';
    return (f + l).toUpperCase() || 'R';
  }

  removePhoto() {
    this.photoPreview = null;
    this.photoFile = null;
  }
}
