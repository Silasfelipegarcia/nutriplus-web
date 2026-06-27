import { Directive, HostListener, Input, inject } from '@angular/core';
import { AnalyticsService } from '../../infrastructure/analytics/analytics.service';

@Directive({
  selector: '[appAnalyticsCta]',
  standalone: true,
})
export class AnalyticsCtaDirective {
  private readonly analytics = inject(AnalyticsService);

  @Input({ required: true }) appAnalyticsCta!: string;
  @Input({ required: true }) appAnalyticsCtaLocation!: string;

  @HostListener('click')
  onClick(): void {
    this.analytics.trackCtaClick(this.appAnalyticsCta, this.appAnalyticsCtaLocation);
  }
}
