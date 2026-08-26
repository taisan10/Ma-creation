import { cn } from '../../lib/utils'

export function Button({ className = '', variant = 'default', size = 'default', type = 'button', ...props }) {
  const variants = {
    default: 'bg-ink text-paper hover:bg-ink2',
    gold: 'bg-gold text-white hover:bg-gold2 hover:text-white',
    outline: 'border border-ink/20 bg-transparent text-ink hover:border-ink hover:bg-card',
    ghost: 'bg-transparent text-ink hover:bg-ink/5',
  }
  const sizes = { default: 'px-5 py-3', sm: 'px-4 py-2.5 text-[13px]' }
  return <button type={type} className={cn('inline-flex items-center justify-center gap-2 rounded-[7px] font-semibold text-sm transition active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none', variants[variant], sizes[size], className)} {...props} />
}
