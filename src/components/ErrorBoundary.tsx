import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In a real deployment this is where we would forward to Sentry / logging.
    console.error('Unhandled UI error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100">
          <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-8 max-w-md text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle size={24} />
            </div>
            <h1 className="text-lg font-bold text-navy">Something went wrong</h1>
            <p className="text-sm text-slate-500 mt-2">
              The application hit an unexpected error. Your data is saved locally and is safe.
            </p>
            <pre className="mt-4 text-left text-xs bg-slate-50 rounded-lg p-3 overflow-auto text-slate-500">
              {this.state.error.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-700"
            >
              Reload application
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
