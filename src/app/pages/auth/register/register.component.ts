import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import {
  PasswordValidatorService,
  PasswordStrength,
} from '../../../core/services/password-validator.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  selectedRole: 'candidate' | 'recruiter' = 'candidate';
  isLoading = false;
  errorMessage = '';

  // ID card scan
  idScanState: 'idle' | 'scanning' | 'success' | 'error' = 'idle';
  idScanMessage = '';
  idPreviewUrl: string | null = null;

  passwordStrength: PasswordStrength = {
    score: 0,
    message: '',
    color: '#e0e0e0',
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    },
  };
  passwordSuggestions: string[] = [];

  candidateData = {
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    placeOfBirth: '',
    phone: '',
    city: 'Dakar',
    country: 'Sénégal',
    title: '',
    educationLevel: 'Licence BAC+3',
    experienceYears: '1–3 ans',
    sector: 'Tech & Digital',
  };

  recruiterData = {
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    position: '',
    companyName: '',
    companySector: 'Tech & Startups',
    employeeCount: '11–50',
    city: 'Dakar',
    country: 'Sénégal',
    website: '',
    ninea: '',
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private passwordValidator: PasswordValidatorService,
  ) {}

  switchForm() {
    this.errorMessage = '';
  }

  onPasswordChange(pwd: string) {
    this.passwordStrength = this.passwordValidator.checkStrength(pwd);
    this.passwordSuggestions = this.passwordValidator.getPasswordSuggestions(
      this.passwordStrength.requirements,
    );
  }

  isPasswordValid(): boolean {
    const pwd =
      this.selectedRole === 'candidate'
        ? this.candidateData.password
        : this.recruiterData.password;
    const conf =
      this.selectedRole === 'candidate'
        ? this.candidateData.confirmPassword
        : this.recruiterData.confirmPassword;
    return !!(pwd && conf && pwd === conf && this.passwordStrength.score >= 3);
  }

  // ── SCAN CARTE D'IDENTITÉ (PDF uniquement)
  triggerIdScan() {
    const input = document.createElement('input');
    input.type = 'file';
    // CORRECTION : on n'accepte que les PDF (carte d'identité scannée)
    input.accept = 'application/pdf';
    input.onchange = (e: any) => {
      const file: File = e.target.files[0];
      if (!file) return;
      // Vérification supplémentaire côté JS
      if (file.type !== 'application/pdf') {
        this.idScanState = 'error';
        this.idScanMessage =
          "Seuls les fichiers PDF sont acceptés. Scannez votre carte d'identité et exportez-la en PDF.";
        return;
      }
      this.processIdCard(file);
    };
    input.click();
  }

  async processIdCard(file: File) {
    this.idScanState = 'scanning';
    this.idScanMessage = 'Chargement du PDF…';

    try {
      // ÉTAPE 1 : Rendre le PDF en image via canvas (pdf.js)
      // Fonctionne même si le PDF est une photo scannée (pas de texte sélectionnable)
      this.idScanMessage = 'Rendu de la carte en image…';
      const imageBase64 = await this.pdfPageToImageBase64(file);

      // Aperçu local
      this.idPreviewUrl = 'data:image/jpeg;base64,' + imageBase64;

      // ÉTAPE 2 : Envoyer l'IMAGE à Claude Vision
      // On envoie une image JPEG (pas un document PDF) → pas de CORS
      this.idScanMessage = 'Analyse IA en cours…';
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-dangerous-allow-browser': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: imageBase64,
                  },
                },
                {
                  type: 'text',
                  text: `C'est une carte d'identité nationale sénégalaise (CEDEAO).
Lis tous les champs visibles et réponds UNIQUEMENT avec ce JSON, sans texte avant ni après :
{"isIdCard":true,"firstName":"prénom","lastName":"NOM","dateOfBirth":"JJ/MM/AAAA","placeOfBirth":"lieu de naissance"}

Règles importantes :
- Le NOM de famille (Nom) est en MAJUSCULES (ex: MBAYE)
- Les Prénoms sont en minuscules/mixte (ex: Die)
- dateOfBirth = "Date de naissance" au format JJ/MM/AAAA
- placeOfBirth = "Lieu de naissance"
- Si un champ est illisible, mets ""
- Si ce n'est pas une carte d'identité : {"isIdCard":false,"reason":"explication courte"}`,
                },
              ],
            },
          ],
        }),
      });

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        throw new Error(
          (errBody as any)?.error?.message || `Erreur HTTP ${resp.status}`,
        );
      }

      const data = await resp.json();
      const text = data.content?.map((c: any) => c.text || '').join('') || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Réponse IA invalide');
      const result = JSON.parse(match[0]);

      if (!result.isIdCard) {
        this.idScanState = 'error';
        this.idScanMessage =
          result.reason ||
          "Ce document ne semble pas être une carte d'identité.";
        this.idPreviewUrl = null;
        return;
      }

      if (result.firstName) this.candidateData.firstName = result.firstName;
      if (result.lastName) this.candidateData.lastName = result.lastName;
      if (result.dateOfBirth)
        this.candidateData.dateOfBirth = result.dateOfBirth;
      if (result.placeOfBirth)
        this.candidateData.placeOfBirth = result.placeOfBirth;

      this.idScanState = 'success';
      this.idScanMessage =
        'Informations extraites avec succès ! Vérifiez et complétez si besoin.';
    } catch (err: any) {
      console.error('ID scan error:', err);
      this.idScanState = 'error';
      this.idPreviewUrl = null;
      this.idScanMessage = `Erreur : ${err.message || 'Impossible de lire le PDF. Réessayez.'}`;
    }
  }

  // Convertit la 1ère page du PDF en JPEG base64 via canvas
  private async pdfPageToImageBase64(file: File): Promise<string> {
    await this.loadScript(
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    );

    const pdfLib =
      (window as any)['pdfjs-dist/build/pdf'] || (window as any).pdfjsLib;
    if (!pdfLib) throw new Error('pdf.js non disponible');

    pdfLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    // Résolution 2x pour meilleure lisibilité par l'IA
    const scale = 2.0;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;

    await page.render({ canvasContext: ctx, viewport }).promise;

    // Retourner en JPEG base64 (qualité 0.92)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    return dataUrl.split(',')[1];
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Impossible de charger ${src}`));
      document.head.appendChild(s);
    });
  }

  resetIdScan() {
    this.idScanState = 'idle';
    this.idScanMessage = '';
    this.idPreviewUrl = null;
  }

  async onRegister() {
    this.errorMessage = '';
    if (this.selectedRole === 'candidate') {
      if (
        !this.candidateData.email ||
        !this.candidateData.password ||
        !this.candidateData.firstName ||
        !this.candidateData.lastName
      ) {
        this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
        return;
      }
      if (this.candidateData.password !== this.candidateData.confirmPassword) {
        this.errorMessage = 'Les mots de passe ne correspondent pas';
        return;
      }
      if (this.passwordStrength.score < 3) {
        this.errorMessage = 'Mot de passe trop faible';
        return;
      }
    } else {
      if (
        !this.recruiterData.email ||
        !this.recruiterData.password ||
        !this.recruiterData.firstName ||
        !this.recruiterData.lastName ||
        !this.recruiterData.companyName ||
        !this.recruiterData.ninea
      ) {
        this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
        return;
      }
      if (this.recruiterData.password !== this.recruiterData.confirmPassword) {
        this.errorMessage = 'Les mots de passe ne correspondent pas';
        return;
      }
      if (this.passwordStrength.score < 3) {
        this.errorMessage = 'Mot de passe trop faible';
        return;
      }
    }
    this.isLoading = true;
    try {
      if (this.selectedRole === 'candidate') {
        await this.authService.registerCandidate(this.candidateData);
        this.router.navigate(['/onboarding']);
      } else {
        await this.authService.registerRecruiter(this.recruiterData);
        this.router.navigate(['/recruiter/dashboard']);
      }
    } catch (error: any) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          this.errorMessage = 'Cet email est déjà utilisé.';
          break;
        case 'auth/invalid-email':
          this.errorMessage = 'Email invalide';
          break;
        case 'auth/weak-password':
          this.errorMessage = 'Mot de passe trop faible.';
          break;
        default:
          this.errorMessage = error.message || "Erreur lors de l'inscription.";
      }
    } finally {
      this.isLoading = false;
    }
  }

  async onGoogleRegister() {
    this.isLoading = true;
    try {
      await this.authService.loginWithGoogle();
      this.router.navigate(['/onboarding']);
    } catch {
      this.errorMessage = 'Erreur Google';
    } finally {
      this.isLoading = false;
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
