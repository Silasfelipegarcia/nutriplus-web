import { FeatureFlag } from '../../infrastructure/http/admin-api.service';

export interface FeatureFlagGroup {
  category: string;
  label: string;
  description: string;
  flags: FeatureFlag[];
}

const CATEGORY_META: Record<string, { label: string; description: string; order: number }> = {
  ACESSO: {
    label: 'Acesso & cadastro',
    description: 'Quem pode entrar e se cadastrar na plataforma.',
    order: 1,
  },
  PRODUTO: {
    label: 'Experiência do app',
    description: 'Funcionalidades visíveis para o usuário no app e portal.',
    order: 2,
  },
  MONETIZACAO: {
    label: 'Assinaturas & cobrança',
    description: 'Planos pagos, checkout e exigência de assinatura.',
    order: 3,
  },
  MARKETPLACE: {
    label: 'Nutricionistas Pro',
    description: 'Marketplace e contratação de profissionais.',
    order: 4,
  },
  MARKETING: {
    label: 'Site & aquisição',
    description: 'Landing, links de download e fluxos públicos.',
    order: 5,
  },
  PLATAFORMA: {
    label: 'Plataforma',
    description: 'Outras configurações operacionais.',
    order: 99,
  },
};

export function groupFeatureFlags(flags: FeatureFlag[]): FeatureFlagGroup[] {
  const byCategory = new Map<string, FeatureFlag[]>();
  for (const flag of flags) {
    const category = flag.category?.trim() || 'PLATAFORMA';
    if (!byCategory.has(category)) {
      byCategory.set(category, []);
    }
    byCategory.get(category)!.push(flag);
  }

  return [...byCategory.entries()]
    .map(([category, categoryFlags]) => {
      const meta = CATEGORY_META[category] ?? CATEGORY_META['PLATAFORMA'];
      return {
        category,
        label: meta.label,
        description: meta.description,
        flags: categoryFlags,
        order: meta.order,
      };
    })
    .sort((a, b) => a.order - b.order)
    .map(({ order: _order, ...group }) => group);
}
