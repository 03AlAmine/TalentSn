import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-candidate-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './candidate-dashboard.component.html',
  styleUrls: ['./candidate-dashboard.component.css']
})
export class CandidateDashboardComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async logout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/']);
  }
}