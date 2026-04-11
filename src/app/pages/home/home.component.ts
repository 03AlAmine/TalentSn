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
      bg: 'linear-gradient(135deg, #0C2B1E, #1A4A32)',
      color: '#1EC28B',
      isHovered: false
    },
    {
      initials: 'MK',
      name: 'Moussa Koné',
      role: 'Chef de Projet · 7 ans · Abidjan',
      score: 87,
      bg: 'linear-gradient(135deg, #12182E, #1E2850)',
      color: '#7FA8F5',
      isHovered: false
    },
    {
      initials: 'AD',
      name: 'Awa Diallo',
      role: 'Data Analyst · 3 ans · Dakar',
      score: 82,
      bg: 'linear-gradient(135deg, #211500, #3A2A0A)',
      color: '#F59E0B',
      isHovered: false
    }
  ];

  // Statistiques avec valeurs dynamiques
  stats = [
    {
      currentValue: 0,
      targetValue: 10234,
      displayValue: '0',
      label: 'Profils certifiés blockchain',
      suffix: '+',
      trend: '+24% ce mois',
      trendIcon: 'fas fa-arrow-up',
      trendColor: '#1EC28B'
    },
    {
      currentValue: 0,
      targetValue: 0,
      displayValue: '0',
      label: 'Faux diplômes détectés',
      suffix: '%',
      trend: 'Confiance totale',
      trendIcon: 'fas fa-shield-alt',
      trendColor: '#1EC28B'
    },
    {
      currentValue: 0,
      targetValue: 51,
      displayValue: '0',
      label: 'Durée de recrutement vs marché',
      suffix: '%',
      trend: '-15% vs 2024',
      trendIcon: 'fas fa-arrow-down',
      trendColor: '#F59E0B'
    }
  ];

  features = [
    {
      iconClass: 'fas fa-link',
      iconColor: 'g',
      title: 'Blockchain Polygon',
      description: 'Chaque diplôme est haché et enregistré sur Polygon. Vérification instantanée par QR code — les faux CV deviennent techniquement impossibles.',
      isHovered: false,
      isClicked: false
    },
    {
      iconClass: 'fas fa-chart-line',
      iconColor: 'b',
      title: 'IA Prédictive',
      description: 'Score à 4 dimensions : technique, expérience, soft skills, fit culturel. L\'IA prédit la probabilité de succès sur chaque poste.',
      isHovered: false,
      isClicked: false
    },
    {
      iconClass: 'fas fa-file-alt',
      iconColor: 'a',
      title: 'CV Assisté par IA',
      description: 'Décrivez votre parcours en français. L\'IA génère un CV ATS-optimisé, exportable PDF et partageable en ligne.',
      isHovered: false,
      isClicked: false
    },
    {
      iconClass: 'fas fa-columns',
      iconColor: 'g',
      title: 'Pipeline Kanban',
      description: 'Gérez toutes vos candidatures visuellement. Notes collaboratives, analytics et relances automatiques intégrés.',
      isHovered: false,
      isClicked: false
    },
    {
      iconClass: 'fas fa-eye-slash',
      iconColor: 'b',
      title: 'Recrutement à l\'Aveugle',
      description: 'Anonymisation automatique (nom, photo, âge) pour un premier tri 100% objectif et sans biais inconscients.',
      isHovered: false,
      isClicked: false
    },
    {
      iconClass: 'fas fa-database',
      iconColor: 'a',
      title: 'Souveraineté des données',
      description: 'Le candidat contrôle ses données. Partage via smart contract avec expiration et révocation automatique.',
      isHovered: false,
      isClicked: false
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
  private observer: IntersectionObserver | null = null;
  private messageInterval: any;
  private animationFrameId: any;

  ngOnInit(): void {
    this.setupScrollObserver();
    this.startOrbAnimation();
    this.startRotatingMessages();
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
    }, { threshold: 0.3 });

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
    const duration = 2500;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function pour une animation plus naturelle
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      
      this.stats.forEach((stat, index) => {
        const target = stat.targetValue;
        const current = Math.floor(target * easeOutCubic);
        stat.currentValue = current;
        
        if (target === 0) {
          stat.displayValue = '0';
        } else if (stat.suffix === '%') {
          stat.displayValue = current.toString();
        } else {
          stat.displayValue = current.toLocaleString();
        }
      });
      
      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        // Finalisation
        this.stats.forEach(stat => {
          if (stat.targetValue === 0) {
            stat.displayValue = '0';
          } else if (stat.suffix === '%') {
            stat.displayValue = stat.targetValue.toString();
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
      `${profile.name} correspond à ${profile.score}% avec vos critères. Top compétences : Angular, React, Node.js`,
      `🎯 Profil exceptionnel ! ${profile.name} a été recommandé par notre IA pour 3 offres premium cette semaine.`,
      `⭐ ${profile.name} fait partie du top 5% des talents sur le marché ouest-africain.`,
      `💡 Notre IA prédit un taux de succès de ${profile.score}% pour ${profile.name} sur ce poste.`
    ];
    
    this.aiMessage = messages[Math.floor(Math.random() * messages.length)];
  }

  onProfileLeave(): void {
    this.hoveredProfile = null;
  }

  startRotatingMessages(): void {
    const messages = [
      "🎯 Nouveau profil blockchain certifié : +23 diplômes vérifiés aujourd'hui",
      "⚡ L'IA a matché 156 candidats avec des offres premium cette semaine",
      "📊 +300 entreprises nous font confiance en Afrique de l'Ouest",
      "🔗 Vérification instantanée des diplômes sur Polygon — 0% fraude",
      "💼 10 000+ talents certifiés prêts à être recrutés",
      "🚀 Réduction de 51% du temps de recrutement grâce à l'IA"
    ];
    
    let index = 0;
    this.messageInterval = setInterval(() => {
      if (!this.hoveredProfile) {
        this.aiMessage = messages[index % messages.length];
        index++;
      }
    }, 5000);
  }

  startOrbAnimation(): void {
    const orbs = document.querySelectorAll('.orb');
    orbs.forEach((orb, index) => {
      (orb as HTMLElement).style.animation = `float ${20 + index * 5}s ease-in-out infinite`;
    });
  }

  onFeatureHover(feature: any, isHovered: boolean): void {
    feature.isHovered = isHovered;
  }

  onFeatureClick(feature: any): void {
    feature.isClicked = true;
    setTimeout(() => {
      feature.isClicked = false;
    }, 300);
  }
}