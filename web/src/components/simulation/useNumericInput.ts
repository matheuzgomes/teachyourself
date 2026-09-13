import { useState, useEffect, useCallback } from 'react';

export interface UseNumericInputOptions {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  radix?: 10 | 16;
  allowNegative?: boolean;
}

export interface NumericInputBinding {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isValid: boolean;
}

export function useNumericInput({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  radix = 10,
  allowNegative = true,
}: UseNumericInputOptions): NumericInputBinding {
  const formatNumber = useCallback(
    (num: number): string => {
      if (Number.isNaN(num)) return '';
      if (radix === 16) {
        const hex = (num >>> 0).toString(16).toUpperCase();
        return `0x${hex}`;
      }
      return String(num);
    },
    [radix]
  );

  const [textValue, setTextValue] = useState<string>(() => formatNumber(value));
  const [isValid, setIsValid] = useState<boolean>(true);

  // Sincroniza se o valor numérico externo mudar
  useEffect(() => {
    setTextValue(formatNumber(value));
    setIsValid(true);
  }, [value, formatNumber]);

  const parseAndClamp = useCallback(
    (raw: string): number => {
      const clean = raw.trim();
      if (clean === '' || clean === '-' || clean === '0x') {
        return Math.max(min, Math.min(max, 0));
      }

      let parsed: number;
      if (radix === 16) {
        const hexStr = clean.startsWith('0x') || clean.startsWith('0X') ? clean.slice(2) : clean;
        parsed = parseInt(hexStr, 16);
      } else {
        parsed = parseInt(clean, 10);
      }

      if (Number.isNaN(parsed)) {
        return Math.max(min, Math.min(max, value));
      }

      return Math.max(min, Math.min(max, parsed));
    },
    [radix, min, max, value]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextText = e.target.value;

    // Permite que o usuário digite o sinal de menos se negativos forem permitidos
    if (allowNegative && (nextText === '-' || nextText === '0x-')) {
      setTextValue(nextText);
      setIsValid(true);
      return;
    }

    // Permite prefixo de hexadecimal limpo
    if (radix === 16 && (nextText === '0' || nextText === '0x' || nextText === '0X')) {
      setTextValue(nextText);
      setIsValid(true);
      return;
    }

    // Permite campo vazio temporariamente durante digitação
    if (nextText === '') {
      setTextValue('');
      setIsValid(true);
      return;
    }

    // Validação de caracteres
    const validPattern =
      radix === 16
        ? allowNegative
          ? /^-?0x[0-9a-fA-F]*$|^-?[0-9a-fA-F]*$/
          : /^0x[0-9a-fA-F]*$|^[0-9a-fA-F]*$/
        : allowNegative
        ? /^-?[0-9]*$/
        : /^[0-9]*$/;

    if (!validPattern.test(nextText)) {
      return;
    }

    setTextValue(nextText);

    // Se já formar um número válido, atualiza imediatamente se estiver no range
    let parsed: number;
    if (radix === 16) {
      const hexStr = nextText.startsWith('0x') || nextText.startsWith('0X') ? nextText.slice(2) : nextText;
      parsed = parseInt(hexStr, 16);
    } else {
      parsed = parseInt(nextText, 10);
    }

    if (!Number.isNaN(parsed) && parsed >= min && parsed <= max) {
      setIsValid(true);
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    const finalVal = parseAndClamp(textValue);
    setTextValue(formatNumber(finalVal));
    setIsValid(true);
    onChange(finalVal);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const finalVal = parseAndClamp(textValue);
      setTextValue(formatNumber(finalVal));
      setIsValid(true);
      onChange(finalVal);
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setTextValue(formatNumber(value));
      setIsValid(true);
    }
  };

  return {
    value: textValue,
    onChange: handleChange,
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
    isValid,
  };
}
