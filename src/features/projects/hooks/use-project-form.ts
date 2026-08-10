"use client"

import {
  useEffect,
  useState,
} from "react"

import type {
  Project,
} from "../types/project.types"

export type ProjectFormValue = {

  projectCode:string

  name:string

  clientId:string

  pmId:string

  stageId:string

  statusId:string

  deliveryDate:string | null

}

const initialForm:ProjectFormValue={

  projectCode:"",

  name:"",

  clientId:"",

  pmId:"",

  stageId:"",

  statusId:"",

  deliveryDate:null,

}

const mapProjectToForm = (
  project: Project,
): ProjectFormValue => ({

  projectCode: project.projectCode,

  name: project.name,

  clientId: project.client.id,

  pmId: project.pm.id,

  stageId: project.stage.id,

  statusId: project.status.id,

  deliveryDate:
    project.deliveryDate
      ? project.deliveryDate.slice(0,10)
      : null,
      
})

export function useProjectForm(
  project?:Project,
){

  const [
    form,
    setForm,
  ]=
    useState<ProjectFormValue>(

      project

        ? mapProjectToForm(
            project,
          )

        : initialForm,

    )

  // Solo re-mapear al cambiar de proyecto (id). Si dependemos del
  // objeto entero, un refetch/stale cache pisa la fecha que el usuario
  // acaba de guardar o editar.
  useEffect(() => {
    setForm(project ? mapProjectToForm(project) : initialForm)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo project.id
  }, [project?.id])

  const update=(
    data:Partial<ProjectFormValue>,
  )=>{

    setForm(
      current=>({

        ...current,

        ...data,

      }),
    )

  }

  const reset=()=>{

    setForm(

      project

        ? mapProjectToForm(
            project,
          )

        : initialForm,

    )

  }

  const canSave=
    Boolean(

      form.projectCode.trim() &&

      form.name.trim() &&

      form.clientId &&

      form.pmId &&

      form.stageId &&

      form.statusId &&

      form.deliveryDate,

    )

  const buildProject=()=>({

    ...form,

  })

  return {

    form,

    update,

    reset,

    buildProject,

    canSave,

  }

}