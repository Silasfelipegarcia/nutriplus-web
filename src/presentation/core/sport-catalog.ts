import { SportCatalogItem } from '../../domain/entities';

/** Espelha SportType da API — fallback offline com lista completa. */
export function defaultSportCatalog(): SportCatalogItem[] {
  return [
    { sportType: 'WEIGHT_TRAINING', label: 'Musculação', met: 6, intensityHint: 'Moderada' },
    { sportType: 'RUNNING', label: 'Corrida', met: 9.8, intensityHint: 'Alta intensidade' },
    { sportType: 'WALKING', label: 'Caminhada', met: 3.5, intensityHint: 'Baixa intensidade' },
    { sportType: 'CYCLING', label: 'Ciclismo', met: 7.5, intensityHint: 'Alta intensidade' },
    { sportType: 'FUNCTIONAL', label: 'Treino funcional', met: 6.5, intensityHint: 'Moderada' },
    { sportType: 'HIIT', label: 'HIIT', met: 9, intensityHint: 'Alta intensidade' },
    { sportType: 'CROSSFIT', label: 'CrossFit', met: 8.5, intensityHint: 'Alta intensidade' },
    { sportType: 'FOOTBALL', label: 'Futebol', met: 7, intensityHint: 'Moderada' },
    { sportType: 'SWIMMING', label: 'Natação', met: 8, intensityHint: 'Alta intensidade' },
    { sportType: 'YOGA', label: 'Yoga', met: 3, intensityHint: 'Baixa intensidade' },
    { sportType: 'PILATES', label: 'Pilates', met: 3.5, intensityHint: 'Baixa intensidade' },
    { sportType: 'SPINNING', label: 'Spinning', met: 8, intensityHint: 'Alta intensidade' },
    { sportType: 'DANCE', label: 'Dança', met: 5, intensityHint: 'Moderada' },
    { sportType: 'TENNIS', label: 'Tênis', met: 7.3, intensityHint: 'Alta intensidade' },
    { sportType: 'VOLLEYBALL', label: 'Vôlei', met: 6, intensityHint: 'Moderada' },
    { sportType: 'BASKETBALL', label: 'Basquete', met: 6.5, intensityHint: 'Moderada' },
    { sportType: 'BEACH_TENNIS', label: 'Beach tennis', met: 6.5, intensityHint: 'Moderada' },
    { sportType: 'MARTIAL_ARTS', label: 'Artes marciais', met: 10, intensityHint: 'Alta intensidade' },
    { sportType: 'BOXING', label: 'Boxe', met: 9, intensityHint: 'Alta intensidade' },
    { sportType: 'HIKING', label: 'Trilha', met: 6, intensityHint: 'Moderada' },
    { sportType: 'STRETCHING', label: 'Alongamento', met: 2.5, intensityHint: 'Baixa intensidade' },
    { sportType: 'ROWING', label: 'Remo', met: 7, intensityHint: 'Alta intensidade' },
    { sportType: 'OTHER', label: 'Outro', met: 5.5, intensityHint: 'Intensidade variável' },
  ];
}

export function mergeSportCatalog(fromApi: SportCatalogItem[]): SportCatalogItem[] {
  if (!fromApi.length) return defaultSportCatalog();
  const byType = new Map(defaultSportCatalog().map((s) => [s.sportType, s]));
  for (const s of fromApi) {
    byType.set(s.sportType, s);
  }
  return [...byType.values()].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
}

export interface SportSelection {
  sportType: string;
  label: string;
  customLabel?: string;
  met: number;
}

export function otherSportCatalogItem(): SportCatalogItem {
  return (
    defaultSportCatalog().find((s) => s.sportType === 'OTHER') ?? {
      sportType: 'OTHER',
      label: 'Outro',
      met: 5.5,
      intensityHint: 'Intensidade variável',
    }
  );
}
