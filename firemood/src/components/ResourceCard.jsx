export default function ResourceCard({ text, onRestart }){
  return (
    <div className="container">
      <div className="card">
        <h1>Sagesse du Daron</h1>
        <p style={{fontSize:22, marginTop:8}}>{text}</p>
        <p className="tagline">Refais un rituel quand tu veux.</p>
      </div>
      <div style={{height:16}}/>
      <button className="btn primary block" onClick={onRestart}>Refaire un rituel</button>
    </div>
  )
}
