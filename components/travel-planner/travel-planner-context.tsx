"use client";

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { SessionManager, initSync } from "@/lib/travel-planner/session/pkg/session";

interface TravelPlannerCtx {
    sessionManager: SessionManager | null;
    tokenMapRef: React.MutableRefObject<string[]>;
    ready: boolean;
}

const Ctx = createContext<TravelPlannerCtx>(null!);

export function useTravelPlanner() {
    return useContext(Ctx);
}

export function TravelPlannerProvider({ children }: { children: ReactNode }) {
    const [ready, setReady] = useState(false);
    const smRef = useRef<SessionManager | null>(null);
    const tokenMapRef = useRef<string[]>([]);

    useEffect(() => {
        // Load and init WASM once — served from public/ for production compatibility
        (async () => {
            try {
                const wasmBytes = await fetch("/session_bg.wasm").then((r) => {
                    if (!r.ok) throw new Error(`WASM fetch failed: ${r.status}`);
                    return r.arrayBuffer();
                });
                initSync({ module: wasmBytes });
                smRef.current = new SessionManager();
                setReady(true);
            } catch (e) {
                console.error("Failed to init travel planner WASM:", e);
            }
        })();
    }, []);

    return (
        <Ctx.Provider
            value={{ sessionManager: smRef.current, tokenMapRef, ready }}
        >
            {children}
        </Ctx.Provider>
    );
}
