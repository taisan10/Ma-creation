import { useEffect, useRef } from 'react'
import {
  watchGetDisplayMedia,
  detectIncognito,
  watchScreenshotShortcuts,
} from './recordingDetection'

/**
 * Mounts all detection signals for as long as the calling component is
 * mounted (i.e. for as long as a protected video page is open), and calls
 * onDetected(reason) the first time ANY signal fires.
 */
export function useRecordingGuard(onDetected, { enabled = true } = {}) {
  const firedRef = useRef(false)

  useEffect(() => {
    if (!enabled) return

    function fire(reason) {
      if (firedRef.current) return
      firedRef.current = true
      onDetected(reason)
    }

    // Signal 1: Incognito check
    detectIncognito().then(isIncognito => {
      if (isIncognito) fire('incognito_suspected')
    })

    // Signal 2: Browser getDisplayMedia hook
    const unhookDisplayMedia = watchGetDisplayMedia(reason => fire(reason))

    // Signal 3: Screenshot & Screen Record shortcut interception
    const unhookShortcuts = watchScreenshotShortcuts(reason => fire(reason))

    return () => {
      unhookDisplayMedia()
      unhookShortcuts()
    }
  }, [enabled, onDetected])
}