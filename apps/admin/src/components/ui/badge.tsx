import { cn } from '@/lib/utils'

type Variant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'

const variantClasses: Record<Variant, string> = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  outline: 'border text-foreground',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  info: 'bg-blue-100 text-blue-800',
}

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

export const STATUS_BADGE: Record<string, Variant> = {
  pending: 'secondary',
  scheduled: 'info',
  approved: 'success',
  featured: 'warning',
  rejected: 'destructive',
  withdrawn: 'outline',
  hidden: 'default',
  open: 'destructive',
  reviewed: 'warning',
  resolved: 'success',
  visible: 'success',
}
