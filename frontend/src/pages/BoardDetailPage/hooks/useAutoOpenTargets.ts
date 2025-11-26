import { useCallback, useMemo, useState } from 'react';

interface InlineCardFocus {
  cardId: number;
  columnId?: number | null;
}

const parseNumericParam = (params: URLSearchParams, key: string) => {
  const value = params.get(key);
  if (value === null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export const useAutoOpenTargets = (searchParams: URLSearchParams) => {
  const [inlineCardFocus, setInlineCardFocus] = useState<InlineCardFocus | null>(null);
  const cardIdFromQuery = useMemo(() => parseNumericParam(searchParams, 'cardId'), [searchParams]);
  const columnIdFromQuery = useMemo(() => parseNumericParam(searchParams, 'columnId'), [searchParams]);

  const effectiveAutoOpenCardId = inlineCardFocus?.cardId ?? cardIdFromQuery;
  const effectiveAutoOpenColumnId = inlineCardFocus?.columnId ?? columnIdFromQuery;

  const handleInlineAutoOpenHandled = useCallback(() => {
    setInlineCardFocus((prev) => (prev ? null : prev));
  }, []);

  return {
    effectiveAutoOpenCardId,
    effectiveAutoOpenColumnId,
    setInlineCardFocus,
    handleInlineAutoOpenHandled,
  };
};
