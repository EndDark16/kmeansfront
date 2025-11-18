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
