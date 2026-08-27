"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type {
  RoadmapItem,
  VoteRequest,
  User,
  RoadmapStatus,
  Project,
} from "@/types";
import { ADMIN_EMAILS } from "@/lib/casdoor";

interface VotedItem {
  targetType: string;
  targetId: string;
}

interface AppState {
  user: User | null;
  roadmapItems: RoadmapItem[];
  voteRequests: VoteRequest[];
  projects: Project[];
  isAdmin: boolean;
  loading: boolean;
  votedSet: Set<string>;
}

interface AppContextType extends AppState {
  login: (user: User) => void;
  logout: () => void;
  fetchAll: () => Promise<void>;
  addRoadmapItem: (item: {
    title: string;
    description: string;
    status: RoadmapStatus;
    projectId?: string | null;
  }) => Promise<void>;
  updateRoadmapItem: (
    id: string,
    updates: Partial<RoadmapItem>
  ) => Promise<void>;
  deleteRoadmapItem: (id: string) => Promise<void>;
  moveRoadmapItem: (id: string, newStatus: RoadmapStatus) => Promise<void>;
  voteForItem: (itemId: string) => Promise<void>;
  addVoteRequest: (req: {
    title: string;
    description: string;
  }) => Promise<void>;
  updateVoteRequest: (
    id: string,
    updates: Partial<VoteRequest>
  ) => Promise<void>;
  deleteVoteRequest: (id: string) => Promise<void>;
  voteForRequest: (requestId: string) => Promise<void>;
  promoteVoteRequest: (
    requestId: string,
    status: RoadmapStatus
  ) => Promise<void>;
  reorderRoadmapItems: (
    items: { id: string; sortOrder: number }[]
  ) => Promise<void>;
  addProject: (name: string, color?: string) => Promise<void>;
  updateProject: (id: string, updates: { name?: string; color?: string }) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

interface DbRoadmapRow {
  id: string;
  title: string;
  description: string;
  status: RoadmapStatus;
  votes: number;
  sort_order: number;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

interface DbProjectRow {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

interface DbVoteRequestRow {
  id: string;
  title: string;
  description: string;
  user_id: string;
  votes: number;
  created_at: string;
}

function mapRoadmapRow(row: DbRoadmapRow): RoadmapItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    votes: row.votes,
    votedBy: [],
    sortOrder: row.sort_order ?? 0,
    projectId: row.project_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProjectRow(row: DbProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
  };
}

function mapVoteRequestRow(row: DbVoteRequestRow): VoteRequest {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    userId: row.user_id,
    itemId: "",
    votes: row.votes,
    createdAt: row.created_at,
  };
}

function getAnonymousId(): string {
  if (typeof window === "undefined") return "anonymous";
  let anonId = localStorage.getItem("roadmap_anonymous_id");
  if (!anonId) {
    anonId = "anon_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("roadmap_anonymous_id", anonId);
  }
  return anonId;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [voteRequests, setVoteRequests] = useState<VoteRequest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [votedSet, setVotedSet] = useState<Set<string>>(new Set());

  const fetchVotes = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/vote?user_id=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (data.ok) {
        const set = new Set<string>();
        (data.data as VotedItem[]).forEach((v) => {
          set.add(`${v.targetType}:${v.targetId}`);
        });
        setVotedSet(set);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [roadmapRes, voteRes, projectsRes] = await Promise.all([
        fetch("/api/roadmap"),
        fetch("/api/vote-requests"),
        fetch("/api/projects"),
      ]);
      const roadmapData = await roadmapRes.json();
      const voteData = await voteRes.json();
      const projectsData = await projectsRes.json();

      if (roadmapData.ok) {
        setRoadmapItems(
          (roadmapData.data as DbRoadmapRow[]).map(mapRoadmapRow)
        );
      }
      if (voteData.ok) {
        setVoteRequests(
          (voteData.data as DbVoteRequestRow[]).map(mapVoteRequestRow)
        );
      }
      if (projectsData.ok) {
        setProjects(
          (projectsData.data as DbProjectRow[]).map(mapProjectRow)
        );
      }
    } catch (err) {
      console.error("获取数据失败:", err);
    }
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("roadmap_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        // ignore
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      const voterId = user ? user.id : getAnonymousId();
      Promise.all([fetchAll(), fetchVotes(voterId)]).finally(() =>
        setLoading(false)
      );
    }
  }, [hydrated, fetchAll, fetchVotes, user]);

  const isAdmin =
    !!user && (user.isAdmin || ADMIN_EMAILS.includes(user.email));

  const login = useCallback((newUser: User) => {
    const admin = ADMIN_EMAILS.includes(newUser.email) || newUser.isAdmin;
    const userWithAdmin = { ...newUser, isAdmin: admin };
    setUser(userWithAdmin);
    localStorage.setItem("roadmap_user", JSON.stringify(userWithAdmin));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("roadmap_user");
  }, []);

  const addRoadmapItem = useCallback(
    async (item: {
      title: string;
      description: string;
      status: RoadmapStatus;
      projectId?: string | null;
    }) => {
      await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      await fetchAll();
    },
    [fetchAll]
  );

  const updateRoadmapItem = useCallback(
    async (id: string, updates: Partial<RoadmapItem>) => {
      await fetch("/api/roadmap", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      await fetchAll();
    },
    [fetchAll]
  );

  const deleteRoadmapItem = useCallback(
    async (id: string) => {
      await fetch(`/api/roadmap?id=${id}`, { method: "DELETE" });
      await fetchAll();
    },
    [fetchAll]
  );

  const moveRoadmapItem = useCallback(
    async (id: string, newStatus: RoadmapStatus) => {
      await fetch("/api/roadmap", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      await fetchAll();
    },
    [fetchAll]
  );

  const voteForItem = useCallback(
    async (itemId: string) => {
      const voterId = user ? user.id : getAnonymousId();
      await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: voterId,
          targetType: "roadmap",
          targetId: itemId,
        }),
      });
      await Promise.all([fetchAll(), fetchVotes(voterId)]);
    },
    [user, fetchAll, fetchVotes]
  );

  const addVoteRequest = useCallback(
    async (req: { title: string; description: string }) => {
      if (!user) return;
      await fetch("/api/vote-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...req, user_id: user.id }),
      });
      await fetchAll();
    },
    [user, fetchAll]
  );

  const updateVoteRequest = useCallback(
    async (id: string, updates: Partial<VoteRequest>) => {
      await fetch("/api/vote-requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      await fetchAll();
    },
    [fetchAll]
  );

  const deleteVoteRequest = useCallback(
    async (id: string) => {
      await fetch(`/api/vote-requests?id=${id}`, { method: "DELETE" });
      await fetchAll();
    },
    [fetchAll]
  );

  const voteForRequest = useCallback(
    async (requestId: string) => {
      const voterId = user ? user.id : getAnonymousId();
      await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: voterId,
          targetType: "vote_request",
          targetId: requestId,
        }),
      });
      await Promise.all([fetchAll(), fetchVotes(voterId)]);
    },
    [user, fetchAll, fetchVotes]
  );

  const promoteVoteRequest = useCallback(
    async (requestId: string, status: RoadmapStatus) => {
      const req = voteRequests.find((r) => r.id === requestId);
      if (!req) return;

      await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: req.title,
          description: req.description,
          status,
        }),
      });

      await fetch(`/api/vote-requests?id=${requestId}`, {
        method: "DELETE",
      });

      await fetchAll();
    },
    [voteRequests, fetchAll]
  );

  const reorderRoadmapItems = useCallback(
    async (items: { id: string; sortOrder: number }[]) => {
      await fetch("/api/roadmap", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reorder: true,
          items: items.map((item) => ({
            id: item.id,
            sort_order: item.sortOrder,
          })),
        }),
      });
      await fetchAll();
    },
    [fetchAll]
  );

  const addProject = useCallback(
    async (name: string, color?: string) => {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color }),
      });
      await fetchAll();
    },
    [fetchAll]
  );

  const updateProject = useCallback(
    async (id: string, updates: { name?: string; color?: string }) => {
      await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      await fetchAll();
    },
    [fetchAll]
  );

  const deleteProject = useCallback(
    async (id: string) => {
      await fetch(`/api/projects?id=${id}`, { method: "DELETE" });
      await fetchAll();
    },
    [fetchAll]
  );

  return (
    <AppContext.Provider
      value={{
        user,
        roadmapItems,
        voteRequests,
        projects,
        isAdmin,
        loading,
        votedSet,
        login,
        logout,
        fetchAll,
        addRoadmapItem,
        updateRoadmapItem,
        deleteRoadmapItem,
        moveRoadmapItem,
        voteForItem,
        addVoteRequest,
        updateVoteRequest,
        deleteVoteRequest,
        voteForRequest,
        promoteVoteRequest,
        reorderRoadmapItems,
        addProject,
        updateProject,
        deleteProject,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within AppProvider");
  }
  return ctx;
}
