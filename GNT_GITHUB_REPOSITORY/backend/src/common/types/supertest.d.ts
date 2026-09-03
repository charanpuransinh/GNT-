// ============================================================================
// supertest की हल्की ambient typing (टास्क #024 — F1)
// @types/supertest install नहीं है और network बंद है — इसलिए यह न्यूनतम typed
// declaration (जो कुछ tests इस्तेमाल करते हैं, वही surface)। body: any सिर्फ़
// यहाँ — test जवाब का shape runtime पर ही मालूम रहता है (कहीं और कोई any नहीं)।
// ============================================================================

declare module 'supertest' {
  import type { IncomingMessage } from 'node:http';

  interface Response extends IncomingMessage {
    status: number;
    // test जवाब का shape API पर निर्भर करता है — इस declaration तक सीमित सुविधा
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: any;
    text: string;
  }

  interface Test {
    expect(status: number): Test;
    set(field: string, value: string): Test;
    set(fields: Record<string, string>): Test;
    send(body?: unknown): Test;
    query(query: Record<string, unknown>): Test;
    field(name: string, value: string): Test;
    attach(name: string, path: string): Test;
    auth(user: string, pass: string): Test;
    timeout(ms: number): Test;
    then<TResult1 = Response, TResult2 = never>(
      onfulfilled?: ((value: Response) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): PromiseLike<TResult1 | TResult2>;
    catch<TResult = never>(
      onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
    ): PromiseLike<Response | TResult>;
  }

  interface SuperTest extends Test {
    get(url: string): Test;
    post(url: string): Test;
    put(url: string): Test;
    patch(url: string): Test;
    delete(url: string): Test;
    head(url: string): Test;
    options(url: string): Test;
  }

  function supertest(app: unknown): SuperTest;
  export = supertest;
}
