"use client"

import {
  useMemo,
  useState,
} from "react"

import {
  useResponsive,
} from "@/shared/responsive/hooks/use-responsive"

import {
  EntityTable,
} from "@/shared/ui/entity-table"

import {
  EntityTableSkeleton,
} from "@/shared/ui/entity-table"

import {
  useUsers,
} from "@/features/users/hooks/use-users"

import {
  UserMobileCard,
} from "../components/cards/user-mobile-card"

import {
  UserMobileSkeleton,
} from "../components/cards/user-mobile-skeleton"

import {
  useUserColumns,
} from "./user-columns"

type Props = {
  search: string
}

export function UserTable({
  search,
}: Props) {
  const {
    isMobile,
  } =
    useResponsive()

  const {
    users,
    loading,
  } =
    useUsers()

  const columns =
    useUserColumns()

  const [
    expandedUserId,
    setExpandedUserId,
  ] =
    useState<string | null>(null)

  const data =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      return users.filter(user =>
        !query ||
        user.name
          .toLowerCase()
          .includes(query) ||
        user.email
          .toLowerCase()
          .includes(query) ||
        (
          user.username ??
          ""
        )
          .toLowerCase()
          .includes(query),
      )
    }, [
      users,
      search,
    ])

  if (loading) {

    if (isMobile) {
      return <UserMobileSkeleton />
    }

    return (
      <EntityTableSkeleton
        columns={columns}
      />
    )
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {data.length ? (
          data.map((user, index) => (
            <UserMobileCard
              key={user.id}
              user={user}
              index={index}
              expanded={
                expandedUserId === user.id
              }
              onToggle={() =>
                setExpandedUserId(current =>
                  current === user.id
                    ? null
                    : user.id,
                )
              }
            />
          ))
        ) : (
          <div className="rounded-2xl bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
            Sin usuarios
          </div>
        )}
      </div>
    )
  }

  return (
    <EntityTable
      data={data}
      columns={columns}
      rowId={user => user.id}
      emptyMessage="Sin usuarios"
    />
  )
}