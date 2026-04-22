// candidate-layout.component.ts (CORRIGÉ)
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService, UserData } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-candidate-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './candidate-layout.component.html',
  styleUrls: ['./candidate-layout.component.css']
})
export class CandidateLayoutComponent implements OnInit, OnDestroy {
  userData: UserData | null = null;
  sidebarOpen = false;
  userMenuOpen = false;
  currentRoute = '';
  private subscriptions = new Subscription();

  navItems: NavItem[] = [
    { path: '/candidate/dashboard', label: 'Tableau de bord', icon: 'M3 12h18M3 6h18M3 18h18' },
    { path: '/candidate/cv', label: 'Mon CV', icon: 'M4 4h16v16H4zM8 4v16M16 4v16M4 12h16' },
    { path: '/candidate/offers', label: 'Offres d\'emploi', icon: 'M20 7h-4.18A3 3 0 0016 5.18V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v1.18A3 3 0 008.18 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z' },
    { path: '/candidate/applications', label: 'Mes candidatures', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { path: '/candidate/messages', label: 'Messages', icon: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' },
    { path: '/candidate/interviews', label: 'Entretiens', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { path: '/candidate/profile', label: 'Mon profil', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
  ];

  constructor(
    private authService: AuthService,
    public router: Router
  ) {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.currentRoute = this.router.url;
      });
  }

  ngOnInit() {
    this.subscriptions.add(
      this.authService.userData$.subscribe(data => {
        this.userData = data;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  get fullName(): string {
    const firstName = this.userData?.firstName || '';
    const lastName = this.userData?.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Candidat';
  }

  get initials(): string {
    const first = this.userData?.firstName?.charAt(0) || '';
    const last = this.userData?.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'C';
  }

  get photoURL(): string {
    return this.userData?.photoURL || '';
  }

  get title(): string {
    return this.userData?.title || 'Candidat';
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  closeUserMenu(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.userMenuOpen = false;
    }
  }

  getBreadcrumbItems(): Array<{ label: string; path?: string }> {
    const url = this.router.url;
    const items: Array<{ label: string; path?: string }> = [];

    if (url.includes('/dashboard')) {
      items.push({ label: 'Tableau de bord' });
    } else if (url.includes('/cv')) {
      items.push({ label: 'Mon CV', path: '/candidate/cv' });
    } else if (url.includes('/offers')) {
      items.push({ label: 'Offres', path: '/candidate/offers' });
    } else if (url.includes('/applications')) {
      items.push({ label: 'Mes candidatures', path: '/candidate/applications' });
    } else if (url.includes('/messages')) {
      items.push({ label: 'Messages' });
    } else if (url.includes('/interviews')) {
      items.push({ label: 'Entretiens' });
    } else if (url.includes('/profile')) {
      items.push({ label: 'Mon profil' });
    }

    return items;
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
