import React, { useEffect, useRef, useState } from 'react'
import { useFM } from '../store'
import { getProfile } from '../engine/DaronEngine'

function lerp(a, b, t){ return a + (b - a) * t }
function clamp(v, min, max){ return Math.min(max, Math.max(min, v)) }
function dist(a, b){ const dx = a.x - b.x; const dy = a.y - b.y; return Math.hypot(dx, dy) }

export default function FireMoodCanvas({ onDone }){
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const { mood, sensation, intensity, setResource } = useFM()
  const [clonesLeft, setClonesLeft] = useState(intensity)
  const [audioName, setAudioName] = useState('Ambiance interne')
  const [stageError, setStageError] = useState(null)
  const clonesLeftRef = useRef(intensity)
  const analyserRef = useRef(null)
  const dataArrayRef = useRef(null)
  const audioCtxRef = useRef(null)
  const sourceRef = useRef(null)
  const audioRef = useRef(null)
  const audioUrlRef = useRef(null)
  const completedRef = useRef(false)

  useEffect(() => { setClonesLeft(intensity) }, [intensity])
  useEffect(() => { clonesLeftRef.current = clonesLeft }, [clonesLeft])

  useEffect(() => {
    const container = containerRef.current
    if(!container) return
    completedRef.current = false
    setStageError(null)

    const { palette, resource } = getProfile(mood, sensation, intensity)
    const canvas = document.createElement('canvas')
    canvasRef.current = canvas
    const ctx = canvas.getContext('2d')
    if(!ctx){
      setStageError('Canvas non supporté par ce navigateur.')
      return () => {}
    }

    canvas.style.width = '100%'
    canvas.style.height = '100%'
    container.appendChild(canvas)

    const clones = []
    for (let i = 0; i < intensity; i++){
      const angle = Math.random() * Math.PI * 2
      const radius = 160 + Math.random() * 80
      const pos = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
      const vel = { x: 0, y: 0 }
      clones.push({
        pos,
        vel,
        alive: true,
        radius: 28 + Math.random() * 12,
        wobble: Math.random() * Math.PI * 2,
        hueShift: Math.random() * 50 - 25,
        emojiTilt: Math.random() * 0.6 - 0.3,
      })
    }

    const pointer = { x: 0, y: 0 }
    let dragging = null
    let raf
    const start = performance.now()

    function resize(){
      const { clientWidth, clientHeight } = container
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = clientWidth * dpr
      canvas.height = clientHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function sampleAudio(){
      const analyser = analyserRef.current
      if(!analyser || !dataArrayRef.current) return 0
      analyser.getByteFrequencyData(dataArrayRef.current)
      let sum = 0
      for (let i = 0; i < dataArrayRef.current.length; i++) sum += dataArrayRef.current[i]
      const val = sum / (dataArrayRef.current.length * 255)
      return clamp(val * 1.3, 0, 1)
    }

    function drawBackground(t, energy){
      const { width, height } = canvas
      const cx = width / (canvas.width / canvas.clientWidth) / 2
      const cy = height / (canvas.height / canvas.clientHeight) / 2

      const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.max(cx, cy))
      grad.addColorStop(0, palette.base)
      grad.addColorStop(0.35, palette.glow)
      grad.addColorStop(1, '#050505')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight)

      ctx.save()
      ctx.translate(canvas.clientWidth / 2, canvas.clientHeight / 2)
      const rings = 8
      for (let i = 0; i < rings; i++){
        const r = 40 + i * 40 + Math.sin(t * 0.001 + i) * 14 * (1 + energy)
        ctx.strokeStyle = `rgba(255,255,255,${0.018 + energy * 0.04})`
        ctx.lineWidth = 1.2 + energy * 0.6
        ctx.beginPath()
        ctx.arc(0, 0, r, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()

      const waveCount = 5
      for (let i = 0; i < waveCount; i++){
        const y = canvas.clientHeight * (i / (waveCount - 1))
        ctx.strokeStyle = `rgba(255,255,255,${0.07 + energy * 0.08})`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        for (let x = 0; x <= canvas.clientWidth; x += 6){
          const offset = Math.sin((x * 0.02) + t * 0.002 + i) * 12
          const pulsing = Math.sin(t * 0.0015 + i * 0.6) * 18 * energy
          const waveY = y + offset + pulsing
          if (x === 0) ctx.moveTo(x, waveY)
          else ctx.lineTo(x, waveY)
        }
        ctx.stroke()
      }
    }

    function drawClone(c, t, energy){
      const { x, y } = c.pos
      const r = c.radius * (1 + energy * 0.35)
      ctx.save()
      ctx.translate(canvas.clientWidth / 2 + x, canvas.clientHeight / 2 + y)
      ctx.rotate(Math.sin(t * 0.002 + c.wobble) * 0.2)

      const bubble = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.2, 0, 0, r)
      bubble.addColorStop(0, palette.glow)
      bubble.addColorStop(0.6, palette.base)
      bubble.addColorStop(1, 'rgba(0,0,0,0.8)')
      ctx.fillStyle = bubble
      ctx.strokeStyle = `rgba(0,0,0,0.55)`
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.beginPath()
      ctx.ellipse(-r * 0.3, -r * 0.4, r * 0.25, r * 0.18, 0.4, 0, Math.PI * 2)
      ctx.fill()

      ctx.save()
      ctx.rotate(c.emojiTilt)
      ctx.font = `${r * 1.4}px "Apple Color Emoji", "Noto Color Emoji", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = 'rgba(0,0,0,0.35)'
      ctx.shadowBlur = 12
      ctx.fillText(mood, 0, 4)
      ctx.restore()

      ctx.beginPath()
      ctx.strokeStyle = `hsla(${220 + c.hueShift}, 40%, 80%, ${0.35 + energy * 0.3})`
      ctx.lineWidth = 6
      ctx.arc(0, 0, r + 8, Math.sin(t * 0.004 + c.wobble) * 0.8, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }

    function updateClone(c, t, energy, index){
      if(!c.alive) return
      const center = { x: 0, y: 0 }
      const pull = 0.08 + energy * 0.14
      const swirl = 0.012 + energy * 0.02

      const toCenter = { x: center.x - c.pos.x, y: center.y - c.pos.y }
      const len = Math.max(0.001, Math.hypot(toCenter.x, toCenter.y))
      c.vel.x += (toCenter.x / len) * pull
      c.vel.y += (toCenter.y / len) * pull

      const ang = Math.sin(t * 0.002 + index) * swirl
      const vx = c.vel.x
      c.vel.x = vx * Math.cos(ang) - c.vel.y * Math.sin(ang)
      c.vel.y = vx * Math.sin(ang) + c.vel.y * Math.cos(ang)

      if (dragging === c){
        c.vel.x *= 0.4
        c.vel.y *= 0.4
        const dragTo = { x: pointer.x - canvas.clientWidth / 2, y: pointer.y - canvas.clientHeight / 2 }
        c.pos.x = lerp(c.pos.x, dragTo.x, 0.3)
        c.pos.y = lerp(c.pos.y, dragTo.y, 0.3)
      } else {
        c.vel.x *= 0.985
        c.vel.y *= 0.985
        c.pos.x += c.vel.x * (1 + energy * 0.2)
        c.pos.y += c.vel.y * (1 + energy * 0.2)
      }

      const wobbleRadius = 6 + energy * 8
      c.pos.x += Math.cos(t * 0.004 + c.wobble) * wobbleRadius * 0.03
      c.pos.y += Math.sin(t * 0.003 + c.wobble * 0.6) * wobbleRadius * 0.03

      if (len < 18){
        c.alive = false
      }
    }

    function animate(now){
      const t = now - start
      const energy = sampleAudio()
      drawBackground(t, energy)

      let alive = 0
      clones.forEach((c, i) => {
        updateClone(c, t, energy, i)
        if (c.alive){
          drawClone(c, t, energy)
          alive += 1
        }
      })

      if (alive !== clonesLeftRef.current){
        setClonesLeft(alive)
        clonesLeftRef.current = alive
        if (alive === 0 && !completedRef.current){
          completedRef.current = true
          setResource(resource)
          onDone?.()
        }
      }

      raf = requestAnimationFrame(animate)
    }

    function onPointerDown(event){
      const rect = canvas.getBoundingClientRect()
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
      let nearest = null
      let d = 80
      clones.forEach((c) => {
        if(!c.alive) return
        const distance = dist({ x: canvas.clientWidth / 2 + c.pos.x, y: canvas.clientHeight / 2 + c.pos.y }, pointer)
        if (distance < d){ nearest = c; d = distance }
      })
      if(nearest){ dragging = nearest; canvas.setPointerCapture(event.pointerId) }
    }

    function onPointerMove(event){
      const rect = canvas.getBoundingClientRect()
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
    }

    function onPointerUp(event){
      dragging = null
      try { canvas.releasePointerCapture(event.pointerId) } catch(e) { /* ignore */ }
    }

    resize()
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    window.addEventListener('resize', resize)
    raf = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(raf)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('resize', resize)
      if (container.contains(canvas)) container.removeChild(canvas)
      if (audioRef.current){ audioRef.current.pause() }
      if (sourceRef.current){ try { sourceRef.current.disconnect() } catch(e) { /* noop */ } }
      if (analyserRef.current){ try { analyserRef.current.disconnect() } catch(e) { /* noop */ } }
      if (audioCtxRef.current){ try { audioCtxRef.current.close() } catch(e) { /* noop */ } }
      if (audioUrlRef.current){ URL.revokeObjectURL(audioUrlRef.current); audioUrlRef.current = null }
    }
  }, [mood, sensation, intensity, onDone, setResource])

  function handleSave(){
    const canvas = canvasRef.current
    if(!canvas) return
    const data = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = data
    link.download = 'firemood-illustration.png'
    link.click()
  }

  function teardownAudio(){
    if (audioRef.current){
      try { audioRef.current.pause() } catch(e) { /* noop */ }
    }
    if (sourceRef.current){
      try { sourceRef.current.disconnect() } catch(e) { /* noop */ }
      sourceRef.current = null
    }
    if (analyserRef.current){
      try { analyserRef.current.disconnect() } catch(e) { /* noop */ }
      analyserRef.current = null
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed'){
      try { audioCtxRef.current.close() } catch(e) { /* noop */ }
    }
    audioCtxRef.current = null
    if (audioUrlRef.current){
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
  }

  function handleAudioUpload(event){
    const file = event.target.files?.[0]
    if(!file) return
    setStageError(null)
    setAudioName(file.name)
    teardownAudio()
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    audioCtxRef.current = ctx
    const url = URL.createObjectURL(file)
    audioUrlRef.current = url
    const audio = new Audio(url)
    audio.loop = true
    audio.crossOrigin = 'anonymous'
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 1024
    const source = ctx.createMediaElementSource(audio)
    source.connect(analyser)
    analyser.connect(ctx.destination)
    analyserRef.current = analyser
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)
    sourceRef.current = source
    audioRef.current = audio
    ctx.resume().then(() => audio.play()).catch(() => {
      setStageError('Lecture audio bloquée. Cliquez pour relancer ou vérifiez les permissions de votre navigateur.')
    })
  }

  function handleStopAudio(){
    teardownAudio()
    setStageError(null)
    setAudioName('Ambiance interne')
  }

  return (
    <div ref={containerRef} className="vjing-stage" aria-label="Zone de rituel FireMood">
      {stageError && (
        <div className="visualizer-error" role="alert" aria-live="assertive">{stageError}</div>
      )}
      <div className="floating-actions">
        <button className="btn" onClick={handleSave} aria-label="Sauvegarder la trace">Sauvegarder la trace</button>
        <span className="small" style={{ alignSelf:'center' }}>Clones restants: {clonesLeft}</span>
        <label className="audio-upload btn">
          Importer un son
          <input type="file" accept="audio/*" onChange={handleAudioUpload} aria-label="Importer un fichier audio" />
        </label>
        <button className="btn" onClick={handleStopAudio} aria-label="Couper l'audio">Stop audio</button>
        <span className="small" style={{ alignSelf:'center' }}>{audioName}</span>
      </div>
    </div>
  )
}
