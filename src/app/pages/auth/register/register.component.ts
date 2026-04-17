import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import {
  PasswordValidatorService,
  PasswordStrength,
} from '../../../services/password-validator.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  selectedRole: 'candidate' | 'recruiter' = 'candidate';
  isLoading: boolean = false;
  errorMessage: string = '';

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

  switchForm(): void {
    this.errorMessage = '';
  }

  onPasswordChange(password: string): void {
    this.passwordStrength = this.passwordValidator.checkStrength(password);
    this.passwordSuggestions = this.passwordValidator.getPasswordSuggestions(
      this.passwordStrength.requirements,
    );
  }

  isPasswordValid(): boolean {
    const password =
      this.selectedRole === 'candidate'
        ? this.candidateData.password
        : this.recruiterData.password;
    const confirmPassword =
      this.selectedRole === 'candidate'
        ? this.candidateData.confirmPassword
        : this.recruiterData.confirmPassword;

    if (!password || !confirmPassword) return false;
    if (password !== confirmPassword) return false;
    if (this.passwordStrength.score < 3) return false;

    return true;
  }

  async onRegister(): Promise<void> {
    console.log('=== DÉBUT INSCRIPTION ===');
    this.errorMessage = '';

    if (this.selectedRole === 'candidate') {
      console.log('Rôle: Candidat');

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
        this.errorMessage =
          'Veuillez utiliser un mot de passe plus fort (au moins moyen)';
        return;
      }
    } else {
      console.log('Rôle: Recruteur');

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
        this.errorMessage =
          'Veuillez utiliser un mot de passe plus fort (au moins moyen)';
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
      console.error('Registration error:', error);
      switch (error.code) {
        case 'auth/email-already-in-use':
          this.errorMessage =
            'Cet email est déjà utilisé. Veuillez vous connecter.';
          break;
        case 'auth/invalid-email':
          this.errorMessage = 'Email invalide';
          break;
        case 'auth/weak-password':
          this.errorMessage =
            'Mot de passe trop faible. Utilisez au moins 8 caractères avec majuscules, minuscules et chiffres.';
          break;
        default:
          this.errorMessage =
            error.message ||
            "Erreur lors de l'inscription. Veuillez réessayer.";
      }
    } finally {
      this.isLoading = false;
    }
  }

  async onGoogleRegister(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.authService.loginWithGoogle();
      this.router.navigate(['/onboarding']);
    } catch (error: any) {
      console.error('Google registration error:', error);
      this.errorMessage = "Erreur lors de l'inscription avec Google";
    } finally {
      this.isLoading = false;
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
