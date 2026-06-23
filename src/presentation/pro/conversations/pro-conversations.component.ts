import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PRO_REPOSITORY } from '../../../domain/repositories/pro.repository';
import { Conversation } from '../../../domain/entities';

@Component({
  selector: 'app-pro-conversations',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="portal-page">
      <div class="portal-main__header">
        <h1>Conversas</h1>
        <p>Chat com pacientes em acompanhamento ativo.</p>
      </div>
      <div class="portal-list">
        @for (c of conversations(); track c.threadId) {
          <a class="portal-list-item" [routerLink]="['/pro/conversas', c.threadId]">
            <div class="portal-list-item__main">
              <strong>{{ c.participantName }}</strong>
              <span>{{ c.messages.length ? c.messages[c.messages.length - 1].body : 'Sem mensagens' }}</span>
            </div>
          </a>
        } @empty {
          <p class="loading-text">Nenhuma conversa ativa.</p>
        }
      </div>
    </div>
  `,
  styleUrl: '../../portal/portal.scss',
})
export class ProConversationsComponent implements OnInit {
  private readonly proRepo = inject(PRO_REPOSITORY);
  readonly conversations = signal<Conversation[]>([]);

  async ngOnInit(): Promise<void> {
    this.conversations.set(await this.proRepo.listConversations());
  }
}
