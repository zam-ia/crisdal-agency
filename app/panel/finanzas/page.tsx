import { requirePanelSession } from "../../lib/os/dal";
import { PanelShell } from "../../ui/os/panel-shell";
import { FinanceClient } from "./finance-client";
export const metadata = { title:"Finanzas | Crisdal OS", robots:{index:false,follow:false} };
export const dynamic="force-dynamic";
export default async function FinancePage(){
 const session=await requirePanelSession("finance.read");
 return <PanelShell session={session} currentPath="/panel/finanzas"><FinanceClient canWrite={session.capabilities.includes("finance.write")}/></PanelShell>;
}
