export interface TodayMeeting {
  id: string;
  title: string;
  start: string;
  end: string | null;
  zoomLink: string | null;
  caseNumber: string | null;
  clientName: string | null;
  completed: boolean;
}

export interface TodayDeadline {
  id: string;
  title: string;
  caseNumber: string | null;
  clientName: string | null;
  completed: boolean;
}

export interface AttorneyScoreSummary {
  attorneyId: string;
  name: string;
  caseCount: number;
  averageScore: number;
  averageCompleteness: number;
  averageFreshness: number;
  casesNeedingUpdate: number;
}

export interface TodayResponse {
  date: string;
  scope: "mine" | "all";
  canViewAll: boolean;
  meetings: TodayMeeting[];
  deadlines: TodayDeadline[];
  attorneys: AttorneyScoreSummary[];
  errors: { schedule?: string; scores?: string };
}
