import React, { useEffect, useRef, useState } from 'react'
import { useFM } from '../store'
import { getProfile } from '../engine/DaronEngine'

export default function FireMoodCanvas({ onDone }){
  const cvsRef = useRef(null)
  const { mood, sensation, intensity, setResource } = useFM()
  const [clonesLeft, setClonesLeft] = useState(intensity)

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
    for(let i=0;i<intensity;i++){
      balls.push({
        x: W*0.5 + (Math.random()-0.5)*80,
        y: H*0.8 + (Math.random()-0.5)*20,
        vx: (Math.random()*2-1)*2,
        vy: - (3 + Math.random()*1.5),
        alive: true
      })
    }

    function triggerHaptic(){
      if (navigator?.vibrate){
        navigator.vibrate(20)
      }
    }

    let dragging = null
    function onDown(e){
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const b = balls.find((ball) => ball.alive && Math.hypot(ball.x - x, ball.y - y) < 22)
      if(b){ dragging = b; canvas.setPointerCapture(e.pointerId) }
    }
    function onMove(e){
      if(!dragging) return
      const rect = canvas.getBoundingClientRect()
      dragging.x = e.clientX - rect.left
      dragging.y = e.clientY - rect.top
    }
    function onUp(e){
      if(!dragging) return
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      dragging.x = x
      dragging.y = y
      if (Math.hypot(dragging.x-fire.x, dragging.y-fire.y) < fire.r){
        dragging.alive = false
        setClonesLeft((c) => Math.max(0, c-1))
        triggerHaptic()
      }
      dragging = null
      canvas.releasePointerCapture(e.pointerId)
    }

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)

    function bg(){
      ctx.fillStyle = 'rgba(0,0,0,0.18)'
      ctx.fillRect(0,0,W,H)
      fire.t += 0.02
      const pulse = 1 + Math.sin(fire.t)*0.06
      const g = ctx.createRadialGradient(fire.x,fire.y,10, fire.x,fire.y,fire.r*1.8)
      g.addColorStop(0, palette.glow+'ee')
      g.addColorStop(0.6, palette.base+'55')
      g.addColorStop(1, 'transparent')
      ctx.fillStyle = g
      ctx.beginPath(); ctx.arc(fire.x,fire.y,fire.r*pulse,0,Math.PI*2); ctx.fill()
    }

    function draw(){
      bg()

      for(const b of balls){
        if(!b.alive) continue
        ctx.fillStyle = palette.base+'66'
        ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI*2); ctx.fill()
        ctx.font = '24px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(mood, b.x, b.y)

        if (dragging!==b){
          b.vy += 0.2
          b.x += b.vx
          b.y += b.vy
          if(b.x<10 || b.x>W-10) b.vx *= -0.9
          if(b.y<10 || b.y>H-10) b.vy *= -0.7
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
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
    }
  }, [mood, sensation, intensity, setResource, onDone])

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
    </div>
  )
}
