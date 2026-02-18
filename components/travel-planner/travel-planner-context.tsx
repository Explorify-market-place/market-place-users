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
        // Load and init WASM once
        (async () => {
            const wasmUrl = new URL(
                "@/lib/travel-planner/session/pkg/session_bg.wasm",
                import.meta.url
            );
            const wasmBytes = await fetch(wasmUrl).then((r) => r.arrayBuffer());
            initSync(wasmBytes);
            smRef.current = new SessionManager();
            setReady(true);
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
