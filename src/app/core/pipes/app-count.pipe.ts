import { Pipe, PipeTransform } from '@angular/core';
import { Application } from '../services/recruiter.service';

/**
 * Compte les candidatures d'un statut donné dans la liste complète.
 * Usage: {{ filteredApps | appCount:'new':allApps }}
 */
@Pipe({ name: 'appCount', standalone: true })
export class AppCountPipe implements PipeTransform {
  transform(apps: Application[], status: string): number {
    if (!apps) return 0;
    if (status === 'all') return apps.length;
    return apps.filter(a => a.status === status).length;
  }
}
