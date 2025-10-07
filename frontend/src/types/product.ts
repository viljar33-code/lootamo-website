export interface Product {
  id: string;
  name: string;
  slug: string;
  type?: string;
  qty?: number;
  min_price?: number;
  retail_min_price?: number;
  retail_min_base_price?: number;
  available_to_buy: boolean;
  thumbnail?: string;
  small_image?: string;
  cover_image?: string;
  is_active: boolean;
  last_synced: string;
  updated_at: string;
  release_date?: string;
  region?: string;
  developer?: string;
  publisher?: string;
  platform?: string;
  price_limit?: {
    max?: number;
    min?: number;
  };
  categories: Category[];
  images: string[];
  videos: ProductVideo[];
  restrictions?: ProductRestrictions;
  requirements?: ProductRequirements;
}

export interface Category {
  id: string;
  name: string;
}

export interface ProductImage {
  id: number;
  url: string;
}

export interface ProductVideo {
  url: string;
  video_type?: string;
}

export interface ProductRestrictions {
  pegi_violence: boolean;
  pegi_profanity: boolean;
  pegi_discrimination: boolean;
  pegi_drugs: boolean;
  pegi_fear: boolean;
  pegi_gambling: boolean;
  pegi_online: boolean;
  pegi_sex: boolean;
}

export interface ProductRequirements {
  minimal?: {
    reqprocessor?: string;
    reqgraphics?: string;
    reqmemory?: string;
    reqdiskspace?: string;
    reqsystem?: string;
    reqother?: string;
  };
  recommended?: {
    reqprocessor?: string;
    reqgraphics?: string;
    reqmemory?: string;
    reqdiskspace?: string;
    reqsystem?: string;
    reqother?: string;
  };
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}

export interface ProductsParams {
  skip?: number;
  limit?: number;
  search?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
}
