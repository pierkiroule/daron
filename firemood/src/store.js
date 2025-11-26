import { create } from 'zustand'

export const useFM = create((set) => ({
  mood: '😔',
  sensation: 'lourdeur',
  intensity: 5,
  resource: null,
  setMood: (mood) => set({ mood }),
  setSensation: (sensation) => set({ sensation }),
  setIntensity: (intensity) => set({ intensity }),
  setResource: (resource) => set({ resource }),
}))
