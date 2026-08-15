export type WorkflowActionPayload = {
  piecesOutput?: number | null
  plRtReal?: number | null
  paintKgReal?: number | null
}

export type WorkflowUpdatePayload = {
  operatorId?: string | null
  coOperatorIds?: string[]
  piecesOutput?: number | null
  plRtReal?: number | null
  paintKgReal?: number | null
}