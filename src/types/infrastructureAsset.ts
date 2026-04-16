export type AssetCondition = 'baik' | 'rusak ringan' | 'rusak berat';

export interface AssetLocation {
  lat: number;
  lng: number;
}

export interface InfrastructureAsset {
  id: string;
  name: string;
  category: string;
  location: AssetLocation;
  condition: AssetCondition;
  year_built: number;
  photo_url: string | null;
}
