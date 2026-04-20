import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  selectedRole: 'candidate' | 'recruiter' = 'candidate';
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  async onLogin(): Promise<void> {
    if (!this.email || !this.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const user = await this.authService.login(this.email, this.password);
      const userData = await this.authService.getUserData(user.uid);

      if (userData) {
        if (userData.role === 'candidate') {
          this.router.navigate(['/candidate/dashboard']);
        } else {
          this.router.navigate(['/recruiter/dashboard']);
        }
      } else {
        this.errorMessage = 'Données utilisateur introuvables';
      }
    } catch (error: any) {
      console.error('Login error:', error);
      switch (error.code) {
        case 'auth/user-not-found':
          this.errorMessage = 'Aucun compte associé à cet email';
          break;
        case 'auth/wrong-password':
          this.errorMessage = 'Mot de passe incorrect';
          break;
        case 'auth/invalid-email':
          this.errorMessage = 'Email invalide';
          break;
        default:
          this.errorMessage = 'Erreur de connexion. Veuillez réessayer.';
      }
    } finally {
      this.isLoading = false;
    }
  }

  async onGoogleLogin(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const user = await this.authService.loginWithGoogle();
      const userData = await this.authService.getUserData(user.uid);

      if (userData) {
        if (userData.role === 'candidate') {
          this.router.navigate(['/candidate/dashboard']);
        } else {
          this.router.navigate(['/recruiter/dashboard']);
        }
      } else {
        this.router.navigate(['/candidate/dashboard']);
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      this.errorMessage = 'Erreur lors de la connexion avec Google';
    } finally {
      this.isLoading = false;
    }
  }

  forgotPassword(): void {
    // Implémenter la réinitialisation du mot de passe
    this.errorMessage = 'Fonctionnalité à venir';
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
