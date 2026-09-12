import { cn } from '@/lib/utils'
import { Reveal } from '@/components/reveal'

type SectionHeadingProps = {
  index: string
  eyebrow: string
  title: string
  description?: string
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        'flex flex-col gap-4',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span className="font-display text-[0.65rem] tracking-[0.4em] text-primary">
          {index}
        </span>
        <span className="h-px w-10 bg-primary/40" aria-hidden="true" />
        <span className="text-[0.65rem] tracking-[0.35em] text-muted-foreground uppercase">
          {eyebrow}
        </span>
      </div>
      <h2 className="font-display text-3xl leading-tight tracking-tight text-balance sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            'max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base',
            align === 'center' && 'mx-auto',
          )}
        >
          {description}
        </p>
      ) : null}
    </Reveal>
  )
}
