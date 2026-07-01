import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CARE_REPOSITORY } from '../../../domain/repositories/pro.repository';
import { Conversation } from '../../../domain/entities';

@Component({
  selector: 'app-patient-conversations',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="portal-page">
      <div class="portal-main__header">
        <h1>Conversas</h1>
        <p>Chat com seu nutricionista após a consulta paga.</p>
      </div>
      <div class="portal-list">
        @for (c of conversations(); track c.threadId) {
          <a class="portal-list-item" [routerLink]="['/app/conversas', c.threadId]">
            <div class="portal-list-item__main">
              <strong>{{ c.participantName }}</strong>
              <span>{{ c.messages.length ? c.messages[c.messages.length - 1].body : 'Sem mensagens' }}</span>
            </div>
          </a>
        } @empty {
          <p class="loading-text">Nenhuma conversa ativa. Contrate um nutricionista para iniciar o chat.</p>
        }
      </div>
    </div>
  `,
  styleUrl: '../portal.scss',
})
export class PatientConversationsComponent implements OnInit {
  private readonly careRepo = inject(CARE_REPOSITORY);
  readonly conversations = signal<Conversation[]>([]);

  async ngOnInit(): Promise<void> {
    this.conversations.set(await this.careRepo.listConversations());
  }
}
