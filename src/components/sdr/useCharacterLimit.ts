// =============================================================================
// Hook: useCharacterLimit
// Controla limite de caracteres em campos de texto
// =============================================================================

import { useState, useCallback, ChangeEvent } from 'react';

interface UseCharacterLimitOptions {
  maxLength: number;
  initialValue?: string;
}

export function useCharacterLimit({
  maxLength,
  initialValue = '',
}: UseCharacterLimitOptions) {
  const [value, setValue] = useState(initialValue);
  const characterCount = value.length;
  const remaining = maxLength - characterCount;
  const isNearLimit = remaining < maxLength * 0.1;
  const isAtLimit = remaining === 0;

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (newValue.length <= maxLength) {
        setValue(newValue);
      }
    },
    [maxLength]
  );

  const reset = useCallback(() => {
    setValue(initialValue);
  }, [initialValue]);

  return {
    value,
    setValue,
    characterCount,
    remaining,
    isNearLimit,
    isAtLimit,
    handleChange,
    reset,
    maxLength,
  };
}
