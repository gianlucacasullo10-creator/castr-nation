import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
}

// Detects Vite/Rollup dynamic-import failures that happen when a new
// deployment invalidates previously cached JS chunks.
function isChunkLoadError(error: Error): boolean {
  const msg = error?.message || "";
  return (
    error?.name === "ChunkLoadError" ||
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("Loading chunk") ||
    msg.includes("dynamically imported module")
  );
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, isChunkError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, isChunkError: isChunkLoadError(error) };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("ErrorBoundary caught:", error.message, info.componentStack);
  }

  handleReset = () => {
    // For chunk errors a hard reload fetches fresh assets from the new deployment.
    // For other errors, just reset so the component gets another render attempt.
    if (this.state.isChunkError) {
      window.location.reload();
    } else {
      this.setState({ hasError: false, error: null, isChunkError: false });
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center space-y-4">
          <p className="text-4xl">🎣</p>
          <h2 className="text-xl font-black italic uppercase text-primary tracking-tight">
            {this.state.isChunkError ? "App Updated" : "Something went wrong"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {this.state.isChunkError
              ? "A new version of the app is available. Tap below to load it."
              : "An unexpected error occurred on this page."}
          </p>
          <Button onClick={this.handleReset} className="font-black uppercase text-xs">
            {this.state.isChunkError ? "Load Latest Version" : "Try Again"}
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
