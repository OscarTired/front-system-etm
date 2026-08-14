"use client"

import { useEffect, useRef, useState, KeyboardEvent, ChangeEvent } from "react"
import { Camera, SendHorizontal, X } from "lucide-react"
import { IconAction } from "@/shared/ui/actions/icon-action"
import { Popover, PopoverAnchor } from "@/components/ui/popover"
import { PermissionCode } from "@/shared/core/enums/permission-code.enum"
import { usePermissions } from "@/features/permissions/hooks/use-permissions"
import { useCreateComment } from "../hooks/use-create-comment"
import { useUpdateComment } from "../hooks/use-update-comment"
import { useMentionableUsers } from "../hooks/use-mentionable-users"
import { MentionSuggestions } from "./mention-suggestions"
import type { Comment, CommentTarget } from "../types/comment.types"
import { flushSync } from "react-dom"

type Props = {
  target: CommentTarget
  editingComment?: Comment | null
  onCancelEdit?: () => void
  replyingTo?: Comment | null
  onCancelReply?: () => void
}

export function CommentComposer({
  target,
  editingComment,
  onCancelEdit,
  replyingTo,
  onCancelReply,
}: Props) {

  const [message, setMessage] = useState("")
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { createComment } = useCreateComment(target)
  const { updateComment, updating } = useUpdateComment(target)
  const { users } = useMentionableUsers()

  const isEditing = !!editingComment
  const isReplying = !isEditing && !!replyingTo

  const { has } = usePermissions()
  const canCreate = isEditing || has(PermissionCode.COMMENT_CREATE)

  const busy = updating

  useEffect(() => {
    setMessage(editingComment?.message ?? "")
  }, [editingComment])

  useEffect(() => {
    if (replyingTo) {
      requestAnimationFrame(() => textareaRef.current?.focus())
    }
  }, [replyingTo])

  const filteredUsers = mentionQuery === null
    ? []
    : users.filter(u =>
        u.username?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        u.name.toLowerCase().includes(mentionQuery.toLowerCase()),
      )

  const mentionOpen = mentionQuery !== null && filteredUsers.length > 0

  const detectMentionQuery = (value: string, cursor: number) => {
    const upToCursor = value.slice(0, cursor)
    const match = upToCursor.match(/@([a-zA-Z0-9_.]*)$/)
    setMentionQuery(match ? match[1] : null)
  }

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    detectMentionQuery(e.target.value, e.target.selectionStart)
  }

  const handleSelectMention = (username: string) => {
    const cursor = textareaRef.current?.selectionStart ?? message.length
    const upToCursor = message.slice(0, cursor)
    const afterCursor = message.slice(cursor)

    const replaced = upToCursor.replace(/@([a-zA-Z0-9_.]*)$/, `@${username} `)

    const newMessage = replaced + afterCursor
    setMessage(newMessage)
    setMentionQuery(null)

    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
  }

  const handleCancel = () => {
    setMessage("")
    setSelectedImage(null)
    onCancelEdit?.()
    onCancelReply?.()
  }

  const handleSelectImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""

    if (!file) return

    const reader = new FileReader()

    reader.onload = () => {
      setSelectedImage(reader.result as string)
    }

    reader.readAsDataURL(file)
  }

  const handleSubmit = () => {
    const trimmed = message.trim()

    if ((!trimmed && !selectedImage) || busy || !canCreate) return

    if (isEditing && editingComment) {
      updateComment({ id: editingComment.id, dto: { message: trimmed } })
        .then(() => onCancelEdit?.())
        .catch(() => {})
    } else {
      createComment({
        message: trimmed || undefined,
        imageBase64: selectedImage ?? undefined,
        parentId: replyingTo?.id,
      }).catch(() => {})

      onCancelReply?.()
    }

    flushSync(() => {
      setMessage("")
      setSelectedImage(null)
      setMentionQuery(null)
    })

    const el = textareaRef.current
    if (el) {
      void el.offsetHeight
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && filteredUsers.length > 0) {
      if (e.key === "Escape") {
        e.preventDefault()
        setMentionQuery(null)
        return
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }

    if (e.key === "Escape" && (isEditing || isReplying) && mentionQuery === null) {
      handleCancel()
    }
  }

  const canSubmit =
    (!!message.trim() || !!selectedImage) && !busy && canCreate

  return (
    <div className="flex flex-col gap-1.5 rounded-2xl bg-foreground/[0.06] px-2 py-1.5">
      {isEditing && (
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="text-[11px] font-medium text-primary">
            Editando comentario
          </span>
          <IconAction icon={X} onClick={handleCancel} />
        </div>
      )}

      {isReplying && replyingTo && (
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-primary">
              Respondiendo a {replyingTo.user.name}
            </span>
            <p className="truncate text-[11px] text-muted-foreground">
              {replyingTo.message || "📷 Foto"}
            </p>
          </div>
          <IconAction icon={X} onClick={handleCancel} />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSelectImage}
      />

      {selectedImage && (
        <div className="relative w-fit px-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedImage}
            alt="Foto adjunta"
            className="size-12 rounded-lg object-cover"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            aria-label="Quitar foto"
            className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-popover text-foreground shadow-sm hover:bg-accent"
          >
            <X size={11} />
          </button>
        </div>
      )}

      <Popover
        forceFloating
        open={mentionOpen}
        onOpenChange={next => {
          if (!next) setMentionQuery(null)
        }}
      >
        <PopoverAnchor asChild>
          <div className="flex items-end gap-1">
            {!isEditing && (
              <IconAction
                icon={Camera}
                disabled={!canCreate}
                onClick={() => fileInputRef.current?.click()}
              />
            )}

            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={busy || !canCreate}
              rows={1}
              placeholder={
                canCreate
                  ? "Mensaje…  @mencionar"
                  : "Sin permiso para comentar"
              }
              className="max-h-24 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
            />

            <button
              type="button"
              aria-label={isEditing ? "Guardar" : "Enviar"}
              title={isEditing ? "Guardar" : "Enviar"}
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition enabled:hover:opacity-90 enabled:active:scale-95 disabled:opacity-40"
            >
              <SendHorizontal size={16} strokeWidth={2} />
            </button>
          </div>
        </PopoverAnchor>

        {mentionOpen && (
          <MentionSuggestions
            users={filteredUsers}
            onSelect={handleSelectMention}
          />
        )}
      </Popover>
    </div>
  )
}