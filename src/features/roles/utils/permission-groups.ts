// Agrupa los PermissionCode en categorías legibles para mostrarlos
// como secciones en la pantalla, en vez de una lista plana de 25+
// checkboxes sin ningún orden. Mapeo explícito (no un split
// genérico por "_") porque el set de permisos es finito y conocido
// — así cada grupo tiene un título en español, no el prefijo crudo
// en inglés.
const PERMISSION_GROUPS: Record<string,string> = {

  PROJECT:"Proyectos",
  TASK:"Tareas",
  WORKFLOW:"Workflow / Procesos",
  MASTER_DATA:"Datos maestros",
  USER:"Usuarios",
  COMMENT:"Comentarios",
  ACTIVITY_LOG:"Bitácora",
  ACTIVITY_TYPE:"Bitácora — tipos de actividad",
  ROLE:"Roles y permisos",
  NESTING:"Nesting",

}

const GROUP_ORDER = [
  "PROJECT",
  "TASK",
  "WORKFLOW",
  "MASTER_DATA",
  "USER",
  "COMMENT",
  "ACTIVITY_LOG",
  "ACTIVITY_TYPE",
  "ROLE",
  "NESTING",
]

export function getPermissionGroupKey(code:string):string{

  // El más específico primero — "ACTIVITY_LOG_READ" tiene que
  // matchear "ACTIVITY_LOG", no el "ACTIVITY_TYPE" genérico si
  // hubiera un prefijo compartido más corto.
  const sortedKeys=
    Object.keys(PERMISSION_GROUPS)
      .sort((a,b)=>b.length-a.length)

  const match=
    sortedKeys.find(key=>code.startsWith(key))

  return match??"OTROS"

}

export function getPermissionGroupLabel(key:string):string{
  return PERMISSION_GROUPS[key]??"Otros"
}

export function getGroupOrder(key:string):number{

  const index=GROUP_ORDER.indexOf(key)

  return index===-1?GROUP_ORDER.length:index

}

// Traduce el resto del code (después del prefijo de grupo) a una
// palabra corta en español — "READ"->"Ver", "CREATE"->"Crear", etc.
export function getPermissionActionLabel(code:string,groupKey:string):string{

  const action=
    code
      .slice(groupKey.length)
      .replace(/^_/,"")

  const labels:Record<string,string> = {
    READ:"Ver",
    CREATE:"Crear",
    UPDATE:"Editar",
    DELETE:"Eliminar",
    DELETE_ANY:"Eliminar (de cualquiera)",
    REVIEW:"Revisar",
    READ_ANY:"Ver (de cualquiera)",
    MANAGE:"Administrar",
    MANAGE_TYPES:"Administrar tipos",
    PERMISSION_OVERRIDE_MANAGE:"Gestionar excepciones",
  }

  return labels[action]??action

}