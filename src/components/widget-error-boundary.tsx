"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WidgetErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center p-4">
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-destructive">Widget error</p>
            <p className="text-xs text-muted-foreground">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
