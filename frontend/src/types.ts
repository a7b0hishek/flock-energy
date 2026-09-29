export type InstallStatus = 'active' | 'inactive' | 'pending';
export type PhaseType = 'single-phase' | 'three-phase' | 'unknown';

export type HierarchyLevel = {
  name: string;
  code: string;
};

export type Hierarchy = {
  zone: HierarchyLevel;
  circle: HierarchyLevel;
  division: HierarchyLevel;
  subdivision: HierarchyLevel;
  substation: HierarchyLevel;
  feeder: HierarchyLevel;
  dt: HierarchyLevel;
};

export type Geo = {
  lat: number;
  lng: number;
};

export type Meter = {
  meterId: string;
  serialNo: string;
  make: string;
  phaseType: PhaseType;
  installStatus: InstallStatus;
  installType: string;
  build: string;
  dtCode: string;
  hierarchy: Hierarchy;
  geo: Geo;
};

export type MeterQuery = {
  status?: InstallStatus;
  make?: string;
  phaseType?: PhaseType;
  dtCode?: string;
};

export type MeterListResponse = {
  meta: {
    total: number;
    filters: Record<string, unknown>;
  };
  items: Meter[];
};

export type Transformer = {
  code: string;
  name: string;
  feeder: string;
  capacityKva: number;
};

export type TransformerQuery = {
  page?: number;
  limit?: number;
  search?: string;
  feeder?: string;
  capacityKva?: number;
};

export type TransformerListResponse = {
  meta: {
    page: number;
    limit: number;
    total: number;
    filters: Record<string, unknown>;
  };
  items: Transformer[];
};