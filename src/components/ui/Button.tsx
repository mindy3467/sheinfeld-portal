import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'navy' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export default function Button({
  variant = 'gold',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: Props) {
  return (
    <button
      disabled={disabled ?? loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-gold text-white hover:bg-gold-dark focus-visible:outline-gold': variant === 'gold',
          'bg-navy text-white hover:bg-navy-dark focus-visible:outline-navy': variant === 'navy',
          'bg-transparent text-navy hover:bg-light-gray border border-border focus-visible:outline-navy': variant === 'ghost',
          'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600': variant === 'danger',
        },
        {
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-5 py-2.5 text-base': size === 'md',
          'px-7 py-3.5 text-lg': size === 'lg',
        },
        className,
      )}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}
