"use client";

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    useCallback,
    type ReactNode,
} from "react";
import { SessionManager, initSync } from "@/lib/travel-planner/session/pkg/session";
import {
    type TripInput,
    type PlanState,
    type ChatMessage,
    emptyPlanState,
} from "./plan-types";

interface TravelPlannerCtx {
    sessionManager: SessionManager | null;
    tokenMapRef: React.MutableRefObject<string[]>;
    ready: boolean;
    tripInput: TripInput | null;
    setTripInput: (input: TripInput) => void;
    plan: PlanState;
    setPlan: React.Dispatch<React.SetStateAction<PlanState>>;
    messages: ChatMessage[];
    addMessage: (msg: ChatMessage) => void;
}

const Ctx = createContext<TravelPlannerCtx>(null!);

export function useTravelPlanner() {
    return useContext(Ctx);
}

export function TravelPlannerProvider({ children }: { children: ReactNode }) {
    const [ready, setReady] = useState(false);
    const smRef = useRef<SessionManager | null>(null);
    const tokenMapRef = useRef<string[]>([]);

    const [tripInput, setTripInput] = useState<TripInput | null>(null);
    const [plan, setPlan] = useState<PlanState>(emptyPlanState());
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const addMessage = useCallback((msg: ChatMessage) => {
        setMessages((prev) => [...prev, msg]);
    }, []);

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
            value={{
                sessionManager: smRef.current,
                tokenMapRef,
                ready,
                tripInput,
                setTripInput,
                plan,
                setPlan,
                messages,
                addMessage,
            }}
        >
            {children}
        </Ctx.Provider>
    );
}
