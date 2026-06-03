import { useEffect, useState } from 'react'
import { FiTruck } from 'react-icons/fi'

export default function SplashScreen({ onFinish }) {
  const [progress, setProgress] = useState(0)
  const [fade, setFade] = useState(false)

  useEffect(() => {
    // Animate the progress bar over 2.7s, then trigger fade out
    const duration = 2700
    const intervalTime = 30
    const step = 100 / (duration / intervalTime)

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          return 100
        }
        return prev + step
      })
    }, intervalTime)

    // Trigger fade-out effect slightly before redirection (at 2.8s)
    const fadeTimer = setTimeout(() => {
      setFade(true)
    }, 2800)

    // Call onFinish at 3 seconds
    const finishTimer = setTimeout(() => {
      onFinish()
    }, 3100)

    return () => {
      clearInterval(timer)
      clearTimeout(fadeTimer)
      clearTimeout(finishTimer)
    }
  }, [onFinish])

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white transition-opacity duration-500 ease-out ${fade ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Main logo & branding container */}
      <div className="relative flex flex-col items-center text-center max-w-md px-6">
        
        {/* Animated truck icon with pulse rings */}
        <div className="relative mb-8 flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/35 animate-ping opacity-75"></div>
          <div className="absolute w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/20 animate-pulse"></div>
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 border border-slate-800 shadow-2xl text-emerald-400">
            <FiTruck className="h-8 w-8 animate-bounce" style={{ animationDuration: '2s' }} />
          </div>
        </div>

        {/* Brand Text */}
        <p className="text-xs uppercase tracking-[0.4em] text-emerald-400/80 font-bold mb-2">Société ATL</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          ATL FLOTTE
        </h1>
        <p className="mt-3 text-slate-400 text-sm font-medium tracking-wide">
          Système intelligent de gestion logistique
        </p>

        {/* Sleek Progress Bar */}
        <div className="w-64 h-1 bg-slate-900/90 rounded-full mt-10 overflow-hidden border border-slate-800/40">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Running status text */}
        <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-slate-500 font-semibold">
          Démarrage des systèmes de contrôle...
        </p>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-xs text-slate-600 tracking-wider">ATL FLOTTE © {new Date().getFullYear()} • Tous droits réservés</p>
      </div>
    </div>
  )
}
