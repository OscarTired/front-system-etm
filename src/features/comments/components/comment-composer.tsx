"use client"

import { useEffect, useLayoutEffect, useRef, useState, KeyboardEvent, ChangeEvent } from "react"
import { Camera, SendHorizontal, X } from "lucide-react"
import { PrimaryAction } from "@/shared/ui/actions/primary-action"
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
  // Modo respuesta — banner "Respondiendo a X" arriba del textarea,
  // igual estructura visual que el de "Editando comentario" (mismo
  // patrón, no un componente nuevo). Editar y responder son
  // mutuamente excluyentes: si llega editingComment, ese gana (ver
  // isEditing más abajo).
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
  // Editar un comentario propio no exige un permiso aparte (ver
  // CommentItem: canEdit depende solo de isOwner) — COMMENT_CREATE
  // solo aplica al flujo de publicar uno nuevo.
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
        .catch(() => {
        })

    } else {

      createComment({
        message: trimmed || undefined,
        imageBase64: selectedImage ?? undefined,
        parentId: replyingTo?.id,
      }).catch(() => {
      })

      onCancelReply?.()

    }

    flushSync(() => {
      setMessage("")
      setSelectedImage(null)
      setMentionQuery(null)
    })

    const el = textareaRef.current

    if (el) {
      // Fuerza un layout síncrono para que el navegador
      // repinte completamente el ::placeholder.
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

  return (

    <div className="flex min-h-0 flex-1 flex-col rounded-xl bg-white/2 p-2.5">

      {isEditing && (

        <div className="mb-1.5 flex items-center justify-between rounded-lg bg-white/5 px-2.5 py-1.5">
          <span className="text-xs font-medium text-cyan-300">Editando comentario</span>
          <IconAction icon={X} onClick={handleCancel} />
        </div>

      )}

      {isReplying && replyingTo && (

        <div className="mb-1.5 flex items-center justify-between gap-2 rounded-lg bg-white/5 px-2.5 py-1.5">

          <div className="min-w-0">
            <span className="text-xs font-medium text-cyan-300">
              Respondiendo a {replyingTo.user.name}
            </span>
            <p className="truncate text-xs text-neutral-500">
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

      <Popover
        open={mentionOpen}
        onOpenChange={(next) => {
          if (!next) setMentionQuery(null)
        }}
      >

        <PopoverAnchor asChild>

          <div className="flex min-h-0 flex-1 gap-4">

            {selectedImage && (

              <div className="relative shrink-0">

                <img
                  src={selectedImage}
                  alt="Foto adjunta"
                  className="h-16 w-16 rounded-lg object-cover"
                />

                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                >
                  <X size={12} />
                </button>

              </div>

            )}

            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={busy || !canCreate}
              placeholder={
                canCreate
                  ? "Escribe y usa @ para mencionar"
                  : "No tienes permisos para comentar"
              }
              className="text-sm font-medium min-h-9 min-w-0 flex-1 resize-none bg-transparent text-white outline-none placeholder:text-neutral-600"
            />

          </div>

        </PopoverAnchor>

        {mentionOpen && (
          <MentionSuggestions users={filteredUsers} onSelect={handleSelectMention} />
        )}

      </Popover>

      <div className="mt-1 flex items-center justify-between">

        {!isEditing && (

          <IconAction
            icon={Camera}
            disabled={!canCreate}
            onClick={() => fileInputRef.current?.click()}
          />

        )}

        <PrimaryAction
          label={isEditing ? "Guardar" : "Publicar"}
          icon={SendHorizontal}
          isLoading={busy}
          onClick={handleSubmit}
          disabled={(!message.trim() && !selectedImage) || busy || !canCreate}
        />

      </div>

    </div>

  )

}