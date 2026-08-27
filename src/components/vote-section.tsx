"use client";

import { useApp } from "@/hooks/use-app";
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
  Triangle,
  Lightbulb,
  Plus,
  Trash2,
  Edit,
  ArrowRight,
  Wand2,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import type { RoadmapStatus } from "@/types";
import { STATUS_CONFIG } from "@/types";

export function VoteSection() {
  const {
    user,
    isAdmin,
    voteRequests,
    votedSet,
    addVoteRequest,
    updateVoteRequest,
    deleteVoteRequest,
    voteForRequest,
    promoteVoteRequest,
  } = useApp();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "" });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [polishing, setPolishing] = useState(false);

  const sortedRequests = [...voteRequests].sort((a, b) => b.votes - a.votes);
  const maxVotes = sortedRequests.length > 0 ? sortedRequests[0].votes : 1;

  const handleAdd = () => {
    if (!form.title || !user) return;
    addVoteRequest({
      title: form.title,
      description: form.description,
    });
    setForm({ title: "", description: "" });
    setShowAddDialog(false);
  };

  const handleEdit = () => {
    if (!editingId || !form.title) return;
    updateVoteRequest(editingId, {
      title: form.title,
      description: form.description,
    });
    setEditingId(null);
    setForm({ title: "", description: "" });
  };

  const handlePromote = (status: RoadmapStatus) => {
    if (!promotingId) return;
    promoteVoteRequest(promotingId, status);
    setPromotingId(null);
  };

  const openEditDialog = (id: string) => {
    const req = voteRequests.find((r) => r.id === id);
    if (!req) return;
    setForm({ title: req.title, description: req.description });
    setEditingId(id);
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

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">功能投票</h2>
          <Badge variant="secondary">{voteRequests.length} 个提议</Badge>
        </div>
        {user && (
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            提议新功能
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {sortedRequests.map((req, index) => {
          const percentage = maxVotes > 0 ? (req.votes / maxVotes) * 100 : 0;
          const hasVoted = votedSet.has(`vote_request:${req.id}`);
          return (
            <Card
              key={req.id}
              className="group hover:border-primary transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${hasVoted ? "text-primary" : ""}`}
                      onClick={() => voteForRequest(req.id)}
                      title={hasVoted ? "取消投票" : "投票"}
                    >
                      <Triangle className={`h-4 w-4 ${hasVoted ? "text-primary fill-primary" : ""}`} />
                    </Button>
                    <span className={`text-sm font-bold ${hasVoted ? "text-primary" : ""}`}>
                      {req.votes}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm">
                          <Badge variant="default" className="mr-1 text-[10px] px-1.5 py-0">#{index + 1}</Badge>
                          {req.title}
                        </h3>
                        {req.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {req.description}
                          </p>
                        )}
                      </div>
                      {user && (
                        <div className="flex items-center gap-1 shrink-0">
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => setPromotingId(req.id)}
                            >
                              <ArrowRight className="h-3 w-3 mr-1" />
                              转为任务
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEditDialog(req.id)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirmId(req.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="mt-2">
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-end mt-1">
                        <span className="text-xs text-muted-foreground">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>提议新功能</DialogTitle>
            <DialogDescription>描述您希望添加的功能</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>功能名称</Label>
              <Input
                placeholder="输入功能名称"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>功能描述</Label>
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
                placeholder="详细描述这个功能"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              取消
            </Button>
            <Button onClick={handleAdd}>提交</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingId}
        onOpenChange={(open) => {
          if (!open) {
            setEditingId(null);
            setForm({ title: "", description: "" });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑功能提议</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>功能名称</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>功能描述</Label>
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
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setForm({ title: "", description: "" });
              }}
            >
              取消
            </Button>
            <Button onClick={handleEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!promotingId}
        onOpenChange={(open) => !open && setPromotingId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>转入路线图</DialogTitle>
            <DialogDescription>选择要将此功能提议转入的阶段</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {(Object.entries(STATUS_CONFIG) as [RoadmapStatus, typeof STATUS_CONFIG[RoadmapStatus]][]).map(
              ([key, config]) => (
                <Button
                  key={key}
                  variant="outline"
                  className="h-auto py-3 flex flex-col gap-1"
                  onClick={() => handlePromote(key)}
                >
                  <span className="font-medium">{config.label}</span>
                </Button>
              )
            )}
          </div>
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
              确定要删除这个功能提议吗？此操作不可撤销。
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
                  deleteVoteRequest(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
