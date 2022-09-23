
export class OdpEvent {
    /**
     * Type of event (typically "fullstack")
     */
    public type: string;

    /**
     * Subcategory of the event type
     */
    public action: string;

    /**
     * Key-value map of user identifiers
     */
    public identifiers: Map<string, string>;

    /**
     * Event data in a key-value map
     */
    public data: Map<string, unknown>;

    /**
     * Event to be sent and stored in the Optimizely Data Platform
     * @param type Type of event (typically "fullstack")
     * @param action Subcategory of the event type
     * @param identifiers Key-value map of user identifiers
     * @param data Event data in a key-value map. Use wrapped primitives if needed
     */
    constructor(type: string, action: string, identifiers?: Map<string, string>, data?: Map<string, unknown>) {
        this.type = type;
        this.action = action;
        this.identifiers = identifiers ?? new Map<string, string>();
        this.data = data ?? new Map<string, unknown>();
    }
}