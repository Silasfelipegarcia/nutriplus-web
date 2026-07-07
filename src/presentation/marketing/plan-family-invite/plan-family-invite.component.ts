import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { NutriLogoComponent } from '../../../design-system/nutri-logo/nutri-logo.component';
import { HOUSEHOLD_REPOSITORY } from '../../../domain/repositories/household.repository';
import { PlanInvitationPreview } from '../../../domain/entities/household.model';
import { AuthFacade } from '../../core/auth.facade';
import { HouseholdInviteStorage } from '../../core/household-invite-storage';
import { HouseholdInviteFlowService } from '../../core/household-invite-flow.service';
import {
  androidApkDownloadUrl,
  androidApkVersionLabel,
  hasAnyMobileDownload,
  hasDirectAndroidApkDownload,
  hasIosAdHocDownload,
  hasIosTestFlightDownload,
  iosAdHocInstallUrl,
  iosTestFlightUrl,
  iosVersionLabel,
} from '../../core/app-download.config';
import { APP_NAME } from '../../core/constants';

@Component({
  selector: 'app-plan-family-invite',
  standalone: true,
  imports: [NutriLogoComponent, NutriButtonComponent],
  template: `
    <div class="download-page">
      <div class="download-page__card">
        <nutri-logo />
        @if (loading()) {
          <p>Carregando convite...</p>
        } @else if (error()) {
          <h1>Convite indisponível</h1>
          <p class="auth-card__error">{{ error() }}</p>
        } @else if (preview()) {
          <h1>{{ preview()!.expired ? 'Convite expirado' : 'Plano da família' }}</h1>
          @if (preview()!.expired) {
            <p>Peça um novo convite para quem compartilhou o plano alimentar da casa.</p>
          } @else {
            <p>
              <strong>{{ preview()!.inviterName }}</strong> convidou você para seguir o mesmo cardápio da casa no
              {{ appName }} — mesmos alimentos e horários, com porções ajustadas ao seu perfil.
            </p>
            @if (success()) {
              <p class="portal-card portal-card--highlight">{{ success() }}</p>
            } @else {
              @if (auth.isAuthenticated()) {
                <nutri-button variant="primary" [block]="true" [disabled]="accepting()" (click)="accept()">
                  {{ accepting() ? 'Aceitando...' : 'Entrar no plano da família' }}
                </nutri-button>
                @if (auth.needsOnboarding()) {
                  <p class="download-page__hint">
                    Você precisa concluir o perfil nutricional antes de aceitar.
                  </p>
                  <nutri-button variant="secondary" [block]="true" to="/onboarding">
                    Continuar cadastro
                  </nutri-button>
                }
              } @else {
                <nutri-button variant="primary" [block]="true" to="/auth/cadastro">
                  Criar conta e aceitar
                </nutri-button>
                <nutri-button variant="secondary" [block]="true" to="/auth/login">
                  Já tenho conta — entrar
                </nutri-button>
              }
            }
            <p class="download-page__hint">Prefere o celular? Baixe o app e abra este mesmo link.</p>
            @if (hasApkDownload) {
              <nutri-button variant="secondary" [block]="true" [href]="androidApkDownloadUrl" download="nutriplus.apk">
                Baixar Android{{ apkVersionLabel ? ' (' + apkVersionLabel + ')' : '' }}
              </nutri-button>
            }
            @if (hasIosTestFlight) {
              <nutri-button variant="secondary" [block]="true" [href]="iosTestFlightUrl" [external]="true">
                iPhone — TestFlight{{ iosVersion ? ' (' + iosVersion + ')' : '' }}
              </nutri-button>
            } @else if (hasIosAdHoc) {
              <nutri-button variant="secondary" [block]="true" [href]="iosAdHocInstallUrl" [external]="true">
                Instalar no iPhone{{ iosVersion ? ' (' + iosVersion + ')' : '' }}
              </nutri-button>
            }
            @if (mobileAppDeepLink) {
              <nutri-button variant="ghost" [block]="true" [href]="mobileAppDeepLink">
                Abrir no app instalado
              </nutri-button>
            }
          }
        }
      </div>
    </div>
  `,
  styleUrl: '../../mobile-redirect/download-app.component.scss',
})
export class PlanFamilyInviteComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly householdRepo = inject(HOUSEHOLD_REPOSITORY);
  private readonly inviteFlow = inject(HouseholdInviteFlowService);
  readonly auth = inject(AuthFacade);

  readonly appName = APP_NAME;
  readonly hasApkDownload = hasDirectAndroidApkDownload;
  readonly apkVersionLabel = androidApkVersionLabel;
  readonly hasIosTestFlight = hasIosTestFlightDownload;
  readonly iosTestFlightUrl = iosTestFlightUrl;
  readonly hasIosAdHoc = hasIosAdHocDownload;
  readonly iosAdHocInstallUrl = iosAdHocInstallUrl;
  readonly iosVersion = iosVersionLabel;
  readonly androidApkDownloadUrl = androidApkDownloadUrl;
  readonly hasMobileDownload = hasAnyMobileDownload;

  readonly loading = signal(true);
  readonly accepting = signal(false);
  readonly error = signal<string | null>(null);
  readonly preview = signal<PlanInvitationPreview | null>(null);
  readonly success = signal<string | null>(null);

  token = '';
  mobileAppDeepLink = '';

  async ngOnInit(): Promise<void> {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    if (!this.token) {
      this.error.set('Link de convite inválido.');
      this.loading.set(false);
      return;
    }
    this.mobileAppDeepLink = `nutriplus://plano-familia/${encodeURIComponent(this.token)}`;
    HouseholdInviteStorage.savePendingToken(this.token);
    try {
      const preview = await this.householdRepo.previewInvitation(this.token);
      this.preview.set(preview);
      if (
        !preview.expired &&
        this.auth.isAuthenticated() &&
        !this.auth.needsOnboarding() &&
        !this.auth.needsTerms()
      ) {
        await this.accept();
      }
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Não foi possível carregar o convite.');
    } finally {
      this.loading.set(false);
    }
  }

  async accept(): Promise<void> {
    if (!this.token || this.accepting()) return;
    if (!this.auth.isAuthenticated()) {
      await this.router.navigate(['/auth/login'], {
        queryParams: { redirect: `/plano-familia/${this.token}` },
      });
      return;
    }
    if (this.auth.needsOnboarding()) {
      await this.router.navigate(['/onboarding']);
      return;
    }
    if (this.auth.needsTerms()) {
      await this.router.navigate(['/onboarding/termos']);
      return;
    }
    this.accepting.set(true);
    const accepted = await this.inviteFlow.tryAcceptPendingInvite();
    if (accepted) {
      this.success.set('Plano da família aceito! Gerando seu plano alinhado...');
    }
    this.accepting.set(false);
  }
}
