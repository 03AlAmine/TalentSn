import { Component, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, CvData } from '../../services/auth.service';
import { CvUploadComponent } from '../cv/cv-upload/cv-upload.component';
import { ExtractedProfile } from '../../services/cv-parser.service';

interface Experience { title:string;company:string;startDate:string;endDate:string;isCurrent:boolean;location:string;description:string; }
interface Education { degree:string;institution:string;startYear:number;endYear:number;location:string; }
interface Certification { name:string;issuer:string; }
interface Language { name:string;level:string; }
interface AdditionalInfo { summary:string;github:string;linkedin:string;contractType:string;availability:string; }

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, CvUploadComponent],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.css'],
})
export class OnboardingComponent {
  currentStep = 0;
  genStep = 0;
  genMessage = '';
  cvFilled = false;
  cvImported = false; // true si CV importé avec succès → on skip l'onboarding

  experiences: Experience[] = [{title:'',company:'',startDate:'',endDate:'',isCurrent:false,location:'',description:''}];
  educations: Education[] = [{degree:'',institution:'',startYear:0,endYear:0,location:''}];
  certifications: Certification[] = [{name:'',issuer:''}];
  technicalSkills: string[] = [];
  softSkills: string[] = [];
  techSuggestions = ['TypeScript','Python','Firebase','PostgreSQL','Docker','AWS','Git','MongoDB','React','Angular','Node.js','Java'];
  softSuggestions = ['Leadership','Travail en équipe','Gestion de projet','Communication','Autonomie','Adaptabilité'];
  languages: Language[] = [{name:'Français',level:'maternelle'},{name:'Anglais',level:'courant'}];
  additionalInfo: AdditionalInfo = {summary:'',github:'',linkedin:'',contractType:'CDI',availability:'Immédiate'};

  // Voice
  voiceActive: string | null = null;
  private recognition: any = null;
  // Buffers pour la saisie vocale des compétences
  private voiceTechBuffer = '';
  private voiceSoftBuffer = '';

  constructor(private authService: AuthService, private router: Router, private zone: NgZone) {}

  get speechSupported(): boolean {
    return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
  }

  // ── CV UPLOAD: si IA valide → skip onboarding direct dashboard
  async onProfileExtracted(profile: ExtractedProfile): Promise<void> {
    this.cvFilled = true;
    if (profile.experiences.length > 0 && profile.experiences[0].title)
      this.experiences = profile.experiences.map(e=>({title:e.title||'',company:e.company||'',startDate:e.startDate||'',endDate:e.endDate||'',isCurrent:e.isCurrent||false,location:e.location||'',description:e.description||''}));
    if (profile.educations.length > 0 && profile.educations[0].degree)
      this.educations = profile.educations.map(e=>({degree:e.degree||'',institution:e.institution||'',startYear:e.startYear||0,endYear:e.endYear||0,location:e.location||''}));
    if (profile.technicalSkills.length > 0) this.technicalSkills = [...profile.technicalSkills];
    if (profile.softSkills.length > 0) this.softSkills = [...profile.softSkills];
    if (profile.languages.length > 0) this.languages = profile.languages.map(l=>({name:l.name,level:l.level}));
    if (profile.certifications.length > 0 && profile.certifications[0].name)
      this.certifications = profile.certifications.map(c=>({name:c.name,issuer:c.issuer}));
    if (profile.summary) this.additionalInfo.summary = profile.summary;
    if (profile.github) this.additionalInfo.github = profile.github;
    if (profile.linkedin) this.additionalInfo.linkedin = profile.linkedin;

    // Si CV bien rempli (a au moins un exp ou compétence) → génère CV IA direct
    const hasContent = (profile.experiences.length > 0 && profile.experiences[0].title) || profile.technicalSkills.length > 0;
    if (hasContent) {
      this.cvImported = true;
      this.currentStep = 5;
      window.scrollTo(0, 0);
      await this.runCvGeneration();
    } else {
      this.currentStep = 1;
      window.scrollTo(0, 0);
    }
  }

  onSkipUpload(): void { this.cvFilled = false; this.currentStep = 1; window.scrollTo(0,0); }

  nextStep(): void { if (this.currentStep < 5) { this.currentStep++; window.scrollTo(0,0); } }
  previousStep(): void {
    if (this.currentStep > 1) this.currentStep--;
    else if (this.currentStep === 1) this.currentStep = 0;
    window.scrollTo(0,0);
  }

  addExperience() { this.experiences.push({title:'',company:'',startDate:'',endDate:'',isCurrent:false,location:'',description:''}); }
  removeExperience(i: number) { if (this.experiences.length > 1) this.experiences.splice(i,1); }
  addEducation() { this.educations.push({degree:'',institution:'',startYear:0,endYear:0,location:''}); }
  removeEducation(i: number) { if (this.educations.length > 1) this.educations.splice(i,1); }
  addCertification() { this.certifications.push({name:'',issuer:''}); }
  removeCertification(i: number) { if (this.certifications.length > 1) this.certifications.splice(i,1); }
  addTechnicalSkill(s: string) { if (s.trim() && !this.technicalSkills.includes(s.trim())) this.technicalSkills.push(s.trim()); }
  removeTechnicalSkill(i: number) { this.technicalSkills.splice(i,1); }
  addSoftSkill(s: string) { if (s.trim() && !this.softSkills.includes(s.trim())) this.softSkills.push(s.trim()); }
  removeSoftSkill(i: number) { this.softSkills.splice(i,1); }
  addLanguage() { this.languages.push({name:'',level:'courant'}); }
  removeLanguage(i: number) { if (this.languages.length > 1) this.languages.splice(i,1); }

  // ── VOICE
  startVoice(fieldId: string, obj: any, key: string) {
    if (this.voiceActive) { this.stopVoice(); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    this.recognition = new SR();
    this.recognition.lang = 'fr-FR';
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.voiceActive = fieldId;
    this.recognition.onresult = (event: any) => {
      this.zone.run(() => {
        const t = event.results[0][0].transcript;
        // Cas spéciaux : compétences tech et soft (ajout via liste)
        if (fieldId === 'tech-voice') {
          // Découpe par virgule ou "et" pour ajouter plusieurs compétences
          const skills = t.split(/,|et /i).map((s: string) => s.trim()).filter((s: string) => s.length > 1);
          skills.forEach((s: string) => this.addTechnicalSkill(s));
        } else if (fieldId === 'soft-voice') {
          const skills = t.split(/,|et /i).map((s: string) => s.trim()).filter((s: string) => s.length > 1);
          skills.forEach((s: string) => this.addSoftSkill(s));
        } else {
          // Champ texte normal
          obj[key] = ((obj[key] || '') + ' ' + t).trim();
        }
      });
    };
    this.recognition.onerror = () => this.zone.run(() => this.stopVoice());
    this.recognition.onend = () => this.zone.run(() => { this.voiceActive = null; });
    this.recognition.start();
  }

  stopVoice() {
    if (this.recognition) { this.recognition.stop(); this.recognition = null; }
    this.voiceActive = null;
  }

  // ── GÉNÉRATION CV
  async generateCV(): Promise<void> {
    this.currentStep = 5;
    window.scrollTo(0,0);
    await this.runCvGeneration();
  }

  private async runCvGeneration(): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) { this.router.navigate(['/login']); return; }

    const steps = [
      'Analyse de vos expériences…',
      'Rédaction des bullet points IA…',
      'Optimisation ATS & mots-clés…',
      'Génération du résumé professionnel…',
      'Finalisation du profil…'
    ];

    for (let i = 0; i < steps.length; i++) {
      this.genStep = i + 1;
      this.genMessage = steps[i];
      if (i === 2) {
        try {
          const cvData = await this.callClaudeForCV(user.uid);
          await this.authService.saveCvData(user.uid, cvData);
        } catch (e) {
          await this.saveFallbackCv(user.uid);
        }
      }
      await this.delay(1300);
    }

    await this.authService.updateUserData(user.uid, { onboardingCompleted: true } as any);
    this.router.navigate(['/candidate/dashboard']);
  }

  private async callClaudeForCV(uid: string): Promise<CvData> {
    const userData = await this.authService.getUserData(uid);
    const prompt = `Tu es un expert RH africain francophone. Génère un CV optimisé pour ${userData?.firstName} ${userData?.lastName}.

DONNÉES :
- Titre : ${userData?.title || ''}
- Expériences : ${JSON.stringify(this.experiences)}
- Formations : ${JSON.stringify(this.educations)}
- Compétences tech : ${this.technicalSkills.join(', ')}
- Soft skills : ${this.softSkills.join(', ')}
- Langues : ${JSON.stringify(this.languages)}
- Certifications : ${JSON.stringify(this.certifications)}
- Résumé brut : ${this.additionalInfo.summary || 'À générer'}
- GitHub / Portfolio : ${this.additionalInfo.github || ''}
- LinkedIn : ${this.additionalInfo.linkedin || ''}
- Contrat : ${this.additionalInfo.contractType} | Dispo : ${this.additionalInfo.availability}

Réponds UNIQUEMENT en JSON valide :
{"summary":"Résumé pro percutant 3-4 phrases, 1ère personne, optimisé ATS","experiences":[{"title":"","company":"","startDate":"","endDate":"","isCurrent":false,"location":"","bulletPoints":["Action concrète résultat chiffré"]}],"educations":[],"technicalSkills":[],"softSkills":[],"languages":[],"certifications":[]}`;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await resp.json();
    const text = data.content?.map((c: any) => c.text || '').join('') || '';
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : {};
    const shareToken = Math.random().toString(36).substring(2, 10);

    return {
      generatedAt: new Date(), theme: 'green',
      summary: parsed.summary || this.additionalInfo.summary || '',
      experiences: parsed.experiences || this.experiences,
      educations: parsed.educations || this.educations,
      technicalSkills: parsed.technicalSkills || this.technicalSkills,
      softSkills: parsed.softSkills || this.softSkills,
      languages: parsed.languages || this.languages,
      certifications: parsed.certifications || this.certifications,
      additionalInfo: this.additionalInfo, shareToken
    };
  }

  private async saveFallbackCv(uid: string): Promise<void> {
    const cvData: CvData = {
      generatedAt: new Date(), theme: 'green',
      summary: this.additionalInfo.summary || '',
      experiences: this.experiences, educations: this.educations,
      technicalSkills: this.technicalSkills, softSkills: this.softSkills,
      languages: this.languages, certifications: this.certifications,
      additionalInfo: this.additionalInfo,
      shareToken: Math.random().toString(36).substring(2, 10)
    };
    await this.authService.saveCvData(uid, cvData);
  }

  private delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }
}