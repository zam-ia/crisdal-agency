import { z } from "zod";
import { authorizePanelApi } from "../../../lib/commercial/api-auth";
import { createPackageRepository } from "../../../lib/commercial/package-repository";
import { createPackageShare } from "../../../lib/commercial/package-service";
import { createOsAuthRepository } from "../../../lib/os/auth-repository";
import { fingerprint,newRequestId } from "../../../lib/os/security";
const schema=z.object({packageIds:z.array(z.string().uuid()).min(1).max(20),message:z.string().min(20).max(1200)});
export async function POST(request:Request){const auth=await authorizePanelApi(request,"packages.read",true);if("response"in auth)return auth.response;const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({error:"Selección o mensaje inválido."},{status:400});try{const share=await createPackageShare(createPackageRepository(),parsed.data.packageIds,parsed.data.message,auth.session.userId);await createOsAuthRepository().writeAudit({actorUserId:auth.session.userId,action:"package.share.created",entityType:"package_share_link",entityId:share.campaignId,requestId:newRequestId(),ipHash:fingerprint(request.headers.get("x-forwarded-for")?.split(",")[0]||"unknown"),metadata:{packageCount:share.packages.length}});return Response.json({share});}catch(error){return Response.json({error:error instanceof Error?error.message:"No se pudo generar el enlace."},{status:422});}}
