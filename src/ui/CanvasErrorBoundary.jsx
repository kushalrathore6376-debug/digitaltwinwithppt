import { Component } from "react";

// A blank canvas gives no signal about what went wrong — WebGL creation
// failures and render-tree crashes both just leave an empty rectangle.
// This turns that into a visible, readable message instead.
export class CanvasErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="canvas-error">
          <p>The 3D view couldn't load in this browser.</p>
          <p className="canvas-error-detail">{String(this.state.error.message || this.state.error)}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
