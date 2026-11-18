import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-[#150C33] shadow-xs',
        brand:
          'bg-gradient-to-r from-[#231651] to-[#613399] text-white shadow-[var(--shadow-soft)] hover:brightness-110',
        cta: 'bg-[#231651] text-white shadow-[var(--shadow-soft)] hover:bg-[#150C33] hover:shadow-[var(--shadow-lifted)] hover:-translate-y-0.5',
        mint:
          'bg-[#D6FFF6] text-[#0A5C4A] font-bold shadow-[var(--shadow-soft)] hover:bg-[#B8F7E8] hover:-translate-y-0.5',
        'outline-dark':
          'border border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50 backdrop-blur-sm',
        glass:
          'border border-border/80 bg-card/85 text-foreground backdrop-blur-md hover:bg-secondary/80 dark:bg-white/5 dark:hover:bg-white/10',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border border-border bg-card text-foreground shadow-xs hover:bg-secondary hover:text-primary hover:border-accent/40 dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-[#E8E3F5]',
        ghost:
          'text-foreground hover:bg-secondary hover:text-primary dark:hover:bg-accent/30',
        link: 'text-accent underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-9 rounded-lg gap-1.5 px-3.5 text-xs has-[>svg]:px-2.5',
        lg: 'h-12 rounded-xl px-6 text-sm sm:text-base has-[>svg]:px-4',
        icon: 'size-10',
        'icon-sm': 'size-8',
        'icon-lg': 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
