import { Injectable } from '@angular/core';

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces du profil extrait
// ─────────────────────────────────────────────────────────────────────────────

export interface ExtractedExperience {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  location: string;
  description: string;
}

export interface ExtractedEducation {
  degree: string;
  institution: string;
  startYear: number;
  endYear: number;
  location: string;
}

export interface ExtractedProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  title: string;
  summary: string;
  linkedin: string;
  github: string;
  experiences: ExtractedExperience[];
  educations: ExtractedEducation[];
  technicalSkills: string[];
  softSkills: string[];
  languages: { name: string; level: string }[];
  certifications: { name: string; issuer: string }[];
  rawText: string;
  confidence: number;
}

export interface ParseProgress {
  stage: 'reading' | 'ocr' | 'parsing' | 'done' | 'error';
  progress: number;
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service principal
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class CvParserService {

  async parseFile(
    file: File,
    onProgress: (p: ParseProgress) => void
  ): Promise<ExtractedProfile> {
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

    onProgress({ stage: 'reading', progress: 10, message: 'Lecture du fichier…' });

    let rawText = '';

    if (isPdf) {
      rawText = await this.extractTextFromPdf(file, onProgress);
    } else {
      rawText = await this.extractTextFromImage(file, onProgress);
    }

    onProgress({ stage: 'parsing', progress: 80, message: 'Analyse intelligente du contenu…' });
    await this.delay(400);

    const profile = this.parseRawText(rawText);

    onProgress({ stage: 'done', progress: 100, message: 'Profil extrait avec succès !' });

    return profile;
  }

  // ──────────────────────────────────────────
  // EXTRACTION PDF AVEC PDF.JS
  // ──────────────────────────────────────────

  private async extractTextFromPdf(
    file: File,
    onProgress: (p: ParseProgress) => void
  ): Promise<string> {
    onProgress({ stage: 'reading', progress: 20, message: 'Chargement de pdf.js…' });

    await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');

    const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
    if (pdfjsLib) {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    onProgress({ stage: 'reading', progress: 35, message: 'Lecture du PDF…' });

    const arrayBuffer = await file.arrayBuffer();
    const pdfLib = (window as any)['pdfjs-dist/build/pdf'] || (window as any).pdfjsLib;

    if (!pdfLib) {
      throw new Error('pdf.js non disponible');
    }

    const pdf = await pdfLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';

      const progress = 35 + Math.round((i / pdf.numPages) * 40);
      onProgress({
        stage: 'reading',
        progress,
        message: `Extraction page ${i}/${pdf.numPages}…`
      });
    }

    return fullText;
  }

  // ──────────────────────────────────────────
  // EXTRACTION IMAGE AVEC TESSERACT.JS
  // ──────────────────────────────────────────

  private async extractTextFromImage(
    file: File,
    onProgress: (p: ParseProgress) => void
  ): Promise<string> {
    onProgress({ stage: 'ocr', progress: 20, message: 'Chargement de Tesseract.js…' });

    await this.loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js');

    const Tesseract = (window as any).Tesseract;
    if (!Tesseract) throw new Error('Tesseract.js non disponible');

    onProgress({ stage: 'ocr', progress: 30, message: 'Reconnaissance du texte (OCR)…' });

    const imageUrl = URL.createObjectURL(file);

    const result = await Tesseract.recognize(imageUrl, 'fra+eng', {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          const progress = 30 + Math.round(m.progress * 45);
          onProgress({
            stage: 'ocr',
            progress,
            message: `OCR en cours… ${Math.round(m.progress * 100)}%`
          });
        }
      }
    });

    URL.revokeObjectURL(imageUrl);
    return result.data.text;
  }

  // ──────────────────────────────────────────
  // ANALYSE DU TEXTE BRUT — VERSION AMÉLIORÉE
  // ──────────────────────────────────────────

  parseRawText(text: string): ExtractedProfile {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const fullText = text;

    const profile: ExtractedProfile = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      city: '',
      country: '',
      title: '',
      summary: '',
      linkedin: '',
      github: '',
      experiences: [],
      educations: [],
      technicalSkills: [],
      softSkills: [],
      languages: [],
      certifications: [],
      rawText: text,
      confidence: 0
    };

    // ── 1. Email
    const emailMatch = fullText.match(/\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/);
    if (emailMatch) profile.email = emailMatch[0];

    // ── 2. Téléphone (formats internationaux et sénégalais)
    const phoneMatch = fullText.match(
      /(?:\+?221[\s\-]?)?(?:70|75|76|77|78|33)[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}|(?:\+\d{1,3}[\s\-]?)?\(?\d{1,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{3,4}/
    );
    if (phoneMatch) profile.phone = phoneMatch[0].replace(/\s+/g, ' ').trim();

    // ── 3. LinkedIn
    const linkedinMatch = fullText.match(/linkedin\.com\/in\/([a-zA-Z0-9\-_]+)/i);
    if (linkedinMatch) profile.linkedin = `https://linkedin.com/in/${linkedinMatch[1]}`;

    // ── 4. GitHub
    const githubMatch = fullText.match(/github\.com\/([a-zA-Z0-9\-_]+)/i);
    if (githubMatch) profile.github = `https://github.com/${githubMatch[1]}`;

    // ── 5. Ville / Pays (amélioré)
    const location = this.extractLocation(fullText);
    profile.city = location.city;
    profile.country = location.country;

    // ── 6. Nom / Prénom (version améliorée qui accepte les majuscules)
    const name = this.extractName(lines);
    if (name) {
      const parts = name.split(/\s+/);
      profile.firstName = parts[0] || '';
      profile.lastName = parts.slice(1).join(' ') || '';
    }

    // ── 7. Titre professionnel
    profile.title = this.extractTitle(lines, fullText);

    // ── 8. Résumé
    profile.summary = this.extractSummary(fullText);

    // ── 9. Découpage en sections
    const sections = this.splitIntoSections(fullText);

    // ── 10. Expériences (version améliorée)
    profile.experiences = this.parseExperiences(sections['experience'] || fullText);

    // ── 11. Formations
    profile.educations = this.parseEducations(sections['education'] || fullText);

    // ── 12. Compétences
    const skills = this.parseSkills(sections['skills'] || fullText);
    profile.technicalSkills = skills.tech;
    profile.softSkills = skills.soft;

    // ── 13. Langues
    profile.languages = this.parseLanguages(sections['languages'] || fullText);

    // ── 14. Certifications
    profile.certifications = this.parseCertifications(sections['certifications'] || fullText);

    // ── 15. Score de confiance
    profile.confidence = this.computeConfidence(profile);

    return profile;
  }

  // ──────────────────────────────────────────
  // EXTRACTION NOM (AMÉLIORÉE)
  // ──────────────────────────────────────────

  private extractName(lines: string[]): string {
    for (let i = 0; i < Math.min(15, lines.length); i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Ignorer les lignes qui ressemblent à des sections
      if (/^(expérience|formation|profil|compétence|certification|langues|contact|à propos|coordonnées|email|téléphone|linkedin|github)/i.test(line)) {
        continue;
      }

      const words = line.split(/\s+/);
      if (words.length < 2 || words.length > 5) continue;
      if (line.length > 60) continue;

      // Vérifier si tous les mots ressemblent à des noms
      const looksLikeName = words.every(word => {
        // MOUHAMAD (tout en majuscules)
        if (/^[A-ZÀÂÄÉÈÊËÎÏÔÙÛÜ]{2,}$/.test(word)) return true;
        // Mouhamad (1ère majuscule, puis minuscules)
        if (/^[A-ZÀÂÄÉÈÊËÎÏÔÙÛÜ][a-zàâäéèêëîïôùûü]+$/.test(word)) return true;
        // Al (2 lettres avec 1ère majuscule)
        if (/^[A-ZÀÂÄÉÈÊËÎÏÔÙÛÜ][a-z]?$/.test(word) && word.length >= 2) return true;
        // Éviter les mots trop courts ou chiffres
        if (word.length < 2 || /[0-9]/.test(word)) return false;
        return false;
      });

      if (looksLikeName) {
        return line;
      }
    }
    return '';
  }

  // ──────────────────────────────────────────
  // EXTRACTION LOCALISATION
  // ──────────────────────────────────────────

  private extractLocation(text: string): { city: string; country: string } {
    const cities = [
      'Dakar', 'Thiès', 'Saint-Louis', 'Ziguinchor', 'Kaolack', 'Mbour', 'Touba', 'Diourbel',
      'Abidjan', 'Douala', 'Lomé', 'Cotonou', 'Bamako', 'Conakry', 'Paris', 'Lyon', 'Marseille',
      'Bordeaux', 'Toulouse', 'Montréal', 'Casablanca', 'Tunis', 'Alger', 'Rufisque', 'Pikine',
      'Guédiawaye', 'Tivaouane', 'Kolda', 'Tambacounda', 'Louga', 'Fatick', 'Kédougou', 'Sédhiou'
    ];

    const countries = [
      'Sénégal', 'Senegal', "Côte d'Ivoire", 'Cameroun', 'France', 'Maroc', 'Tunisie',
      'Algérie', 'Canada', 'Bénin', 'Mali', 'Guinée', 'Togo', 'Burkina Faso', 'Niger'
    ];

    let city = '';
    let country = '';

    for (const c of cities) {
      if (new RegExp(`\\b${c}\\b`, 'i').test(text)) {
        city = c;
        break;
      }
    }

    for (const c of countries) {
      if (new RegExp(`\\b${c}\\b`, 'i').test(text)) {
        country = c === 'Senegal' ? 'Sénégal' : c;
        break;
      }
    }

    return { city, country };
  }

  // ──────────────────────────────────────────
  // EXTRACTION TITRE PROFESSIONNEL
  // ──────────────────────────────────────────

  private extractTitle(lines: string[], text: string): string {
    const titleKeywords = [
      'développeur', 'developer', 'ingénieur', 'engineer', 'manager', 'chef de projet',
      'consultant', 'analyste', 'analyst', 'designer', 'architecte', 'directeur',
      'responsable', 'chargé de', 'technicien', 'data scientist', 'devops',
      'full stack', 'frontend', 'backend', 'product manager', 'scrum master',
      'lead', 'senior', 'junior', 'administrateur', 'admin'
    ];

    // Chercher dans les 20 premières lignes
    for (const line of lines.slice(0, 20)) {
      const lower = line.toLowerCase();
      if (titleKeywords.some(kw => lower.includes(kw)) && line.length < 80 && line.length > 3) {
        return line;
      }
    }

    // Chercher après "Expérience" ou "Profil"
    const titleMatch = text.match(/(?:poste|titre|fonction|position|profession)[\s:]*([^\n]{5,60})/i);
    if (titleMatch) return titleMatch[1].trim();

    return '';
  }

  // ──────────────────────────────────────────
  // EXTRACTION RÉSUMÉ
  // ──────────────────────────────────────────

  private extractSummary(text: string): string {
    const patterns = [
      /(?:profil|résumé|à propos|about me|summary|objectif|présentation)[:\s]*\n?([^\n]{20,500})/i,
      /Passionné par[^.!?]*[.!?]/i,
      /(?:actuellement|je suis|mon parcours)[^.!?]*[.!?]/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let summary = match[1] || match[0];
        if (summary.length > 20 && summary.length < 500) {
          return summary.trim();
        }
      }
    }
    return '';
  }

  // ──────────────────────────────────────────
  // DÉCOUPE EN SECTIONS (AMÉLIORÉE)
  // ──────────────────────────────────────────

  private splitIntoSections(text: string): Record<string, string> {
    const sectionKeywords: Record<string, RegExp> = {
      experience: /\b(expérience[s]?|experience[s]?|parcours professionnel|emploi[s]?|poste[s]?|professional experience|work experience|missions|career)\b/i,
      education: /\b(formation[s]?|éducation|diplôme[s]?|études|scolarité|academic|education|school|université|lycée)\b/i,
      skills: /\b(compétence[s]?|skill[s]?|savoir-faire|expertise|technologie[s]?|outils?|technical skills|compétences techniques)\b/i,
      languages: /\b(langue[s]?|language[s]?|langues parlées|langues maîtrisées)\b/i,
      certifications: /\b(certification[s]?|certificat[s]?|accréditation[s]?|diplômes? professionnel[s]?|formations complémentaires)\b/i,
      summary: /\b(profil|résumé|à propos|about me|summary|objectif[s]?|présentation)\b/i
    };

    const lines = text.split(/\r?\n/);
    const sections: Record<string, string> = {};
    let currentSection = 'header';
    let buffer: string[] = [];

    const flush = () => {
      if (buffer.length) {
        sections[currentSection] = (sections[currentSection] || '') + buffer.join('\n');
      }
      buffer = [];
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      let matched = false;
      for (const [sectionName, pattern] of Object.entries(sectionKeywords)) {
        if (pattern.test(trimmed) && trimmed.length < 50) {
          flush();
          currentSection = sectionName;
          matched = true;
          break;
        }
      }

      if (!matched) {
        buffer.push(trimmed);
      }
    }
    flush();

    return sections;
  }

  // ──────────────────────────────────────────
  // PARSE EXPÉRIENCES (VERSION AMÉLIORÉE)
  // ──────────────────────────────────────────

  private parseExperiences(text: string): ExtractedExperience[] {
    const experiences: ExtractedExperience[] = [];

    // Patterns de dates (supporte français et anglais)
    const datePatterns = [
      // 2020 - 2022
      /(\d{4})\s*[-–]\s*(\d{4})/i,
      // 2020 - présent / actuel / now
      /(\d{4})\s*[-–]\s*(présent|present|actuel|aujourd'hui|maintenant|current|now|today)/i,
      // de févr. 2020 à janv. 2022
      /de\s+(\w+\.?\s*\d{4})\s+à\s+(\w+\.?\s*\d{4})/i,
      // de févr. 2020 à ce jour
      /de\s+(\w+\.?\s*\d{4})\s+à\s+(ce jour|aujourd'hui|maintenant|present)/i,
      // janv. 2020 - déc. 2022
      /(\w+\.?\s*\d{4})\s*[-–]\s*(\w+\.?\s*\d{4})/i,
      // janv. 2020 - présent
      /(\w+\.?\s*\d{4})\s*[-–]\s*(présent|present|actuel)/i
    ];

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    let current: Partial<ExtractedExperience> | null = null;
    let descBuffer: string[] = [];
    let foundAny = false;

    const pushCurrent = () => {
      if (current && (current.title || current.company || descBuffer.length > 0)) {
        experiences.push({
          title: current.title || '',
          company: current.company || '',
          startDate: current.startDate || '',
          endDate: current.endDate || '',
          isCurrent: current.isCurrent || false,
          location: current.location || '',
          description: descBuffer.join(' ').trim().substring(0, 1000)
        });
        descBuffer = [];
        foundAny = true;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let matched = false;

      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          pushCurrent();
          current = {};

          const startRaw = match[1];
          const endRaw = match[2];

          // Convertir les dates au format YYYY-MM
          current.startDate = this.normalizeDate(startRaw);

          if (/(présent|present|actuel|ce jour|aujourd'hui|maintenant|current|now|today)/i.test(endRaw)) {
            current.isCurrent = true;
            current.endDate = '';
          } else {
            current.endDate = this.normalizeDate(endRaw);
          }

          matched = true;
          break;
        }
      }

      if (matched) continue;

      if (current) {
        // Détection du titre (ligne qui commence par une majuscule, pas trop longue)
        if (!current.title && line.length < 80 && line.length > 3 && /^[A-ZÀÂÄ]/.test(line)) {
          // Éviter les mots-clés de section
          if (!/(entreprise|société|sarl|sas|email|téléphone|linkedin)/i.test(line)) {
            current.title = line;
            continue;
          }
        }

        // Détection de l'entreprise
        if (!current.company && line.length < 60 && !current.title) {
          if (/(sarl|sas|entreprise|société|group|technologies|services|consulting)/i.test(line) ||
              /^[A-Z][a-z]+/.test(line)) {
            current.company = line;
            continue;
          }
        }

        // Détection de la localisation
        if (!current.location && /(dakar|paris|lyon|abidjan|casablanca|tunis)/i.test(line)) {
          current.location = line;
          continue;
        }

        // Accumuler la description
        if (line.length > 3 && !/^(compétences|langues|formation|certification)/i.test(line)) {
          descBuffer.push(line);
        }
      } else {
        // Avant de trouver une date, chercher un titre de poste potentiel
        if (/développeur|ingénieur|manager|chef de projet|consultant|analyste|designer/i.test(line)) {
          if (!current) current = {};
          if (!current.title && line.length < 80) {
            current.title = line;
          }
        }
      }
    }
    pushCurrent();

    // Si aucune expérience trouvée, créer une entrée vide
    if (!foundAny && experiences.length === 0) {
      experiences.push({
        title: '', company: '', startDate: '', endDate: '',
        isCurrent: false, location: '', description: ''
      });
    }

    return experiences.slice(0, 6);
  }

  // ──────────────────────────────────────────
  // NORMALISATION DES DATES
  // ──────────────────────────────────────────

  private normalizeDate(dateStr: string): string {
    const months: Record<string, string> = {
      'janv': '01', 'january': '01', 'jan': '01',
      'févr': '02', 'february': '02', 'feb': '02',
      'mars': '03', 'march': '03', 'mar': '03',
      'avr': '04', 'april': '04', 'apr': '04',
      'mai': '05', 'may': '05',
      'juin': '06', 'june': '06', 'jun': '06',
      'juil': '07', 'july': '07', 'jul': '07',
      'août': '08', 'august': '08', 'aug': '08',
      'sep': '09', 'sept': '09', 'september': '09',
      'oct': '10', 'october': '10',
      'nov': '11', 'november': '11',
      'déc': '12', 'december': '12', 'dec': '12'
    };

    // Si c'est déjà une année seule
    if (/^\d{4}$/.test(dateStr)) {
      return `${dateStr}-01`;
    }

    // Essayer d'extraire mois et année
    for (const [monthName, monthNum] of Object.entries(months)) {
      const regex = new RegExp(`${monthName}\\.?\\s*(\\d{4})`, 'i');
      const match = dateStr.match(regex);
      if (match) {
        return `${match[1]}-${monthNum}`;
      }
    }

    // Si juste une année dans la chaîne
    const yearMatch = dateStr.match(/(\d{4})/);
    if (yearMatch) {
      return `${yearMatch[1]}-01`;
    }

    return '';
  }

  // ──────────────────────────────────────────
  // PARSE FORMATIONS (AMÉLIORÉ)
  // ──────────────────────────────────────────

  private parseEducations(text: string): ExtractedEducation[] {
    const educations: ExtractedEducation[] = [];

    const degreeKeywords = [
      'licence', 'master', 'doctorat', 'phd', 'bts', 'dut', 'bac', 'ingénieur',
      'bachelor', 'mba', 'dess', 'deug', 'cap', 'bep', 'diplôme', 'certificate',
      'licence pro', 'master 2', 'master 1', 'baccalauréat', 'bfeem'
    ];

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    let current: Partial<ExtractedEducation> | null = null;
    let foundAny = false;

    const pushCurrent = () => {
      if (current && current.degree) {
        educations.push({
          degree: current.degree || '',
          institution: current.institution || '',
          startYear: current.startYear || 0,
          endYear: current.endYear || 0,
          location: current.location || ''
        });
        foundAny = true;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lower = line.toLowerCase();

      const isDegree = degreeKeywords.some(kw => lower.includes(kw));

      if (isDegree && line.length < 100) {
        pushCurrent();
        current = { degree: line };
        continue;
      }

      // Chercher les années
      const yearRange = line.match(/(\d{4})\s*[-–]\s*(\d{4})/);
      if (yearRange && current) {
        current.startYear = parseInt(yearRange[1]);
        current.endYear = parseInt(yearRange[2]);
        continue;
      }

      const singleYear = line.match(/(\d{4})/);
      if (singleYear && current && !current.endYear) {
        if (!current.startYear) {
          current.startYear = parseInt(singleYear[1]);
        } else {
          current.endYear = parseInt(singleYear[1]);
        }
        continue;
      }

      // Détection de l'établissement
      if (current && !current.institution && line.length < 80) {
        if (/(université|university|école|school|institute|iut|ucad|esp|iam|suptech|isep|lycée|cfa|faculté)/i.test(line)) {
          current.institution = line;
        }
      }
    }
    pushCurrent();

    if (!foundAny && educations.length === 0) {
      educations.push({ degree: '', institution: '', startYear: 0, endYear: 0, location: '' });
    }

    return educations.slice(0, 5);
  }

  // ──────────────────────────────────────────
  // PARSE COMPÉTENCES (AMÉLIORÉ)
  // ──────────────────────────────────────────

  private parseSkills(text: string): { tech: string[]; soft: string[] } {
    const techKeywords = [
      'angular', 'react', 'vue', 'next', 'nuxt', 'svelte', 'html', 'css', 'scss', 'tailwind',
      'javascript', 'typescript', 'python', 'java', 'php', 'ruby', 'go', 'rust', 'c#', 'c++',
      'node', 'express', 'nestjs', 'django', 'laravel', 'spring', 'rails', 'symfony', 'codeigniter',
      'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'firebase', 'supabase',
      'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'terraform', 'ansible',
      'git', 'github', 'gitlab', 'jira', 'figma', 'photoshop', 'illustrator',
      'rest', 'graphql', 'soap', 'grpc', 'api', 'ajax',
      'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'matplotlib',
      'flutter', 'react native', 'kotlin', 'swift', 'android', 'ios', 'ionic',
      'linux', 'bash', 'powershell', 'nginx', 'apache', 'ci/cd', 'devops', 'jenkins',
      'wordpress', 'prestashop', 'woocommerce', 'shopify', 'salesforce', 'sap', 'odoo',
      'blockchain', 'cryptographie', 'solidity', 'web3', 'ethereum',
      'securité', 'cybersécurité', 'pentesting', 'owasp', 'metasploit', 'wireshark'
    ];

    const softKeywordsMap: Record<string, string> = {
      'leadership': 'Leadership',
      'équipe': 'Travail en équipe',
      'teamwork': 'Travail en équipe',
      'communication': 'Communication',
      'autonomie': 'Autonomie',
      'rigueur': 'Rigueur',
      'créativité': 'Créativité',
      'adaptabilité': 'Adaptabilité',
      'gestion de projet': 'Gestion de projet',
      'problem solving': 'Résolution de problèmes',
      'organisation': 'Organisation',
      'pédagogie': 'Pédagogie',
      'proactif': 'Proactivité',
      'agile': 'Méthodes Agile',
      'scrum': 'Scrum',
      'kanban': 'Kanban',
      'discrétion': 'Discrétion',
      'fiabilité': 'Fiabilité',
      'analytique': 'Esprit analytique',
      'détail': 'Attention aux détails',
      'innovant': 'Innovation'
    };

    const lower = text.toLowerCase();
    const tech: string[] = [];
    const soft: string[] = [];

    // Extraire les compétences techniques
    for (const kw of techKeywords) {
      if (lower.includes(kw)) {
        const formatted = kw.split(' ').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        if (!tech.includes(formatted)) {
          tech.push(formatted);
        }
      }
    }

    // Extraire les soft skills
    for (const [pattern, label] of Object.entries(softKeywordsMap)) {
      if (lower.includes(pattern) && !soft.includes(label)) {
        soft.push(label);
      }
    }

    // Trier les compétences
    tech.sort();
    soft.sort();

    return {
      tech: tech.slice(0, 20),
      soft: soft.slice(0, 10)
    };
  }

  // ──────────────────────────────────────────
  // PARSE LANGUES (AMÉLIORÉ)
  // ──────────────────────────────────────────

  private parseLanguages(text: string): { name: string; level: string }[] {
    const languages: { name: string; level: string }[] = [];

    const knownLanguages = [
      'français', 'anglais', 'espagnol', 'arabe', 'wolof', 'mandingue', 'pulaar',
      'sérère', 'diola', 'portugais', 'allemand', 'italien', 'chinois', 'russe',
      'french', 'english', 'spanish', 'arabic', 'german', 'portuguese', 'russian'
    ];

    const levelMap: Record<string, string> = {
      'natif': 'maternelle',
      'maternelle': 'maternelle',
      'bilingue': 'bilingue',
      'courant': 'courant',
      'fluent': 'courant',
      'professionnel': 'professionnel',
      'intermédiaire': 'intermédiaire',
      'intermediate': 'intermédiaire',
      'notions': 'débutant',
      'basique': 'débutant',
      'basic': 'débutant',
      'c2': 'bilingue',
      'c1': 'courant',
      'b2': 'avancé',
      'b1': 'intermédiaire',
      'a2': 'élémentaire',
      'a1': 'débutant'
    };

    const lines = text.split('\n');

    for (const line of lines) {
      const lower = line.toLowerCase();
      for (const lang of knownLanguages) {
        if (lower.includes(lang)) {
          let level = 'courant';
          for (const [key, val] of Object.entries(levelMap)) {
            if (lower.includes(key)) {
              level = val;
              break;
            }
          }

          const displayName = lang.charAt(0).toUpperCase() + lang.slice(1);
          if (!languages.find(l => l.name.toLowerCase() === lang)) {
            languages.push({ name: displayName, level });
          }
          break;
        }
      }
    }

    if (languages.length === 0) {
      languages.push({ name: 'Français', level: 'maternelle' });
    }

    return languages.slice(0, 6);
  }

  // ──────────────────────────────────────────
  // PARSE CERTIFICATIONS (AMÉLIORÉ)
  // ──────────────────────────────────────────

  private parseCertifications(text: string): { name: string; issuer: string }[] {
    const certifications: { name: string; issuer: string }[] = [];

    const issuers = [
      'google', 'microsoft', 'aws', 'cisco', 'oracle', 'ibm', 'meta',
      'coursera', 'udemy', 'openclassrooms', 'linkedin learning', 'comptia',
      'tryhackme', 'hackthebox', 'certiprof', 'isc2', 'ec council'
    ];

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.length < 5 || line.length > 150) continue;

      let issuer = '';
      const lower = line.toLowerCase();

      for (const iss of issuers) {
        if (lower.includes(iss)) {
          issuer = iss.split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          break;
        }
      }

      if (issuer || /certifi|accrédita|diplôme pro|attestation|fundamentals|security|devops/i.test(line)) {
        if (!certifications.find(c => c.name === line)) {
          certifications.push({ name: line, issuer });
        }
      }
    }

    return certifications.slice(0, 5);
  }

  // ──────────────────────────────────────────
  // SCORE DE CONFIANCE
  // ──────────────────────────────────────────

  private computeConfidence(profile: ExtractedProfile): number {
    let score = 0;

    if (profile.firstName) score += 12;
    if (profile.lastName) score += 8;
    if (profile.email) score += 15;
    if (profile.phone) score += 10;
    if (profile.city) score += 5;
    if (profile.title) score += 10;
    if (profile.experiences.length > 0 && profile.experiences[0].title) score += 15;
    if (profile.educations.length > 0 && profile.educations[0].degree) score += 10;
    if (profile.technicalSkills.length > 0) score += 10;
    if (profile.languages.length > 0) score += 5;
    if (profile.summary) score += 5;
    if (profile.certifications.length > 0) score += 5;

    return Math.min(score, 100);
  }

  // ──────────────────────────────────────────
  // UTILITAIRES
  // ──────────────────────────────────────────

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Impossible de charger ${src}`));
      document.head.appendChild(script);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
