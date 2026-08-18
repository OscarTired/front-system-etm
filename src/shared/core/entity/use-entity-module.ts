"use client"

import { useEffect, useRef } from "react"
import { useMutation,useQuery,useQueryClient } from "@tanstack/react-query"

import { sidebarCountsQueryKey } from "@/shared/responsive/layout/hooks/use-sidebar-counts"

type EntityWithId={id:string}

export type CacheHandlers<T extends EntityWithId>={
  onCreate?:(items:T[],created:T)=>T[]
  onUpdate?:(items:T[],updated:T)=>T[]
  onRemove?:(items:T[],id:string)=>T[]
}

type EntityService<T,CreateDto,UpdateDto=CreateDto>={
  findAll:(signal?:AbortSignal)=>Promise<T[]>
  create:(dto:CreateDto)=>Promise<T>
  update:(id:string,dto:UpdateDto)=>Promise<T>
  remove:(id:string)=>Promise<void>
}

export type EntityModuleOptions={
  enabled?:boolean
}

const SINGULARS: Record<string, string> = {
  processes: "process",
  priorities: "priority",
  statuses: "status",
  thicknesses: "thickness",
}

function toSingular(key: string): string {
  return SINGULARS[key] ?? key.slice(0, -1)
}

// Un solo Set global por queryKey: garantiza que el loop de
// "poblar cache individual por ítem" corra UNA vez por dato nuevo
// real, sin importar cuántos componentes (sidebar + página activa,
// etc.) estén usando useEntityModule con la misma key al mismo
// tiempo. Antes, cada consumidor repetía el loop completo sobre
// la lista entera cada vez que `query.data` cambiaba de referencia
// (lo cual pasa en cada refetch, aunque los datos sean idénticos),
// multiplicando el trabajo síncrono por cantidad de consumidores.
const processedDataRefs = new WeakSet<object>()

export function useEntityModule<
  T extends EntityWithId,
  CreateDto,
  UpdateDto=CreateDto,
>(
  key:string,
  service:EntityService<T,CreateDto,UpdateDto>,
  handlers?:CacheHandlers<T>,
  options?:EntityModuleOptions,
){

  const qc=useQueryClient()

  const listKey=[key] as const

  const entityKey=(id:string)=>[
    toSingular(key),
    id,
  ] as const

  const query=useQuery<T[]>({
    queryKey:listKey,
    queryFn:({signal})=>service.findAll(signal),
    enabled:options?.enabled??true,
  })

  useEffect(()=>{

    if(!query.data)return

    // Si esta referencia exacta de array ya fue procesada por
    // CUALQUIER consumidor (sidebar, página, etc.), no repetir
    // el loop — WeakSet se limpia solo cuando el array deja de
    // ser referenciado (garbage collection), sin fugas de memoria.
    if(processedDataRefs.has(query.data)) return

    processedDataRefs.add(query.data)

    for(const item of query.data){

      const cached=
        qc.getQueryData<T>(
          entityKey(item.id),
        )

      if(cached!==undefined)continue

      qc.setQueryData<T>(
        entityKey(item.id),
        item,
      )

    }

  },[
    qc,
    query.data,
  ])

  const create=useMutation({

    mutationFn:service.create,

    onSuccess:async created=>{

      // El backend excluye al propio actor de su propio evento de
      // tiempo real (excludeUserId) — a propósito, para no
      // reprocesar tu propia acción como si viniera de otro lado.
      // Pero eso significa que SIN esto, el contador del sidebar
      // (proyectos activos, tareas activas, por proceso) se quedaba
      // desactualizado para quien acaba de crear algo, hasta que
      // recargara la página a mano — mientras que otros usuarios sí
      // lo veían actualizarse solos vía el handler de realtime.
      qc.invalidateQueries({
        queryKey:sidebarCountsQueryKey,
      })

      if(!handlers?.onCreate){

        await qc.invalidateQueries({
          queryKey:listKey,
        })

        return

      }

      qc.setQueryData<T[]>(
        listKey,
        current=>
          handlers.onCreate!(
            current??[],
            created,
          ),
      )

      qc.setQueryData<T>(
        entityKey(created.id),
        created,
      )

    },

  })

  const update=useMutation<
    T,
    Error,
    {
      id:string
      dto:UpdateDto
      optimistic?:Partial<T>
    },
    {
      previous:T[]
    }
  >({

    mutationFn:({id,dto})=>
      service.update(
        id,
        dto,
      ),

    onMutate:async({
      id,
      optimistic,
    })=>{

      await qc.cancelQueries({
        queryKey:listKey,
      })

      const previous=
        qc.getQueryData<T[]>(listKey)??[]

      if(optimistic){

        qc.setQueryData<T[]>(
          listKey,
          items=>
            (items??[]).map(
              item=>
                item.id===id
                  ?{
                      ...item,
                      ...optimistic,
                    }
                  :item,
            ),
        )

        const current=
          qc.getQueryData<T>(
            entityKey(id),
          )

        if(current){

          qc.setQueryData<T>(
            entityKey(id),
            {
              ...current,
              ...optimistic,
            },
          )

        }

      }

      return{
        previous,
      }

    },

    onError:(
      _,
      __,
      context,
    )=>{

      if(!context)return

      qc.setQueryData(
        listKey,
        context.previous,
      )

      for(const item of context.previous){

        qc.setQueryData<T>(
          entityKey(item.id),
          item,
        )

      }

    },

    onSuccess: async updated => {
      qc.invalidateQueries({
        queryKey: sidebarCountsQueryKey,
      })

      // Siempre volcar el entity actualizado en la lista YA
      // (no esperar al refetch de invalidate — causa "no se actualiza de una").
      if (handlers?.onUpdate) {
        qc.setQueryData<T[]>(listKey, current =>
          handlers.onUpdate!(current ?? [], updated),
        )
      } else {
        qc.setQueryData<T[]>(listKey, current =>
          (current ?? []).map(item =>
            item.id === updated.id ? updated : item,
          ),
        )
      }

      qc.setQueryData<T>(entityKey(updated.id), updated)

      // Revalidate en background sin bloquear UI
      void qc.invalidateQueries({ queryKey: listKey })
    },

  })

  const remove=useMutation({

    mutationFn:service.remove,

    onSuccess:async(_,id)=>{

      qc.invalidateQueries({
        queryKey:sidebarCountsQueryKey,
      })

      if(handlers?.onRemove){

        qc.setQueryData<T[]>(
          listKey,
          current=>
            handlers.onRemove!(
              current??[],
              id,
            ),
        )

      }else{

        await qc.invalidateQueries({
          queryKey:listKey,
        })

      }

      qc.removeQueries({
        queryKey:entityKey(id),
      })

    },

  })

  return{
    items:query.data??[],
    loading:query.isLoading,
    refreshing:query.isFetching,
    create:create.mutateAsync,
    update:update.mutateAsync,
    remove:remove.mutateAsync,
  }

}