import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

export default function Card({ padding = 'md', className, children, ...props }: Props) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-border',
        {
          'p-3': padding === 'sm',
          'p-5': padding === 'md',
          'p-8': padding === 'lg',
          '': padding === 'none',
        },
        className,
      )}
      style={{ boxShadow: 'var(--shadow-card)' }}
      {...props}
    >
      {children}
    </div>
  )
}
