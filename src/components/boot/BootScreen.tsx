import React, { useEffect, useState } from 'react'
import { useDesktopStore } from '../../store/desktopStore'

interface BootScreenProps {
  onComplete: () => void
}

const BOOT_STAGES = [
  { text: 'Initializing system...', duration: 400 },
  { text: 'Loading kernel extensions...', duration: 350 },
  { text: 'Mounting filesystems...', duration: 400 },
  { text: 'Starting window server...', duration: 350 },
  { text: 'Loading desktop...', duration: 500 },
]

const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
  const [stage, setStage] = useState(0)
  const [progress, setProgress] = useState(0)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    let mounted = true
    let currentStage = 0
    let stageProgress = 0

    const runStages = async () => {
      while (currentStage < BOOT_STAGES.length && mounted) {
        const stageDuration = BOOT_STAGES[currentStage].duration
        const steps = 20
        const stepDuration = stageDuration / steps

        for (let i = 0; i < steps && mounted; i++) {
          await new Promise(r => setTimeout(r, stepDuration))
          stageProgress = ((currentStage + (i / steps)) / BOOT_STAGES.length) * 100
          setProgress(stageProgress)
        }

        if (mounted) {
          setStage(currentStage + 1)
          currentStage++
        }
      }

      if (mounted) {
        await new Promise(r => setTimeout(r, 300))
        setFadeOut(true)
        await new Promise(r => setTimeout(r, 500))
        onComplete()
      }
    }

    runStages()

    return () => {
      mounted = false
    }
  }, [onComplete])

  return (
    <div className={`os-boot ${fadeOut ? 'os-boot--fadeout' : ''}`}>
      <div className="os-boot__content">
        <div className="os-boot__logo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path
              d="M24 4L4 14v20l20 10 20-10V14L24 4z"
              fill="url(#logoGradient)"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1"
            />
            <path
              d="M24 14l-10 5v10l10 5 10-5V19l-10-5z"
              fill="rgba(255,255,255,0.15)"
            />
            <circle cx="24" cy="24" r="4" fill="white" opacity="0.9" />
            <defs>
              <linearGradient id="logoGradient" x1="4" y1="4" x2="44" y2="44">
                <stop offset="0%" stopColor="#30d158" />
                <stop offset="50%" stopColor="#007aff" />
                <stop offset="100%" stopColor="#5856d6" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1 className="os-boot__title">SDesktop</h1>

        <div className="os-boot__progress-container">
          <div className="os-boot__progress-bar">
            <div
              className="os-boot__progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="os-boot__stage">
            {stage < BOOT_STAGES.length
              ? BOOT_STAGES[stage].text
              : 'Ready'}
          </span>
        </div>

        <p className="os-boot__hint">
          Hold Shift during startup to skip boot sequence
        </p>
      </div>
    </div>
  )
}

export default BootScreen
