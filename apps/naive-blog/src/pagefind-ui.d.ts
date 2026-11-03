declare module "@pagefind/default-ui" {
  export class PagefindUI {
    constructor(options: {
      element: HTMLElement;
      bundlePath?: string;
      baseUrl?: string;
      showImages?: boolean;
      showSubResults?: boolean;
      autofocus?: boolean;
      processTerm?: (term: string) => string;
    });
    triggerSearch(term: string): void;
    destroy(): void;
  }
}
