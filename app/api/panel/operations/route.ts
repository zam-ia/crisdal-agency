import {z} from "zod";
import {authorizePanelApi} from "../../../lib/commercial/api-auth";
import {getSupabaseAdmin} from "../../../lib/supabase-admin";
import {fingerprint} from "../../../lib/os/security";
import type {Capability} from "../../../lib/os/capabilities";
import {priceQuote} from "../../../lib/os/quotes/pricing";
import {FINANCE_LIMIT,limaDate} from "../../../lib/os/finance/operations";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store"};
const respond=(value:unknown,status=200)=>Response.json(value,{status,headers});
const id=z.string().uuid();
const nullableId=id.nullable();
const day=z.string().regex(/^20\d{2}-\d{2}-\d{2}$/).refine(v=>{const d=new Date(v+"T00:00:00Z");return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v;});
const optionalDay=day.nullable();
const stages=["planning","coverage","editing","review","ready","delivered"] as const;
const clientFields={name:z.string().trim().min(2).max(180),phone:z.string().regex(/^[0-9]{7,15}$/),email:z.string().email().or(z.literal("")),notes:z.string().max(2000)};
const base={requestId:id};
const line=z.object({id:z.string().uuid(),description:z.string().trim().min(1).max(240),quantity:z.number().int().min(1).max(10000),unitPriceMinor:z.number().int().min(0).max(FINANCE_LIMIT),discountBps:z.number().int().min(0).max(10000),taxBps:z.number().int().min(0).max(10000)});
const schema=z.discriminatedUnion("action",[
 z.object({...base,action:z.literal("client"),...clientFields}),
 z.object({...base,action:z.literal("client_update"),id,...clientFields,stage:z.enum(["new","contacted","negotiating","active","closed"]),nextAction:z.string().max(240),nextActionOn:optionalDay}),
 z.object({...base,action:z.literal("link_inquiry"),inquiryId:id,clientId:id}),
 z.object({...base,action:z.literal("quote"),clientId:id,title:z.string().trim().min(2).max(180),eventOn:optionalDay,currency:z.enum(["PEN","USD"]),lines:z.array(line).min(1).max(30),discountMinor:z.number().int().min(0).max(FINANCE_LIMIT),terms:z.string().trim().min(1).max(2000),expiresOn:day}),
 z.object({...base,action:z.literal("quote_send"),id}),
 z.object({...base,action:z.literal("quote_reject"),id}),
 z.object({...base,action:z.literal("quote_accept"),id,reference:z.string().trim().min(3).max(240)}),
 z.object({...base,action:z.literal("project_update"),id,stage:z.enum(stages),leadUserId:nullableId,dueOn:optionalDay,notes:z.string().max(2000)}),
 z.object({...base,action:z.literal("task"),projectId:id,title:z.string().trim().min(2).max(180),dueOn:optionalDay,assignedTo:nullableId}),
 z.object({...base,action:z.literal("task_done"),id,done:z.boolean()}),
]);
const viewCaps={clients:"clients.read",quotes:"quotes.manage",production:"projects.read",insights:"finance.read"} as const satisfies Record<string,Capability>;
const actionCaps:Record<z.infer<typeof schema>["action"],Capability>={client:"clients.write",client_update:"clients.write",link_inquiry:"clients.write",quote:"quotes.manage",quote_send:"quotes.manage",quote_reject:"quotes.manage",quote_accept:"quotes.manage",project_update:"projects.write",task:"projects.write",task_done:"projects.write"};
function check<T extends {error:unknown}>(...rows:T[]){if(rows.some(r=>r.error))throw new Error("Database unavailable");}
export async function GET(request:Request){
 const q=new URL(request.url).searchParams;
 const view=q.get("view") as keyof typeof viewCaps;
 if(!Object.hasOwn(viewCaps,view))return respond({error:"Sección inválida."},422);
 const auth=await authorizePanelApi(request,viewCaps[view]);
 if("response" in auth)return auth.response;
 const offset=Number(q.get("offset")||0);
 if(!Number.isInteger(offset)||offset<0||offset>1000000)return respond({error:"Página inválida."},422);
 try{
 const db=getSupabaseAdmin();
 if(view==="clients"){
  const [clients,inquiries,links]=await Promise.all([
   db.from("crisdal_clients").select("id,name,phone,email,stage,next_action,next_action_on,notes",{count:"exact"}).order("created_at",{ascending:false}).order("id").range(offset,offset+49),
   db.from("crisdal_public_date_inquiries").select("id,contact_name,contact_phone,event_type,requested_day").neq("state","spam").order("created_at",{ascending:false}).limit(50),
   db.from("crisdal_client_inquiries").select("inquiry_id,client_id").limit(500),
  ]);check(clients,inquiries,links);return respond({rows:clients.data,count:clients.count,inquiries:inquiries.data,links:links.data});
 }
 if(view==="quotes"){
  const [quotes,clients]=await Promise.all([
   db.from("crisdal_quotes").select("id,client_id,title,event_on,currency,lines,pricing,total_minor,terms,expires_on,status,acceptance_reference,accepted_at,crisdal_clients(name)",{count:"exact"}).order("created_at",{ascending:false}).order("id").range(offset,offset+49),
   db.from("crisdal_clients").select("id,name").order("name").limit(200),
  ]);check(quotes,clients);return respond({rows:quotes.data,count:quotes.count,clients:clients.data});
 }
 if(view==="production"){
  const projects=await db.from("crisdal_production_projects").select("id,title,event_on,due_on,lead_user_id,stage,notes",{count:"exact"}).order("created_at",{ascending:false}).order("id").range(offset,offset+49);
  check(projects);
  const ids=(projects.data||[]).map(p=>p.id);
  const tasks=ids.length?await db.from("crisdal_production_tasks").select("id,project_id,title,due_on,assigned_to,done").in("project_id",ids).order("created_at").limit(1000):{data:[],error:null};
  const staff=await db.from("crisdal_os_users").select("id,display_name").eq("active",true).in("role_code",["owner","administration","production"]).order("display_name").limit(200);
  check(tasks,staff);return respond({rows:projects.data,count:projects.count,tasks:tasks.data,staff:staff.data});
 }
 const currency=q.get("currency")||"PEN",month=q.get("month")||limaDate().slice(0,7);
 if(!["PEN","USD"].includes(currency)||!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month))return respond({error:"Periodo inválido."},422);
 const next=new Date(month+"-01T00:00:00Z");next.setUTCMonth(next.getUTCMonth()+1);
 const [cash,quotes,accepted,projects,late]=await Promise.all([
  db.rpc("crisdal_finance_snapshot",{p_actor:auth.session.userId,p_currency:currency,p_month:month+"-01",p_account_offset:0,p_movement_offset:0,p_voucher_offset:0}),
  db.from("crisdal_quotes").select("id",{count:"exact",head:true}).eq("currency",currency).gte("created_at",month+"-01T00:00:00-05:00").lt("created_at",next.toISOString().slice(0,10)+"T00:00:00-05:00"),
  db.from("crisdal_quotes").select("id",{count:"exact",head:true}).eq("currency",currency).eq("status","accepted").gte("created_at",month+"-01T00:00:00-05:00").lt("created_at",next.toISOString().slice(0,10)+"T00:00:00-05:00"),
  db.from("crisdal_production_projects").select("id",{count:"exact",head:true}).neq("stage","delivered"),
  db.from("crisdal_production_projects").select("id",{count:"exact",head:true}).neq("stage","delivered").lt("due_on",limaDate()),
 ]);check(cash,quotes,accepted,projects,late);
 const data=cash.data;
 if(!data?.totals||!Array.isArray(data.trend))throw new Error("No finance snapshot");
 return respond({totals:data.totals,trend:data.trend,openBalance:data.open_balance_minor,quotes:quotes.count,accepted:accepted.count,projects:projects.count,late:late.count});
 }catch{return respond({error:"Módulo pendiente de activación o temporalmente no disponible. No se muestran datos ficticios."},503);}
}
export async function POST(request:Request){
 // Resolve session and trusted origin before processing writes.
 const initial=await authorizePanelApi(request,"clients.read",true);
 // Production-only roles lack clients.read: use a separate authorized check below.
 if("response" in initial && initial.response.status!==403)return initial.response;
 if(!request.headers.get("content-type")?.startsWith("application/json"))return respond({error:"Formato inválido."},415);
 if(Number(request.headers.get("content-length")||0)>32000)return respond({error:"Solicitud demasiado grande."},413);
 let raw:unknown;try{const s=await request.text();if(s.length>32000)return respond({error:"Solicitud demasiado grande."},413);raw=JSON.parse(s);}catch{return respond({error:"Datos inválidos."},400);}
 const parsed=schema.safeParse(raw);if(!parsed.success)return respond({error:"Revisa los campos obligatorios y los importes."},422);
 const auth=await authorizePanelApi(request,actionCaps[parsed.data.action],true);if("response" in auth)return auth.response;
 if(parsed.data.action==="quote_accept"&&!auth.session.capabilities.includes("finance.write"))return respond({error:"La confirmación requiere permiso financiero."},403);
 const {requestId,action,...payload}=parsed.data;
 let normalized:Record<string,unknown>={...payload};
 if(parsed.data.action==="quote"){
  const x=parsed.data;
  try{const pricing=priceQuote({currency:x.currency,lines:x.lines,globalDiscount:{kind:"fixed",amountMinor:x.discountMinor}});
   if(pricing.totalMinor<1||pricing.totalMinor>FINANCE_LIMIT)return respond({error:"Importe total fuera de rango."},422);
   normalized={...payload,pricing,totalMinor:pricing.totalMinor};
  }catch{return respond({error:"Revisa los descuentos, impuestos explícitos y cantidades."},422);}
 }
 try{
 const {data,error}=await getSupabaseAdmin().rpc("crisdal_ops_write",{p_actor:auth.session.userId,p_request:requestId,p_action:action,p_payload:normalized,p_ip_hash:fingerprint("panel:operations")});
 if(error){
  if(error.code==="23505")return respond({error:"Ya existe un registro con estos datos. Revisa antes de duplicarlo."},409);
  if(error.message==="OPS_FORBIDDEN")return respond({error:"Permiso insuficiente."},403);
  if(["OPS_TRANSITION","OPS_EXPIRED","OPS_TASKS","OPS_RETRY","OPS_INQUIRY_LINKED","OPS_ASSIGNEE"].includes(error.message))return respond({error:"No se puede realizar el cambio: revisa estado, vigencia, tareas o registro asociado."},409);
  return respond({error:"No se confirmó el guardado. Reintenta con los mismos datos."},503);
 }
 if(typeof data!=="string")throw new Error("No confirmation");
 return respond({ok:true,id:data});
 }catch{return respond({error:"No se confirmó el guardado. Reintenta con los mismos datos."},503);}
}
