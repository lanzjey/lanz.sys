import { Component } from "react";

export default class SceneBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return this.props.fallback || null;
    return this.props.children;
  }
}
