"use client"

import { useQuery } from "@tanstack/react-query"
import { areasService } from "../services/areas.service"

export function useAreas(enabled = true) {

  const { data, isLoading } = useQuery({
    queryKey: ["areas"],
    queryFn: ({ signal }) => areasService.getAll(signal),
    enabled,
    // Las 6 áreas de Producción no cambian casi nunca — mismo
    // criterio que useActivityTypes.
    staleTime: 1000 * 60 * 10,
  })

  return {
    areas: data ?? [],
    loading: isLoading,
  }

}