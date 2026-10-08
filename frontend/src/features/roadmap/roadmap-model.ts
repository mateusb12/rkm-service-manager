export type RoadmapFeature = {
  id: string;
  title: string;
  acceptance: string;
  state: string;
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
