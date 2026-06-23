import { Injectable, inject, signal } from '@angular/core';
import { NUTRITION_REPOSITORY } from '../../domain/repositories/nutrition.repository';
import {
  CheckinStats,
  NutritionProfile,
  SportCatalogItem,
  TodayCheckins,
  TrainingProfile,
} from '../../domain/entities';
import { isNotFound } from '../../infrastructure/http/api-error';

export type PortalCacheKey =
  | 'nutritionProfile'
  | 'checkinStats'
  | 'todayCheckins'
  | 'trainingProfile'
  | 'sportCatalog';

interface CacheEntry<T> {
  value: T;
  loadedAt: number;
}

const TTL_MS: Record<PortalCacheKey, number> = {
  nutritionProfile: 5 * 60 * 1000,
  checkinStats: 60 * 1000,
  todayCheckins: 60 * 1000,
  trainingProfile: 5 * 60 * 1000,
  sportCatalog: Number.POSITIVE_INFINITY,
};

const REVALIDATE_AFTER_MS: Partial<Record<PortalCacheKey, number>> = {
  nutritionProfile: 2 * 60 * 1000,
};

/**
 * Cache em memória do portal — reduz GETs repetidos entre abas.
 * Invalidar após mutações (check-in, treino, onboarding, plano gerado).
 */
@Injectable({ providedIn: 'root' })
export class PortalDataStore {
  private readonly nutritionRepo = inject(NUTRITION_REPOSITORY);

  private readonly nutritionProfileCache = signal<CacheEntry<NutritionProfile> | null>(null);
  private readonly checkinStatsCache = signal<CacheEntry<CheckinStats> | null>(null);
  private readonly todayCheckinsCache = signal<CacheEntry<TodayCheckins> | null>(null);
  private readonly trainingProfileCache = signal<CacheEntry<TrainingProfile> | null>(null);
  private readonly sportCatalogCache = signal<CacheEntry<SportCatalogItem[]> | null>(null);

  private inFlight = new Map<PortalCacheKey, Promise<unknown>>();

  readonly nutritionProfile = signal<NutritionProfile | null>(null);
  readonly checkinStats = signal<CheckinStats | null>(null);
  readonly todayCheckins = signal<TodayCheckins | null>(null);
  readonly trainingProfile = signal<TrainingProfile | null>(null);
  readonly sportCatalog = signal<SportCatalogItem[] | null>(null);

  invalidate(...keys: PortalCacheKey[]): void {
    for (const key of keys) {
      switch (key) {
        case 'nutritionProfile':
          this.nutritionProfileCache.set(null);
          this.nutritionProfile.set(null);
          break;
        case 'checkinStats':
          this.checkinStatsCache.set(null);
          this.checkinStats.set(null);
          break;
        case 'todayCheckins':
          this.todayCheckinsCache.set(null);
          this.todayCheckins.set(null);
          break;
        case 'trainingProfile':
          this.trainingProfileCache.set(null);
          this.trainingProfile.set(null);
          break;
        case 'sportCatalog':
          this.sportCatalogCache.set(null);
          this.sportCatalog.set(null);
          break;
      }
      this.inFlight.delete(key);
    }
  }

  invalidateCheckins(): void {
    this.invalidate('todayCheckins', 'checkinStats');
  }

  invalidateProgress(): void {
    // progress/evolution carregam sob demanda nas rotas; sem cache global v1
  }

  invalidateMealData(): void {
    this.invalidateCheckins();
  }

  async loadNutritionProfile(force = false): Promise<NutritionProfile | null> {
    return this.load(
      'nutritionProfile',
      () => this.nutritionRepo.getNutritionProfile(),
      this.nutritionProfileCache,
      this.nutritionProfile,
      force,
    );
  }

  async loadCheckinStats(force = false): Promise<CheckinStats | null> {
    return this.load(
      'checkinStats',
      () => this.nutritionRepo.getCheckinStats(),
      this.checkinStatsCache,
      this.checkinStats,
      force,
    );
  }

  async loadTodayCheckins(force = false): Promise<TodayCheckins | null> {
    return this.load(
      'todayCheckins',
      async () => {
        try {
          return await this.nutritionRepo.getTodayCheckins();
        } catch (e) {
          if (isNotFound(e)) return null;
          throw e;
        }
      },
      this.todayCheckinsCache,
      this.todayCheckins,
      force,
    );
  }

  async loadTrainingProfile(force = false): Promise<TrainingProfile | null> {
    return this.load(
      'trainingProfile',
      async () => {
        try {
          return await this.nutritionRepo.getTrainingProfile();
        } catch (e) {
          if (isNotFound(e)) return null;
          throw e;
        }
      },
      this.trainingProfileCache,
      this.trainingProfile,
      force,
    );
  }

  async loadSportCatalog(force = false): Promise<SportCatalogItem[]> {
    const result = await this.load(
      'sportCatalog',
      () => this.nutritionRepo.getSportCatalog(),
      this.sportCatalogCache,
      this.sportCatalog,
      force,
    );
    return result ?? [];
  }

  /** Prefetch do shell: dados usados no dashboard + assistente. */
  async prefetchPortalCore(): Promise<void> {
    await Promise.all([
      this.loadNutritionProfile(),
      this.loadCheckinStats(),
      this.loadTodayCheckins(),
    ]);
    if (this.shouldRevalidate('nutritionProfile', this.nutritionProfileCache())) {
      void this.loadNutritionProfile(true);
    }
  }

  private shouldRevalidate(key: PortalCacheKey, entry: CacheEntry<unknown> | null): boolean {
    const after = REVALIDATE_AFTER_MS[key];
    if (!after || !entry) return false;
    return Date.now() - entry.loadedAt > after;
  }

  private isFresh<T>(entry: CacheEntry<T> | null, key: PortalCacheKey): boolean {
    if (!entry) return false;
    const ttl = TTL_MS[key];
    if (!Number.isFinite(ttl)) return true;
    return Date.now() - entry.loadedAt < ttl;
  }

  private async load<T>(
    key: PortalCacheKey,
    fetcher: () => Promise<T>,
    cacheSignal: ReturnType<typeof signal<CacheEntry<T> | null>>,
    valueSignal: ReturnType<typeof signal<T | null>>,
    force: boolean,
  ): Promise<T | null> {
    const cached = cacheSignal();
    if (!force && cached && this.isFresh(cached, key)) {
      valueSignal.set(cached.value);
      return cached.value;
    }

    const pending = this.inFlight.get(key);
    if (pending && !force) {
      return (await pending) as T | null;
    }

    const promise = (async () => {
      try {
        const value = await fetcher();
        const entry: CacheEntry<T> = { value, loadedAt: Date.now() };
        cacheSignal.set(entry);
        valueSignal.set(value);
        return value;
      } catch (e) {
        if (isNotFound(e)) {
          cacheSignal.set(null);
          valueSignal.set(null);
          return null;
        }
        throw e;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }
}
