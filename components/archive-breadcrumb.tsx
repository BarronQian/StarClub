import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

type Crumb = { label: string; href?: string }

export function ArchiveBreadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="面包屑导航">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.68rem] tracking-[0.2em] text-muted-foreground">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={item.label} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-foreground' : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <ChevronRight
                  className="size-3 text-border"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
