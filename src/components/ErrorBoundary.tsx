import { Component, type ReactNode } from 'react'
import { RotateCw, TriangleAlert } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Catches render-time errors in a view so a single failing screen shows a
 * readable message instead of blanking the whole app. The parent remounts this
 * (via `key`) whenever the active view changes, so navigating away clears it.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="grid min-h-[320px] place-items-center p-6">
        <div className="max-w-md rounded-xl border border-risk-critical/40 bg-navy-900 p-6 text-center">
          <TriangleAlert className="mx-auto size-7 text-risk-critical" aria-hidden />
          <p className="mt-3 t-base font-semibold text-steel-100">Something went wrong</p>
          <p className="mt-2 t-sm leading-relaxed text-steel-400">
            This view could not be displayed. The rest of the app is unaffected.
          </p>
          <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-navy-700 bg-navy-950 p-2 text-left t-xs text-steel-500">
            {this.state.error.message}
          </pre>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 t-base font-semibold text-white hover:bg-blue-500"
          >
            <RotateCw className="size-4" aria-hidden /> Try again
          </button>
        </div>
      </div>
    )
  }
}
