import type { ReactNode } from 'react'

export function Expandable({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className={`expandable${open ? ' expandable--open' : ''}`} aria-hidden={!open}>
      <div className="expandable__inner">{children}</div>
    </div>
  )
}
