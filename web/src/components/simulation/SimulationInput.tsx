import { useNumericInput } from './useNumericInput';

export interface SimulationInputPreset {
  label: string;
  value: number;
}

export interface SimulationInputProps {
  id: string;
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  radix?: 10 | 16;
  allowNegative?: boolean;
  unit?: string;
  helperText?: string;
  presets?: SimulationInputPreset[];
  className?: string;
}

export function SimulationInput({
  id,
  label,
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  radix = 10,
  allowNegative = true,
  unit,
  helperText,
  presets,
  className = '',
}: SimulationInputProps) {
  const inputBinding = useNumericInput({
    value,
    onChange,
    min,
    max,
    radix,
    allowNegative,
  });

  return (
    <div className={`space-y-1.5 font-mono text-xs ${className}`}>
      <label htmlFor={id} className="block font-medium text-graphite">
        {label}
      </label>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            id={id}
            type="text"
            inputMode={radix === 16 ? 'text' : 'numeric'}
            value={inputBinding.value}
            onChange={inputBinding.onChange}
            onBlur={inputBinding.onBlur}
            onKeyDown={inputBinding.onKeyDown}
            className={`min-h-[42px] w-full rounded-xl border bg-white px-3 py-2 font-bold text-off-black transition-all focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none ${
              inputBinding.isValid ? 'border-ash' : 'border-coral ring-1 ring-coral'
            } ${unit ? 'pr-12' : ''}`}
          />
          {unit && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-smoke text-[11px]">
              {unit}
            </span>
          )}
        </div>
      </div>

      {helperText && <p className="text-[11px] text-smoke leading-tight">{helperText}</p>}

      {/* Presets Rápidos */}
      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChange(preset.value)}
              className={`min-h-[28px] rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition-all focus-visible:ring-2 focus-visible:ring-lake-blue focus-visible:outline-none ${
                value === preset.value
                  ? 'bg-lake-blue text-white border-lake-blue shadow-2xs'
                  : 'bg-white text-graphite border-ash hover:border-off-black hover:text-off-black'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
