import { Injectable } from '@angular/core';

export interface PasswordStrength {
  score: number;
  message: string;
  color: string;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PasswordValidatorService {
  
  checkStrength(password: string): PasswordStrength {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    let score = 0;
    if (requirements.length) score++;
    if (requirements.uppercase) score++;
    if (requirements.lowercase) score++;
    if (requirements.number) score++;
    if (requirements.special) score++;
    
    let message = '';
    let color = '';
    
    if (password.length === 0) {
      message = 'Entrez un mot de passe';
      color = '#e0e0e0';
    } else if (score <= 2) {
      message = 'Mot de passe faible';
      color = '#ef4444';
    } else if (score === 3) {
      message = 'Mot de passe moyen';
      color = '#f59e0b';
    } else if (score === 4) {
      message = 'Mot de passe fort';
      color = '#10b981';
    } else if (score === 5) {
      message = 'Mot de passe très fort';
      color = '#00D68F';
    }
    
    return { score, message, color, requirements };
  }
  
  getPasswordSuggestions(requirements: any): string[] {
    const suggestions = [];
    if (!requirements.length) suggestions.push('Au moins 8 caractères');
    if (!requirements.uppercase) suggestions.push('Au moins une majuscule (A-Z)');
    if (!requirements.lowercase) suggestions.push('Au moins une minuscule (a-z)');
    if (!requirements.number) suggestions.push('Au moins un chiffre (0-9)');
    if (!requirements.special) suggestions.push('Au moins un caractère spécial (!@#$%^&*)');
    return suggestions;
  }
}
