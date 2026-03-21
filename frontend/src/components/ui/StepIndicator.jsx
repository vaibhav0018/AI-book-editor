import { cn } from '@/lib/utils'

const STEPS = ['planning', 'writing', 'summarizing', 'done']

const LABELS = {
  planning: 'Planning outline',
  writing: 'Writing chapter',
  summarizing: 'Summarizing',
  done: 'Done',
}

export default function StepIndicator({ currentStep }) {
  if (!currentStep) return null

  const activeIdx = STEPS.indexOf(currentStep)

  return (
    <div className="flex items-center gap-2 rounded-md bg-accent px-4 py-2">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                i < activeIdx && 'bg-green-500 text-white',
                i === activeIdx && 'animate-pulse bg-primary text-primary-foreground',
                i > activeIdx && 'bg-muted text-muted-foreground',
              )}
            >
              {i < activeIdx ? '✓' : i + 1}
            </div>
            <span
              className={cn(
                'text-xs',
                i === activeIdx ? 'font-semibold text-foreground' : 'text-muted-foreground',
              )}
            >
              {LABELS[step]}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn('h-px w-6', i < activeIdx ? 'bg-green-500' : 'bg-border')} />
          )}
        </div>
      ))}
    </div>
  )
}
