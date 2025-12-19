
export interface SupportLevelData {
  independent: {
    count: number;
    success: number;
    missed: number;
  };
  minimal: {
    count: number;
    success: number;
    miss: number;
  };
  modrate: {
    count: number;
    success: number;
    miss: number;
  };
}


 export   interface GoalProgressData {
    trend:any
    totalSessions: number
  goalId: string;
  category: string;
  goal: string;
  baseline: number;
  target: number;
  dataKey: string;
  color: string;
  sessionData: Array<{
    date: string;
    fullDate: Date;
    accuracy: number;
    independent: number;
    minimal: number;
    moderate: number;
    total: number;
    clientVariables?: string;
  }>;
  averages: {
    overall: number;
    independent: number;
    minimal: number;
    moderate: number;
  };
  currentStatus: string;
}

export  interface FEDCObservation {
  fedc: string;
  observations: number;
  percentage: number;
}