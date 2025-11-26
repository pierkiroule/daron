const MOOD_PALETTES = {
  '😔': { base:'#7aa7ff', glow:'#a6c4ff' },
  '😤': { base:'#ff693a', glow:'#ff9b6b' },
  '😵‍💫': { base:'#b987ff', glow:'#e1c9ff' },
  '😰': { base:'#7ad1ff', glow:'#b6e8ff' },
  '🌫️': { base:'#9aa0a6', glow:'#cfd4d8' },
  '😡': { base:'#ff3a3a', glow:'#ff7a7a' },
  '🥀': { base:'#c96a7a', glow:'#e6a0ad' },
  '😐': { base:'#aaaaaa', glow:'#dddddd' },
}

const SENSATION_PALETTES = {
  lourdeur: { base:'#6fa8ff', glow:'#b2ceff' },
  chaleur: { base:'#ff7c3a', glow:'#ffb284' },
  froid: { base:'#7ad1ff', glow:'#b6e8ff' },
  nœud: { base:'#c8a1ff', glow:'#e5d3ff' },
  vertige: { base:'#c294ff', glow:'#f3d6ff' },
  pression: { base:'#ff9366', glow:'#ffc4ab' },
  vide: { base:'#9aa0a6', glow:'#cfd4d8' },
  tiraillement: { base:'#f0678f', glow:'#f8abc8' },
}

const RESOURCES = {
  '😔:lourdeur': [
    "Dépose un poids. Un seul.",
    "Ce que tu sens n’est pas tout ce que tu es.",
  ],
  '😤:chaleur': [
    "Respire large. Laisse sortir la pression.",
    "Ton corps n’est pas ton ennemi.",
  ],
  '😵‍💫:vertige': [
    "Ton esprit tourne. Toi, non.",
    "Pose une seule chose. Pas tout.",
  ],
  '😰:froid': [
    "Tu trembles, mais t’es vivant.",
    "Mets en pause. Reviens quand tu veux.",
  ],
  '🌫️:vide': [
    "Le flou n’est pas toi. Il te traverse.",
    "Marche très doucement. Ça suffit.",
  ],
  'default': [
    "Un fragment à la fois, tu t’allèges.",
    "Respire. C’est déjà mieux.",
  ]
}

export function getProfile(mood, sensation, intensity){
  const basePalette = MOOD_PALETTES[mood] || { base:'#ff8a3a', glow:'#ffd0b0' }
  const sensPalette = SENSATION_PALETTES[sensation]
  const palette = sensPalette ? { ...basePalette, ...sensPalette } : basePalette
  const key = `${mood}:${sensation}`
  const bank = RESOURCES[key] || RESOURCES.default
  const res = bank[(intensity > 7) ? 0 : 1] || bank[0]
  const anim = profileFor(mood, sensation)
  return { palette, resource: res, anim }
}

function profileFor(mood, sensation){
  if (mood==='😵‍💫' || sensation==='vertige') return 'vortex'
  if (mood==='😤' || sensation==='chaleur')  return 'flame'
  if (mood==='😰' || sensation==='froid')    return 'frost'
  if (mood==='😔' || sensation==='lourdeur') return 'mist'
  if (mood==='🌫️' || sensation==='vide')    return 'haze'
  return 'spark'
}
