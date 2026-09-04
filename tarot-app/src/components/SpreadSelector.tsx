import { SPREADS, SPREAD_ORDER } from '../logic/spreads'
import type { SpreadId } from '../logic/types'

export type SpreadChoice = 'auto' | SpreadId

export function SpreadSelector({ value, onChange, disabled }: { value: SpreadChoice; onChange: (v: SpreadChoice) => void; disabled: boolean }) {
  return (
    <div className="spreads" role="radiogroup" aria-label="Legesystem">
      <Chip active={value === 'auto'} onClick={() => onChange('auto')} disabled={disabled}>
        Auto
      </Chip>
      {SPREAD_ORDER.map((id) => (
        <Chip key={id} active={value === id} onClick={() => onChange(id)} disabled={disabled}>
          {SPREADS[id].name}
        </Chip>
      ))}
    </div>
  )
}

function Chip({ active, onClick, disabled, children }: { active: boolean; onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button type="button" role="radio" aria-checked={active} className={`chip${active ? ' chip--on' : ''}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}
