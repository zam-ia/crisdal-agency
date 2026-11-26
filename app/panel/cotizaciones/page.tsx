import {requirePanelSession} from "../../lib/os/dal";
import {PanelShell} from "../../ui/os/panel-shell";
import {OperationsClient} from "../operaciones/operations-client";
export const metadata={title:"Cotizaciones | Crisdal OS",robots:{index:false,follow:false}};
export const dynamic="force-dynamic";
export default async function Page(){
 const session=await requirePanelSession("quotes.manage");
 return <PanelShell session={session} currentPath="/panel/cotizaciones"><OperationsClient view="quotes" canWrite={session.capabilities.includes("quotes.manage")} canAccept={session.capabilities.includes("finance.write")}/></PanelShell>;
}
