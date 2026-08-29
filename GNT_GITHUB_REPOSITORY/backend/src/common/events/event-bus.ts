type Handler = (payload: any) => void | Promise<void>;
export class EventBus {
  private readonly handlers = new Map<string, Set<Handler>>();
  subscribe(event: string, handler: Handler): void { if (!this.handlers.has(event)) this.handlers.set(event, new Set()); this.handlers.get(event)!.add(handler); }
  async publish(event: string, payload: unknown): Promise<void> { const hs = [...(this.handlers.get(event) ?? [])]; await Promise.all(hs.map(h => h(payload))); }
}
export const eventBus = new EventBus();
