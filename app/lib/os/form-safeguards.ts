/** Helpers for ambiguous finance writes; never silently create a second request ID. */
export type PendingFinanceWrite={body:string;id:string;uncertain:boolean};
export function canReuseFinanceWrite(previous:PendingFinanceWrite|null,body:string){return !previous?.uncertain||previous.body===body;}
export function markFinanceWriteUncertain(previous:PendingFinanceWrite|null){return previous?{...previous,uncertain:true}:null;}
/** Peru local time: datetime-local has no timezone. Store the explicit Lima offset. */
export function limaDateTimeInput(iso:string|null){
 if(!iso)return "";
 const date=new Date(iso);if(!Number.isFinite(date.getTime()))return "";
 const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Lima",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(date);
 const part=(type:string)=>parts.find(p=>p.type===type)?.value;
 return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}
export function limaDateTimeToIso(value:string):string|null{
 if(!value)return null;
 if(!/^20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))return null;
 const date=new Date(value+"-05:00");if(!Number.isFinite(date.getTime()))return null;
 const iso=date.toISOString();return limaDateTimeInput(iso)===value?iso:null;
}
