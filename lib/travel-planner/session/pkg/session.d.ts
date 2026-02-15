/* tslint:disable */
/* eslint-disable */

export class SessionManager {
    free(): void;
    [Symbol.dispose](): void;
    add_reply(parts: string): void;
    add_reply_string(reply: string): void;
    ask(parts: string): void;
    ask_string(query: string): void;
    get_last_reply(): string;
    get_session(): string;
    last_parts(): string;
    constructor();
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_sessionmanager_free: (a: number, b: number) => void;
    readonly sessionmanager_add_reply: (a: number, b: number, c: number) => void;
    readonly sessionmanager_add_reply_string: (a: number, b: number, c: number) => void;
    readonly sessionmanager_ask: (a: number, b: number, c: number) => void;
    readonly sessionmanager_ask_string: (a: number, b: number, c: number) => void;
    readonly sessionmanager_get_last_reply: (a: number) => [number, number];
    readonly sessionmanager_get_session: (a: number) => [number, number];
    readonly sessionmanager_last_parts: (a: number) => [number, number];
    readonly sessionmanager_new: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
