/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '3dmol' {
  const content: any;
  export default content;
  export const rasmolElementColors: any;
  export function createViewer(element: HTMLElement | null, config?: any): any;
  export function download(uri: string, viewer: any): any;
}

declare module 'smiles-drawer' {
  const SmilesDrawer: any;
  export default SmilesDrawer;
  export class Drawer {
    constructor(options?: any);
    draw(tree: any, target: string | HTMLCanvasElement, theme?: string, infoOnly?: boolean): void;
  }
  export function parse(smiles: string, success: (tree: any) => void, error?: (err: any) => void): void;
}

