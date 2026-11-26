import {requirePanelSession} from "../../lib/os/dal";
import {PanelShell} from "../../ui/os/panel-shell";
import {OperationsClient} from "../operaciones/operations-client";
export const metadata={title:"Producción | Crisdal OS",robots:{index:false,follow:false}};
export const dynamic="force-dynamic";
export default async function Page(){
 const session=await requirePanelSession("projects.read");
 return <PanelShell session={session} currentPath="/panel/produccion"><OperationsClient view="production" canWrite={session.capabilities.includes("projects.write")} canAccept={session.capabilities.includes("finance.write")}/></PanelShell>;
}
