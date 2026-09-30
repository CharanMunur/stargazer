import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider transition-colors focus:outline-none shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-primary/20 bg-primary/10 text-primary",
        orange:
          "border border-[rgba(230,164,65,0.30)] bg-[rgba(230,164,65,0.12)] text-[#E6A441]",
        secondary:
          "border border-border/60 bg-muted/60 text-muted-foreground font-medium text-xs px-2.5",
        destructive:
          "border border-destructive/20 bg-destructive/10 text-destructive",
        outline: "border border-border text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
