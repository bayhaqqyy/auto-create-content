"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Channel } from "../lib/types";
import { api } from "./api";

type Ctx = { channels: Channel[] | null; current: Channel | null; setCurrent: (id: string) => void; reload: () => Promise<void>; error: string };
const C = createContext<Ctx>({ channels: null, current: null, setCurrent: () => {}, reload: async () => {}, error: "" });
const KEY = "kk-channel";

export function ChannelProvider({ children }: { children: React.ReactNode }) {
  const [channels, setChannels] = useState<Channel[] | null>(null);
  const [id, setId] = useState<string>("");
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    try {
      const d = await api<{ channels: Channel[] }>("/api/channels");
      setChannels(d.channels);
      setError("");
    } catch (e: any) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    try {
      setId(localStorage.getItem(KEY) || "");
    } catch {}
    reload();
  }, [reload]);
  const setCurrent = (v: string) => {
    setId(v);
    try {
      localStorage.setItem(KEY, v);
    } catch {}
  };
  const current = channels?.find((c) => c.id === id) || channels?.[0] || null;
  return <C.Provider value={{ channels, current, setCurrent, reload, error }}>{children}</C.Provider>;
}

export const useChannel = () => useContext(C);
