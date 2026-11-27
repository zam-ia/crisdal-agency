export const operationFilters={
 clients:[["all","Todos"],["due","Seguimientos vencidos y de hoy"],["new","Nuevos"],["negotiating","En negociación"],["active","Clientes activos"]],
 quotes:[["all","Todas"],["draft","Borradores"],["sent","Enviadas vigentes"],["expired","Enviadas vencidas"],["accepted","Aceptadas"],["rejected","No concretadas"]],
 production:[["all","Todos"],["open","En curso"],["overdue","Entregas vencidas"],["today","Entregas de hoy"],["unassigned","Sin responsable"],["delivered","Entregados"]],
 insights:[["all","Todos"]],
} as const;
export type OperationView=keyof typeof operationFilters;
export function validOperationFilter(view:OperationView,value:string){return operationFilters[view].some(([key])=>key===value);}
export function deadlineLabel(day:string|null,today:string){if(!day)return "Sin fecha";if(day<today)return "Vencido";if(day===today)return "Hoy";return "Programado";}
