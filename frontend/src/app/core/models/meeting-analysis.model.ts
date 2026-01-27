export interface MeetingAnalysis {
  summary: {
    introduction: string;
    key_points: string[];
    conclusion: string;
  };
  topics: {
    title: string;
    description: string;
  }[];
  decisions: string[];
  action_items: {
    task: string;
    responsible: string | null;
    deadline: string | null;
    needs_review: boolean;
  }[];
  speakers: {
    speaker: string;
    description: string;
  }[];
}
