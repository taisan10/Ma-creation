import { cn } from '../../lib/utils'
export function Card({ className = '', children }) { return <div className={cn('rounded-xl border border-ink/10 bg-card', className)}>{children}</div> }
export function CardHeader({ className = '', children }) { return <div className={cn('p-6 pb-3', className)}>{children}</div> }
export function CardContent({ className = '', children }) { return <div className={cn('p-6 pt-3', className)}>{children}</div> }
