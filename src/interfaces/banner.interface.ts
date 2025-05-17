export interface ICreateBanner {
  descriptions: string;
  startDate: string;
  endDate: string;
  numberOrder: number;
  url?: string;
}

export interface IBanner {
  descriptions?: string;
  startDate?: string;
  endDate?: string;
  numberOrder?: number;
  url?: string;
}

export type IUpdateBanner = Partial<IBanner>;
