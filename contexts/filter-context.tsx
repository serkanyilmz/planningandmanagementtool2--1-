"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export interface FilterState {
  keyword: string
  myTasksOnly: boolean
  selectedLabelIds: string[]
  dueDateSort: "closest" | "furthest" | "none"
}

interface FilterContextType {
  filters: FilterState
  pendingFilters: FilterState
  setPendingKeyword: (keyword: string) => void
  setPendingMyTasksOnly: (value: boolean) => void
  togglePendingLabelFilter: (labelId: string) => void
  setPendingSelectedLabelIds: (ids: string[]) => void
  setPendingDueDateSort: (sort: "closest" | "furthest" | "none") => void
  applyFilters: () => void
  resetFilters: () => void
  resetPendingFilters: () => void
  hasActiveFilters: boolean
  hasPendingChanges: boolean
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

const defaultFilters: FilterState = {
  keyword: "",
  myTasksOnly: false,
  selectedLabelIds: [],
  dueDateSort: "none",
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [pendingFilters, setPendingFilters] = useState<FilterState>(defaultFilters)

  const setPendingKeyword = useCallback((keyword: string) => {
    setPendingFilters((prev) => ({ ...prev, keyword }))
  }, [])

  const setPendingMyTasksOnly = useCallback((value: boolean) => {
    setPendingFilters((prev) => ({ ...prev, myTasksOnly: value }))
  }, [])

  const togglePendingLabelFilter = useCallback((labelId: string) => {
    setPendingFilters((prev) => ({
      ...prev,
      selectedLabelIds: prev.selectedLabelIds.includes(labelId)
        ? prev.selectedLabelIds.filter((id) => id !== labelId)
        : [...prev.selectedLabelIds, labelId],
    }))
  }, [])

  const setPendingSelectedLabelIds = useCallback((ids: string[]) => {
    setPendingFilters((prev) => ({ ...prev, selectedLabelIds: ids }))
  }, [])

  const setPendingDueDateSort = useCallback((sort: "closest" | "furthest" | "none") => {
    setPendingFilters((prev) => ({ ...prev, dueDateSort: sort }))
  }, [])

  const applyFilters = useCallback(() => {
    setFilters(pendingFilters)
  }, [pendingFilters])

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
    setPendingFilters(defaultFilters)
  }, [])

  const resetPendingFilters = useCallback(() => {
    setPendingFilters(filters)
  }, [filters])

  const hasActiveFilters =
    filters.keyword !== "" ||
    filters.myTasksOnly ||
    filters.selectedLabelIds.length > 0 ||
    filters.dueDateSort !== "none"

  const hasPendingChanges =
    pendingFilters.keyword !== filters.keyword ||
    pendingFilters.myTasksOnly !== filters.myTasksOnly ||
    JSON.stringify(pendingFilters.selectedLabelIds) !== JSON.stringify(filters.selectedLabelIds) ||
    pendingFilters.dueDateSort !== filters.dueDateSort

  return (
    <FilterContext.Provider
      value={{
        filters,
        pendingFilters,
        setPendingKeyword,
        setPendingMyTasksOnly,
        togglePendingLabelFilter,
        setPendingSelectedLabelIds,
        setPendingDueDateSort,
        applyFilters,
        resetFilters,
        resetPendingFilters,
        hasActiveFilters,
        hasPendingChanges,
      }}
    >
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error("useFilters must be used within a FilterProvider")
  }
  return context
}
