import { useFM } from '../store'

const EMOJIS = ['😔','😤','😵‍💫','😰','🌫️','😡','🥀','😐']

export default function MoodScreen({ onNext }){
  const { mood, setMood } = useFM()
  return (
    <div className="container">
      <h1>Choisis ton émoji du moment</h1>
      <div className="grid">
        {EMOJIS.map((e) => (
          <button
            key={e}
            className={'btn' + (mood === e ? ' primary' : '')}
            onClick={() => setMood(e)}
            aria-label={`Émoji ${e}`}
          >
            {e}
          </button>
        ))}
      </div>
      <div style={{ height: 16 }} />
      <button className="btn primary block" onClick={onNext}>Continuer</button>
    </div>
  )
}
