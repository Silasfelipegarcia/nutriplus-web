import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NutriToastContainerComponent } from '../design-system/nutri-toast/nutri-toast-container.component';
import { CookieBannerComponent } from '../presentation/marketing/cookie-banner/cookie-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NutriToastContainerComponent, CookieBannerComponent],
  template: `
    <router-outlet />
    <nutri-toast-container />
    <app-cookie-banner />
  `,
  styles: [`:host { display: block; min-height: 100vh; }`],
})
export class AppComponent {}
