export interface Meeting {
  id: string;
  meetingTitle: string;
  meetingDate: string;
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
  actionItems: {
    task: string;
    responsible: string | null;
    deadline: string | null;
    needs_review: boolean;
  }[];
  speakers: {
    speaker: string;
    description: string;
  }[];
  status: string;
  errorMessage?: string | null;
  s3Key?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
