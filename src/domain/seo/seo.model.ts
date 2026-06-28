export interface RouteSeoConfig {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  noindex?: boolean;
}

export const DEFAULT_SEO: RouteSeoConfig = {
  title: 'Nutri+ — Seu plano alimentar inteligente',
  description:
    'Organize sua alimentação com planos personalizados por IA, macros calculados e acompanhamento diário com Luna ou Bruno.',
  path: '/',
  ogImage: '/og/default.png',
};
