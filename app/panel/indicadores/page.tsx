import {requirePanelSession} from "../../lib/os/dal";
import {PanelShell} from "../../ui/os/panel-shell";
import {OperationsClient} from "../operaciones/operations-client";
export const metadata={title:"Indicadores | Crisdal OS",robots:{index:false,follow:false}};
export const dynamic="force-dynamic";
export default async function Page(){
 const session=await requirePanelSession("finance.read");
 return <PanelShell session={session} currentPath="/panel/indicadores"><OperationsClient view="insights" canWrite={session.capabilities.includes("finance.write")} canAccept={session.capabilities.includes("finance.write")}/></PanelShell>;
}
