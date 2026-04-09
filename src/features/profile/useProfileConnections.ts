"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import type {
  ClerkConnectionSuggestion,
  ConnectionsPayload,
  SocialConnection,
  SocialProvider,
} from "@/features/profile/profile-types";

function normalizeConnectionsErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.toLowerCase();

  if (
    message.includes("json.parse") ||
    message.includes("unexpected end of data") ||
    message.includes("unexpected token") ||
    message.includes("failed to fetch")
  ) {
    return "Profile sync is temporarily unavailable. Refresh once and try again.";
  }

  return error.message || fallback;
}

async function readConnectionsPayload(response: Response, fallbackError: string) {
  const raw = await response.text();

  if (!raw.trim()) {
    if (!response.ok) {
      throw new Error(fallbackError);
    }

    return {} as ConnectionsPayload;
  }

  try {
    return JSON.parse(raw) as ConnectionsPayload;
  } catch {
    throw new Error(fallbackError);
  }
}

export function useProfileConnections() {
  const { isLoaded, isSignedIn } = useAuth();
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [clerkSuggestions, setClerkSuggestions] = useState<ClerkConnectionSuggestion[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);
  const [activeAction, setActiveAction] = useState<`${"connect" | "disconnect" | "refresh"}-${SocialProvider}` | "">("");
  const [panelError, setPanelError] = useState("");
  const [setupRequired, setSetupRequired] = useState(false);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      setConnections([]);
      setClerkSuggestions([]);
      setIsLoadingConnections(false);
      setPanelError("");
      setSetupRequired(false);
      return;
    }

    let cancelled = false;

    async function loadConnections() {
      setIsLoadingConnections(true);
      setPanelError("");

      try {
        const response = await fetch("/api/profile/connections", {
          cache: "no-store",
        });
        const payload = await readConnectionsPayload(
          response,
          "Profile sync is temporarily unavailable. Refresh once and try again.",
        );

        if (cancelled) {
          return;
        }

        setSetupRequired(Boolean(payload.setupRequired));
        setConnections(payload.connections ?? []);
        setClerkSuggestions(payload.clerkSuggestions ?? []);

        if (!response.ok && !payload.setupRequired) {
          throw new Error(payload.error || "Unable to load profile connections.");
        }
      } catch (error) {
        if (!cancelled) {
          setPanelError(normalizeConnectionsErrorMessage(error, "Unable to load profile connections."));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingConnections(false);
        }
      }
    }

    loadConnections();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  async function connectConnection(
    payload: Record<string, string | boolean>,
    actionKey: typeof activeAction,
  ) {
    setActiveAction(actionKey);
    setPanelError("");

    try {
      const response = await fetch("/api/profile/connections", {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const nextPayload = await readConnectionsPayload(
        response,
        "Unable to save your social connection right now.",
      );

      setSetupRequired(Boolean(nextPayload.setupRequired));
      setConnections(nextPayload.connections ?? []);
      setClerkSuggestions(nextPayload.clerkSuggestions ?? []);

      if (!response.ok) {
        throw new Error(nextPayload.error || "Unable to save social connection.");
      }
    } catch (error) {
      setPanelError(normalizeConnectionsErrorMessage(error, "Unable to save social connection."));
    } finally {
      setActiveAction("");
    }
  }

  async function disconnectConnection(provider: SocialProvider) {
    setActiveAction(`disconnect-${provider}`);
    setPanelError("");

    try {
      const response = await fetch("/api/profile/connections", {
        body: JSON.stringify({ provider }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "DELETE",
      });
      const nextPayload = await readConnectionsPayload(
        response,
        "Unable to remove your social connection right now.",
      );

      setSetupRequired(Boolean(nextPayload.setupRequired));
      setConnections(nextPayload.connections ?? []);
      setClerkSuggestions(nextPayload.clerkSuggestions ?? []);

      if (!response.ok) {
        throw new Error(nextPayload.error || "Unable to remove social connection.");
      }
    } catch (error) {
      setPanelError(normalizeConnectionsErrorMessage(error, "Unable to remove social connection."));
    } finally {
      setActiveAction("");
    }
  }

  return {
    activeAction,
    clerkSuggestions,
    connectConnection,
    connections,
    disconnectConnection,
    isLoadingConnections,
    isSignedIn,
    panelError,
    setupRequired,
  };
}
