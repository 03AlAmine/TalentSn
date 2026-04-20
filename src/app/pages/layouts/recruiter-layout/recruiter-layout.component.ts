import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService, UserData } from '../../../core/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-recruiter-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './recruiter-layout.component.html',
  styleUrls: ['./recruiter-layout.component.css'],
})
export class RecruiterLayoutComponent implements OnInit {

  userData: UserData | null = null;
  sidebarOpen = false;
  userMenuOpen = false;
  currentRoute = '';

  constructor(
    private authService: AuthService,
    public router: Router,
  ) {
    // Track route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.currentRoute = this.router.url;
      });
  }

  ngOnInit() {
    this.authService.userData$.subscribe(data => {
      this.userData = data;
    });
  }

  // ====== GETTERS ======

  get fullName() {
    return `${this.userData?.firstName || ''} ${this.userData?.lastName || ''}`.trim() || 'Recruteur';
  }

  get companyName() {
    return this.userData?.companyName || 'Mon entreprise';
  }

  get initials() {
    const f = this.userData?.firstName?.[0] || '';
    const l = this.userData?.lastName?.[0] || '';
    return (f + l).toUpperCase() || 'R';
  }

  get photoURL() {
    return this.userData?.photoURL || '';
  }

  // ====== NAVIGATION ======

  navigateTo(route: string) {
    this.router.navigateByUrl(route);
  }

  // ====== UI ======

  toggleUserMenu() {
    this.userMenuOpen = !this.userMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  closeUserMenu(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.userMenuOpen = false;
    }
  }

  // ====== BREADCRUMB HELPERS ======

  isApplicationDetail(): boolean {
    return /\/applications\/[^\/]+$/.test(this.router.url);
  }

  isTalentDetail(): boolean {
    return /\/talents\/[^\/]+$/.test(this.router.url);
  }

  // ====== AUTH ======

  async logout() {
    await this.authService.logout();
  }
}
