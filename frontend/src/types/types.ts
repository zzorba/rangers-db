export interface Aspect {
  name: string;
  short_name: string;
  color: string;
}

export type AspectMap = {
  [code: string]: Aspect | undefined;
}