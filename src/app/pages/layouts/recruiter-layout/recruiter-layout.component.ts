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
    public router: Router
  ) {
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

  get fullName(): string {
    const firstName = this.userData?.firstName || '';
    const lastName = this.userData?.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Recruteur';
  }

  get companyName(): string {
    return this.userData?.companyName || '';
  }

  get initials(): string {
    const first = this.userData?.firstName?.charAt(0) || '';
    const last = this.userData?.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'R';
  }

  get photoURL(): string {
    return this.userData?.photoURL || '';
  }

  get position(): string {
    return this.userData?.position || 'Recruteur';
  }

  navigateTo(route: string): void {
    this.router.navigateByUrl(route);
    this.sidebarOpen = false;
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
    } else if (url.includes('/offers')) {
      items.push({ label: 'Offres', path: '/recruiter/offers' });
      if (url.includes('/create')) {
        items.push({ label: 'Nouvelle offre' });
      } else if (url.includes('/edit') || url.match(/\/offers\/[a-zA-Z0-9]+$/)) {
        items.push({ label: 'Détail offre' });
      }
    } else if (url.includes('/applications')) {
      items.push({ label: 'Candidatures', path: '/recruiter/applications' });
      if (url.match(/\/applications\/[a-zA-Z0-9]+$/)) {
        items.push({ label: 'Détail candidature' });
      }
    } else if (url.includes('/talents')) {
      items.push({ label: 'Talents', path: '/recruiter/talents' });
      if (url.match(/\/talents\/[a-zA-Z0-9]+$/)) {
        items.push({ label: 'Profil candidat' });
      }
    } else if (url.includes('/messages')) {
      items.push({ label: 'Messages' });
    } else if (url.includes('/interviews')) {
      items.push({ label: 'Entretiens' });
    } else if (url.includes('/company')) {
      items.push({ label: 'Entreprise' });
    } else if (url.includes('/profile')) {
      items.push({ label: 'Profil' });
    }

    return items;
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
