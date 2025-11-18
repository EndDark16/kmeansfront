export type Neighborhood = {
  id: number;
  x: number;
  y: number;
  cluster?: number;
};

export type Hospital = {
  id: number;
  x: number;
  y: number;
};

export type SimulationResponse = {
  neighborhoods: Neighborhood[];
  hospitals: Hospital[];
  assignments: number[];
  iterations: number;
  grid_size: number;
  inertia: number;
  overall_avg_distance: number;
  overall_max_distance: number;
  cluster_stats: ClusterStats[];
  distance_bins: DistanceBin[];
};

export type SimulationParams = {
  m: number;
  n: number;
  k: number;
};

export type PretrainedModel = {
  k: number;
  hospitals: number[][];
  description: string;
};

export type ClusterStats = {
  hospital_id: number;
  count: number;
  avg_distance: number;
  max_distance: number;
};

export type DistanceBin = {
  label: string;
  count: number;
};
