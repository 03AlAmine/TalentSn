import {
  Component,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CvParserService,
  ExtractedProfile,
  ParseProgress
} from '../../services/cv-parser.service';

export type UploadMode = 'idle' | 'dragging' | 'processing' | 'done' | 'error';

@Component({
  selector: 'app-cv-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cv-upload.component.html',
  styleUrls: ['./cv-upload.component.css']
})
export class CvUploadComponent {
  @Output() profileExtracted = new EventEmitter<ExtractedProfile>();
  @Output() skipUpload = new EventEmitter<void>();

  mode: UploadMode = 'idle';
  progress: ParseProgress = { stage: 'reading', progress: 0, message: '' };
  errorMsg: string = '';
  extractedProfile: ExtractedProfile | null = null;
  fileName: string = '';

  constructor(private cvParser: CvParserService) {}

  // ──────────────────────────────────────────
  // GETTERS (remplacent les computed signals)
  // ──────────────────────────────────────────

  get isDragging(): boolean   { return this.mode === 'dragging';   }
  get isProcessing(): boolean { return this.mode === 'processing'; }
  get isDone(): boolean       { return this.mode === 'done';       }
  get isError(): boolean      { return this.mode === 'error';      }

  // ──────────────────────────────────────────
  // DRAG & DROP
  // ──────────────────────────────────────────

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.mode = 'dragging';
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.mode = 'idle';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.mode = 'idle';
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  // ──────────────────────────────────────────
  // INPUT FILE
  // ──────────────────────────────────────────

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  triggerFileInput(): void {
    document.getElementById('cv-file-input')?.click();
  }

  // ──────────────────────────────────────────
  // TRAITEMENT DU FICHIER
  // ──────────────────────────────────────────

  private async processFile(file: File): Promise<void> {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10 MB

    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png|webp)$/i)) {
      this.errorMsg = 'Format non supporté. Utilisez PDF, JPG ou PNG.';
      this.mode = 'error';
      return;
    }

    if (file.size > maxSize) {
      this.errorMsg = 'Fichier trop lourd (max 10 MB).';
      this.mode = 'error';
      return;
    }

    this.fileName = file.name;
    this.mode = 'processing';
    this.errorMsg = '';

    try {
      const profile = await this.cvParser.parseFile(file, (p: ParseProgress) => {
        this.progress = { ...p }; // spread pour forcer la détection de changement
      });

      this.extractedProfile = profile;
      this.mode = 'done';

    } catch (err: any) {
      console.error('CV parsing error:', err);
      this.errorMsg = err.message || "Erreur lors de l'analyse du document.";
      this.mode = 'error';
    }
  }

  // ──────────────────────────────────────────
  // ACTIONS UTILISATEUR
  // ──────────────────────────────────────────

  confirmProfile(): void {
    if (this.extractedProfile) {
      this.profileExtracted.emit(this.extractedProfile);
    }
  }

  retryUpload(): void {
    this.mode = 'idle';
    this.errorMsg = '';
    this.extractedProfile = null;
    this.fileName = '';
    this.progress = { stage: 'reading', progress: 0, message: '' };
  }

  skip(): void {
    this.skipUpload.emit();
  }

  // ──────────────────────────────────────────
  // HELPERS TEMPLATE
  // ──────────────────────────────────────────

  getConfidenceLabel(score: number): string {
    if (score >= 80) return '🟢 Excellent';
    if (score >= 60) return '🟡 Bon';
    if (score >= 40) return '🟠 Partiel';
    return '🔴 Limité';
  }

  isStageCompleted(targetStage: string): boolean {
    const order = ['reading', 'ocr', 'parsing', 'done'];
    return order.indexOf(this.progress.stage) > order.indexOf(targetStage);
  }

  isStageActive(targetStage: string): boolean {
    return this.progress.stage === targetStage;
  }
}
