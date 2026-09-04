import type { Suit } from '../logic/types'

export function SuitIcon({ suit, major }: { suit: Suit; major: boolean }) {
  if (major) {
    return (
      <svg viewBox="0 0 40 40" className="card__icon">
        <path d="M20 4l4.2 9.6L34 15l-7.5 6.8L28.4 32 20 27l-8.4 5 1.9-10.2L6 15l9.8-1.4z" fill="currentColor" />
        <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      </svg>
    )
  }
  switch (suit) {
    case 'wands':
      return (
        <svg viewBox="0 0 40 40" className="card__icon">
          <rect x="17.5" y="6" width="5" height="30" rx="2.5" fill="currentColor" transform="rotate(20 20 20)" />
          <path d="M14 8c3-4 9-4 12 0-2 2-4 3-6 3s-4-1-6-3z" fill="currentColor" />
          <circle cx="12" cy="30" r="2" fill="currentColor" opacity="0.6" />
          <circle cx="28" cy="10" r="1.5" fill="currentColor" opacity="0.6" />
        </svg>
      )
    case 'cups':
      return (
        <svg viewBox="0 0 40 40" className="card__icon">
          <path d="M9 8h22c0 10-4 15-11 16C13 23 9 18 9 8z" fill="currentColor" />
          <rect x="18" y="23" width="4" height="8" fill="currentColor" />
          <path d="M11 33h18v2H11z" fill="currentColor" />
        </svg>
      )
    case 'swords':
      return (
        <svg viewBox="0 0 40 40" className="card__icon">
          <path d="M20 3l3 22h-6z" fill="currentColor" />
          <rect x="12" y="25" width="16" height="3" rx="1.5" fill="currentColor" />
          <rect x="18.5" y="28" width="3" height="8" rx="1.5" fill="currentColor" />
          <circle cx="20" cy="37" r="2" fill="currentColor" />
        </svg>
      )
    case 'pentacles':
      return (
        <svg viewBox="0 0 40 40" className="card__icon">
          <circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <path d="M20 8l3.5 9.5H33l-7.6 5.6 2.9 9.4L20 26.7 11.7 32.5l2.9-9.4L7 17.5h9.5z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      )
    default:
      return null
  }
}
