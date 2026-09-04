export function Deck({ empty }: { empty: boolean }) {
  return (
    <div className={`deck${empty ? ' deck--empty' : ''}`} aria-hidden="true">
      <span className="deck__card deck__card--3" />
      <span className="deck__card deck__card--2" />
      <span className="deck__card deck__card--1" />
    </div>
  )
}
