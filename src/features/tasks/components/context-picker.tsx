"use client"

import {
  useMemo,
  useRef,
  useState,
} from "react"

import {
  ChevronDown,
  Search,
} from "lucide-react"

import {
  cn,
} from "@/shared/utils/utils"

import {
  useResponsive,
} from "@/shared/responsive/hooks/use-responsive"

import {
  Input,
} from "@/components/ui/input"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandList,
} from "@/components/ui/command"

import {
  SelectOption,
} from "@/shared/ui/select-option/select-option"

import {
  useProjects,
} from "@/features/projects/hooks/use-projects"

import {
  isProjectCompleted,
} from "@/features/projects/selectors/is-project-completed"

import {
  useTasks,
} from "@/features/tasks/hooks/use-tasks"

export type ContextPickerValue = {
  projectId: string
  taskId: string
}

type ContextPickerMode =
  | "both"
  | "projects"
  | "tasks"

type Props = {
  value: ContextPickerValue
  onChange: (value: ContextPickerValue) => void
  // "both" (default): busca proyectos y tareas juntos, las tareas
  // sólo aparecen una vez que hay texto escrito (para no mezclar
  // TODAS las tareas de TODOS los proyectos sin filtrar).
  // "projects": no ofrece tareas, sólo proyectos.
  // "tasks": no ofrece proyectos, sólo tareas — y a diferencia de
  // "both", las lista completas aunque no haya búsqueda todavía.
  mode?: ContextPickerMode
  // Sólo aplica con mode="tasks": limita la lista a las tareas de
  // este proyecto. Sin esto, "tasks" mostraría tareas de todos los
  // proyectos mezcladas — pensado para usarse junto a otro
  // ContextPicker en mode="projects" que defina este id primero.
  taskProjectId?: string
}

export function ContextPicker({
  value,
  onChange,
  mode = "both",
  taskProjectId,
}: Props) {

  const [
    open,
    setOpen,
  ] = useState(false)

  const [
    query,
    setQuery,
  ] = useState("")

  const inputRef =
    useRef<HTMLInputElement>(null)

  const { isCompact } = useResponsive()

  const showProjects =
    mode !== "tasks"

  const showTasks =
    mode !== "projects"

  const {
    projects,
  } = useProjects()

  const {
    tasks,
  } = useTasks()

  const selectedProject =
    useMemo(
      () =>
        projects.find(
          project =>
            project.id === value.projectId,
        ),
      [
        projects,
        value.projectId,
      ],
    )

  const selectedTask =
    useMemo(
      () =>
        tasks.find(
          task =>
            task.id === value.taskId,
        ),
      [
        tasks,
        value.taskId,
      ],
    )

  const placeholder =

    mode === "projects"

      ? "Seleccionar proyecto"

      : mode === "tasks"

        ? "Seleccionar tarea"

        : "Proyecto o tarea (opcional)"

  // El label no puede simplemente "caer" a selectedProject como
  // fallback genérico: en mode="tasks" ambos pickers comparten el
  // mismo `value` (incluye projectId), así que sin este chequeo el
  // picker de tareas mostraría el nombre del proyecto apenas se
  // elige uno, antes incluso de elegir una tarea.
  const label =

    mode === "tasks"

      ? selectedTask
        ? `#${String(selectedTask.taskNumber).padStart(3, "0")} · ${selectedTask.reference}`
        : placeholder

      : mode === "projects"
        ? selectedProject
          ? `${selectedProject.projectCode} · ${selectedProject.name}`
          : placeholder

        : selectedTask
          ? `#${String(selectedTask.taskNumber).padStart(3, "0")} · ${selectedTask.reference}`
          : selectedProject
            ? `${selectedProject.projectCode} · ${selectedProject.name}`
            : placeholder

  const search =
    query
      .trim()
      .toLowerCase()

  const filteredProjects =
    useMemo(() => {

      if (!showProjects) {
        return []
      }

      // Igual que antes: no ofrecer proyectos completados, salvo
      // que sea el ya seleccionado, para no "perder" la selección
      // actual si el proyecto se completó después.
      const availableProjects =
        projects.filter(
          project =>

            project.id === value.projectId ||

            !isProjectCompleted(project),

        )

      if (!search) {
        return availableProjects
      }

      return availableProjects.filter(
        project =>

          [

            project.projectCode,

            project.name,

            project.client?.name ?? "",

            project.pm?.name ?? "",

          ].some(
            text =>

              text
                .toLowerCase()
                .includes(search),
          ),
      )

    }, [
      showProjects,
      projects,
      search,
      value.projectId,
    ])

  const filteredTasks =
    useMemo(() => {

      if (!showTasks) {
        return []
      }

      // En modo "both", listar tareas sólo tiene sentido cuando
      // hay texto — si no, mostrar TODAS las tareas de TODOS los
      // proyectos sería demasiado ruido junto a los proyectos.
      // En modo "tasks" no hay ese problema porque no compite
      // espacio con la lista de proyectos.
      if (!search && mode === "both") {
        return []
      }

      const scopedTasks =
        taskProjectId
          ? tasks.filter(
              task =>
                task.project.id === taskProjectId,
            )
          : tasks

      if (!search) {
        return scopedTasks
      }

      return scopedTasks.filter(
        task =>

          [

            String(task.taskNumber),

            task.reference,

            task.project.projectCode,

            task.project.name,

          ].some(
            text =>

              text
                .toLowerCase()
                .includes(search),
          ),
      )

    }, [
      showTasks,
      tasks,
      search,
      mode,
      taskProjectId,
    ])

  function selectProject(projectId: string) {

    if (value.projectId === projectId) {

      onChange({
        projectId: "",
        taskId: "",
      })

      setOpen(false)

      setQuery("")

      return

    }

    onChange({

      projectId,

      // Si la tarea seleccionada no pertenece a este proyecto,
      // se descarta.
      taskId:
        selectedTask?.project.id === projectId
          ? value.taskId
          : "",

    })

    setOpen(false)

    setQuery("")

  }

  function selectTask(taskId: string, projectId: string) {

    onChange({
      projectId,
      taskId:
        value.taskId === taskId
          ? ""
          : taskId,
    })

    setOpen(false)

    setQuery("")

  }

  function handleClear() {

    onChange({
      projectId: "",
      taskId: "",
    })

    setOpen(false)

    setQuery("")

  }

  const hasSelection =

    mode === "tasks"

      ? !!value.taskId

      : mode === "projects"
        ? !!value.projectId

        : !!value.projectId || !!value.taskId

  return (

    <Popover
      open={open}
      onOpenChange={nextOpen => {

        setOpen(nextOpen)

        if (!nextOpen) {

          setQuery("")

          return

        }

        // Autofoco solo en desktop/laptop — en mobile y tablet
        // abriría el teclado automáticamente apenas se muestra
        // el popover, sin que el usuario haya tocado el campo.
        if (isCompact) {
          return
        }

        requestAnimationFrame(
          () => inputRef.current?.focus(),
        )

      }}
    >

      <PopoverTrigger asChild>

        <button
          type="button"
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-xl bg-white/4 px-3 py-2.5 text-left text-sm outline-none transition-colors hover:bg-white/6",
            hasSelection
              ? "text-white"
              : "text-neutral-500",
          )}
        >

          <span className="min-w-0 truncate">

            {label}

          </span>

          <ChevronDown
            size={15}
            className={cn(
              "shrink-0 text-neutral-500 transition-transform duration-200",
              open && "rotate-180",
            )}
          />

        </button>

      </PopoverTrigger>

        <PopoverContent
            sideOffset={8}
            className={cn(
                "p-2",
                isCompact
                ? "w-[calc(100vw-2rem)] max-w-96"
                : "w-96",
            )}
        >

        <Command
          className="bg-transparent"
        >

          <div className="sticky top-0 z-20 mb-2 flex items-center gap-2 px-2 pb-2">

            <Search
              size={14}
              className="text-white/35"
            />

            <Input
              ref={inputRef}
              value={query}
              onChange={event =>
                setQuery(event.target.value)
              }
              placeholder={

                mode === "projects"

                  ? "Buscar proyecto..."

                  : mode === "tasks"

                    ? "Buscar tarea..."

                    : "Buscar proyecto o tarea..."

              }
              className="h-9 border-0 bg-transparent px-0"
            />

          </div>

          <CommandList
            className="max-h-80 overflow-y-auto"
          >

            <CommandEmpty>
              Sin resultados
            </CommandEmpty>

            {filteredProjects.length > 0 && (

              <CommandGroup>

                {filteredProjects.map(project => (

                  <SelectOption
                    key={project.id}
                    label={`${project.projectCode} · ${project.name}`}
                    icon="project"
                    color={
                      project.client?.color ?? "#64748B"
                    }
                    selected={

                      mode === "both"

                        ? !value.taskId &&
                          project.id === value.projectId

                        : project.id === value.projectId

                    }
                    disableCheckAnimation
                    onSelect={() =>
                      selectProject(project.id)
                    }
                  />

                ))}

              </CommandGroup>

            )}

            {filteredTasks.length > 0 && (

              <CommandGroup>

                {filteredTasks.map(task => (

                  <SelectOption
                    key={task.id}
                    label={`#${String(task.taskNumber).padStart(3, "0")} · ${task.reference} — ${task.project.projectCode}`}
                    icon="clipboard"
                    color={task.project.client.color}
                    selected={task.id === value.taskId}
                    disableCheckAnimation
                    onSelect={() =>
                      selectTask(task.id, task.project.id)
                    }
                  />

                ))}

              </CommandGroup>

            )}

          </CommandList>

        </Command>

      </PopoverContent>

    </Popover>

  )

}