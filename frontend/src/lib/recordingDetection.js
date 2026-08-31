// ============================================================
// Best-effort detection signals. NONE of these can see a phone camera
// filming the screen -- that's outside what any browser can ever observe,
// and is intentionally out of scope (agreed earlier). What these DO catch:
//   1. Browser-extension screen recorders that call getDisplayMedia()
//   2. Known virtual-camera/virtual-audio devices installed by recording
//      software (OBS, ManyCam, Camtasia, etc.)
//   3. DevTools being open (sometimes paired with inspecting the <video>
//      element to grab its source)
//   4. Incognito / private browsing mode
// ============================================================

// --- Signal 1: getDisplayMedia hook -----------------------------------
// Some browser-extension recorders call navigator.mediaDevices.getDisplayMedia()
// from the SAME page context (rather than an isolated extension world) to
// start capturing. We temporarily wrap that function so we notice if
// anything calls it while our video is on screen. This does NOT catch
// extensions that capture via their own isolated background/content-script
// context without ever touching the page's navigator object -- that's a
// real limitation, not a bug in this code.
export function watchGetDisplayMedia(onDetected) {
  const original = navigator.mediaDevices?.getDisplayMedia
  if (!original) return () => {} // API not supported in this browser, nothing to hook

  navigator.mediaDevices.getDisplayMedia = function (...args) {
    onDetected('recording_suspected')
    return original.apply(navigator.mediaDevices, args)
  }

  // Cleanup function -- restores the original so we don't leave the
  // browser's API permanently patched after the video page unmounts.
  return () => {
    navigator.mediaDevices.getDisplayMedia = original
  }
}

// --- Signal 2: known recorder virtual devices --------------------------
// Software like OBS, ManyCam, Camtasia, and virtual-audio-cable tools
// install a virtual camera/microphone that shows up in enumerateDevices().
// Device LABELS are only populated once mic/camera permission has been
// granted at least once in this browser -- if not, this check silently
// finds nothing (we do not force a permission prompt just for this, since
// that would be intrusive on every single video page load).
const KNOWN_RECORDER_DEVICE_PATTERNS = [
  /obs virtual camera/i, /obs-camera/i, /manycam/i, /camtasia/i,
  /streamlabs/i, /xsplit/i, /snap camera/i, /virtual audio cable/i,
  /cable input/i, /cable output/i, /vb-audio/i, /ndi video/i
]

export async function checkKnownRecorderDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) return false
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.some(d => d.label && KNOWN_RECORDER_DEVICE_PATTERNS.some(pattern => pattern.test(d.label)))
  } catch {
    return false
  }
}

// --- Signal 3: DevTools open --------------------------------------------
// Classic heuristic: when DevTools is docked, the visible viewport shrinks
// relative to the outer window by a large, consistent margin. Not 100%
// reliable (doesn't catch undocked DevTools windows), which is exactly why
// this is only ONE signal among several, not used alone.
export function isDevToolsLikelyOpen() {
  const threshold = 160
  const widthDiff = window.outerWidth - window.innerWidth
  const heightDiff = window.outerHeight - window.innerHeight
  return widthDiff > threshold || heightDiff > threshold
}

// --- Signal 4: Incognito / private browsing -----------------------------
// Chrome/Edge: in Incognito, navigator.storage.estimate() reports a much
// smaller quota than normal browsing (historically capped low, vs. many GB
// normally). Firefox private mode: IndexedDB is often unavailable or
// throws. We try both and treat either as a positive signal.
export async function detectIncognito() {
  try {
    if (navigator.storage?.estimate) {
      const { quota } = await navigator.storage.estimate()
      // Regular browsing quota is typically several GB+; incognito quota is
      // usually under ~200MB. This threshold is a heuristic, not a hard law.
      if (typeof quota === 'number' && quota < 200 * 1024 * 1024) return true
    }
  } catch {
    // estimate() itself throwing is also a (weaker) private-mode signal in some browsers
  }

  try {
    await new Promise((resolve, reject) => {
      const req = indexedDB.open('__incognito_probe__')
      req.onerror = () => reject(req.error)
      req.onsuccess = () => { req.result.close(); resolve() }
    })
    return false
  } catch {
    return true // IndexedDB unavailable -- strong private-mode signal (older Firefox)
  }
}