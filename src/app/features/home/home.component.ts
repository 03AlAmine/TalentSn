import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  
  topProfiles = [
    {
      initials: 'FA',
      name: 'Fatou Aminata Sow',
      role: 'Dev Full Stack · 4 ans · Dakar',
      score: 94,
      bg: '#0C2B1E',
      color: '#1EC28B'
    },
    {
      initials: 'MK',
      name: 'Moussa Koné',
      role: 'Chef de Projet · 7 ans · Abidjan',
      score: 87,
      bg: '#12182E',
      color: '#7FA8F5'
    },
    {
      initials: 'AD',
      name: 'Awa Diallo',
      role: 'Data Analyst · 3 ans · Dakar',
      score: 82,
      bg: '#211500',
      color: '#F59E0B'
    }
  ];

  stats = [
    { 
      value: '10 000+', 
      rawValue: 10000,
      displayValue: '0',
      label: 'Profils certifiés blockchain',
      suffix: '+',
      trend: '+24% ce mois',
      trendIcon: 'fas fa-arrow-up'
    },
    { 
      value: '0%', 
      rawValue: 0,
      displayValue: '0',
      label: 'Faux diplômes détectés',
      suffix: '%',
      trend: 'Confiance totale',
      trendIcon: 'fas fa-shield-alt'
    },
    { 
      value: '−51%', 
      rawValue: 51,
      displayValue: '0',
      label: 'Durée de recrutement vs marché',
      suffix: '%',
      trend: '-15% vs 2024',
      trendIcon: 'fas fa-arrow-down'
    }
  ];

  features = [
    {
      icon: 'fa-link',
      iconClass: 'fas fa-link',
      iconColor: 'g',
      title: 'Blockchain Polygon',
      description: 'Chaque diplôme est haché et enregistré sur Polygon. Vérification instantanée par QR code — les faux CV deviennent techniquement impossibles.'
    },
    {
      icon: 'fa-chart-line',
      iconClass: 'fas fa-chart-line',
      iconColor: 'b',
      title: 'IA Prédictive',
      description: 'Score à 4 dimensions : technique, expérience, soft skills, fit culturel. L\'IA prédit la probabilité de succès sur chaque poste.'
    },
    {
      icon: 'fa-file-alt',
      iconClass: 'fas fa-file-alt',
      iconColor: 'a',
      title: 'CV Assisté par IA',
      description: 'Décrivez votre parcours en français. L\'IA génère un CV ATS-optimisé, exportable PDF et partageable en ligne.'
    },
    {
      icon: 'fa-columns',
      iconClass: 'fas fa-columns',
      iconColor: 'g',
      title: 'Pipeline Kanban',
      description: 'Gérez toutes vos candidatures visuellement. Notes collaboratives, analytics et relances automatiques intégrés.'
    },
    {
      icon: 'fa-eye-slash',
      iconClass: 'fas fa-eye-slash',
      iconColor: 'b',
      title: 'Recrutement à l\'Aveugle',
      description: 'Anonymisation automatique (nom, photo, âge) pour un premier tri 100% objectif et sans biais inconscients.'
    },
    {
      icon: 'fa-database',
      iconClass: 'fas fa-database',
      iconColor: 'a',
      title: 'Souveraineté des données',
      description: 'Le candidat contrôle ses données. Partage via smart contract avec expiration et révocation automatique.'
    }
  ];

  testimonials = [
    {
      text: "Grâce à TalentSn, nous avons réduit notre temps de recrutement de 60%. La vérification blockchain des diplômes est une révolution pour notre secteur.",
      authorName: "Sophie Mendy",
      authorTitle: "DRH, Orange Sénégal",
      authorInitials: "SM",
      avatarBg: "#1EC28B"
    },
    {
      text: "L'IA prédictive nous a permis de trouver des profils rares que nous n'aurions jamais repérés autrement. Un outil indispensable.",
      authorName: "Ibrahim Touré",
      authorTitle: "CTO, Wave Sénégal",
      authorInitials: "IT",
      avatarBg: "#F59E0B"
    },
    {
      text: "La transparence et la sécurité blockchain rassurent aussi bien les recruteurs que les candidats. TalentSn est un game changer.",
      authorName: "Aïcha Diallo",
      authorTitle: "Fondatrice, Dakar Dev Hub",
      authorInitials: "AD",
      avatarBg: "#3B82F6"
    }
  ];

  hoveredProfile: any = null;
  aiMessage: string = "Fatou correspond à 94% à votre offre Angular — compétences blockchain rares sur le marché. Contactez-la rapidement !";
  
  private statsAnimated: boolean = false;
  private counterInterval: any;
  private observer: IntersectionObserver | null = null;

  ngOnInit(): void {
    this.setupScrollObserver();
    this.startOrbAnimation();
  }

  ngOnDestroy(): void {
    if (this.counterInterval) {
      clearInterval(this.counterInterval);
    }
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.checkStatsInView();
  }

  setupScrollObserver(): void {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.statsAnimated) {
          this.statsAnimated = true;
          this.animateCounters();
        }
      });
    }, { threshold: 0.5 });

    const statsSection = document.querySelector('.stats-bar');
    if (statsSection) {
      this.observer.observe(statsSection);
    }
  }

  checkStatsInView(): void {
    if (!this.statsAnimated) {
      const statsSection = document.querySelector('.stats-bar');
      if (statsSection) {
        const rect = statsSection.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight - 100 && rect.bottom > 0;
        if (isVisible) {
          this.statsAnimated = true;
          this.animateCounters();
        }
      }
    }
  }

  animateCounters(): void {
    const counters = document.querySelectorAll('.counter');
    
    counters.forEach((counter, index) => {
      const target = this.stats[index]?.rawValue || 0;
      const suffix = this.stats[index]?.suffix || '';
      let current = 0;
      const increment = target / 50;
      const duration = 1500;
      const stepTime = duration / 50;
      
      const updateCounter = () => {
        current += increment;
        if (current < target) {
          if (suffix === '%' && target === 0) {
            counter.textContent = '0';
          } else {
            counter.textContent = Math.floor(current).toLocaleString();
          }
          setTimeout(updateCounter, stepTime);
        } else {
          if (target === 0) {
            counter.textContent = '0';
          } else if (suffix === '%') {
            counter.textContent = target.toString();
          } else {
            counter.textContent = target.toLocaleString();
          }
        }
      };
      
      setTimeout(() => {
        updateCounter();
      }, index * 200);
    });
  }

  onProfileHover(profile: any): void {
    this.hoveredProfile = profile;
    
    const messages = [
      `${profile.name} correspond à ${profile.score}% avec vos critères. Top compétences : ${profile.role.split('·')[0]}`,
      `Profil rare ! ${profile.name} a été recommandé par notre IA pour 3 offres similaires cette semaine.`,
      `🔥 ${profile.name} fait partie des 5% meilleurs profils sur le marché ouest-africain.`
    ];
    
    this.aiMessage = messages[Math.floor(Math.random() * messages.length)];
  }

  onProfileLeave(): void {
    this.hoveredProfile = null;
    this.aiMessage = "Fatou correspond à 94% à votre offre Angular — compétences blockchain rares sur le marché. Contactez-la rapidement !";
  }

  startOrbAnimation(): void {
    const orbs = document.querySelectorAll('.orb');
    orbs.forEach((orb, index) => {
      (orb as HTMLElement).style.animation = `float ${20 + index * 5}s ease-in-out infinite`;
    });
  }
}