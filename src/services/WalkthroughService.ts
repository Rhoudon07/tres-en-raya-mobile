import { StorageService } from './StorageService';

const SEEN_WALKTHROUGHS_KEY = '@tres_en_raya_seen_walkthroughs';

export class WalkthroughService {
  private static cache: Set<string> | null = null;

  private static async getCache(): Promise<Set<string>> {
    if (this.cache) return this.cache;
    const raw = await StorageService.getItem<string[]>(SEEN_WALKTHROUGHS_KEY, []);
    this.cache = new Set(raw);
    return this.cache;
  }

  public static async hasSeen(modeKey: string): Promise<boolean> {
    const cache = await this.getCache();
    return cache.has(modeKey);
  }

  public static async markSeen(modeKey: string): Promise<void> {
    const cache = await this.getCache();
    cache.add(modeKey);
    await StorageService.setItem(SEEN_WALKTHROUGHS_KEY, Array.from(cache));
  }

  public static async resetAll(): Promise<void> {
    this.cache = new Set();
    await StorageService.removeItem(SEEN_WALKTHROUGHS_KEY);
  }
}
