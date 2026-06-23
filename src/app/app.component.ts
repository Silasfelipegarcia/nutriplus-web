import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NutriToastContainerComponent } from '../design-system/nutri-toast/nutri-toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NutriToastContainerComponent],
  template: `
    <router-outlet />
    <nutri-toast-container />
  `,
  styles: [`:host { display: block; min-height: 100vh; }`],
})
export class AppComponent {}
