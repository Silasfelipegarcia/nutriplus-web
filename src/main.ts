import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .then(() => sessionStorage.removeItem('nutri_chunk_reload'))
  .catch((err) => console.error(err));
