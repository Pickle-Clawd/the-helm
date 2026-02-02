"use client";

import { useState } from "react";
import { useGateway } from "@/lib/gateway-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Loader2, AlertCircle } from "lucide-react";

export function ConnectionSetup() {
  const { setConfig, status } = useGateway();
  const [url, setUrl] = useState("ws://localhost:18789");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");

  const handleConnect = () => {
    if (!url.trim()) {
      setError("Gateway URL is required");
      return;
    }
    if (!token.trim()) {
      setError("Token is required");
      return;
    }
    setError("");
    setConfig({ url: url.trim(), token: token.trim() });
  };

  const isConnecting = status === "connecting";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="gradient-bg" />
      <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-gradient-orange to-gradient-pink flex items-center justify-center">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">ClawPilot</CardTitle>
            <CardDescription className="mt-2">
              Connect to your OpenClaw gateway to get started
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Gateway URL</Label>
            <Input
              id="url"
              placeholder="ws://100.x.x.x:18789"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConnect()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="token">Token</Label>
            <Input
              id="token"
              type="password"
              placeholder="Your gateway token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConnect()}
            />
          </div>
          {(error || status === "error") && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error || "Failed to connect. Check URL and token."}</span>
            </div>
          )}
          <Button
            className="w-full bg-gradient-to-r from-gradient-orange to-gradient-pink text-white hover:opacity-90 transition-opacity"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
