import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UserData } from '../../../core/services/auth.service';
import { Firestore, doc, updateDoc, getDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';

interface CompanyData {
  companyName: string;
  companyLogo?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyWebsite?: string;
  companySector?: string;
  companySize?: string;
  companyDescription?: string;
  companyAddress?: string;
  companyCity?: string;
  companyCountry?: string;
  companySocialLinkedin?: string;
  companySocialTwitter?: string;
  companySocialFacebook?: string;
}

@Component({
  selector: 'app-company-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './company-settings.component.html',
  styleUrls: ['./company-settings.component.css'],
})
export class CompanySettingsComponent implements OnInit {
  userData: UserData | null = null;
  companyData: CompanyData = {
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    companyWebsite: '',
    companySector: '',
    companySize: '',
    companyDescription: '',
    companyAddress: '',
    companyCity: '',
    companyCountry: 'Sénégal',
    companySocialLinkedin: '',
    companySocialTwitter: '',
    companySocialFacebook: '',
  };

  isLoading = true;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  // Logo upload
  logoFile: File | null = null;
  logoPreview: string | null = null;
  isUploading = false;

  // Active tab
  activeTab: 'general' | 'contact' | 'social' | 'branding' = 'general';

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
        await this.loadCompanyData();
      }
      this.isLoading = false;
    });
  }

  async loadCompanyData() {
    if (!this.userData?.uid) return;

    try {
      const userDoc = await getDoc(doc(this.firestore, 'users', this.userData.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.companyData = {
          companyName: userData['companyName'] || '',
          companyLogo: userData['companyLogo'] || '',
          companyEmail: userData['companyEmail'] || '',
          companyPhone: userData['companyPhone'] || '',
          companyWebsite: userData['companyWebsite'] || '',
          companySector: userData['companySector'] || '',
          companySize: userData['companySize'] || '',
          companyDescription: userData['companyDescription'] || '',
          companyAddress: userData['companyAddress'] || '',
          companyCity: userData['companyCity'] || '',
          companyCountry: userData['companyCountry'] || 'Sénégal',
          companySocialLinkedin: userData['companySocialLinkedin'] || '',
          companySocialTwitter: userData['companySocialTwitter'] || '',
          companySocialFacebook: userData['companySocialFacebook'] || '',
        };

        if (this.companyData.companyLogo) {
          this.logoPreview = this.companyData.companyLogo;
        }
      }
    } catch (error) {
      console.error('Error loading company data:', error);
      this.errorMessage = 'Erreur lors du chargement des données';
    }
  }

  async onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.logoFile = input.files[0];

      // Preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(this.logoFile);
    }
  }

  async uploadLogo() {
    if (!this.logoFile || !this.userData?.uid) return null;

    this.isUploading = true;
    try {
      const fileExt = this.logoFile.name.split('.').pop();
      const fileName = `companies/${this.userData.uid}/logo.${fileExt}`;
      const storageRef = ref(this.storage, fileName);

      await uploadBytes(storageRef, this.logoFile);
      const downloadUrl = await getDownloadURL(storageRef);

      this.companyData.companyLogo = downloadUrl;
      this.isUploading = false;
      return downloadUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      this.errorMessage = 'Erreur lors du téléchargement du logo';
      this.isUploading = false;
      return null;
    }
  }

  async saveSettings() {
    if (!this.userData?.uid) return;

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      // Upload logo if changed
      if (this.logoFile) {
        const logoUrl = await this.uploadLogo();
        if (logoUrl) {
          this.companyData.companyLogo = logoUrl;
        }
      }

      // Update user document
      const userRef = doc(this.firestore, 'users', this.userData.uid);
      await updateDoc(userRef, {
        companyName: this.companyData.companyName,
        companyLogo: this.companyData.companyLogo,
        companyEmail: this.companyData.companyEmail,
        companyPhone: this.companyData.companyPhone,
        companyWebsite: this.companyData.companyWebsite,
        companySector: this.companyData.companySector,
        companySize: this.companyData.companySize,
        companyDescription: this.companyData.companyDescription,
        companyAddress: this.companyData.companyAddress,
        companyCity: this.companyData.companyCity,
        companyCountry: this.companyData.companyCountry,
        companySocialLinkedin: this.companyData.companySocialLinkedin,
        companySocialTwitter: this.companyData.companySocialTwitter,
        companySocialFacebook: this.companyData.companySocialFacebook,
        updatedAt: new Date(),
      });

      this.successMessage = 'Paramètres enregistrés avec succès !';
      setTimeout(() => this.successMessage = '', 3000);
    } catch (error) {
      console.error('Error saving company settings:', error);
      this.errorMessage = 'Erreur lors de l\'enregistrement';
    } finally {
      this.isSaving = false;
    }
  }

  get sectors(): string[] {
    return [
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
      'Autre',
    ];
  }

  get companySizes(): string[] {
    return [
      '1-10 employés',
      '11-50 employés',
      '51-200 employés',
      '201-500 employés',
      '501-1000 employés',
      '1000+ employés',
    ];
  }

  get countries(): string[] {
    return [
      'Sénégal', 'Côte d\'Ivoire', 'Mali', 'Guinée', 'Mauritanie',
      'Burkina Faso', 'Niger', 'Bénin', 'Togo', 'Gambie',
      'France', 'Canada', 'Belgique', 'Suisse', 'Autre',
    ];
  }

  removeLogo() {
    this.companyData.companyLogo = '';
    this.logoPreview = null;
    this.logoFile = null;
  }
}
