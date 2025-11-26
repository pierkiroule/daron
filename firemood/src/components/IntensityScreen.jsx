import { useFM } from '../store'

export default function IntensityScreen({ onNext, onBack }){
  const { intensity, setIntensity } = useFM()
  return (
    <div className="container">
      <h1>Et c’est fort comment ?</h1>
      <input
        className="slider"
        type="range"
        min="1"
        max="10"
        value={intensity}
        onChange={(e) => setIntensity(parseInt(e.target.value, 10))}
        aria-label="Intensité"
      />
      <p className="small">Intensité: {intensity}</p>
      <div style={{ display:'flex', gap:8, marginTop:16 }}>
        <button className="btn block" onClick={onBack}>Retour</button>
        <button className="btn primary block" onClick={onNext}>Balancer</button>
      </div>
    </div>
  )
}
