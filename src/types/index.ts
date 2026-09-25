export type RoadmapStatus = "backlog" | "next_up" | "in_progress" | "done";

export interface Project {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: RoadmapStatus;
  votes: number;
  sortOrder: number;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VoteRequest {
  id: string;
  itemId: string;
  userId: string;
  title: string;
  description: string;
  votes: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isAdmin: boolean;
}

export const STATUS_CONFIG: Record<
  RoadmapStatus,
  { label: string; color: string; bgColor: string }
> = {
  backlog: {
    label: "待办池",
    color: "text-gray-600 dark:text-gray-300",
    bgColor: "bg-[#fcfcfc] dark:bg-muted/40",
  },
  next_up: {
    label: "即将开始",
    color: "text-nextup",
    bgColor: "bg-[#fcfcfc] dark:bg-muted/40",
  },
  in_progress: {
    label: "进行中",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-[#fcfcfc] dark:bg-muted/40",
  },
  done: {
    label: "已完成",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-[#fcfcfc] dark:bg-muted/40",
  },
};

export const DEFAULT_ROADMAP_ITEMS: RoadmapItem[] = [];
export const DEFAULT_VOTE_REQUESTS: VoteRequest[] = [];
