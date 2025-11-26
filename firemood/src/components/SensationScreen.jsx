import { useFM } from '../store'

const SENS = ['lourdeur','chaleur','froid','nœud','vertige','pression','vide','tiraillement']

export default function SensationScreen({ onNext, onBack }){
  const { sensation, setSensation } = useFM()
  return (
    <div className="container">
      <h1>Et dans ton corps, ça fait comment ?</h1>
      <div className="grid">
        {SENS.map((s) => (
          <button
            key={s}
            className={'btn' + (sensation === s ? ' primary' : '')}
            onClick={() => setSensation(s)}
            aria-label={`Sensation ${s}`}
          >
            {s}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button className="btn block" onClick={onBack}>Retour</button>
        <button className="btn primary block" onClick={onNext}>Continuer</button>
      </div>
    </div>
  )
}
