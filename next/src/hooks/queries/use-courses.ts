"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { adminKeys } from "@/lib/query-keys";
import { toast } from "sonner";

export interface CategoryItem {
  _id: string;
  name: string;
  description?: string;
  createdAt?: string;
}

export interface PlanItem {
  _id: string;
  name: string;
  price?: number;
  billing?: string;
  duration?: string;
}

export interface CourseItem {
  _id: string;
  title: string;
  description?: string;
  category: CategoryItem | string;
  plan: PlanItem | string;
  active: boolean;
  order?: number;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface VideoItem {
  _id: string;
  course: string;
  title: string;
  description?: string;
  order: number;
  durationSeconds: number;
  thumbnailUrl?: string;
  status: "PENDING" | "UPLOADING" | "QUEUED" | "PROCESSING" | "READY" | "FAILED";
  processingProgress: number;
  errorMessage?: string | null;
  fileSizeBytes?: number;
  isHlsReady?: boolean;
  hlsDirectory?: string;
  hlsManifestKey?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface CoursesApiResponse {
  success: boolean;
  courses: CourseItem[];
}

interface CategoriesApiResponse {
  success: boolean;
  categories: CategoryItem[];
}

interface PlansApiResponse {
  success: boolean;
  plans: PlanItem[];
}

interface VideosApiResponse {
  success: boolean;
  videos: VideoItem[];
}

/**
 * Fetch all Courses for Admin DataTable
 */
export function useCourses() {
  return useQuery({
    queryKey: adminKeys.courses(),
    queryFn: async () => {
      const res = await api<CoursesApiResponse>("/admin/lms/courses");
      return res.courses || [];
    },
    staleTime: 30_000,
  });
}

/**
 * Fetch all Categories for Course assignment
 */
export function useCategories() {
  return useQuery({
    queryKey: adminKeys.categories(),
    queryFn: async () => {
      const res = await api<CategoriesApiResponse>("/admin/lms/categories");
      return res.categories || [];
    },
    staleTime: 60_000,
  });
}

/**
 * Fetch all Plans for Course entitlement mapping
 */
export function useCatalogPlans() {
  return useQuery({
    queryKey: adminKeys.catalog("plans"),
    queryFn: async () => {
      const res = await api<PlansApiResponse>("/catalog/plans");
      return res.plans || [];
    },
    staleTime: 60_000,
  });
}

/**
 * Fetch Video Lessons for a specific Course.
 * Smart Polling: Polls every 3s ONLY when a video is PROCESSING or QUEUED.
 */
export function useCourseVideos(courseId?: string | null) {
  return useQuery({
    queryKey: adminKeys.videos(courseId || undefined),
    queryFn: async () => {
      if (!courseId) return [];
      const res = await api<VideosApiResponse>(`/admin/lms/videos?courseId=${encodeURIComponent(courseId)}`);
      return res.videos || [];
    },
    enabled: Boolean(courseId),
    refetchInterval: (query) => {
      const videos = query.state.data;
      if (!Array.isArray(videos)) return false;
      const isWorking = videos.some(
        (v) => v.status === "PROCESSING" || v.status === "QUEUED" || v.status === "UPLOADING"
      );
      return isWorking ? 3000 : false;
    },
  });
}

/**
 * Course and Video Actions (Create, Delete)
 */
export function useCourseMutations() {
  const queryClient = useQueryClient();

  const createCourse = useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      category: string;
      plan: string;
      active?: boolean;
    }) => {
      return await api<{ success: boolean; course: CourseItem }>("/admin/lms/courses", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast.success("Course created successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.courses() });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create course");
    },
  });

  const deleteCourse = useMutation({
    mutationFn: async (courseId: string) => {
      return await api<{ success: boolean }>(`/admin/lms/courses/${courseId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast.success("Course deleted successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.courses() });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete course");
    },
  });

  const createCategory = useMutation({
    mutationFn: async (data: { name: string; slug?: string; description?: string }) => {
      const slug =
        data.slug ||
        data.name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      return await api<{ success: boolean; category: CategoryItem }>("/admin/lms/categories", {
        method: "POST",
        body: JSON.stringify({ ...data, slug }),
      });
    },
    onSuccess: () => {
      toast.success("Category created successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.categories() });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create category");
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (categoryId: string) => {
      return await api<{ success: boolean }>(`/admin/lms/categories/${categoryId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast.success("Category deleted successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.categories() });
      queryClient.invalidateQueries({ queryKey: adminKeys.courses() });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete category");
    },
  });

  const deleteVideo = useMutation({
    mutationFn: async ({ videoId }: { videoId: string; courseId: string }) => {
      return await api<{ success: boolean }>(`/admin/lms/videos/${videoId}`, {
        method: "DELETE",
      });
    },
    onSuccess: (_, variables) => {
      toast.success("Video lesson deleted successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.videos(variables.courseId) });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete video lesson");
    },
  });

  return {
    createCourse,
    deleteCourse,
    createCategory,
    deleteCategory,
    deleteVideo,
  };
}
