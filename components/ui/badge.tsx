import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3.5 gap-1.5 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        mint:
          'border-[#0A5C4A]/15 bg-[#D6FFF6] text-[#0A5C4A] [a&]:hover:bg-[#B8F7E8]',
        lavender:
          'border-[#E8E3F5] bg-[#F3EFFA] text-[#231651] [a&]:hover:bg-[#E8E3F5]',
        violet:
          'border-transparent bg-[#613399] text-white [a&]:hover:bg-[#4E277D]',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/80',
        success:
          'border-[#0A5C4A]/20 bg-[#D6FFF6] text-[#0A5C4A] dark:bg-emerald-500/20 dark:text-emerald-200',
        warning:
          'border-amber-500/25 bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200',
        info:
          'border-[#613399]/20 bg-[#F3EFFA] text-[#613399] dark:bg-[#613399]/25 dark:text-[#D6FFF6]',
        level:
          'border-[#E8E3F5] bg-[#F3EFFA] text-[#231651] dark:bg-[#261857] dark:text-[#D6FFF6]',
        destructive:
          'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border-border text-foreground [a&]:hover:bg-secondary [a&]:hover:text-primary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
