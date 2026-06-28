import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'beta', renderMode: RenderMode.Client },
  { path: 'privacidade', renderMode: RenderMode.Prerender },
  { path: 'termos', renderMode: RenderMode.Prerender },
  { path: 'cookies', renderMode: RenderMode.Prerender },
  { path: 'seguranca', renderMode: RenderMode.Prerender },
  { path: 'baixar-app', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];
