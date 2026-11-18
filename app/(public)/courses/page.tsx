"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Search, SlidersHorizontal, Sparkles, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { AuthGateModal } from "@/components/skillup/auth-gate-modal"
import { CourseCard } from "@/components/skillup/course-card"
import { FilterPanel } from "@/components/skillup/filter-panel"
import { DigitalGridMotif, MakerLanguageMotif, MotifLoadingState } from "@/components/brand/motifs"
import { useToast } from "@/hooks/use-toast"
import { usePurchaseGuard } from "@/hooks/use-purchase-guard"
import { useAuthStore, useCartStore, usePreferencesStore } from "@/lib/store"
import type { Category, Course } from "@/lib/types"

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [levelFilter, setLevelFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("popular")

  const { currency } = usePreferencesStore()
  const { addToCart, items } = useCartStore()
  const { user } = useAuthStore()
  const { toast } = useToast()
  const { isAuthGateOpen, setIsAuthGateOpen, loginHref, registerHref, requirePurchaseAuth, consumeStoredIntent } =
    usePurchaseGuard()
  const restoredIntentRef = useRef(false)

  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true)
      try {
        const [coursesRes, categoriesRes] = await Promise.all([fetch("/api/courses"), fetch("/api/categories")])
        const courseData = await coursesRes.json()
        const categoryData = await categoriesRes.json()
        const allCourses = (courseData.courses || []) as Course[]

        setCourses(allCourses)
        setFilteredCourses(allCourses)
        setCategories(categoryData.categories || [])
      } catch {
        setCourses([])
        setFilteredCourses([])
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [])

  useEffect(() => {
    let filtered = [...courses]

    if (searchQuery) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((course) => course.category === categoryFilter)
    }

    if (levelFilter !== "all") {
      filtered = filtered.filter((course) => course.level === levelFilter)
    }

    if (sortBy === "popular") {
      filtered.sort((a, b) => b.enrollmentCount - a.enrollmentCount)
    } else if (sortBy === "rating") {
      filtered.sort((a, b) => b.rating - a.rating)
    } else if (sortBy === "price-low") {
      filtered.sort((a, b) => a.price[currency] - b.price[currency])
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => b.price[currency] - a.price[currency])
    }

    setFilteredCourses(filtered)
  }, [searchQuery, categoryFilter, levelFilter, sortBy, courses, currency])

  useEffect(() => {
    if (!user || restoredIntentRef.current) return
    const pending = consumeStoredIntent()
    if (!pending) return

    const matchedCourse = courses.find((course) => course.id === pending.courseId || course.slug === pending.courseSlug)
    if (!matchedCourse) return

    restoredIntentRef.current = true

    if (!items.find((item) => item.courseId === matchedCourse.id)) {
      addToCart({ courseId: matchedCourse.id, course: matchedCourse })
    }
    toast({
      title: "Enrollment resumed",
      description:
        pending.action === "buy_now"
          ? "We added the course to your cart. Continue checkout."
          : "Course added to cart successfully.",
    })
  }, [user, courses, items, addToCart, consumeStoredIntent, toast])

  const clearFilters = () => {
    setSearchQuery("")
    setCategoryFilter("all")
    setLevelFilter("all")
    setSortBy("popular")
  }

  const handleAddToCart = (course: Course) => {
    if (user && user.enrolledCourses.includes(course.id)) {
      toast({
        title: "Already enrolled",
        description: "You are already enrolled in this course.",
        variant: "destructive",
      })
      return
    }

    if (items.find((item) => item.courseId === course.id)) {
      toast({ title: "Already in cart", description: "This course is already in your cart." })
      return
    }

    addToCart({ courseId: course.id, course })
    toast({ title: "Added to cart", description: `${course.title} has been added to your cart.` })
  }

  const handleGuardedAddToCart = (course: Course) => {
    requirePurchaseAuth(
      { action: "add_to_cart", courseId: course.id, courseSlug: course.slug },
      () => handleAddToCart(course),
    )
  }

  const hasActiveFilters = searchQuery.length > 0 || categoryFilter !== "all" || levelFilter !== "all" || sortBy !== "popular"
  const quickCategories = useMemo(() => categories.slice(0, 5), [categories])

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onRemove: () => void }> = []
    if (searchQuery) chips.push({ key: "search", label: `Search: ${searchQuery}`, onRemove: () => setSearchQuery("") })
    if (categoryFilter !== "all") chips.push({ key: "category", label: `Category: ${categoryFilter}`, onRemove: () => setCategoryFilter("all") })
    if (levelFilter !== "all") chips.push({ key: "level", label: `Level: ${levelFilter}`, onRemove: () => setLevelFilter("all") })
    if (sortBy !== "popular") {
      const sortMap: Record<string, string> = {
        rating: "Highest Rated",
        "price-low": "Price: Low to High",
        "price-high": "Price: High to Low",
      }
      chips.push({ key: "sort", label: `Sort: ${sortMap[sortBy] || sortBy}`, onRemove: () => setSortBy("popular") })
    }
    return chips
  }, [searchQuery, categoryFilter, levelFilter, sortBy])

  return (
    <div className="pb-16">
      {/* Rebrand V2 Courses Hero with Digital Grid & Maker Motifs */}
      <section className="relative overflow-hidden bg-skillup-hero py-12 text-white md:py-16">
        <DigitalGridMotif className="pointer-events-none absolute left-0 top-0 h-56 w-96 text-[#D6FFF6] opacity-25" />
        <MakerLanguageMotif className="pointer-events-none absolute right-6 bottom-4 hidden h-36 w-56 text-[#D6FFF6] opacity-35 lg:block" />

        <div className="container relative z-10 max-w-5xl space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="mint">
              <Sparkles className="h-3.5 w-3.5" />
              Course Catalog &bull; Teens (13–18) &amp; Adults
            </Badge>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-[#E8E3F5]">
              2 Free Foundation Courses Included
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Explore Practical <span className="text-[#D6FFF6]">Digital Tech Courses</span>
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[#E8E3F5]/90 sm:text-base">
              Master software engineering, applied AI, graphic design, video editing, and digital marketing with
              structured cohort mentorship and rubric-verified capstones.
            </p>
          </div>

          {/* Accessible Hero Search Bar */}
          <div className="max-w-2xl space-y-3">
            <label htmlFor="catalog-hero-search" className="sr-only">
              Search courses by title or topic
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A5373]" />
              <Input
                id="catalog-hero-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search courses by title, skill, or topic..."
                className="h-12 rounded-2xl border-white/20 bg-white pl-10 text-[#150C33] placeholder:text-[#5A5373]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={categoryFilter === "all" ? "mint" : "outline-dark"}
                size="sm"
                className="rounded-full"
                onClick={() => setCategoryFilter("all")}
              >
                All Tracks
              </Button>
              {quickCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={categoryFilter === category.name ? "mint" : "outline-dark"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setCategoryFilter(category.name)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="container mt-8 space-y-6">
        <div className="flex items-center justify-between lg:hidden">
          <p className="text-sm font-medium text-muted-foreground">Showing {filteredCourses.length} programmes</p>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-sm overflow-y-auto border-border bg-background p-0">
              <SheetHeader className="border-b border-border px-5 py-4">
                <SheetTitle className="font-display text-[#231651]">Course Filters</SheetTitle>
              </SheetHeader>
              <div className="p-5">
                <FilterPanel
                  searchQuery={searchQuery}
                  categoryFilter={categoryFilter}
                  levelFilter={levelFilter}
                  sortBy={sortBy}
                  categories={categories}
                  totalCourses={courses.length}
                  shownCourses={filteredCourses.length}
                  onSearchChange={setSearchQuery}
                  onCategoryChange={setCategoryFilter}
                  onLevelChange={setLevelFilter}
                  onSortChange={setSortBy}
                  onClear={clearFilters}
                  hasActiveFilters={hasActiveFilters}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {activeFilterChips.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {activeFilterChips.map((chip) => (
              <Badge key={chip.key} variant="lavender" className="gap-1.5 px-3 py-1">
                {chip.label}
                <button
                  type="button"
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-[#231651] cursor-pointer"
                  onClick={chip.onRemove}
                  aria-label={`Remove ${chip.label} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <FilterPanel
                searchQuery={searchQuery}
                categoryFilter={categoryFilter}
                levelFilter={levelFilter}
                sortBy={sortBy}
                categories={categories}
                totalCourses={courses.length}
                shownCourses={filteredCourses.length}
                onSearchChange={setSearchQuery}
                onCategoryChange={setCategoryFilter}
                onLevelChange={setLevelFilter}
                onSortChange={setSortBy}
                onClear={clearFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </aside>

          <div className="space-y-5">
            <div className="hidden items-center justify-between rounded-2xl border border-border bg-card px-5 py-3 text-sm text-muted-foreground lg:flex">
              <span className="font-medium text-[#231651]">Showing {filteredCourses.length} programmes</span>
              {hasActiveFilters ? (
                <Button size="sm" variant="ghost" onClick={clearFilters}>
                  Clear all filters
                </Button>
              ) : null}
            </div>

            {loading ? (
              <MotifLoadingState label="Loading SkillUp course catalog..." />
            ) : filteredCourses.length === 0 ? (
              <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center">
                <img
                  src="/images/illustrations/empty-courses.svg"
                  alt="No matching courses"
                  className="mb-4 h-28 w-44 object-contain"
                />
                <h3 className="font-display text-lg font-bold text-[#231651]">No courses match those filters</h3>
                <p className="mt-1 text-sm text-muted-foreground">Try clearing a filter or searching another keyword.</p>
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    currency={currency}
                    showCartAction
                    isEnrolled={Boolean(user?.enrolledCourses.includes(course.id))}
                    onAddToCart={handleGuardedAddToCart}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AuthGateModal
        open={isAuthGateOpen}
        onOpenChange={setIsAuthGateOpen}
        loginHref={loginHref}
        registerHref={registerHref}
      />
    </div>
  )
}
