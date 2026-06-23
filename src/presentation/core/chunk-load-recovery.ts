import { APP_INITIALIZER, inject, Injectable } from '@angular/core';
import { NavigationError, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

const RELOAD_FLAG = 'nutri_chunk_reload';

function isChunkLoadFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /Failed to fetch dynamically imported module|Loading chunk [\d]+ failed|ChunkLoadError/i.test(
    message,
  );
}

/** Recarrega a página uma vez quando um lazy chunk sumiu após novo deploy no Vercel. */
@Injectable({ providedIn: 'root' })
export class ChunkLoadRecovery {
  private readonly router = inject(Router);

  init(): void {
    this.router.events
      .pipe(filter((event): event is NavigationError => event instanceof NavigationError))
      .subscribe((event) => {
        if (!isChunkLoadFailure(event.error)) return;
        if (sessionStorage.getItem(RELOAD_FLAG)) return;
        sessionStorage.setItem(RELOAD_FLAG, '1');
        window.location.reload();
      });
  }
}

export function provideChunkLoadRecovery() {
  return {
    provide: APP_INITIALIZER,
    useFactory: (recovery: ChunkLoadRecovery) => () => recovery.init(),
    deps: [ChunkLoadRecovery],
    multi: true,
  };
}
