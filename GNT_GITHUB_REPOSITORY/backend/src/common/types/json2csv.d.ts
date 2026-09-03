// ============================================================================
// json2csv की हल्की ambient typing (टास्क #025 B2)
// @types/json2csv नहीं है और network बंद है — न्यूनतम declaration (जितना use है)
// ============================================================================

declare module 'json2csv' {
  export interface ParserOptions {
    fields?: string[];
    header?: boolean;
  }
  export class Parser<T = Record<string, unknown>> {
    constructor(options?: ParserOptions);
    parse(data: T[]): string;
  }
}
