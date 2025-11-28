const STORAGE_KEYS = {
  DISABLED: 'didYouKnowModal_disabled',
  LAST_SHOWN: 'didYouKnowModal_lastShown',
} as const;

const HOURS_BETWEEN_SHOWS = 24;

export const didYouKnowStorage = {
  /**
   * 모달이 비활성화되어 있는지 확인
   */
  isDisabled(): boolean {
    return localStorage.getItem(STORAGE_KEYS.DISABLED) === 'true';
  },

  /**
   * 모달을 비활성화 (다음부터 안 띄우기)
   */
  disable(): void {
    localStorage.setItem(STORAGE_KEYS.DISABLED, 'true');
  },

  /**
   * 모달을 활성화 (다시 띄우기)
   */
  enable(): void {
    localStorage.removeItem(STORAGE_KEYS.DISABLED);
  },

  /**
   * 마지막으로 모달을 표시한 시간 조회
   * @returns ISO 8601 형식의 날짜 문자열 또는 null
   */
  getLastShownTime(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LAST_SHOWN);
  },

  /**
   * 현재 시간을 마지막 표시 시간으로 저장
   */
  setLastShownTime(): void {
    localStorage.setItem(STORAGE_KEYS.LAST_SHOWN, new Date().toISOString());
  },

  /**
   * 모달을 표시해야 하는지 판단
   * - 비활성화되어 있으면 false
   * - 마지막 표시 시간이 24시간 이내면 false
   * - 그 외에는 true
   */
  shouldShow(): boolean {
    // 비활성화 체크
    if (this.isDisabled()) {
      return false;
    }

    // 마지막 표시 시간 체크
    const lastShown = this.getLastShownTime();
    if (lastShown) {
      const lastShownDate = new Date(lastShown);
      const now = new Date();
      const hoursPassed = (now.getTime() - lastShownDate.getTime()) / (1000 * 60 * 60);

      if (hoursPassed < HOURS_BETWEEN_SHOWS) {
        return false;
      }
    }

    return true;
  },
};
