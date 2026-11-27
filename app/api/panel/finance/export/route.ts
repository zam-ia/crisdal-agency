import {z} from "zod";
import {authorizePanelApi} from "../../../../lib/commercial/api-auth";
import {getSupabaseAdmin} from "../../../../lib/supabase-admin";
import {monthlyVouchers,monthlyMovements} from "../../../../lib/os/finance/monthly-export";
import type {FinanceVoucher,FinanceMovement} from "../../../../lib/os/finance/operations";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store"};
const filters=z.object({currency:z.enum(["PEN","USD"]),month:z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/),kind:z.enum(["vouchers","movements"])});
export async function GET(request:Request){
 const auth=await authorizePanelApi(request,"finance.read");
 if("response" in auth)return auth.response;
 const input=filters.safeParse(Object.fromEntries(new URL(request.url).searchParams));
 if(!input.success)return Response.json({error:"Periodo inválido."},{status:422,headers});
 const {month,currency,kind}=input.data;
 const fail=(error:string,status=503)=>Response.json({error},{status,headers});
 try{
  const db=getSupabaseAdmin();
  const read=async(offset:number)=>{
   const {data,error}=await db.rpc("crisdal_finance_snapshot",{p_actor:auth.session.userId,p_currency:currency,p_month:month+"-01",p_account_offset:0,p_movement_offset:kind==="movements"?offset:0,p_voucher_offset:kind==="vouchers"?offset:0});
   if(error||!data||!Array.isArray(data[kind]))throw new Error("No se pudo consultar el registro.");
   const count=data[kind+"_count"];if(!Number.isSafeInteger(count)||count<0)throw new Error("Conteo inválido.");
   return {rows:data[kind] as (FinanceMovement|FinanceVoucher)[],count,totals:JSON.stringify(data.totals)};
  };
  const initial=await read(0);
  if(initial.count>5000)return fail("El periodo supera el límite de 5000 registros por informe. Solicita una exportación administrativa.",422);
  const rows=[...initial.rows];
  for(let offset=50;offset<initial.count;offset+=50){
   const page=await read(offset);
   if(page.count!==initial.count||page.totals!==initial.totals)return fail("Los registros cambiaron durante la exportación. Vuelve a intentarlo.",409);
   rows.push(...page.rows);
  }
  const final=await read(0);
  if(final.count!==initial.count||final.totals!==initial.totals||JSON.stringify(final.rows)!==JSON.stringify(initial.rows)||rows.length!==initial.count||new Set(rows.map(r=>r.id)).size!==rows.length)return fail("Los registros cambiaron durante la exportación. Vuelve a intentarlo.",409);
  const content=kind==="vouchers"?monthlyVouchers(rows as FinanceVoucher[]):monthlyMovements(rows as FinanceMovement[]);
  return new Response(content,{headers:{...headers,"Content-Type":"text/csv; charset=utf-8","Content-Disposition":'attachment; filename="crisdal-'+kind+'-'+month+'-'+currency+'.csv"',"X-Content-Type-Options":"nosniff"}});
 }catch{return fail("No se pudo preparar el informe mensual. Reintenta.");}
}
