import { MeetingAnalysis } from '../models/meeting-analysis.model';

export const MEETING_ANALYSIS_MOCK: MeetingAnalysis = {
  summary: {
    introduction:
      'The video provides a comprehensive tutorial on how to accelerate a video using the CapCut mobile application.',
    key_points: [
      'Open the CapCut app and start a new project',
      'Select the video from your gallery',
      'Mute the original audio',
      'Use Velocity > Normal to accelerate the video',
      'Add background music',
      'Trim music and apply fade effects',
      'Export the final video',
    ],
    conclusion:
      'The tutorial demonstrates how to speed up videos and enhance them with music for better engagement.',
  },
  topics: [
    {
      title: 'Getting Started with CapCut',
      description: 'How to open the app and create a new project using a video from the gallery.',
    },
    {
      title: 'Adjusting Video Speed',
      description: 'Using the Velocity tool to accelerate long videos.',
    },
  ],
  decisions: ['Use CapCut as the editing tool', 'Mute original audio before accelerating'],
  action_items: [
    {
      task: 'Install CapCut',
      responsible: null,
      deadline: null,
      needs_review: true,
    },
  ],
  speakers: [
    {
      speaker: 'Speaker 1',
      description: 'Instructor demonstrating video acceleration and editing techniques.',
    },
  ],
};
