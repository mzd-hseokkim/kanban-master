/**
 * Avatar blob URL 캐시
 * - 동일한 avatarUrl에 대해 중복 fetch 방지
 * - 메모리 관리를 위한 cleanup 기능 제공
 */

interface CacheEntry {
  blobUrl: string;
  timestamp: number;
}

class AvatarCache {
  private cache = new Map<string, CacheEntry>();
  private readonly MAX_AGE = 1000 * 60 * 10; // 10분

  /**
   * 캐시에서 blob URL 조회
   */
  get(avatarUrl: string): string | null {
    const entry = this.cache.get(avatarUrl);
    if (!entry) return null;

    // 만료된 캐시는 삭제
    if (Date.now() - entry.timestamp > this.MAX_AGE) {
      URL.revokeObjectURL(entry.blobUrl);
      this.cache.delete(avatarUrl);
      return null;
    }

    return entry.blobUrl;
  }

  /**
   * 캐시에 blob URL 저장
   */
  set(avatarUrl: string, blobUrl: string): void {
    this.cache.set(avatarUrl, {
      blobUrl,
      timestamp: Date.now(),
    });
  }

  /**
   * 특정 avatarUrl의 캐시 무효화
   */
  invalidate(avatarUrl: string): void {
    const entry = this.cache.get(avatarUrl);
    if (entry) {
      URL.revokeObjectURL(entry.blobUrl);
      this.cache.delete(avatarUrl);
    }
  }

  /**
   * 모든 캐시 무효화
   */
  clear(): void {
    this.cache.forEach((entry) => {
      URL.revokeObjectURL(entry.blobUrl);
    });
    this.cache.clear();
  }

  /**
   * 만료된 캐시 정리
   */
  cleanup(): void {
    const now = Date.now();
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (now - entry.timestamp > this.MAX_AGE) {
        URL.revokeObjectURL(entry.blobUrl);
        this.cache.delete(key);
      }
    });
  }
}

export const avatarCache = new AvatarCache();

// 10분마다 만료된 캐시 정리
setInterval(() => {
  avatarCache.cleanup();
}, 1000 * 60 * 10);
