import type {FinanceSnapshot} from "./operations";
export type FinanceExportTab="summary"|"accounts"|"movements"|"vouchers";
type Cell=string|number|null|undefined;
/** Text cells are neutralized against spreadsheet formula execution. Numeric cells are trusted only when finite. */
export function csvCell(value:Cell):string{
 if(typeof value==="number"){if(!Number.isFinite(value))throw new Error("Invalid amount");return String(value);}
 let text=value??"";
 if(/^[\s\u0000-\u001f]*[=+\-@]/.test(text)||/^[\t\r\n]/.test(text))text="'"+text;
 return '"'+text.replace(/"/g,'""')+'"';
}
export function encodeCsv(rows:readonly (readonly Cell[])[]):string{return "\uFEFF"+rows.map(row=>row.map(csvCell).join(",")).join("\r\n")+"\r\n";}
const units=(minor:number)=>{if(!Number.isSafeInteger(minor))throw new Error("Invalid minor units");return minor/100;};
export function financeExport(snapshot:FinanceSnapshot,tab:FinanceExportTab){
 const c=snapshot.currency,m=snapshot.month;
 if(tab==="summary"){const t=snapshot.totals;return encodeCsv([
 ["Periodo","Moneda","Concepto","Importe"],
 [m,c,"Cobros brutos",units(t.received_minor)],[m,c,"Devoluciones",units(t.refunded_minor)],[m,c,"Cobros netos",units(t.received_minor-t.refunded_minor)],
 [m,c,"Gastos pagados",units(t.expenses_minor)],[m,c,"Flujo neto de caja",units(t.received_minor-t.refunded_minor-t.expenses_minor)],
 [m,c,"Gastos fijos pagados",units(t.fixed_minor)],[m,c,"Gastos directos pagados",units(t.direct_minor)],[m,c,"Otros gastos pagados",units(t.other_minor)],
 [m,c,"Saldo por cobrar de todos los contratos",units(snapshot.open_balance_minor)],[m,c,"Boletas registradas (no caja)",units(t.documented_minor)]
 ]);}
 if(tab==="accounts")return encodeCsv([["Moneda","Servicio","Fecha del contrato","Fecha del evento","Contratado","Cobrado neto","Pendiente","Costo directo pagado","Contribución estimada"],...snapshot.accounts.map(a=>[c,a.title,a.contracted_on,a.event_date,units(a.total_minor),units(a.received_minor-a.refunded_minor),units(a.pending_minor),units(a.direct_cost_minor),units(a.total_minor-a.direct_cost_minor)])]);
 if(tab==="movements")return encodeCsv([["Moneda","Fecha","Tipo","Concepto","Medio","Clase de gasto","Importe","Estado"],...snapshot.movements.map(v=>[c,v.occurred_on,({receipt:"Cobro",refund:"Devolución",expense:"Gasto"})[v.kind],v.description,v.method,v.expense_class,units(v.amount_minor),v.status==="posted"?"Vigente":"Anulado"])]);
 return encodeCsv([["Moneda","Fecha de emisión","Serie","Correlativo","Concepto","Importe","IGV consignado","Descuento consignado","Estado","Vínculo"],...snapshot.vouchers.map(v=>[c,v.issued_on,v.series,v.number,v.description,units(v.total_minor),v.igv_minor==null?null:units(v.igv_minor),v.discount_minor==null?null:units(v.discount_minor),v.status==="external_void"?"Baja informada":v.status==="corrected"?"Corregida":"Registrada",v.receipt_id?"Cobro":v.account_id?"Contrato":"Sin vincular"])]);
}
