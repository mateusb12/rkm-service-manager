export type RoadmapFeatureState = 'Concluída' | 'Em andamento' | 'Planejada';

export type RoadmapFeature = {
  id: string;
  title: string;
  acceptance: string;
  state: RoadmapFeatureState;
  completedAcceptanceCriteria: number[];
  branch: string;
};

export type RoadmapArea = {
  id: string;
  title: string;
  objective: string;
  features: RoadmapFeature[];
};

export type RoadmapVersion = {
  id: string;
  title: string;
  description: string;
  areas: RoadmapArea[];
};

export type RoadmapAreaProjection = {
  id: string;
  title: string;
  versions: {
    id: string;
    title: string;
    description: string;
    objective: string;
    features: RoadmapFeature[];
  }[];
};
