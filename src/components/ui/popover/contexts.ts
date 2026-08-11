"use client"

import * as React from "react"

export const PopoverModeContext = React.createContext(false)
export const PopoverCloseContext = React.createContext<() => void>(() => {})
export const PopoverOpenContext = React.createContext(false)
