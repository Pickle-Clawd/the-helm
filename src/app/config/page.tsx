"use client";

import { useState, useEffect } from "react";
import { useGateway } from "@/lib/gateway-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ConfigPage() {
  const { rawConfig, send, refreshConfig } = useGateway();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditValue(rawConfig);
  }, [rawConfig]);

  const validateJson = (val: string): boolean => {
    try {
      JSON.parse(val);
      setError("");
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateJson(editValue)) return;
    setSaving(true);
    try {
      const parsed = JSON.parse(editValue);
      await send("config.patch", { config: parsed });
      toast.success("Configuration saved");
      setEditing(false);
      refreshConfig();
    } catch (e) {
      toast.error(`Failed to save: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(editValue);
      setEditValue(JSON.stringify(parsed, null, 2));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuration</h1>
          <p className="text-muted-foreground mt-1">View and edit gateway configuration</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshConfig}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Gateway Config</CardTitle>
            <CardDescription>
              {editing ? "Edit mode — make changes and save" : "Current gateway configuration"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Badge variant="outline" className="bg-warning/15 text-warning border-warning/25">
                  Editing
                </Badge>
                <Button variant="outline" size="sm" onClick={handleFormat}>
                  Format
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(false);
                    setEditValue(rawConfig);
                    setError("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || !!error}
                  className="bg-gradient-to-r from-gradient-orange to-gradient-pink text-white hover:opacity-90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <Textarea
              className="font-mono text-sm min-h-[500px] bg-muted/30 border-border/50"
              value={editValue}
              onChange={(e) => {
                setEditValue(e.target.value);
                if (error) validateJson(e.target.value);
              }}
              spellCheck={false}
            />
          ) : (
            <pre className="font-mono text-sm p-4 rounded-lg bg-muted/30 border border-border/30 overflow-auto min-h-[500px] whitespace-pre-wrap break-all">
              {rawConfig || "Loading..."}
            </pre>
          )}

          {error && (
            <div className="flex items-start gap-2 text-destructive text-sm p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Invalid JSON</p>
                <p className="text-xs mt-1 opacity-80">{error}</p>
              </div>
            </div>
          )}

          {!editing && !error && rawConfig !== "{}" && (
            <div className="flex items-center gap-2 text-success text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Configuration loaded successfully</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
