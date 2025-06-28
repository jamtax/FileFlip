import React, { Component, ReactNode } from 'react';
import './ErrorBoundary.css';

interface State {
  hasError: boolean;
}

interface Props {
  children: ReactNode;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <h1 className="error-boundary-message">Something went wrong.</h1>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
