"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tags,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  Search,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"

const RECOMMENDED_TECH_CATEGORIES = [
  "Full-Stack Web Development",
  "Frontend Engineering",
  "Backend Engineering",
  "Mobile Application Development",
  "Cloud Computing & DevOps",
  "Data Engineering",
  "Artificial Intelligence & Machine Learning",
  "Cybersecurity",
  "UI/UX & Product Design",
  "Blockchain & Web3",
  "Software Engineering Fundamentals",
  "Programming Languages",
]

interface Category {
  id: string
  name: string
  createdAt?: string
  updatedAt?: string
}

interface CourseSummary {
  id: string
  title: string
  category: string
  level?: string
  published?: boolean
  instructorName?: string
}

export default function AdminCategoriesPage() {
  const { token } = useAuthStore()
  const { toast } = useToast()

  const [categories, setCategories] = useState<Category[]>([])
  const [courses, setCourses] = useState<CourseSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Form states
  const [newCategoryName, setNewCategoryName] = useState("")
  const [creating, setCreating] = useState(false)

  // Edit dialog state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editName, setEditName] = useState("")
  const [updating, setUpdating] = useState(false)

  // Delete dialog state
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Courses inspection modal
  const [inspectCategory, setInspectCategory] = useState<Category | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [catRes, courseRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/courses?includeDrafts=true"),
      ])

      if (catRes.ok) {
        const catData = await catRes.json()
        setCategories(catData.categories || [])
      }

      if (courseRes.ok) {
        const courseData = await courseRes.json()
        setCourses(courseData.courses || [])
      }
    } catch (err) {
      console.error("Error loading categories or courses:", err)
      toast({
        title: "Error Loading Architecture",
        description: "Failed to load category taxonomy. Please refresh the page.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getCoursesForCategory = (catName: string) => {
    return courses.filter(
      (c) => c.category && c.category.trim().toLowerCase() === catName.trim().toLowerCase(),
    )
  }

  const handleCreateCategory = async (nameToCreate?: string) => {
    const targetName = (nameToCreate || newCategoryName).trim()
    if (!targetName) {
      toast({
        title: "Validation Error",
        description: "Category name cannot be empty.",
        variant: "destructive",
      })
      return
    }

    // Check duplicate
    if (categories.some((c) => c.name.toLowerCase() === targetName.toLowerCase())) {
      toast({
        title: "Duplicate Category",
        description: `Category "${targetName}" already exists.`,
        variant: "destructive",
      })
      return
    }

    try {
      setCreating(true)
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: targetName }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to create category")
      }

      toast({
        title: "Category Created",
        description: `Successfully added "${targetName}" to academy taxonomy.`,
      })
      if (!nameToCreate) {
        setNewCategoryName("")
      }
      fetchData()
    } catch (err: any) {
      toast({
        title: "Creation Failed",
        description: err.message || "An error occurred while creating category.",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editName.trim()) return

    const trimmed = editName.trim()
    if (
      categories.some(
        (c) => c.id !== editingCategory.id && c.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      toast({
        title: "Duplicate Category",
        description: `Category name "${trimmed}" is already taken.`,
        variant: "destructive",
      })
      return
    }

    try {
      setUpdating(true)
      const res = await fetch(`/api/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: trimmed }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to update category")
      }

      toast({
        title: "Category Updated",
        description: `Category renamed to "${trimmed}".`,
      })
      setEditingCategory(null)
      fetchData()
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update category.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return

    const assigned = getCoursesForCategory(deletingCategory.name)
    if (assigned.length > 0) {
      toast({
        title: "Deletion Blocked",
        description: `Cannot delete "${deletingCategory.name}" because ${assigned.length} course(s) are assigned to it.`,
        variant: "destructive",
      })
      setDeletingCategory(null)
      return
    }

    try {
      setDeleting(true)
      const res = await fetch(`/api/categories/${deletingCategory.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete category")
      }

      toast({
        title: "Category Deleted",
        description: `Category "${deletingCategory.name}" has been removed.`,
      })
      setDeletingCategory(null)
      fetchData()
    } catch (err: any) {
      toast({
        title: "Deletion Failed",
        description: err.message || "Failed to delete category.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-3">
            <Tags className="w-3.5 h-3.5" />
            <span>Academic Architecture</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Technology Category Architecture
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure academic disciplines, engineering tracks, and course taxonomy for the academy.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 font-mono text-xs">
            {categories.length} Active Categories
          </Badge>
          <Badge variant="outline" className="px-3 py-1 font-mono text-xs">
            {courses.length} Total Courses Mapped
          </Badge>
        </div>
      </div>

      {/* Recommended Tech Academy Categories Seed Helper */}
      <Card className="border border-primary/20 bg-primary/5 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Standard SkillUp Disciplines</span>
          </div>
          <CardDescription className="text-xs">
            Quickly provision recommended technology disciplines if not already in taxonomy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {RECOMMENDED_TECH_CATEGORIES.map((rec) => {
              const alreadyExists = categories.some(
                (c) => c.name.toLowerCase() === rec.toLowerCase(),
              )
              return (
                <button
                  key={rec}
                  disabled={alreadyExists || creating}
                  onClick={() => handleCreateCategory(rec)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    alreadyExists
                      ? "bg-muted text-muted-foreground/70 cursor-default border border-border/50"
                      : "bg-background text-foreground hover:bg-primary hover:text-primary-foreground border border-border shadow-xs hover:shadow-sm cursor-pointer"
                  }`}
                  title={alreadyExists ? "Already provisioned" : `Click to add ${rec}`}
                >
                  {alreadyExists ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-primary" />
                  )}
                  <span>{rec}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Create New Category Form */}
      <Card className="border border-border/70 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            <span>Add Custom Discipline or Specialty</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Create an academic engineering category for course categorization and catalog filtering.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleCreateCategory()
            }}
            className="flex flex-col sm:flex-row gap-3 max-w-xl"
          >
            <div className="relative flex-1">
              <Input
                placeholder="e.g. Distributed Systems Engineering"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                disabled={creating}
                className="bg-background text-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={creating || !newCategoryName.trim()}
              className="font-medium shrink-0"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {creating ? "Adding..." : "Add Category"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Category List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <span>Active Academy Taxonomy ({filteredCategories.length})</span>
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-28 rounded-xl border border-border/50 bg-muted/20 animate-pulse"
              />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <Card className="border border-dashed border-border/80 p-8 text-center bg-card/40">
            <Tags className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-base font-semibold text-foreground">No Categories Found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              {searchQuery
                ? `No category matched "${searchQuery}". Try a different search query.`
                : "No categories have been established in the database yet. Click any of the standard templates above to provision them."}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((category) => {
              const assignedCourses = getCoursesForCategory(category.name)
              const hasCourses = assignedCourses.length > 0

              return (
                <Card
                  key={category.id}
                  className="border border-border/70 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <CardTitle className="text-base font-semibold leading-tight text-foreground">
                          {category.name}
                        </CardTitle>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          ID: {category.id.slice(0, 14)}...
                        </p>
                      </div>
                      <Badge
                        variant={hasCourses ? "default" : "secondary"}
                        className={`text-[11px] font-mono shrink-0 ${
                          hasCourses
                            ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                            : "text-muted-foreground"
                        }`}
                      >
                        <BookOpen className="w-3 h-3 mr-1" />
                        {assignedCourses.length} {assignedCourses.length === 1 ? "Course" : "Courses"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between border-t border-border/50 pt-3 mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!hasCourses}
                        onClick={() => setInspectCategory(category)}
                        className="text-xs text-muted-foreground hover:text-foreground h-8 px-2"
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1 text-primary" />
                        <span>Inspect Courses</span>
                      </Button>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingCategory(category)
                            setEditName(category.name)
                          }}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          title="Rename Category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingCategory(category)}
                          className={`h-8 w-8 p-0 ${
                            hasCourses
                              ? "text-muted-foreground/40 hover:text-muted-foreground/60 cursor-not-allowed"
                              : "text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                          }`}
                          title={
                            hasCourses
                              ? "Cannot delete category while courses are assigned"
                              : "Delete Category"
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit Category Dialog */}
      <Dialog
        open={Boolean(editingCategory)}
        onOpenChange={(open) => !open && setEditingCategory(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category Name</DialogTitle>
            <DialogDescription className="text-xs">
              Update the title of this academic discipline.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Category Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Category name"
                disabled={updating}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingCategory(null)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUpdateCategory}
              disabled={updating || !editName.trim()}
            >
              {updating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <Dialog
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <span>Delete Category</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete{" "}
              <strong className="text-foreground">{deletingCategory?.name}</strong>? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deletingCategory && getCoursesForCategory(deletingCategory.name).length > 0 && (
            <div className="p-3 rounded-lg border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs">
              <strong>Deletion Blocked:</strong> There are currently{" "}
              {getCoursesForCategory(deletingCategory.name).length} courses assigned to this category.
              Please reassign these courses before deleting.
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingCategory(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteCategory}
              disabled={
                deleting ||
                (deletingCategory
                  ? getCoursesForCategory(deletingCategory.name).length > 0
                  : false)
              }
            >
              {deleting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inspect Courses Dialog */}
      <Dialog
        open={Boolean(inspectCategory)}
        onOpenChange={(open) => !open && setInspectCategory(null)}
      >
        <DialogContent className="sm:max-w-xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span>Courses in {inspectCategory?.name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {inspectCategory && getCoursesForCategory(inspectCategory.name).length} courses currently
              mapped to this taxonomy discipline.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1">
            {inspectCategory &&
              getCoursesForCategory(inspectCategory.name).map((course) => (
                <div
                  key={course.id}
                  className="p-3 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-semibold text-foreground truncate">{course.title}</p>
                    <p className="text-muted-foreground text-[11px]">
                      Instructor: {course.instructorName || "Faculty Assigned"} • Level:{" "}
                      {course.level || "General"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={course.published ? "default" : "secondary"}
                      className="text-[10px] font-mono"
                    >
                      {course.published ? "Published" : "Draft"}
                    </Badge>
                    <Link
                      href={`/admin/courses`}
                      className="text-primary hover:underline font-medium text-[11px]"
                    >
                      View in Review
                    </Link>
                  </div>
                </div>
              ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInspectCategory(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
