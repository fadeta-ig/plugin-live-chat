interface JQueryWrapper {
    trigger(eventName: string, extraParameters?: unknown[]): unknown;
}

type JQueryFactory = (target: Element) => JQueryWrapper;

interface Window {
    /** Injected by wp_localize_script; validated at runtime before use. */
    aiWooSaConfig?: unknown;
    jQuery?: JQueryFactory;
}
