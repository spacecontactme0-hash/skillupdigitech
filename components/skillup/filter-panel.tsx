"use client"

import { Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { Category } from "@/lib/types"

interface FilterPanelProps {
  searchQuery: string
  categoryFilter: string
  levelFilter: string
  sortBy: string
  categories: Category[]
  totalCourses: number
  shownCourses: number
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onLevelChange: (value: string) => void
  onSortChange: (value: string) => void
  onClear: () => void
  hasActiveFilters: boolean
}

export function FilterPanel({
  searchQuery,
  categoryFilter,
  levelFilter,
  sortBy,
  categories,
  totalCourses,
  shownCourses,
  onSearchChange,
  onCategoryChange,
  onLevelChange,
  onSortChange,
  onClear,
  hasActiveFilters,
}: FilterPanelProps) {
  return (
    <Card variant="elevated" className="rounded-3xl border-border bg-card py-0">
      <CardHeader className="border-b border-border/70 bg-[#F8FAFB] py-4 rounded-t-3xl">
        <CardTitle className="font-display text-base font-bold text-[#231651]">Filter Courses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-5">
        <div className="space-y-1.5">
          <label htmlFor="course-search-sidebar" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="course-search-sidebar"
              placeholder="Search by title or skill..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="filter-category" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Category
          </label>
          <Select value={categoryFilter} onValueChange={onCategoryChange}>
            <SelectTrigger id="filter-category" aria-label="Filter courses by category" className="h-11 w-full rounded-xl">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="filter-level" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Level
          </label>
          <Select value={levelFilter} onValueChange={onLevelChange}>
            <SelectTrigger id="filter-level" aria-label="Filter courses by level" className="h-11 w-full rounded-xl">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Beginner Courses">Beginner Courses</SelectItem>
              <SelectItem value="Intermediate Courses">Intermediate Courses</SelectItem>
              <SelectItem value="Pro Courses">Pro Courses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="filter-sort" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Sort By
          </label>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger id="filter-sort" aria-label="Sort courses" className="h-11 w-full rounded-xl">
              <SelectValue placeholder="Most Popular" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-2xl border border-border bg-[#F8FAFB] p-3 font-mono text-xs text-muted-foreground">
          Showing {shownCourses} of {totalCourses} courses
        </div>

        {hasActiveFilters ? (
          <Button variant="outline" className="w-full" onClick={onClear}>
            Clear Filters
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
