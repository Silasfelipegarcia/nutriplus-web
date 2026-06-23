import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PRO_REPOSITORY } from '../../../domain/repositories/pro.repository';
import { CareRelationship } from '../../../domain/entities';

@Component({
  selector: 'app-pro-patients',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="portal-page">
      <div class="portal-main__header">
        <h1>Pacientes</h1>
        <p>Sua carteira de acompanhamento.</p>
      </div>
      <div class="portal-list">
        @for (p of patients(); track p.id) {
          <a class="portal-list-item" [routerLink]="['/pro/pacientes', p.patientId]">
            <div class="portal-list-item__main">
              <strong>{{ p.patientName }}</strong>
              <span>{{ p.status }} · {{ p.source }}</span>
            </div>
          </a>
        } @empty {
          <p class="loading-text">Nenhum paciente vinculado ainda.</p>
        }
      </div>
    </div>
  `,
  styleUrl: '../../portal/portal.scss',
})
export class ProPatientsComponent implements OnInit {
  private readonly proRepo = inject(PRO_REPOSITORY);
  readonly patients = signal<CareRelationship[]>([]);

  async ngOnInit(): Promise<void> {
    this.patients.set(await this.proRepo.listPatients());
  }
}
