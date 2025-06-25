export interface ICreateProductType {
  productId: string;
  colorTypeId: string;
  sizeTypeId: string;
  quantity: number;
}

export interface IGetProductType {
  id: string;
  quantity: number;
  color?: [
    {
      id: string;
      colorCode: string;
      name: string;
    },
  ];
  size?: [
    {
      id: string;
      sizeCode: string;
      sizeType: string;
      name: string;
    },
  ];
}
