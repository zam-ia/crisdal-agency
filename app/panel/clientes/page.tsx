import {requirePanelSession} from "../../lib/os/dal";
import {PanelShell} from "../../ui/os/panel-shell";
import {OperationsClient} from "../operaciones/operations-client";
export const metadata={title:"Clientes | Crisdal OS",robots:{index:false,follow:false}};
export const dynamic="force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ accion?: string }> }){
 const session=await requirePanelSession("clients.read");
 const startCreating=(await searchParams).accion==="nuevo";
 return <PanelShell session={session} currentPath="/panel/clientes"><OperationsClient key={String(startCreating)} startCreating={startCreating} view="clients" canWrite={session.capabilities.includes("clients.write")} canAccept={session.capabilities.includes("finance.write")}/></PanelShell>;
}
