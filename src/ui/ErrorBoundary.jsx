import { Component } from 'react'
import { ErrorState } from './primitives'

export class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  componentDidUpdate(prev) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null }) }
  render() {
    if (!this.state.error) return this.props.children
    return <div className="page"><ErrorState onRetry={() => this.setState({ error: null })} /></div>
  }
}
