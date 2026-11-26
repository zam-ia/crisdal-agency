import {requirePanelSession} from "../../lib/os/dal";
import {PanelShell} from "../../ui/os/panel-shell";
import {OperationsClient} from "../operaciones/operations-client";
export const metadata={title:"Clientes | Crisdal OS",robots:{index:false,follow:false}};
export const dynamic="force-dynamic";
export default async function Page(){
 const session=await requirePanelSession("clients.read");
 return <PanelShell session={session} currentPath="/panel/clientes"><OperationsClient view="clients" canWrite={session.capabilities.includes("clients.write")} canAccept={session.capabilities.includes("finance.write")}/></PanelShell>;
}
