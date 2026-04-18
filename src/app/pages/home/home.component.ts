// home.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  // Profils améliorés avec plus de données
  topProfiles = [
    {
      initials: 'FA',
      name: 'Fatou Aminata Sow',
      role: 'Dev Full Stack · 4 ans · Dakar',
      score: 94,
      bg: 'linear-gradient(135deg, #0C2B1E, #1A4A32)',
      color: '#1EC28B',
      skills: ['Angular', 'React', 'Node.js', 'Blockchain'],
      verified: true,
      isHovered: false,
    },
    {
      initials: 'MK',
      name: 'Moussa Koné',
      role: 'Chef de Projet · 7 ans · Abidjan',
      score: 87,
      bg: 'linear-gradient(135deg, #12182E, #1E2850)',
      color: '#7FA8F5',
      skills: ['Agile', 'Scrum', 'Jira', 'Leadership'],
      verified: true,
      isHovered: false,
    },
    {
      initials: 'AD',
      name: 'Awa Diallo',
      role: 'Data Analyst · 3 ans · Dakar',
      score: 82,
      bg: 'linear-gradient(135deg, #211500, #3A2A0A)',
      color: '#F59E0B',
      skills: ['Python', 'SQL', 'Power BI', 'Tableau'],
      verified: true,
      isHovered: false,
    },
    {
      initials: 'BS',
      name: 'Babacar Sarr',
      role: 'UX Designer · 5 ans · Dakar',
      score: 91,
      bg: 'linear-gradient(135deg, #1E1B2E, #2D2848)',
      color: '#A78BFA',
      skills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping'],
      verified: true,
      isHovered: false,
    },
  ];

  // Statistiques avec valeurs plus réalistes
  stats = [
    {
      currentValue: 0,
      targetValue: 15234,
      displayValue: '0',
      label: 'Profils certifiés blockchain',
      suffix: '+',
      trend: '+24% ce mois',
      trendIcon: 'fas fa-arrow-up',
      trendColor: '#1EC28B',
      icon: 'fas fa-user-check',
    },
    {
      currentValue: 0,
      targetValue: 99.7,
      displayValue: '0',
      label: 'Faux diplômes détectés',
      suffix: '%',
      trend: 'Confiance totale',
      trendIcon: 'fas fa-shield-alt',
      trendColor: '#1EC28B',
      icon: 'fas fa-shield-virus',
    },
    {
      currentValue: 0,
      targetValue: 51,
      displayValue: '0',
      label: 'Durée de recrutement réduite',
      suffix: '%',
      trend: '-15% vs 2024',
      trendIcon: 'fas fa-arrow-down',
      trendColor: '#F59E0B',
      icon: 'fas fa-clock',
    },
    {
      currentValue: 0,
      targetValue: 845,
      displayValue: '0',
      label: 'Entreprises partenaires',
      suffix: '+',
      trend: '+12 nouvelles ce mois',
      trendIcon: 'fas fa-building',
      trendColor: '#1EC28B',
      icon: 'fas fa-building',
    },
  ];

  features = [
    {
      iconClass: 'fas fa-link',
      iconColor: 'g',
      title: 'Blockchain Polygon',
      description:
        'Chaque diplôme est haché et enregistré sur Polygon. Vérification instantanée par QR code — les faux CV deviennent techniquement impossibles.',
      stats: '10k+ diplômes certifiés',
      isHovered: false,
    },
    {
      iconClass: 'fas fa-chart-line',
      iconColor: 'b',
      title: 'IA Prédictive',
      description:
        "Score à 4 dimensions : technique, expérience, soft skills, fit culturel. L'IA prédit la probabilité de succès sur chaque poste.",
      stats: '92% de précision',
      isHovered: false,
    },
    {
      iconClass: 'fas fa-file-alt',
      iconColor: 'a',
      title: 'CV Assisté par IA',
      description:
        "Décrivez votre parcours en français. L'IA génère un CV ATS-optimisé, exportable PDF et partageable en ligne.",
      stats: 'ATS Score +45%',
      isHovered: false,
    },
    {
      iconClass: 'fas fa-columns',
      iconColor: 'g',
      title: 'Pipeline Kanban',
      description:
        'Gérez toutes vos candidatures visuellement. Notes collaboratives, analytics et relances automatiques intégrés.',
      stats: 'Temps réduit de 60%',
      isHovered: false,
    },
    {
      iconClass: 'fas fa-eye-slash',
      iconColor: 'b',
      title: "Recrutement à l'Aveugle",
      description:
        'Anonymisation automatique (nom, photo, âge) pour un premier tri 100% objectif et sans biais inconscients.',
      stats: 'Diversité +35%',
      isHovered: false,
    },
    {
      iconClass: 'fas fa-database',
      iconColor: 'a',
      title: 'Souveraineté des données',
      description:
        'Le candidat contrôle ses données. Partage via smart contract avec expiration et révocation automatique.',
      stats: 'RGPD compliant',
      isHovered: false,
    },
  ];

  testimonials = [
    {
      text: 'Grâce à TalentSn, nous avons réduit notre temps de recrutement de 60%. La vérification blockchain des diplômes est une révolution pour notre secteur bancaire.',
      authorName: 'Sophie Mendy',
      authorTitle: 'DRH, Orange Sénégal',
      authorInitials: 'SM',
      avatarBg: 'linear-gradient(135deg, #1EC28B, #0F8B5E)',
      rating: 5,
    },
    {
      text: "L'IA prédictive nous a permis de trouver des profils rares que nous n'aurions jamais repérés autrement. Un outil indispensable pour notre croissance.",
      authorName: 'Ibrahim Touré',
      authorTitle: 'CTO, Wave Sénégal',
      authorInitials: 'IT',
      avatarBg: 'linear-gradient(135deg, #F59E0B, #D97706)',
      rating: 5,
    },
    {
      text: 'La transparence et la sécurité blockchain rassurent aussi bien les recruteurs que les candidats. TalentSn est un véritable game changer en Afrique.',
      authorName: 'Aïcha Diallo',
      authorTitle: 'Fondatrice, Dakar Dev Hub',
      authorInitials: 'AD',
      avatarBg: 'linear-gradient(135deg, #3B82F6, #2563EB)',
      rating: 5,
    },
    {
      text: 'Nous recrutons désormais 3 fois plus vite. La qualité des candidats certifiés blockchain est exceptionnelle.',
      authorName: 'Mamadou Diop',
      authorTitle: 'CEO, Sonatel Academy',
      authorInitials: 'MD',
      avatarBg: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
      rating: 5,
    },
  ];

  hoveredProfile: any = null;
  aiMessage: string =
    '✨ Fatou correspond à 94% à votre offre Angular — compétences blockchain rares sur le marché. Contactez-la rapidement !';
  currentTime: string = '';
  private statsAnimated: boolean = false;
  private observer: IntersectionObserver | null = null;
  private messageInterval: any;
  private animationFrameId: any;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.setupScrollObserver();
      this.startRotatingMessages();
      this.updateTime();
      setInterval(() => this.updateTime(), 1000);
    }
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.messageInterval) {
      clearInterval(this.messageInterval);
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  updateTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  mobileMenuOpen: boolean = false;
  isScrolled: boolean = false;

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (this.isBrowser) {
      this.checkStatsInView();
      // Pour la navbar scrolled
      this.isScrolled = window.scrollY > 50;
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
  setupScrollObserver(): void {
    if (!this.isBrowser) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.statsAnimated) {
            this.statsAnimated = true;
            this.animateCounters();
          }
        });
      },
      { threshold: 0.2 },
    );

    const statsSection = document.querySelector('.stats-bar');
    if (statsSection) {
      this.observer.observe(statsSection);
    }
  }

  checkStatsInView(): void {
    if (!this.statsAnimated && this.isBrowser) {
      const statsSection = document.querySelector('.stats-bar');
      if (statsSection) {
        const rect = statsSection.getBoundingClientRect();
        const isVisible =
          rect.top < window.innerHeight - 100 && rect.bottom > 0;
        if (isVisible) {
          this.statsAnimated = true;
          this.animateCounters();
        }
      }
    }
  }

  animateCounters(): void {
    const duration = 2000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);

      this.stats.forEach((stat) => {
        const target = stat.targetValue;
        const current = target * easeOutCubic;

        if (stat.suffix === '%') {
          stat.displayValue = current.toFixed(1);
        } else {
          stat.displayValue = Math.floor(current).toLocaleString();
        }
      });

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.stats.forEach((stat) => {
          if (stat.suffix === '%') {
            stat.displayValue = stat.targetValue.toFixed(1);
          } else {
            stat.displayValue = stat.targetValue.toLocaleString();
          }
        });
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  onProfileHover(profile: any): void {
    this.hoveredProfile = profile;

    const messages = [
      `${profile.name} correspond à ${profile.score}% avec vos critères. Compétences clés : ${profile.skills.slice(0, 3).join(', ')}`,
      `🎯 Profil exceptionnel ! ${profile.name} a été recommandé par notre IA pour 3 offres premium cette semaine.`,
      `⭐ ${profile.name} fait partie du top 5% des talents sur le marché ouest-africain.`,
      `💡 Notre IA prédit un taux de succès de ${profile.score}% pour ${profile.name} sur ce poste.`,
    ];

    this.aiMessage = messages[Math.floor(Math.random() * messages.length)];
  }

  onProfileLeave(): void {
    this.hoveredProfile = null;
  }

  startRotatingMessages(): void {
    const messages = [
      "🎯 Nouveau profil blockchain certifié : +156 diplômes vérifiés aujourd'hui",
      "⚡ L'IA a matché 2,345 candidats avec des offres premium cette semaine",
      "📊 +845 entreprises nous font confiance en Afrique de l'Ouest",
      '🔗 Vérification instantanée des diplômes sur Polygon — 0% fraude',
      '💼 15,000+ talents certifiés prêts à être recrutés',
      "🚀 Réduction de 51% du temps de recrutement grâce à l'IA",
      '💎 92% des recruteurs recommandent TalentSn à leurs pairs',
    ];

    let index = 0;
    this.messageInterval = setInterval(() => {
      if (!this.hoveredProfile) {
        this.aiMessage = messages[index % messages.length];
        index++;
      }
    }, 4000);
  }

  scrollToFeatures(): void {
    if (this.isBrowser) {
      const featuresSection = document.querySelector('.features-section');
      featuresSection?.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
