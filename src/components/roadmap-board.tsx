"use client";

import { useApp } from "@/hooks/use-app";
import type { RoadmapItem, RoadmapStatus } from "@/types";
import { STATUS_CONFIG } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Triangle,
  Plus,
  Trash2,
  Edit,
  GripVertical,
  CheckCircle2,
  Clock,
  ArrowRightCircle,
  Inbox,
  FolderOpen,
  LayoutDashboard,
  Search,
  ArrowDownUp,
  Wand2,
  Loader2,
} from "lucide-react";
import { useState, useRef, useCallback, useMemo } from "react";

const STATUS_ICONS: Record<RoadmapStatus, React.ReactNode> = {
  backlog: <Inbox className="h-4 w-4" />,
  next_up: <ArrowRightCircle className="h-4 w-4" />,
  in_progress: <Clock className="h-4 w-4" />,
  done: <CheckCircle2 className="h-4 w-4" />,
};

const STATUS_ORDER: RoadmapStatus[] = [
  "backlog",
  "next_up",
  "in_progress",
  "done",
];

function RoadmapColumn({
  status,
  items,
}: {
  status: RoadmapStatus;
  items: RoadmapItem[];
}) {
  const {
    user,
    isAdmin,
    votedSet,
    projects,
    voteForItem,
    deleteRoadmapItem,
    moveRoadmapItem,
    updateRoadmapItem,
    reorderRoadmapItems,
  } = useApp();

  const config = STATUS_CONFIG[status];
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    projectId: "" as string,
  });
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [polishing, setPolishing] = useState(false);
  const dragItemIndex = useRef<number | null>(null);

  const openEdit = (item: RoadmapItem) => {
    setEditForm({ title: item.title, description: item.description, projectId: item.projectId || "" });
    setEditingItem(item);
  };

  const handleEditSave = () => {
    if (!editingItem || !editForm.title) return;
    updateRoadmapItem(editingItem.id, {
      title: editForm.title,
      description: editForm.description,
      projectId: editForm.projectId || null,
    });
    setEditingItem(null);
  };

  const handlePolish = async () => {
    if (!editForm.description.trim()) return;
    setPolishing(true);
    try {
      const res = await fetch("/api/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: editForm.description }),
      });
      const data = await res.json();
      if (data.ok && data.data) {
        setEditForm((prev) => ({ ...prev, description: data.data }));
      }
    } catch {
    } finally {
      setPolishing(false);
    }
  };

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      e.dataTransfer.setData(
        "text/plain",
        JSON.stringify({ index, status, itemId: items[index].id })
      );
      e.dataTransfer.effectAllowed = "move";
      dragItemIndex.current = index;
    },
    [status, items]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverIndex(index);
    },
    []
  );

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      setDragOverIndex(null);

      try {
        const data = JSON.parse(e.dataTransfer.getData("text/plain"));
        const { index: fromIndex, status: fromStatus, itemId } = data;

        if (fromStatus === status) {
          const sortedItems = [...items].sort(
            (a, b) => a.sortOrder - b.sortOrder
          );
          const newItems = [...sortedItems];
          const [moved] = newItems.splice(fromIndex, 1);
          newItems.splice(dropIndex, 0, moved);

          await reorderRoadmapItems(
            newItems.map((item, i) => ({ id: item.id, sortOrder: i }))
          );
        } else {
          await moveRoadmapItem(itemId, status);
          const sortedItems = [...items].sort(
            (a, b) => a.sortOrder - b.sortOrder
          );
          const newItems = [...sortedItems];
          const tempItem: RoadmapItem = {
            id: itemId,
            title: "",
            description: "",
            status,
            votes: 0,
            votedBy: [],
            sortOrder: 0,
            projectId: null,
            createdAt: "",
            updatedAt: "",
          };
          newItems.splice(dropIndex, 0, tempItem);

          await reorderRoadmapItems(
            newItems.map((item, i) => ({ id: item.id, sortOrder: i }))
          );
        }
      } catch (err) {
        console.error("Drop failed:", err);
      }
    },
    [items, status, moveRoadmapItem, reorderRoadmapItems]
  );

  const handleColumnDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverIndex(null);

      try {
        const data = JSON.parse(e.dataTransfer.getData("text/plain"));
        const { status: fromStatus, itemId } = data;

        if (fromStatus !== status) {
          await moveRoadmapItem(itemId, status);
        }
      } catch (err) {
        console.error("Column drop failed:", err);
      }
    },
    [status, moveRoadmapItem]
  );

  const sortedItems = [...items].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="flex flex-col w-full min-w-0 sm:min-w-[260px] sm:flex-1 border border-gray-200 rounded-lg">
      <div className={`rounded-t-lg px-4 py-3 border-b border-gray-200 ${config.bgColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={config.color}>{STATUS_ICONS[status]}</span>
            <h3 className={`font-semibold text-sm ${config.color}`}>
              {config.label}
            </h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {items.length}
          </Badge>
        </div>
      </div>

      <div
        className="flex-1 bg-white rounded-b-lg p-3 space-y-2 min-h-[200px]"
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }}
        onDrop={handleColumnDrop}
      >
        {sortedItems.length === 0 && (
          <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
            暂无内容
          </div>
        )}
        {sortedItems.map((item, index) => (
          <Card
            key={item.id}
            draggable={!!user}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            className={`group transition-colors ${
              user ? "cursor-grab active:cursor-grabbing" : "cursor-default"
            } hover:border-primary ${
              dragOverIndex === index
                ? "border-2 border-primary ring-2 ring-primary/20"
                : ""
            }`}
          >
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                {user && (
                  <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{item.title}</h4>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  {item.projectId && (() => {
                    const proj = projects.find(p => p.id === item.projectId);
                    return proj ? (
                      <span
                        className="inline-block mt-1.5 px-2 py-0.5 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: proj.color }}
                      >
                        {proj.name}
                      </span>
                    ) : null;
                  })()}
                </div>
                <div className="flex flex-col items-center gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 ${votedSet.has(`roadmap:${item.id}`) ? "text-primary" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      voteForItem(item.id);
                    }}
                    title={votedSet.has(`roadmap:${item.id}`) ? "取消投票" : "投票"}
                  >
                    <Triangle className={`h-3 w-3 ${votedSet.has(`roadmap:${item.id}`) ? "text-primary fill-primary" : ""}`} />
                  </Button>
                  <span className={`text-xs font-semibold ${votedSet.has(`roadmap:${item.id}`) ? "text-primary" : ""}`}>
                    {item.votes}
                  </span>
                </div>
              </div>
              {user && (
                <div className="flex items-center gap-1 mt-2 pt-2 border-t">
                  <div className="flex-1" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => openEdit(item)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => setDeleteConfirmId(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑任务</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>任务名称</Label>
              <Input
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>任务描述</Label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handlePolish}
                  disabled={polishing || !editForm.description.trim()}
                  title="AI 润色"
                >
                  {polishing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <Textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            {projects.length > 0 && (
              <div className="space-y-2">
                <Label>关联项目（可选）</Label>
                <Select
                  value={editForm.projectId}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({ ...prev, projectId: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择项目标签" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">无</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block w-3 h-3 rounded-full"
                            style={{ backgroundColor: p.color }}
                          />
                          {p.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              取消
            </Button>
            <Button onClick={handleEditSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除这个任务吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirmId) {
                  deleteRoadmapItem(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function RoadmapBoard() {
  const { user, isAdmin, roadmapItems, projects, addRoadmapItem, addProject, updateProject, deleteProject } = useApp();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: "", color: "#3f9bfb" });
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "time" | "votes">("default");
  const [polishing, setPolishing] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "backlog" as RoadmapStatus,
    projectId: "" as string,
  });

  const handleAdd = () => {
    if (!form.title) return;
    addRoadmapItem({
      title: form.title,
      description: form.description,
      status: form.status,
      projectId: form.projectId || null,
    });
    setForm({ title: "", description: "", status: "backlog", projectId: "" });
    setShowAddDialog(false);
  };

  const handleAddProject = async () => {
    if (!projectForm.name) return;
    if (editingProject) {
      await updateProject(editingProject, { name: projectForm.name, color: projectForm.color });
      setEditingProject(null);
    } else {
      await addProject(projectForm.name, projectForm.color);
    }
    setProjectForm({ name: "", color: "#3f9bfb" });
  };

  const handleEditProject = (proj: { id: string; name: string; color: string }) => {
    setEditingProject(proj.id);
    setProjectForm({ name: proj.name, color: proj.color });
  };

  const handlePolish = async () => {
    if (!form.description.trim()) return;
    setPolishing(true);
    try {
      const res = await fetch("/api/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: form.description }),
      });
      const data = await res.json();
      if (data.ok && data.data) {
        setForm((prev) => ({ ...prev, description: data.data }));
      }
    } catch {
    } finally {
      setPolishing(false);
    }
  };

  const filteredItems = useMemo(() => {
    let items = roadmapItems;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      items = items.filter((item) => {
        if (item.title.toLowerCase().includes(q)) return true;
        if (item.description.toLowerCase().includes(q)) return true;
        if (item.projectId) {
          const proj = projects.find((p) => p.id === item.projectId);
          if (proj && proj.name.toLowerCase().includes(q)) return true;
        }
        return false;
      });
    }

    if (sortBy === "votes") {
      items = [...items].sort((a, b) => b.votes - a.votes);
    } else if (sortBy === "time") {
      items = [...items].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return items;
  }, [roadmapItems, searchQuery, sortBy, projects]);

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2 shrink-0">
          <LayoutDashboard className="h-5 w-5 text-primary" />
          项目路线图
        </h2>
        <div className="flex flex-wrap items-center gap-2 sm:flex-1 sm:justify-end">
          <div className="relative flex-1 min-w-0 sm:max-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索任务..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <Select value={sortBy} onValueChange={(v: "default" | "time" | "votes") => setSortBy(v)}>
            <SelectTrigger className="w-[110px] sm:w-[140px] shrink-0">
              <ArrowDownUp className="h-3.5 w-3.5 mr-1 shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">默认排序</SelectItem>
              <SelectItem value="time">按时间</SelectItem>
              <SelectItem value="votes">按投票</SelectItem>
            </SelectContent>
          </Select>
          {user && (
            <>
              <Button size="sm" variant="outline" className="h-9" onClick={() => setShowProjectDialog(true)}>
                <FolderOpen className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">管理项目</span>
              </Button>
              <Button size="sm" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">添加任务</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATUS_ORDER.map((status) => (
          <RoadmapColumn
            key={status}
            status={status}
            items={filteredItems.filter((item) => item.status === status)}
          />
        ))}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加新任务</DialogTitle>
            <DialogDescription>添加一个新的路线图任务</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>任务名称</Label>
              <Input
                placeholder="输入任务名称"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>任务描述</Label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handlePolish}
                  disabled={polishing || !form.description.trim()}
                  title="AI 润色"
                >
                  {polishing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <Textarea
                placeholder="详细描述这个任务"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>所属阶段</Label>
              <Select
                value={form.status}
                onValueChange={(value: RoadmapStatus) =>
                  setForm((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_CONFIG[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {projects.length > 0 && (
              <div className="space-y-2">
                <Label>关联项目（可选）</Label>
                <Select
                  value={form.projectId}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, projectId: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择项目标签" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">无</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block w-3 h-3 rounded-full"
                            style={{ backgroundColor: p.color }}
                          />
                          {p.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              取消
            </Button>
            <Button onClick={handleAdd}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showProjectDialog} onOpenChange={(open) => { setShowProjectDialog(open); if (!open) { setEditingProject(null); setProjectForm({ name: "", color: "#3f9bfb" }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>管理项目</DialogTitle>
            <DialogDescription>添加、编辑或删除项目标签</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input
                placeholder="项目名称"
                value={projectForm.name}
                onChange={(e) =>
                  setProjectForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="flex-1 min-w-0"
              />
              <div className="shrink-0">
                <button
                  type="button"
                  className="w-9 h-9 rounded-full border-2 border-gray-200 transition-transform hover:scale-110"
                  style={{ backgroundColor: projectForm.color }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                />
              </div>
              <Button size="sm" onClick={handleAddProject} className="shrink-0">
                {editingProject ? "保存" : "添加"}
              </Button>
              {editingProject && (
                <Button size="sm" variant="outline" className="shrink-0" onClick={() => { setEditingProject(null); setProjectForm({ name: "", color: "#3f9bfb" }); }}>
                  取消
                </Button>
              )}
            </div>
            {showColorPicker && (
              <div className="p-2 bg-white rounded-lg border grid grid-cols-6 sm:grid-cols-10 gap-1.5">
                {["#ef4444","#f97316","#f59e0b","#eab308","#84cc16","#22c55e","#14b8a3","#06b6d4","#38b6ff","#3f9bfb","#6366f1","#8b5cf6","#a855f7","#d946ef","#ec4899","#f43f5e","#6b7280","#374151","#000000"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-7 h-7 rounded-full transition-transform hover:scale-125 ${projectForm.color === c ? "ring-2 ring-offset-2 ring-gray-400" : ""}`}
                    style={{ backgroundColor: c }}
                    onClick={() => {
                      setProjectForm((prev) => ({ ...prev, color: c }));
                      setShowColorPicker(false);
                    }}
                  />
                ))}
              </div>
            )}
            <div className="space-y-2">
              {projects.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  暂无项目，请添加
                </p>
              )}
              {projects.map((proj) => (
                <div key={proj.id} className="flex items-center gap-2 p-2 rounded border">
                  <span
                    className="inline-block w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: proj.color }}
                  />
                  <span className="flex-1 text-sm font-medium">{proj.name}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditProject(proj)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteProject(proj.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
