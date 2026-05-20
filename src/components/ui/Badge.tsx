import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

type Variant = 'gold' | 'navy' | 'green' | 'red' | 'gray'

interface Props extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant
}

export default function Badge({ variant = 'gray', className, children, ...props }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        {
          'bg-gold/15 text-gold-dark': variant === 'gold',
          'bg-navy/10 text-navy': variant === 'navy',
          'bg-green-100 text-green-700': variant === 'green',
          'bg-red-100 text-red-700': variant === 'red',
          'bg-gray-100 text-gray-600': variant === 'gray',
        },
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
