declare module 'radix-tree' {
  export interface Data {
    path: string;
    data: any; //eslint-disable-line @typescript-eslint/no-explicit-any
  }

  export class Tree {
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    add: (path: string, data: any) => void;
    find: (path: string) => Data | undefined;
    log: () => void;
    remove: (path: string) => void;
    removeAll: () => void;
  }
}
