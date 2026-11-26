import { z } from "zod";
import { authorizePanelApi } from "../../../lib/commercial/api-auth";
import { packageInputSchema, packageStatusSchema } from "../../../lib/commercial/packages";
import { createPackageRepository } from "../../../lib/commercial/package-repository";
import { changePackageStatus, reorderPackages, savePackage } from "../../../lib/commercial/package-service";
import { createOsAuthRepository } from "../../../lib/os/auth-repository";
import { fingerprint, newRequestId } from "../../../lib/os/security";

const inputSchema=z.discriminatedUnion("action",[
  z.object({action:z.literal("save"),item:packageInputSchema}),z.object({action:z.literal("status"),id:z.string().uuid(),status:packageStatusSchema}),z.object({action:z.literal("reorder"),ids:z.array(z.string().uuid()).max(100)}),
]);
async function audit(request:Request,userId:string,action:string,entityId?:string){await createOsAuthRepository().writeAudit({actorUserId:userId,action,entityType:"commercial_package",entityId,requestId:newRequestId(),ipHash:fingerprint(request.headers.get("x-forwarded-for")?.split(",")[0]||"unknown")});}
export async function GET(request:Request){const auth=await authorizePanelApi(request,"packages.read");if("response"in auth)return auth.response;try{return Response.json({packages:await createPackageRepository().listAdmin()});}catch{return Response.json({error:"El catálogo requiere las migraciones comerciales pendientes."},{status:503});}}
export async function POST(request:Request){const auth=await authorizePanelApi(request,"packages.write",true);if("response"in auth)return auth.response;const parsed=inputSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({error:"Datos inválidos."},{status:400});const repo=createPackageRepository();try{if(parsed.data.action==="save"){const item=await savePackage(repo,parsed.data.item,auth.session.userId);await audit(request,auth.session.userId,"package.saved",item.id);return Response.json({item});}if(parsed.data.action==="status"){const item=await changePackageStatus(repo,parsed.data.id,parsed.data.status,auth.session.userId);await audit(request,auth.session.userId,`package.${parsed.data.status}`,item.id);return Response.json({item});}await reorderPackages(repo,parsed.data.ids,auth.session.userId);await audit(request,auth.session.userId,"packages.reordered");return Response.json({ok:true});}catch(error){return Response.json({error:error instanceof Error?error.message:"No se pudo completar la operación."},{status:422});}}
