import { getRandomTips } from '@/constants/didYouKnowTips';
import { usePresenceTransition } from '@/hooks/usePresenceTransition';
import { didYouKnowStorage } from '@/utils/didYouKnowStorage';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HiChevronLeft, HiChevronRight, HiX } from 'react-icons/hi';
import { AnalyticsTip } from './tips/AnalyticsTip';
import { ArchiveTip } from './tips/ArchiveTip';
import { CalendarTip } from './tips/CalendarTip';
import { ChecklistTip } from './tips/ChecklistTip';
import { DefaultTip } from './tips/DefaultTip';
import { ExcelImportTip } from './tips/ExcelImportTip';
import { KeyboardShortcutsTip } from './tips/KeyboardShortcutsTip';
import { ListViewTip } from './tips/ListViewTip';
import { SearchFilterTip } from './tips/SearchFilterTip';
import { SprintManagementTip } from './tips/SprintManagementTip';

interface DidYouKnowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DidYouKnowModal: React.FC<DidYouKnowModalProps> = ({ isOpen, onClose }) => {
  const { shouldRender, stage } = usePresenceTransition(isOpen, 320);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 모달이 열릴 때마다 랜덤으로 6개 팁 선택
  const tips = useMemo(() => {
    if (isOpen) {
      return getRandomTips(5);
    }
    return [];
  }, [isOpen]);

  // 모달이 열릴 때 인덱스 초기화
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setDisplayIndex(0);
      setSlideDirection(null);
      setIsAnimating(false);
      setAnimationStarted(false);
    }
  }, [isOpen]);

  // 애니메이션 시작 트리거
  useEffect(() => {
    if (isAnimating && !animationStarted) {
      // 다음 프레임에서 애니메이션 시작
      requestAnimationFrame(() => {
        setAnimationStarted(true);
      });
    }
  }, [isAnimating, animationStarted]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen || isAnimating) return;

      if (event.key === 'Escape') {
        handleClose();
      } else if (event.key === 'ArrowLeft') {
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        goToNext();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, isAnimating]);

  const handleClose = () => {
    if (dontShowAgain) {
      didYouKnowStorage.disable();
    }
    onClose();
  };

  const goToNext = () => {
    if (isAnimating) return;

    const nextIndex = (currentIndex + 1) % tips.length;
    setDisplayIndex(nextIndex);
    setSlideDirection('right');
    setIsAnimating(true);
    setAnimationStarted(false);

    // 애니메이션 완료 후 상태 정리
    if (animationRef.current) clearTimeout(animationRef.current);
    animationRef.current = setTimeout(() => {
      setCurrentIndex(nextIndex);
      setSlideDirection(null);
      setIsAnimating(false);
      setAnimationStarted(false);
    }, 300);
  };

  const goToPrevious = () => {
    if (isAnimating) return;

    const prevIndex = (currentIndex - 1 + tips.length) % tips.length;
    setDisplayIndex(prevIndex);
    setSlideDirection('left');
    setIsAnimating(true);
    setAnimationStarted(false);

    // 애니메이션 완료 후 상태 정리
    if (animationRef.current) clearTimeout(animationRef.current);
    animationRef.current = setTimeout(() => {
      setCurrentIndex(prevIndex);
      setSlideDirection(null);
      setIsAnimating(false);
      setAnimationStarted(false);
    }, 300);
  };

  const goToIndex = (index: number) => {
    if (isAnimating || index === currentIndex) return;

    setDisplayIndex(index);
    setSlideDirection(index > currentIndex ? 'right' : 'left');
    setIsAnimating(true);
    setAnimationStarted(false);

    if (animationRef.current) clearTimeout(animationRef.current);
    animationRef.current = setTimeout(() => {
      setCurrentIndex(index);
      setSlideDirection(null);
      setIsAnimating(false);
      setAnimationStarted(false);
    }, 300);
  };

  const getTipElement = useCallback((tipIndex: number) => {
    if (!tips[tipIndex]) return null;
    const tip = tips[tipIndex];

    switch (tip.id) {
      case 'keyboard-shortcuts':
        return <KeyboardShortcutsTip />;
      case 'sprint-management':
        return <SprintManagementTip />;
      case 'excel-import':
        return <ExcelImportTip />;
      case 'archive-cards':
        return <ArchiveTip />;
      case 'checklist-management':
        return <ChecklistTip />;
      case 'calendar-view':
        return <CalendarTip />;
      case 'search-filter':
        return <SearchFilterTip />;
      case 'list-view':
        return <ListViewTip />;
      case 'analytics':
        return <AnalyticsTip />;
      default:
        return <DefaultTip tip={tip} />;
    }
  }, [tips]);

  if (!shouldRender) return null;


  const modalContent = (
    <div
      className={`fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[9999] transition-opacity duration-300 ${
        stage === 'enter' ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
      onScroll={(e) => e.stopPropagation()}
    >
      <div
        className={`w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300 ${
          stage === 'enter' ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
        onScroll={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-pastel-blue-50 to-pastel-purple-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            💡 Did You Know?
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-500 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-white/50"
          >
            <HiX className="text-xl" />
          </button>
        </div>

        {/* Content - Carousel */}
        <div
          className="p-8 min-h-[280px] flex flex-col items-center justify-center relative overflow-hidden"
          onScroll={(e) => e.stopPropagation()}
        >
          {/* Navigation Buttons */}
          <button
            onClick={goToPrevious}
            disabled={isAnimating}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-md hover:shadow-lg hover:bg-pastel-blue-50 transition-all text-pastel-blue-600 disabled:opacity-50 disabled:cursor-not-allowed z-10"
            aria-label="Previous tip"
          >
            <HiChevronLeft className="text-2xl" />
          </button>

          <button
            onClick={goToNext}
            disabled={isAnimating}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-md hover:shadow-lg hover:bg-pastel-blue-50 transition-all text-pastel-blue-600 disabled:opacity-50 disabled:cursor-not-allowed z-10"
            aria-label="Next tip"
          >
            <HiChevronRight className="text-2xl" />
          </button>

          {/* Tip Content */}
          <div
            className="relative w-full max-w-md mx-auto h-80"
            onScroll={(e) => e.stopPropagation()}
          >
            {/* Old Tip (슬라이드 아웃) - 애니메이션 중에만 표시 */}
            {isAnimating && (
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-300 ease-out ${
                  !animationStarted
                    ? 'translate-x-0 opacity-100'
                    : slideDirection === 'right'
                    ? '-translate-x-full opacity-0'
                    : 'translate-x-full opacity-0'
                }`}
              >
                {getTipElement(currentIndex)}
              </div>
            )}

            {/* New Tip (슬라이드 인) */}
            <div
              key={displayIndex}
              className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-300 ease-out ${
                !isAnimating
                  ? 'translate-x-0 opacity-100'
                  : !animationStarted
                  ? slideDirection === 'right'
                    ? 'translate-x-full opacity-0'
                    : '-translate-x-full opacity-0'
                  : 'translate-x-0 opacity-100'
              }`}
            >
              {getTipElement(displayIndex)}
            </div>
          </div>
        </div>

        {/* Dot Navigation */}
        <div className="flex justify-center gap-2 pb-6">
          {tips.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-pastel-blue-500 w-8'
                  : 'bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Go to tip ${index + 1}`}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-800 transition-colors">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-pastel-blue-500 focus:ring-2 focus:ring-pastel-blue-400 focus:ring-offset-2 cursor-pointer"
            />
            다음부터 안 띄우기
          </label>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              {currentIndex + 1} / {tips.length}
            </span>
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-pastel-blue-500 to-pastel-purple-400 hover:from-pastel-blue-600 hover:to-pastel-purple-500 rounded-lg shadow-lg transition-all"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
