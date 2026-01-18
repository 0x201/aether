export interface CaptureJob {
  id: number;
  roomId: number;
  status: string;
  duration: number;
  startTime: string;
  endTime: string | null;
  createdAt: string;
}

export interface CaptureJobList {
  data: CaptureJob[];
  total: number;
  page: number;
  limit: number;
}