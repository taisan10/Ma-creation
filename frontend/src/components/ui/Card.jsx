import { cn } from '../../lib/utils'

export function Card({ className = '', children, ...props }) {
  return (
    <div className={cn('rounded-xl border border-ink/15 bg-card', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ className = '', children, ...props }) {
  return (
    <div className={cn('p-6 pb-3', className)} {...props}>
      {children}
    </div>
  )
}

export function CardContent({ className = '', children, ...props }) {
  return (
    <div className={cn('p-6 pt-3', className)} {...props}>
      {children}
    </div>
  )
}
