import {validOperationFilter} from "../../../lib/os/operation-filters";
import {JsonBodyError,readBoundedJson} from "../../../lib/os/bounded-json";
import {z} from "zod";
import {authorizePanelApi} from "../../../lib/commercial/api-auth";
import {getSupabaseAdmin} from "../../../lib/supabase-admin";
import {fingerprint,isTrustedOrigin} from "../../../lib/os/security";
import {getPanelSession} from "../../../lib/os/dal";
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
const phone=z.string().max(32).regex(/^\+?[0-9\s().-]+$/).transform(value=>value.replace(/\D/g,"")).pipe(z.string().regex(/^[0-9]{7,15}$/));
const clientFields={name:z.string().trim().min(2).max(180),phone,email:z.string().max(180).email().or(z.literal("")),notes:z.string().max(2000)};
const base={requestId:id};
const line=z.object({id:z.string().uuid(),description:z.string().trim().min(1).max(240),quantity:z.number().int().min(1).max(10000),unitPriceMinor:z.number().int().min(0).max(FINANCE_LIMIT),discountBps:z.number().int().min(0).max(10000),taxBps:z.number().int().min(0).max(10000)});
const revision=z.number().int().positive().max(2147483647);
const quoteFields={clientId:id,title:z.string().trim().min(2).max(180),eventOn:optionalDay,currency:z.enum(["PEN","USD"]),lines:z.array(line).min(1).max(30),discountMinor:z.number().int().min(0).max(FINANCE_LIMIT),terms:z.string().trim().min(1).max(2000),expiresOn:day};
const schema=z.discriminatedUnion("action",[
 z.object({...base,action:z.literal("client"),...clientFields}),
 z.object({...base,action:z.literal("client_update"),id,...clientFields,stage:z.enum(["new","contacted","negotiating","active","closed"]),nextAction:z.string().max(240),nextActionOn:optionalDay}),
 z.object({...base,action:z.literal("link_inquiry"),inquiryId:id,clientId:id}),
 z.object({...base,action:z.literal("quote"),...quoteFields}),
 z.object({...base,action:z.literal("quote_edit"),id,revision,...quoteFields}),
 z.object({...base,action:z.literal("quote_send"),id,revision}),
 z.object({...base,action:z.literal("quote_reject"),id}),
 z.object({...base,action:z.literal("quote_accept"),id,reference:z.string().trim().min(3).max(240)}),
 z.object({...base,action:z.literal("project_update"),id,stage:z.enum(stages),leadUserId:nullableId,dueOn:optionalDay,notes:z.string().max(2000)}),
 z.object({...base,action:z.literal("task"),projectId:id,title:z.string().trim().min(2).max(180),dueOn:optionalDay,assignedTo:nullableId}),
 z.object({...base,action:z.literal("task_done"),id,done:z.boolean()}),
]);
const viewCaps={clients:"clients.read",quotes:"quotes.manage",production:"projects.read",insights:"finance.read"} as const satisfies Record<string,Capability>;
const actionCaps:Record<z.infer<typeof schema>["action"],Capability>={client:"clients.write",client_update:"clients.write",link_inquiry:"clients.write",quote:"quotes.manage",quote_edit:"quotes.manage",quote_send:"quotes.manage",quote_reject:"quotes.manage",quote_accept:"quotes.manage",project_update:"projects.write",task:"projects.write",task_done:"projects.write"};
function check(...rows:{error:unknown}[]){if(rows.some(r=>r.error))throw new Error("Database unavailable");}
export async function GET(request:Request){
 const q=new URL(request.url).searchParams;
 const view=q.get("view") as keyof typeof viewCaps;
 if(!Object.hasOwn(viewCaps,view))return respond({error:"Sección inválida."},422);
 const auth=await authorizePanelApi(request,viewCaps[view]);
 if("response" in auth)return auth.response;
 const filter=q.get("filter")||"all";
 if(!validOperationFilter(view,filter))return respond({error:"Filtro inválido."},422);
 const today=limaDate();
 const offset=Number(q.get("offset")||0);
 if(!Number.isInteger(offset)||offset<0||offset>1000000)return respond({error:"Página inválida."},422);
 try{
 const db=getSupabaseAdmin();
 if(view==="clients"){
  const clientId=q.get("clientId");
  if(clientId!==null){
   if(!id.safeParse(clientId).success)return respond({error:"Cliente inválido."},422);
   const history=await db.from("crisdal_client_inquiries").select("inquiry_id,crisdal_public_date_inquiries(event_type,requested_day,state)").eq("client_id",clientId).order("inquiry_id").range(offset,offset+49);
   check(history);return respond({history:history.data});
  }
  const search=q.get("search")?.trim()??"";
  if(search.length>80)return respond({error:"Usa hasta 80 caracteres en la búsqueda."},422);
  // This user input is a literal PostgREST filter value, not filter syntax.
  const literal=search.replace(/[\\%_]/g,"\\$&").replace(/["\\]/g,"\\$&");
  const directory=db.from("crisdal_clients").select("id,name,phone,email,stage,next_action,next_action_on,notes",{count:"exact"});
  if(search){
   const filters=[`name.ilike."%${literal}%"`,`email.ilike."%${literal}%"`];
   if(/^\+?[0-9\s().-]+$/.test(search)&&/\d/.test(search))filters.push(`phone.like.%${search.replace(/\D/g,"")}%`);
   directory.or(filters.join(","));
  }
  if(filter==="due")directory.neq("stage","closed").lte("next_action_on",today);
  else if(filter!=="all")directory.eq("stage",filter);
  const [clients,inquiries]=await Promise.all([
   (filter==="due"?directory.order("next_action_on"):directory.order("created_at",{ascending:false})).order("id").range(offset,offset+49),
   db.from("crisdal_public_date_inquiries").select("id,contact_name,contact_phone,event_type,requested_day").neq("state","spam").order("created_at",{ascending:false}).limit(50),
  ]);
  check(clients,inquiries);
  const inquiryIds=(inquiries.data??[]).map(inquiry=>inquiry.id);
  const links=inquiryIds.length?await db.from("crisdal_client_inquiries").select("inquiry_id,client_id").in("inquiry_id",inquiryIds):{data:[],error:null};
  check(links);return respond({rows:clients.data,count:clients.count,inquiries:inquiries.data,links:links.data});
 }
 if(view==="quotes"){
  const lookup=q.get("clientLookup");
  if(lookup!==null){
   const term=lookup.trim();
   if(term.length<2||term.length>80)return respond({error:"Busca entre 2 y 80 caracteres."},422);
   const literal = term.replace(/[\\%_]/g, (character) => "\\" + character);
   const match=await db.from("crisdal_clients").select("id,name").ilike("name","%"+literal+"%").order("name").order("id").limit(30);
   check(match);return respond({clients:match.data});
  }
  const quoteQuery=db.from("crisdal_quotes").select("id,client_id,title,event_on,currency,lines,pricing,total_minor,terms,expires_on,status,revision,acceptance_reference,accepted_at,crisdal_clients(name)",{count:"exact"});
  if(filter==="expired")quoteQuery.eq("status","sent").lt("expires_on",today);
  else if(filter==="sent")quoteQuery.eq("status","sent").gte("expires_on",today);
  else if(filter!=="all")quoteQuery.eq("status",filter);
  const [quotes,clients]=await Promise.all([
   quoteQuery.order("created_at",{ascending:false}).order("id").range(offset,offset+49),
   db.from("crisdal_clients").select("id,name").order("name").limit(200),
  ]);check(quotes,clients);return respond({rows:quotes.data,count:quotes.count,clients:clients.data});
 }
 if(view==="production"){
  const projectQuery=db.from("crisdal_production_projects").select("id,title,event_on,due_on,lead_user_id,stage,notes",{count:"exact"});
  if(filter==="delivered")projectQuery.eq("stage","delivered");
  else if(filter!=="all"){
   projectQuery.neq("stage","delivered");
   if(filter==="overdue")projectQuery.lt("due_on",today);
   if(filter==="today")projectQuery.eq("due_on",today);
   if(filter==="unassigned")projectQuery.is("lead_user_id",null);
  }
  const projects=await (filter==="overdue"||filter==="today"?projectQuery.order("due_on"):projectQuery.order("created_at",{ascending:false})).order("id").range(offset,offset+49);
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
 if(!isTrustedOrigin({origin:request.headers.get("origin"),host:request.headers.get("host"),forwardedHost:request.headers.get("x-forwarded-host")}))return respond({error:"Origen inválido."},403);
 if(!await getPanelSession())return respond({error:"Sesión requerida."},401);
 let raw:unknown;try{raw=await readBoundedJson(request,32000);}catch(error){return respond({error:error instanceof JsonBodyError?error.message:"Datos inválidos."},error instanceof JsonBodyError?error.status:400);}
 const parsed=schema.safeParse(raw);if(!parsed.success)return respond({error:"Revisa los campos obligatorios y los importes."},422);
 const auth=await authorizePanelApi(request,actionCaps[parsed.data.action],true);if("response" in auth)return auth.response;
 if(parsed.data.action==="quote_accept"&&!auth.session.capabilities.includes("finance.write"))return respond({error:"La confirmación requiere permiso financiero."},403);
 const {requestId,action,...payload}=parsed.data;
 let normalized:Record<string,unknown>={...payload};
 if(parsed.data.action==="quote"||parsed.data.action==="quote_edit"){
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
  if(error.message==="OPS_QUOTE_STALE")return respond({error:"La cotización cambió. Recarga la página y revisa la versión más reciente."},409);
  if(["OPS_TRANSITION","OPS_EXPIRED","OPS_TASKS","OPS_RETRY","OPS_INQUIRY_LINKED","OPS_ASSIGNEE"].includes(error.message))return respond({error:"No se puede realizar el cambio: revisa estado, vigencia, tareas o registro asociado."},409);
  return respond({error:"No se confirmó el guardado. Reintenta con los mismos datos."},503);
 }
 if(typeof data!=="string")throw new Error("No confirmation");
 return respond({ok:true,id:data});
 }catch{return respond({error:"No se confirmó el guardado. Reintenta con los mismos datos."},503);}
}
