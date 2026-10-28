import React from 'react'

interface Props {
  /** Que se rompio, para mostrarselo al usuario: "Terminal", "el escritorio". */
  label: string
  children: React.ReactNode
}

interface State {
  error: Error | null
}

/**
 * Sin esto, un throw dentro de una ventana desmonta TODO el escritorio a una
 * pagina en blanco. Los metodos del VFS tiran excepciones con soltura
 * ("No such file", "Path must be absolute"), asi que cada ventana va envuelta
 * por su cuenta: una app que explota se cae sola y el OS sigue en pie.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[SDesktop] ${this.props.label} crasheo:`, error, info.componentStack)
  }

  render() {
    const { error } = this.state

    if (!error) return this.props.children

    return (
      <div className="os-error-boundary" role="alert">
        <div className="os-error-boundary__title">{this.props.label} dejo de responder</div>
        <pre className="os-error-boundary__message">{error.message}</pre>
        <button
          type="button"
          className="os-btn os-btn--secondary os-btn--sm"
          onClick={() => this.setState({ error: null })}
        >
          Reintentar
        </button>
      </div>
    )
  }
}
