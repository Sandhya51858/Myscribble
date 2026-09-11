import { CaptionSegment, VideoInfo } from '../types';

export interface SampleProject {
  id: string;
  title: string;
  category: string;
  duration: number;
  videoUrl: string;
  captions: CaptionSegment[];
}

export const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: 'sample-1',
    title: 'Hustle & Success Hook (Hinglish/English)',
    category: 'Viral Motivation',
    duration: 12.5,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    captions: [
      {
        id: 'seg-1',
        start: 0.2,
        end: 2.1,
        text: 'AGAR AAP BHI SUCCESSFUL HONA CHAHTE HO',
        words: [
          { word: 'AGAR', start: 0.2, end: 0.5 },
          { word: 'AAP', start: 0.5, end: 0.8 },
          { word: 'BHI', start: 0.8, end: 1.1 },
          { word: 'SUCCESSFUL', start: 1.1, end: 1.6 },
          { word: 'HONA', start: 1.6, end: 1.8 },
          { word: 'CHAHTE HO', start: 1.8, end: 2.1 },
        ],
      },
      {
        id: 'seg-2',
        start: 2.3,
        end: 4.4,
        text: 'THEN STOP SCROLLING RIGHT NOW!',
        words: [
          { word: 'THEN', start: 2.3, end: 2.6 },
          { word: 'STOP', start: 2.6, end: 3.1 },
          { word: 'SCROLLING', start: 3.1, end: 3.8 },
          { word: 'RIGHT', start: 3.8, end: 4.1 },
          { word: 'NOW!', start: 4.1, end: 4.4 },
        ],
      },
      {
        id: 'seg-3',
        start: 4.6,
        end: 7.2,
        text: 'FOCUS ON ONE SINGLE HIGH VALUE SKILL',
        words: [
          { word: 'FOCUS', start: 4.6, end: 5.1 },
          { word: 'ON', start: 5.1, end: 5.4 },
          { word: 'ONE', start: 5.4, end: 5.8 },
          { word: 'SINGLE', start: 5.8, end: 6.3 },
          { word: 'HIGH VALUE', start: 6.3, end: 6.8 },
          { word: 'SKILL', start: 6.8, end: 7.2 },
        ],
      },
      {
        id: 'seg-4',
        start: 7.4,
        end: 9.8,
        text: 'DAILY 2 HOURS MEHNAT KARO',
        words: [
          { word: 'DAILY', start: 7.4, end: 7.9 },
          { word: '2 HOURS', start: 7.9, end: 8.6 },
          { word: 'MEHNAT', start: 8.6, end: 9.2 },
          { word: 'KARO', start: 9.2, end: 9.8 },
        ],
      },
      {
        id: 'seg-5',
        start: 10.0,
        end: 12.2,
        text: 'AND WATCH YOUR LIFE CHANGE IN 6 MONTHS!',
        words: [
          { word: 'AND', start: 10.0, end: 10.3 },
          { word: 'WATCH', start: 10.3, end: 10.7 },
          { word: 'YOUR LIFE', start: 10.7, end: 11.2 },
          { word: 'CHANGE', start: 11.2, end: 11.6 },
          { word: 'IN 6', start: 11.6, end: 11.9 },
          { word: 'MONTHS!', start: 11.9, end: 12.2 },
        ],
      },
    ],
  },
  {
    id: 'sample-2',
    title: 'Secret Tech Hack (YouTube Shorts)',
    category: 'Tech & Tips',
    duration: 10.0,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    captions: [
      {
        id: 'tech-1',
        start: 0.1,
        end: 1.8,
        text: 'THIS SECRET AI WEBSITE',
        words: [
          { word: 'THIS', start: 0.1, end: 0.4 },
          { word: 'SECRET', start: 0.4, end: 0.9 },
          { word: 'AI', start: 0.9, end: 1.3 },
          { word: 'WEBSITE', start: 1.3, end: 1.8 },
        ],
      },
      {
        id: 'tech-2',
        start: 2.0,
        end: 4.2,
        text: 'FEELS COMPLETELY ILLEGAL TO KNOW',
        words: [
          { word: 'FEELS', start: 2.0, end: 2.4 },
          { word: 'COMPLETELY', start: 2.4, end: 3.1 },
          { word: 'ILLEGAL', start: 3.1, end: 3.7 },
          { word: 'TO KNOW', start: 3.7, end: 4.2 },
        ],
      },
      {
        id: 'tech-3',
        start: 4.4,
        end: 6.8,
        text: 'AUTOMATICALLY ADDS CAPCUT CAPTIONS',
        words: [
          { word: 'AUTOMATICALLY', start: 4.4, end: 5.2 },
          { word: 'ADDS', start: 5.2, end: 5.6 },
          { word: 'CAPCUT', start: 5.6, end: 6.2 },
          { word: 'CAPTIONS', start: 6.2, end: 6.8 },
        ],
      },
      {
        id: 'tech-4',
        start: 7.0,
        end: 9.6,
        text: 'SAVE THIS REEL BEFORE IT GETS DELETED!',
        words: [
          { word: 'SAVE', start: 7.0, end: 7.4 },
          { word: 'THIS REEL', start: 7.4, end: 8.1 },
          { word: 'BEFORE', start: 8.1, end: 8.6 },
          { word: 'IT GETS', start: 8.6, end: 9.0 },
          { word: 'DELETED!', start: 9.0, end: 9.6 },
        ],
      },
    ],
  },
];
