const MESSAGES = {
  recording_suspected: {
    title: 'Screen recording detected',
    body: 'We detected activity consistent with screen recording software. Please close or disable your screen recorder, then reload this page to continue watching.'
  },
  incognito_suspected: {
    title: 'Private / Incognito browsing detected',
    body: 'This video can\'t be played in a private/incognito browser window. Please reopen this page in a normal browser window to continue watching.'
  }
}

export default function RecordingDetectedModal({ reason, onReload }) {
  const copy = MESSAGES[reason] || MESSAGES.recording_suspected
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="card max-w-md w-full text-center py-8 px-6">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rust/10 text-rust text-2xl">
          !
        </div>
        <h2 className="font-display text-xl">{copy.title}</h2>
        <p className="mt-2 text-sm text-ink/60">{copy.body}</p>
        <div className="mt-6 flex justify-center">
          <button type="button" onClick={onReload} className="btn-gold btn-sm">
            I've stopped it — Reload
          </button>
        </div>
      </div>
    </div>
  )
}