export interface ICreateProduct {
  name: string;
  code: string;
  price: number;
  quantity: number;
  quantityAlert: number;
  orderUnit: number;
  description: string;
  status: number;
  multiplicationRate: number;
  discount: number;
}

export interface IUpdateProduct extends Partial<ICreateProduct> {
  mediaIds?: string[];
}
