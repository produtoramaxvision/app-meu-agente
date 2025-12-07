// =============================================================================
// Hook: useSliderWithInput
// Combina slider com input numérico para melhor UX
// =============================================================================

import { useState, useCallback, ChangeEvent } from 'react';

interface UseSliderWithInputOptions {
  defaultValue: number;
  min: number;
  max: number;
  step?: number;
}

export function useSliderWithInput({
  defaultValue,
  min,
  max,
  step = 1,
}: UseSliderWithInputOptions) {
  const [value, setValue] = useState(defaultValue);

  const handleSliderChange = useCallback((newValue: number[]) => {
    setValue(newValue[0]);
  }, []);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      if (!isNaN(newValue) && newValue >= min && newValue <= max) {
        setValue(newValue);
      }
    },
    [min, max]
  );

  const reset = useCallback(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  return {
    value,
    setValue,
    reset,
    sliderProps: {
      value: [value],
      onValueChange: handleSliderChange,
      min,
      max,
      step,
    },
    inputProps: {
      type: 'number' as const,
      value: value.toString(),
      onChange: handleInputChange,
      min,
      max,
      step,
    },
  };
}
