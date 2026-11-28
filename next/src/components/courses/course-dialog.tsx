"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCategories,
  useCatalogPlans,
  useCourseMutations,
  type CategoryItem,
  type PlanItem,
} from "@/hooks/queries/use-courses";
import { toast } from "sonner";

interface CourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CourseDialog({ open, onOpenChange }: CourseDialogProps) {
  const { data: categories = [], isLoading: loadingCats } = useCategories();
  const { data: plans = [], isLoading: loadingPlans } = useCatalogPlans();
  const { createCourse, createCategory } = useCourseMutations();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [planId, setPlanId] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Quick inline category creator
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      toast.error("Category name is required");
      return;
    }
    try {
      const slug = newCatName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const res = await createCategory.mutateAsync({
        name: newCatName.trim(),
        slug,
        description: newCatDesc.trim() || undefined,
      });
      if (res.category?._id) {
        setCategoryId(res.category._id);
        setShowAddCat(false);
        setNewCatName("");
        setNewCatDesc("");
        toast.success(`Category "${res.category.name}" created and selected!`);
      }
    } catch {
      // Error handled by hook
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Course title is required");
      return;
    }
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }
    if (!planId) {
      toast.error("Please select a plan to unlock this course");
      return;
    }

    try {
      await createCourse.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        category: categoryId,
        plan: planId,
        active: isActive,
      });
      // Reset form and close
      setTitle("");
      setDescription("");
      setCategoryId("");
      setPlanId("");
      setIsActive(true);
      onOpenChange(false);
    } catch {
      // Handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">Create New Course</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Group lessons under a curriculum category and connect it to a paid plan for student access.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="course-title" className="text-xs font-medium">
              Course Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="course-title"
              placeholder="e.g. Complete GeM Portal Bidding Masterclass"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-sm"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="course-desc" className="text-xs font-medium">
              Description <span className="text-muted-foreground text-[11px]">(Optional)</span>
            </Label>
            <Input
              id="course-desc"
              placeholder="Brief summary of what students will learn..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Category Selector with Quick Add */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="course-category" className="text-xs font-medium">
                Category <span className="text-destructive">*</span>
              </Label>
              <button
                type="button"
                onClick={() => setShowAddCat(!showAddCat)}
                className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
              >
                <Plus className="h-3 w-3" />
                {showAddCat ? "Cancel new category" : "New category"}
              </button>
            </div>

            {showAddCat ? (
              <div className="rounded-lg border border-border/80 bg-muted/40 p-3 space-y-2">
                <Input
                  placeholder="New category name (e.g. GeM Services)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => setShowAddCat(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleCreateCategory}
                    disabled={createCategory.isPending}
                  >
                    {createCategory.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : null}
                    Save Category
                  </Button>
                </div>
              </div>
            ) : (
              <select
                id="course-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="">Select a category...</option>
                {categories.map((cat: CategoryItem) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Plan Selector */}
          <div className="space-y-1.5">
            <Label htmlFor="course-plan" className="text-xs font-medium">
              Linked Subscription Plan <span className="text-destructive">*</span>
            </Label>
            <select
              id="course-plan"
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            >
              <option value="">Select plan that unlocks this course...</option>
              {plans.map((p: PlanItem) => (
                <option key={p._id} value={p._id}>
                  {p.name} {p.price ? `(₹${p.price.toLocaleString("en-IN")})` : ""}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground">
              Students who purchase this plan automatically unlock access to all lessons in this course.
            </p>
          </div>

          {/* Active Status Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="course-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-border text-foreground accent-foreground"
            />
            <Label htmlFor="course-active" className="text-xs cursor-pointer">
              Publish immediately (visible to entitled students)
            </Label>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-9 text-xs font-medium"
              disabled={createCourse.isPending || loadingCats || loadingPlans}
            >
              {createCourse.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Creating...
                </>
              ) : (
                "Create Course"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
