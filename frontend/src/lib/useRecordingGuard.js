import { useEffect, useRef } from 'react'
import {
  watchGetDisplayMedia,
  checkKnownRecorderDevices,
  isDevToolsLikelyOpen,
  detectIncognito
} from './recordingDetection'

const DEVICE_POLL_INTERVAL_MS = 5000
const DEVTOOLS_POLL_INTERVAL_MS = 2000
// DevTools alone is a weak signal (lots of legitimate reasons to have it
// open), so it only fires after being seen open for several consecutive
// polls in a row -- reduces false positives from a brief accidental toggle.
const DEVTOOLS_CONSECUTIVE_HITS_REQUIRED = 3

/**
 * Mounts all detection signals for as long as the calling component is
 * mounted (i.e. for as long as a protected video page is open), and calls
 * onDetected(reason) the first time ANY signal fires. Only fires once per
 * mount -- firedRef prevents spamming the callback repeatedly.
 *
 * reason is one of: 'recording_suspected' | 'incognito_suspected'
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

    // Signal 4 runs once, immediately, before playback even has a chance to
    // start -- matches the requirement "if incognito mode detected, unmount
    // and stop the playback button before watching."
    detectIncognito().then(isIncognito => {
      if (isIncognito) fire('incognito_suspected')
    })

    // Signal 1: hook getDisplayMedia for the lifetime of this page
    const unhookDisplayMedia = watchGetDisplayMedia(reason => fire(reason))

    // Signal 2: poll for known recorder virtual devices
    const deviceInterval = setInterval(() => {
      checkKnownRecorderDevices().then(found => {
        if (found) fire('recording_suspected')
      })
    }, DEVICE_POLL_INTERVAL_MS)

    // Signal 3: poll for DevTools, require several consecutive hits
    let devToolsConsecutiveHits = 0
    const devToolsInterval = setInterval(() => {
      if (isDevToolsLikelyOpen()) {
        devToolsConsecutiveHits += 1
        if (devToolsConsecutiveHits >= DEVTOOLS_CONSECUTIVE_HITS_REQUIRED) {
          fire('recording_suspected')
        }
      } else {
        devToolsConsecutiveHits = 0
      }
    }, DEVTOOLS_POLL_INTERVAL_MS)

    return () => {
      unhookDisplayMedia()
      clearInterval(deviceInterval)
      clearInterval(devToolsInterval)
    }
  }, [enabled, onDetected])
}