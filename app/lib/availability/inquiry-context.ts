import type {EventType} from "./public-calendar";
import {EVENT_TYPES} from "./public-calendar";
type QueryValue=string|string[]|undefined;
export type InquiryContext={eventType?:EventType;reference:string};
function clean(value:QueryValue){return typeof value==="string"?value.replace(/\p{Cc}/gu," ").trim().slice(0,120):"";}
export function eventTypeForCategory(category:string):EventType|undefined{
 const s=category.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 if(/boda/.test(s))return "Boda";
 if(/quince/.test(s))return "Quinceaños";
 if(/corporativ|empres/.test(s))return "Evento corporativo";
 if(/bautiz/.test(s))return "Bautizo";
 if(/pedida/.test(s))return "Pedida de mano";
 if(/sesion/.test(s))return "Sesión fotográfica";
 if(/celebr|cumple/.test(s))return "Cumpleaños o celebración";
 return undefined;
}
export function inquiryContext(params:Record<string,QueryValue>):InquiryContext{
 const type=clean(params.evento);
 const eventType=EVENT_TYPES.find(t=>t===type);
 const project=clean(params.trabajo),pack=clean(params.paquete);
 return {eventType,reference:project?"Me interesa una cobertura similar a: "+project:pack?"Me interesa el paquete: "+pack:""};
}
export function inquiryHref(input:{eventType?:EventType;project?:string;packageName?:string}={}){
 const q=new URLSearchParams();
 if(input.eventType)q.set("evento",input.eventType);
 const project=clean(input.project),pack=clean(input.packageName);
 if(project)q.set("trabajo",project);
 else if(pack)q.set("paquete",pack);
 return "/consultar-fecha"+(q.size?"?"+q.toString():"");
}
