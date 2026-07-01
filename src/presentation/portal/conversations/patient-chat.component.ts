import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { interval } from 'rxjs';
import { NutriButtonComponent } from '../../../design-system/nutri-button/nutri-button.component';
import { CARE_REPOSITORY } from '../../../domain/repositories/pro.repository';
import { Conversation } from '../../../domain/entities';
import { NutriToastService } from '../../../design-system/nutri-toast/nutri-toast.service';
import { withActionFeedback } from '../../core/action-feedback';

@Component({
  selector: 'app-patient-chat',
  standalone: true,
  imports: [FormsModule, NutriButtonComponent],
  template: `
    <div class="portal-page">
      @if (conversation()) {
        <div class="portal-main__header">
          <h1>{{ conversation()!.participantName }}</h1>
        </div>
        <div class="portal-card chat-thread">
          @for (m of conversation()!.messages; track m.id) {
            <div class="chat-bubble" [class.chat-bubble--mine]="m.senderRole === 'PATIENT'">
              <p>{{ m.body }}</p>
              <small>{{ m.sentAt }}</small>
            </div>
          }
        </div>
        <div class="portal-actions">
          <textarea class="nutri-textarea" [(ngModel)]="draft" rows="3" placeholder="Escreva uma mensagem..."></textarea>
          <nutri-button variant="primary" [disabled]="sending || !draft.trim()" (click)="send()">
            {{ sending ? 'Enviando...' : 'Enviar' }}
          </nutri-button>
        </div>
      }
    </div>
  `,
  styles: `
    .chat-thread { display: grid; gap: 0.75rem; max-height: 420px; overflow-y: auto; }
    .chat-bubble {
      max-width: 80%;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      background: var(--nutri-surface);
      border: 1px solid var(--nutri-border);
    }
    .chat-bubble--mine {
      margin-left: auto;
      background: rgba(61, 139, 95, 0.1);
      border-color: rgba(61, 139, 95, 0.25);
    }
    .chat-bubble p { margin: 0 0 0.25rem; }
    .chat-bubble small { color: var(--nutri-ink-muted); font-size: 0.75rem; }
    .nutri-textarea {
      width: 100%;
      border: 1px solid var(--nutri-border);
      border-radius: var(--nutri-radius-sm);
      padding: 0.75rem;
      font-family: var(--nutri-font);
      resize: vertical;
    }
  `,
})
export class PatientChatComponent implements OnInit {
  private readonly careRepo = inject(CARE_REPOSITORY);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(NutriToastService);
  private readonly destroyRef = inject(DestroyRef);
  readonly conversation = signal<Conversation | null>(null);
  draft = '';
  sending = false;

  async ngOnInit(): Promise<void> {
    const threadId = Number(this.route.snapshot.paramMap.get('id'));
    await this.refresh(threadId);
    interval(8000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => void this.refresh(threadId));
  }

  private async refresh(threadId: number): Promise<void> {
    try {
      this.conversation.set(await this.careRepo.getConversation(threadId));
    } catch {
      // polling silencioso
    }
  }

  async send(): Promise<void> {
    const threadId = Number(this.route.snapshot.paramMap.get('id'));
    const body = this.draft.trim();
    if (!body) return;
    this.sending = true;
    const ok = await withActionFeedback(
      this.toast,
      async () => {
        await this.careRepo.sendMessage(threadId, body);
        this.draft = '';
        this.conversation.set(await this.careRepo.getConversation(threadId));
      },
      { success: 'Mensagem enviada' },
    );
    this.sending = false;
    if (!ok) return;
  }
}
