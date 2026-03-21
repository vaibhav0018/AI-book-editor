import { cn } from '@/lib/utils'

const STEPS = ['planning', 'writing', 'summarizing', 'done']

const LABELS = {
  planning: 'Planning',
  writing: 'Writing',
  summarizing: 'Summarizing',
  done: 'Done',
}

export default function StepIndicator({ currentStep }) {
  if (!currentStep) return null

  const activeIdx = STEPS.indexOf(currentStep)

  return (
    <div className="rounded-xl border border-warm-light bg-warm-light/40 p-3">
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => (
          <div key={step} className="flex items-center gap-1.5">
            <div
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold',
                i < activeIdx && 'bg-green-500 text-white',
                i === activeIdx && 'animate-pulse-soft bg-primary text-primary-foreground',
                i > activeIdx && 'bg-border text-muted-foreground',
              )}
            >
              {i < activeIdx ? '✓' : i + 1}
            </div>
            <span
              className={cn(
                'text-[10px]',
                i === activeIdx ? 'font-semibold text-foreground' : 'text-muted-foreground',
              )}
            >
              {LABELS[step]}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn('mx-1 h-px w-4', i < activeIdx ? 'bg-green-500' : 'bg-border')} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
