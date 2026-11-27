import { requirePanelSession } from "../../lib/os/dal";
import { PanelShell } from "../../ui/os/panel-shell";
import { getFinanceIssuer } from "../../lib/os/finance/issuer";
import { FinanceClient } from "./finance-client";
export const metadata = { title:"Finanzas | Crisdal OS", robots:{index:false,follow:false} };
export const dynamic="force-dynamic";
export default async function FinancePage({ searchParams }: { searchParams: Promise<{ accion?: string }> }){
 const session=await requirePanelSession("finance.read");
 const {accion}=await searchParams;
 const initialAction=accion==="cobro"?"receipt":accion==="gasto"?"expense":accion==="boleta"?"voucher":undefined;
 const canWrite=session.capabilities.includes("finance.write");
 return <PanelShell session={session} currentPath="/panel/finanzas"><FinanceClient key={initialAction??"resumen"} initialAction={initialAction} issuerConfigured={canWrite&&Boolean(getFinanceIssuer().ruc)} canWrite={canWrite}/></PanelShell>;
}
