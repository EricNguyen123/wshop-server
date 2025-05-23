export enum CartStatusEnum {
  ADD_CART = 0,
  BOUGHT = 1,
  ORDER = 2,
  SHIPPING = 3,
  COMPLETE = 4,
}

export enum OrderStatusEnum {
  NOT_ACTIVE = 0,
  ACTIVE = 1,
  COMPLETE = 2,
}

export enum ShippingStatusEnum {
  WAITING_FOR_PICK_UP = 0,
  WAITING_TO_SHIP = 1,
  SHIPPING = 2,
  COMPLETE = 3,
}

export enum SizeTypesEnum {
  MALE = 0,
  FEMALE = 1,
}

export enum BusinessTypeOtpEnum {
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  RESTORE = 'RESTORE',
}

export enum RecordTypeFileEnum {
  MEDIA = 'MEDIA',
}

export enum ResourceMediaTypeEnum {
  USER = 'USER',
  BANNER = 'BANNER',
  PRODUCT = 'PRODUCT',
}

export enum MediaTypeEnum {
  USER_AVATAR = 'USER_AVATAR',
  BANNER_IMAGE = 'BANNER_IMAGE',
  PRODUCT_IMAGE = 'PRODUCT_IMAGE',
}

export enum StatusProductEnum {
  DRAFT = 0,
  PENDING = 1,
  ACTIVE = 2,
  INACTIVE = 3,
  OUT_OF_STOCK = 4,
  DISCONTINUED = 5,
}
