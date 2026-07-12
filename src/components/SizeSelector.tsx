interface Props {
  sizes: string[]
  selected: string
  onChange: (size: string) => void
  error?: boolean
}

export function SizeSelector({ sizes, selected, onChange, error }: Props) {
  return (
    <div data-testid="size-selector">
      <p className="text-sm font-semibold text-text-strong mb-2">
        Talle <span className="text-error-500">*</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {sizes.map(s => (
          <button
            key={s}
            data-testid="size-option"
            onClick={() => onChange(s)}
            className={`min-w-[44px] h-11 px-3 rounded-lg border text-sm font-semibold
              transition-colors
              ${selected === s
                ? 'bg-brand border-brand text-text-on-brand'
                : 'border-border-default text-text-body hover:border-brand hover:text-brand'}`}>
            {s}
          </button>
        ))}
      </div>
      {error && (
        <p className="text-xs text-error-500 mt-1.5 flex items-center gap-1">
          ⚠ Seleccioná un talle para continuar
        </p>
      )}
    </div>
  )
}
