"use client";

import { useState } from "react";
import { Plus, Trash2, Layers, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCategories,
  useCourseMutations,
  type CategoryItem,
} from "@/hooks/queries/use-courses";
import { toast } from "sonner";

interface CategoryManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryManagerDialog({
  open,
  onOpenChange,
}: CategoryManagerDialogProps) {
  const { data: categories = [], isLoading } = useCategories();
  const { createCategory, deleteCategory } = useCourseMutations();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      await createCategory.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setName("");
      setDescription("");
      setIsCreating(false);
    } catch {
      // Handled in mutation hook
    }
  };

  const handleDelete = async (category: CategoryItem) => {
    if (
      confirm(
        `Are you sure you want to delete category "${category.name}"?\nWarning: Any courses and videos under this category will also be deleted from storage.`
      )
    ) {
      try {
        await deleteCategory.mutateAsync(category._id);
      } catch {
        // Handled in mutation hook
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold tracking-tight">
                  Manage Course Categories
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Create, view, or remove curriculum categories.
                </DialogDescription>
              </div>
            </div>
            {!isCreating && (
              <Button
                size="sm"
                className="h-8 text-xs font-medium gap-1"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Category
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* New Category Form */}
          {isCreating && (
            <form onSubmit={handleCreate} className="p-3.5 rounded-xl border border-border/80 bg-muted/40 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="cat-name" className="text-xs font-medium">
                  Category Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cat-name"
                  placeholder="e.g. GeM Services"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8 text-xs bg-background"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cat-desc" className="text-xs font-medium">
                  Description <span className="text-muted-foreground text-[10px]">(Optional)</span>
                </Label>
                <Input
                  id="cat-desc"
                  placeholder="Brief description of courses in this category"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setIsCreating(false);
                    setName("");
                    setDescription("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={createCategory.isPending}
                >
                  {createCategory.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : null}
                  Save Category
                </Button>
              </div>
            </form>
          )}

          {/* Categories List */}
          <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
            {isLoading ? (
              <p className="text-xs text-muted-foreground py-6 text-center">Loading categories…</p>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 rounded-lg border border-dashed border-border/80 bg-muted/20">
                <p className="text-xs text-muted-foreground">No categories found.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs mt-2"
                  onClick={() => setIsCreating(true)}
                >
                  Create your first category
                </Button>
              </div>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat._id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/60 bg-card/60 hover:border-border transition-colors"
                >
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{cat.name}</span>
                    </div>
                    {cat.description && (
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {cat.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => handleDelete(cat)}
                      disabled={deleteCategory.isPending}
                      title="Delete category"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
