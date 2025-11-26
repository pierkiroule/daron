import { useEffect, useState } from 'react'
import { useFM } from '../store'
import FireMoodCanvas from './FireMoodCanvas.jsx'
import ResourceCard from './ResourceCard.jsx'

export default function FireMoodScreen({ onRestart }){
  const { resource, setResource } = useFM()
  const [done, setDone] = useState(false)

  useEffect(() => {
    setResource(null)
  }, [setResource])

  return done
    ? <ResourceCard text={resource} onRestart={onRestart}/>
    : <FireMoodCanvas onDone={() => setDone(true)}/>
}
