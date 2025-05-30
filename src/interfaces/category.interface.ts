export interface ICreateCategory {
  name: string;
  parentCategoryId?: string;
  subCategoryIds?: string[];
}

export interface IUpdateCategory {
  name?: string;
  parentCategoryId?: string;
  subCategoryIds?: string[];
}

export interface ICategory {
  id: string;
  name: string;
  parentCategoryId?: string;
  subCategories?: ICategory[];
}
