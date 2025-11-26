import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFM } from '../store'
import { getProfile } from '../engine/DaronEngine'

const pointerPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)

function emojiTexture(symbol, palette){
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext('2d')
  const grad = ctx.createLinearGradient(0, 0, 256, 256)
  grad.addColorStop(0, palette.glow)
  grad.addColorStop(1, palette.base)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 256, 256)
  ctx.font = '150px "Apple Color Emoji", "Noto Color Emoji", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = palette.glow
  ctx.shadowBlur = 28
  ctx.fillText(symbol, 128, 140)
  return new THREE.CanvasTexture(canvas)
}

function createBackgroundMaterial(palette){
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uAudio: { value: 0 },
      uGlow: { value: new THREE.Color(palette.glow) },
      uBase: { value: new THREE.Color(palette.base) },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      varying vec2 vUv;
      uniform float uTime;
      uniform float uAudio;
      uniform vec3 uGlow;
      uniform vec3 uBase;

      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
      float noise(vec2 p){
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      void main(){
        vec2 uv = vUv * 2.0 - 1.0;
        float t = uTime * 0.12;
        float swirl = noise(uv * 3.0 + vec2(t * 0.7, -t * 0.4));
        float ridge = noise(uv * 5.0 - vec2(t, t * 0.6));
        float flow = sin((uv.x * 3.0 + swirl * 3.14) + t * 4.0);
        float energy = mix(0.22, 1.0, uAudio);

        float mask = smoothstep(1.6, 0.3, length(uv));
        float nebula = mix(swirl, ridge, 0.5) * mask;
        float halo = smoothstep(0.4 + energy * 0.2, 0.2, length(uv + 0.06 * sin(t)));

        vec3 color = mix(uBase, uGlow, nebula * 0.6 + halo * 0.4 + energy * 0.3);
        color += 0.1 * vec3(flow * 0.5 + nebula, halo, swirl);
        gl_FragColor = vec4(color, mask * 0.95);
      }
    `,
  })
}

export default function FireMoodCanvas({ onDone }){
  const containerRef = useRef(null)
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
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(65, container.clientWidth / container.clientHeight, 0.01, 200)
    camera.position.set(0, 0.2, 6.5)

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch (err) {
      console.error('WebGL init failed', err)
      setStageError('Votre navigateur bloque WebGL. Essayez un autre navigateur pour voir le rituel animé.')
      return () => {}
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.9))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)

    const ambient = new THREE.AmbientLight(palette.glow, 1.1)
    scene.add(ambient)
    const movingLight = new THREE.PointLight(palette.base, 16, 18, 2)
    movingLight.position.set(0, 2.5, 3)
    scene.add(movingLight)
    scene.add(new THREE.DirectionalLight('#ffffff', 0.25))

    const bg = new THREE.Mesh(new THREE.PlaneGeometry(16, 9, 1, 1), createBackgroundMaterial(palette))
    bg.position.set(0, 0, -4)
    scene.add(bg)

    const vortexGeo = new THREE.TorusKnotGeometry(1.65, 0.22, 280, 28, 1, 3)
    const vortexMat = new THREE.MeshStandardMaterial({
      color: palette.glow,
      emissive: palette.base,
      emissiveIntensity: 0.85,
      roughness: 0.18,
      metalness: 0.45,
      transparent: true,
      opacity: 0.7,
    })
    const vortex = new THREE.Mesh(vortexGeo, vortexMat)
    vortex.rotation.x = Math.PI * 0.5
    scene.add(vortex)

    const starGeo = new THREE.BufferGeometry()
    const starCount = 1200
    const starPositions = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount * 3; i++) starPositions[i] = (Math.random() - 0.5) * 18
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    const starMat = new THREE.PointsMaterial({ color: palette.base, size: 0.04, transparent: true, opacity: 0.65 })
    const stars = new THREE.Points(starGeo, starMat)
    scene.add(stars)

    const clones = []
    const emojiMap = emojiTexture(mood, palette)
    const spriteBase = new THREE.SpriteMaterial({ map: emojiMap, transparent: true, depthWrite: false })
    for (let i = 0; i < intensity; i++){
      const mesh = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.24 + Math.random() * 0.12, 1),
        new THREE.MeshStandardMaterial({
          color: palette.base,
          emissive: palette.glow,
          emissiveIntensity: 0.6,
          roughness: 0.3,
          metalness: 0.4,
        })
      )
      const sprite = new THREE.Sprite(spriteBase.clone())
      sprite.scale.set(0.9, 0.9, 0.9)
      const pos = new THREE.Vector3((Math.random() - 0.5) * 3.4, -1 + Math.random() * 2.2, Math.random() * 1.2 - 0.6)
      const vel = new THREE.Vector3((Math.random() - 0.5) * 0.06, 0.02 + Math.random() * 0.05, (Math.random() - 0.5) * 0.06)
      mesh.position.copy(pos)
      sprite.position.copy(pos.clone().add(new THREE.Vector3(0, 0.05, 0)))
      scene.add(mesh)
      scene.add(sprite)
      clones.push({ mesh, sprite, pos, vel, alive: true, pulse: Math.random() * Math.PI * 2 })
    }

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    let dragging = null

    const clock = new THREE.Clock()
    let raf

    function resize(){
      if(!container) return
      const { clientWidth, clientHeight } = container
      renderer.setSize(clientWidth, clientHeight)
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
    }

    function pointerToWorld(event){
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const point = new THREE.Vector3()
      raycaster.ray.intersectPlane(pointerPlane, point)
      return point
    }

    function onPointerDown(event){
      const point = pointerToWorld(event)
      let nearest = null
      let dist = 0.6
      clones.forEach((c) => {
        if(!c.alive) return
        const d = c.pos.distanceTo(point)
        if(d < dist){ nearest = c; dist = d }
      })
      if(nearest){
        dragging = nearest
        dragging.vel.set(0, 0, 0)
        renderer.domElement.setPointerCapture(event.pointerId)
      }
    }

    function onPointerMove(event){
      if(!dragging) return
      const point = pointerToWorld(event)
      dragging.pos.lerp(point, 0.35)
    }

    function onPointerUp(event){
      dragging = null
      try { renderer.domElement.releasePointerCapture(event.pointerId) } catch(e) { /* ignore */ }
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerup', onPointerUp)
    window.addEventListener('resize', resize)

    function sampleAudio(){
      const analyser = analyserRef.current
      if(!analyser || !dataArrayRef.current) return 0
      analyser.getByteFrequencyData(dataArrayRef.current)
      let sum = 0
      for (let i = 0; i < dataArrayRef.current.length; i++) sum += dataArrayRef.current[i]
      const val = sum / (dataArrayRef.current.length * 255)
      return Math.min(1, val * 1.3)
    }

    function animate(){
      const t = clock.getElapsedTime()
      const audioEnergy = sampleAudio()
      bg.material.uniforms.uTime.value = t
      bg.material.uniforms.uAudio.value = audioEnergy
      vortex.rotation.z += 0.002 + audioEnergy * 0.008
      vortex.rotation.y += 0.0012
      movingLight.intensity = 8 + audioEnergy * 12
      movingLight.position.x = Math.sin(t * 0.8) * 2.8
      movingLight.position.y = 2 + Math.cos(t * 0.6) * 1.6

      stars.rotation.y += 0.0006
      stars.material.opacity = 0.35 + audioEnergy * 0.45

      const alive = []
      clones.forEach((c, i) => {
        if(!c.alive) return
        const pull = new THREE.Vector3().copy(c.pos).multiplyScalar(-1).normalize().multiplyScalar(0.035 + audioEnergy * 0.05)
        const swirl = new THREE.Vector3(Math.sin(t * 1.2 + i), Math.sin(t * 0.9 + c.pulse), Math.cos(t * 1.4 + i * 0.5)).multiplyScalar(0.02 + audioEnergy * 0.03)
        c.vel.multiplyScalar(0.985)
        c.vel.add(pull)
        c.vel.add(swirl)
        if (dragging === c){
          c.vel.multiplyScalar(0.65)
        }
        c.pos.add(c.vel)
        const bob = Math.sin(t * 3.0 + c.pulse) * 0.02
        c.mesh.position.copy(c.pos)
        c.mesh.scale.setScalar(1 + audioEnergy * 0.4)
        c.sprite.position.copy(c.pos.clone().add(new THREE.Vector3(0, 0.05 + bob, 0)))
        c.sprite.material.opacity = 0.85 + audioEnergy * 0.15

        if (c.pos.length() < 0.42){
          c.alive = false
          c.mesh.visible = false
          c.sprite.visible = false
        } else {
          alive.push(c)
        }
      })

      if (alive.length !== clonesLeftRef.current){
        setClonesLeft(alive.length)
        clonesLeftRef.current = alive.length
        if (alive.length === 0 && !completedRef.current){
          completedRef.current = true
          setResource(resource)
          onDone?.()
        }
      }

      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }

    resize()
    raf = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(raf)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('resize', resize)
      renderer.dispose()
      bg.geometry.dispose(); bg.material.dispose()
      vortex.geometry.dispose(); vortex.material.dispose()
      stars.geometry.dispose(); starMat.dispose()
      clones.forEach(({ mesh, sprite }) => {
        mesh.geometry.dispose(); mesh.material.dispose(); sprite.material.dispose()
      })
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
      if (audioRef.current){ audioRef.current.pause() }
      if (sourceRef.current){ try { sourceRef.current.disconnect() } catch(e) { /* noop */ } }
      if (analyserRef.current){ try { analyserRef.current.disconnect() } catch(e) { /* noop */ } }
      if (audioCtxRef.current){ try { audioCtxRef.current.close() } catch(e) { /* noop */ } }
      if (audioUrlRef.current){ URL.revokeObjectURL(audioUrlRef.current); audioUrlRef.current = null }
    }
  }, [mood, sensation, intensity, onDone, setResource])

  function handleSave(){
    const canvas = containerRef.current?.querySelector('canvas')
    if(!canvas) return
    const data = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = data
    link.download = 'firemood-vjing.png'
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
