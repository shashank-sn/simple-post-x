import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'ghost', size = 'md', className = '', children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 cursor-pointer rounded-md disabled:opacity-40 disabled:cursor-not-allowed no-drag'

    const variants = {
      primary:
        'bg-accent text-text-inverse hover:bg-accent-hover active:scale-[0.98]',
      ghost:
        'text-text-secondary hover:text-text-primary hover:bg-bg-hover active:bg-bg-elevated',
      outline:
        'border border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary bg-transparent active:bg-bg-hover',
    }

    const sizes = {
      sm: 'h-7 px-2.5 text-xs',
      md: 'h-8 px-3 text-sm',
      lg: 'h-10 px-4 text-base',
    }

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
