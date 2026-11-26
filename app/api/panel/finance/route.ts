import { z } from "zod";
import { authorizePanelApi } from "../../../lib/commercial/api-auth";
import { getSupabaseAdmin } from "../../../lib/supabase-admin";
import { fingerprint } from "../../../lib/os/security";
import { CURRENCIES, EXPENSE_CLASSES, FINANCE_LIMIT, PAYMENT_METHODS, limaDate, normalizeVoucher } from "../../../lib/os/finance/operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const HEADERS = { "Cache-Control": "no-store" };
const uuid = z.string().uuid();
const optionalId = uuid.nullable().optional();
const amount = z.number().int().positive().max(FINANCE_LIMIT);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {
  const d = new Date(v+"T00:00:00Z");
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10)===v;
}, "Fecha inválida");
const date = day.refine(v=>v<=limaDate(),"No se permite una fecha futura");
const reason = z.string().trim().min(3).max(240);
const base = { requestId: uuid };
const voucher = {
  accountId: optionalId, receiptId: optionalId, issuerRuc:z.string().regex(/^\d{11}$/),
  series:z.string().min(1).max(8), number:z.string().min(1).max(16),
  date, currency:z.enum(CURRENCIES), amountMinor:amount,
  igvMinor:z.number().int().nonnegative().max(FINANCE_LIMIT).nullable().optional(),
  customer:z.string().trim().max(160),
  documentType:z.enum(["DNI","RUC","CE","PASSPORT","OTHER"]).nullable().optional(),
  documentNumber:z.string().trim().min(1).max(30).nullable().optional(),
  description:z.string().trim().min(1).max(240),
};
const inputSchema=z.discriminatedUnion("action",[
  z.object({...base,action:z.literal("account"),title:z.string().trim().min(1).max(160),customer:z.string().trim().min(1).max(160),date,eventDate:day.nullable().optional(),currency:z.enum(CURRENCIES),amountMinor:amount,reference:z.string().trim().max(160).nullable().optional()}),
  z.object({...base,action:z.literal("adjust_account"),accountId:uuid,amountMinor:amount,reason}),
  z.object({...base,action:z.literal("movement"),kind:z.enum(["receipt","refund","expense"]),accountId:optionalId,currency:z.enum(CURRENCIES),amountMinor:amount,date,method:z.enum(PAYMENT_METHODS),expenseClass:z.enum(EXPENSE_CLASSES).nullable().optional(),description:z.string().trim().min(1).max(240),reference:z.string().trim().max(160).nullable().optional()}),
  z.object({...base,action:z.literal("void_movement"),id:uuid,reason}),
  z.object({...base,action:z.literal("voucher"),...voucher}),
  z.object({...base,action:z.literal("correct_voucher"),id:uuid,reason,...voucher}),
  z.object({...base,action:z.literal("external_void_voucher"),id:uuid,reason}),
]);
const filters=z.object({
  currency:z.enum(CURRENCIES), month:z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/),
  accountOffset:z.coerce.number().int().min(0).max(1000000),
  movementOffset:z.coerce.number().int().min(0).max(1000000),
  voucherOffset:z.coerce.number().int().min(0).max(1000000),
});
function responseError(error:string,status:number) { return Response.json({error},{status,headers:HEADERS}); }
function numericIntegrity(value:unknown):boolean {
  if (typeof value==="number") return Number.isSafeInteger(value);
  if (Array.isArray(value)) return value.every(numericIntegrity);
  if (value && typeof value==="object") return Object.values(value).every(numericIntegrity);
  return true;
}
const errorMessages:Record<string,string>={
  FINANCE_BALANCE:"El cambio dejaría un saldo inválido. Revisa cobros y devoluciones.",
  FINANCE_CURRENCY:"La moneda debe coincidir con la del evento.",
  FINANCE_ACCOUNT_REQUIRED:"Selecciona una cuenta por cobrar.",
  FINANCE_VOID:"El registro ya está anulado o falta una explicación.",
  FINANCE_VOUCHER_LINK:"El pago seleccionado no corresponde a este evento o no está vigente.",
  FINANCE_VOUCHER_CORRECTION:"No se puede corregir ese registro. Revisa su estado y motivo.",
  FINANCE_IDEMPOTENCY:"Esta operación ya fue utilizada con otros datos. Revisa antes de repetirla.",
  FINANCE_FUTURE:"La fecha del movimiento no puede estar en el futuro.",
};
export async function GET(request:Request) {
  const auth=await authorizePanelApi(request,"finance.read");
  if("response" in auth)return auth.response;
  const params=new URL(request.url).searchParams;
  const parsed=filters.safeParse({currency:params.get("currency")||"PEN",month:params.get("month")||limaDate().slice(0,7),accountOffset:params.get("accountOffset")||0,movementOffset:params.get("movementOffset")||0,voucherOffset:params.get("voucherOffset")||0});
  if(!parsed.success)return responseError("Periodo o filtro inválido.",422);
  try {
    const f=parsed.data;
    const {data,error}=await getSupabaseAdmin().rpc("crisdal_finance_snapshot",{p_actor:auth.session.userId,p_currency:f.currency,p_month:f.month+"-01",p_account_offset:f.accountOffset,p_movement_offset:f.movementOffset,p_voucher_offset:f.voucherOffset});
    if(error||!data||!numericIntegrity(data))return responseError("Finanzas no está disponible. Verifica la activación y los permisos.",503);
    return Response.json(data,{headers:HEADERS});
  }catch{return responseError("Finanzas no está disponible.",503);}
}
export async function POST(request:Request) {
  const auth=await authorizePanelApi(request,"finance.write",true);
  if("response" in auth)return auth.response;
  if(!request.headers.get("content-type")?.startsWith("application/json"))return responseError("Formato inválido.",415);
  if(Number(request.headers.get("content-length")||0)>10000)return responseError("Solicitud demasiado grande.",413);
  let body:unknown;
  try{const raw=await request.text();if(raw.length>10000)return responseError("Solicitud demasiado grande.",413);body=JSON.parse(raw);}catch{return responseError("Solicitud inválida.",400);}
  const parsed=inputSchema.safeParse(body);
  if(!parsed.success)return responseError("Revisa los datos: importe, fecha, identificadores y campos obligatorios.",422);
  const {requestId,action,...payload}=parsed.data;
  let normalized:Record<string,unknown>={...payload};
  if(parsed.data.action==="movement"){
    const x=parsed.data;
    if(x.kind==="expense"){
      if(!x.expenseClass||(x.expenseClass==="direct")!==Boolean(x.accountId))return responseError("Un gasto directo necesita un evento; un gasto general no debe asignarse a un evento.",422);
    }else if(!x.accountId||x.expenseClass)return responseError("Selecciona el evento del cobro o devolución.",422);
  }
  if(parsed.data.action==="voucher"||parsed.data.action==="correct_voucher"){
    const x=parsed.data;
    try{normalized={...payload,...normalizeVoucher(x.series,x.number)};}catch{return responseError("Serie o correlativo de boleta inválidos.",422);}
    if((x.igvMinor??0)>x.amountMinor||Boolean(x.documentType)!==Boolean(x.documentNumber)||(x.receiptId&&!x.accountId))return responseError("Revisa el IGV, identificación del cliente y vínculo del pago.",422);
  }
  try{
    const {data,error}=await getSupabaseAdmin().rpc("crisdal_finance_write",{p_actor:auth.session.userId,p_request:requestId,p_action:action,p_payload:normalized,p_ip_hash:fingerprint(request.headers.get("x-real-ip")||"finance:unknown")});
    if(error){
      if(error.code==="23505")return responseError("Ya existe ese comprobante o registro único.",409);
      if(error.message==="FINANCE_FORBIDDEN")return responseError("Permiso insuficiente.",403);
      if(errorMessages[error.message])return responseError(errorMessages[error.message],409);
      if(error.code==="23514"||error.code==="23503"||error.code==="22007"||error.code==="P0002")return responseError("El registro no cumple las condiciones o ya no existe.",422);
      return responseError("No se pudo confirmar la operación. Reintenta sin modificar los datos.",503);
    }
    if(typeof data!=="string")return responseError("No se confirmó la operación. Reintenta.",503);
    return Response.json({id:data,ok:true},{headers:HEADERS});
  }catch{return responseError("No se pudo confirmar la operación. Reintenta sin modificar los datos.",503);}
}
