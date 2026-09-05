type Handler = (payload: any) => void | Promise<void>;
type GlobalHandler = (event: string, payload: unknown) => void | Promise<void>;
export class EventBus {
  private readonly handlers = new Map<string, Set<Handler>>();
  private readonly global = new Set<GlobalHandler>();
  subscribe(event: string, handler: Handler): void { if (!this.handlers.has(event)) this.handlers.set(event, new Set()); this.handlers.get(event)!.add(handler); }
  /** हर event पर चलने वाला handler (M13 के event-driven rules इसी से जुड़ते हैं) */
  subscribeAll(handler: GlobalHandler): void { this.global.add(handler); }
  async publish(event: string, payload: unknown): Promise<void> {
    const hs = [...(this.handlers.get(event) ?? [])];
    await Promise.all([...hs.map((h) => h(payload)), ...[...this.global].map((g) => g(event, payload))]);
  }
}
export const eventBus = new EventBus();
