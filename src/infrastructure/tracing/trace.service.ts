import { Injectable } from '@angular/core';
import { TokenStorage } from '../auth/token-storage';

@Injectable({ providedIn: 'root' })
export class TraceService {
  constructor(private readonly tokens: TokenStorage) {}

  headers(flowId?: string): Record<string, string> {
    return {
      'X-Correlation-Id': crypto.randomUUID(),
      'X-Trace-Id': crypto.randomUUID(),
      'X-Session-Id': this.tokens.getOrCreateSessionId(),
      ...(flowId ? { 'X-Flow-Id': flowId } : {}),
    };
  }
}
