import React, { useEffect, useRef, useState } from 'react'
import { useFM } from '../store'
import { getProfile } from '../engine/DaronEngine'

export default function FireMoodCanvas({ onDone }){
  const cvsRef = useRef(null)
  const audioRef = useRef(null)
  const { mood, sensation, intensity, setResource } = useFM()
  const [clonesLeft, setClonesLeft] = useState(intensity)
  const [audioLevel, setAudioLevel] = useState(0)

  useEffect(() => { setClonesLeft(intensity) }, [intensity])

  useEffect(() => {
    const canvas = cvsRef.current
    const ctx = canvas.getContext('2d')
    let W, H, raf
    function fit(){ W = canvas.width = canvas.clientWidth; H = canvas.height = canvas.clientHeight }
    fit(); const ro = new ResizeObserver(fit); ro.observe(canvas)

    const { palette, resource } = getProfile(mood, sensation, intensity)
    const fire = { x: W/2, y: H*0.35, r: 60, t:0 }
    const balls = []
    const gravity = 0.00025
    const impacts = []

    for(let i=0;i<intensity;i++){
      const angle = Math.random()*Math.PI*2
      const radius = fire.r * (2.4 + Math.random()*1.2)
      const speed = 1.2 + Math.random()*0.6
      const dir = angle + Math.PI/2
      balls.push({
        x: fire.x + Math.cos(angle)*radius,
        y: fire.y + Math.sin(angle)*radius,
        vx: Math.cos(dir)*speed,
        vy: Math.sin(dir)*speed,
        trail: [],
        alive: true
      })
    }

    function triggerHaptic(){
      if (navigator?.vibrate){
        navigator.vibrate(20)
      }
    }

    function pushNearby(x, y){
      const pushRadius = 110
      for(const b of balls){
        if(!b.alive) continue
        const dx = b.x - x
        const dy = b.y - y
        const d = Math.hypot(dx, dy)
        if (d < pushRadius && d > 6){
          const strength = (1 - d/pushRadius) * 8
          b.vx += (dx/d) * strength
          b.vy += (dy/d) * strength
        }
      }
    }

    function onDown(e){
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      pushNearby(x, y)
      canvas.setPointerCapture(e.pointerId)
    }
    function onUp(e){
      if (e.pointerId) {
        canvas.releasePointerCapture(e.pointerId)
      }
    }

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerup', onUp)

    function bg(){
      ctx.fillStyle = 'rgba(0,0,0,0.18)'
      ctx.fillRect(0,0,W,H)
      fire.t += 0.02
      const pulse = 1 + Math.sin(fire.t)*0.06 + audioLevel*0.35
      const g = ctx.createRadialGradient(fire.x,fire.y,10, fire.x,fire.y,fire.r*1.9)
      g.addColorStop(0, palette.glow+'ee')
      g.addColorStop(0.5, palette.base+'55')
      g.addColorStop(1, 'transparent')
      ctx.fillStyle = g
      ctx.beginPath(); ctx.arc(fire.x,fire.y,fire.r*pulse,0,Math.PI*2); ctx.fill()
    }

    function draw(){
      bg()

      for(const b of balls){
        if(!b.alive) continue

        const dx = fire.x - b.x
        const dy = fire.y - b.y
        const dist = Math.hypot(dx, dy) || 1
        const acc = gravity * Math.min(dist, 400)
        b.vx += (dx / dist) * acc
        b.vy += (dy / dist) * acc

        b.vx *= 0.995
        b.vy *= 0.995
        b.x += b.vx
        b.y += b.vy

        b.trail.push({ x: b.x, y: b.y })
        if (b.trail.length > 18) b.trail.shift()

        // traînée comète
        ctx.lineWidth = 2
        ctx.strokeStyle = palette.glow + '55'
        ctx.beginPath()
        b.trail.forEach((p, idx) => {
          if(idx===0) ctx.moveTo(p.x, p.y)
          else ctx.lineTo(p.x, p.y)
        })
        ctx.stroke()

        // halo
        ctx.fillStyle = palette.base+'66'
        ctx.beginPath(); ctx.arc(b.x, b.y, 8, 0, Math.PI*2); ctx.fill()
        ctx.font = '24px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(mood, b.x, b.y)

        if (Math.hypot(dx, dy) < fire.r){
          b.alive = false
          setClonesLeft((c) => Math.max(0, c-1))
          triggerHaptic()
          impacts.push({ x: b.x, y: b.y, t: 0, hue: Math.random()*360 })
        }
      }

      // effets hypnotiques réactifs à l'audio
      for(const imp of impacts){
        imp.t += 1
        const life = imp.t / 140
        if (life >= 1) continue
        const alpha = (1-life) * 0.9
        const radius = fire.r * (0.6 + life*3 + audioLevel*2)
        ctx.strokeStyle = `hsla(${imp.hue}, 90%, 65%, ${alpha})`
        ctx.lineWidth = 3 + audioLevel*6
        ctx.beginPath()
        ctx.arc(imp.x, imp.y, radius, 0, Math.PI*2)
        ctx.stroke()

        const arms = 6
        for(let i=0;i<arms;i++){
          const a = i*Math.PI*2/arms + life*4
          const len = radius * (0.4 + audioLevel)
          const sx = imp.x + Math.cos(a)*len*0.5
          const sy = imp.y + Math.sin(a)*len*0.5
          const ex = imp.x + Math.cos(a)*len
          const ey = imp.y + Math.sin(a)*len
          const grad = ctx.createLinearGradient(sx, sy, ex, ey)
          grad.addColorStop(0, `hsla(${imp.hue+30}, 90%, 70%, ${alpha})`)
          grad.addColorStop(1, `hsla(${imp.hue+120}, 90%, 70%, 0)`)
          ctx.strokeStyle = grad
          ctx.lineWidth = 2 + audioLevel*4
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke()
        }
      }

      if (balls.every((b) => !b.alive)){
        setResource(resource)
        onDone?.()
        return
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
    }
  }, [mood, sensation, intensity, setResource, onDone])

  useEffect(() => {
    const audio = audioRef.current
    if(!audio) return
    let ctx, analyser, dataArray, raf

    function ensureAudio(){
      if(ctx) return
      ctx = new AudioContext()
      const source = ctx.createMediaElementSource(audio)
      analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      dataArray = new Uint8Array(analyser.frequencyBinCount)
      source.connect(analyser)
      analyser.connect(ctx.destination)
    }

    function tick(){
      if(!analyser) return
      analyser.getByteFrequencyData(dataArray)
      const avg = dataArray.reduce((a,b)=>a+b,0) / dataArray.length
      setAudioLevel(avg / 255)
      raf = requestAnimationFrame(tick)
    }

    function onPlay(){
      ensureAudio()
      ctx.resume()
      tick()
    }
    audio.addEventListener('play', onPlay)

    return () => {
      audio.removeEventListener('play', onPlay)
      cancelAnimationFrame(raf)
      if(ctx){ ctx.close() }
    }
  }, [])

  function handleSave(){
    const canvas = cvsRef.current
    if(!canvas) return
    const data = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = data
    link.download = 'firemood.png'
    link.click()
  }

  return (
    <div style={{position:'relative', height:'100vh'}}>
      <canvas ref={cvsRef} style={{width:'100%', height:'100%'}} aria-label="Zone de rituel FireMood"/>
      <div className="floating-actions">
        <button className="btn" onClick={handleSave} aria-label="Sauvegarder la trace">Sauvegarder la trace</button>
        <span className="small" style={{alignSelf:'center'}}>Clones restants: {clonesLeft}</span>
      </div>
      <audio ref={audioRef} src="https://raw.githubusercontent.com/effacestudios/Royalty-Free-Music-Pack/master/Starter.mp3" controls preload="none" style={{position:'absolute', bottom:10, left:10, right:10, width:'calc(100% - 20px)'}}>
        Votre navigateur ne supporte pas l'audio.
      </audio>
    </div>
  )
}
