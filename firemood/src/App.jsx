import { useState } from 'react'
import { useFM } from './store'
import MoodScreen from './components/MoodScreen.jsx'
import SensationScreen from './components/SensationScreen.jsx'
import IntensityScreen from './components/IntensityScreen.jsx'
import FireMoodScreen from './components/FireMoodScreen.jsx'

export default function App(){
  const [step, setStep] = useState(0)
  const { intensity } = useFM()

  return (
    <>
      {step===0 && <MoodScreen onNext={()=>setStep(1)} />}
      {step===1 && <SensationScreen onBack={()=>setStep(0)} onNext={()=>setStep(2)} />}
      {step===2 && <IntensityScreen onBack={()=>setStep(1)} onNext={()=>setStep(3)} />}
      {step===3 && <FireMoodScreen onRestart={()=>setStep(0)} intensity={intensity} />}
    </>
  )
}
