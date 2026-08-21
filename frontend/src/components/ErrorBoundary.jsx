import { Component } from 'react'

// This is the fix for the "blank page" bug: previously the app had no error
// boundary anywhere, so any render-time error (e.g. an API response shaped
// differently than expected) would unmount the ENTIRE React tree and leave a
// completely blank white page with nothing in the UI to explain why.
// Now, any crash below this boundary is caught, logged, and shown as a
// recoverable error card instead of a blank screen.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('UI crashed:', error, info?.componentStack)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-6 py-16">
          <div className="max-w-md w-full text-center bg-card border border-ink/10 rounded-[10px] p-8 shadow-card">
            <div className="w-12 h-12 rounded-full bg-rust/10 text-rust flex items-center justify-center mx-auto text-xl font-bold">!</div>
            <h2 className="font-display text-xl mt-4">Something went wrong</h2>
            <p className="mt-2 text-sm text-ink/60">
              {this.state.error?.message || 'An unexpected error occurred while rendering this page.'}
            </p>
            <div className="mt-6 flex gap-3 justify-center">
              <button className="btn-outline btn-sm" onClick={this.reset}>Try again</button>
              <button className="btn-gold btn-sm" onClick={() => { this.reset(); window.location.href = '/' }}>
                Go to homepage
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
