import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { setLogLevel, LogLevel } from '@angular/fire';

// Réduit les logs Firebase (optionnel)
setLogLevel(LogLevel.WARN);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
