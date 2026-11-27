import type {FinanceMovement,FinanceVoucher} from "./operations";
import {encodeCsv} from "./export";
const money=(n:number|null|undefined)=>{if(n==null)return null;if(!Number.isSafeInteger(n))throw new Error("Importe inválido.");return n/100;};
export function monthlyVouchers(rows:readonly FinanceVoucher[]){
 return encodeCsv([["Fecha emisión","RUC emisor","Serie","Correlativo","Comprobante","Cliente / razón social","Tipo documento","Documento cliente","Moneda","Concepto","Importe total","IGV consignado","Descuento consignado","Estado interno","Fuente","Detalle de servicios transcrito","ID contrato","ID cobro","Motivo de corrección o baja"],...rows.map(v=>[v.issued_on,v.issuer_ruc,v.series,v.number,v.series+"-"+v.number,v.customer,v.document_type,v.document_number,v.currency,v.description,money(v.total_minor),money(v.igv_minor),money(v.discount_minor),v.status,v.source_kind,JSON.stringify(v.items??[]),v.account_id,v.receipt_id,v.correction_reason])]);
}
export function monthlyMovements(rows:readonly FinanceMovement[]){
 return encodeCsv([["Fecha","Tipo","Moneda","Importe","Medio de pago","Clase de gasto","Concepto","Referencia","Estado interno","ID contrato","ID movimiento","Motivo de anulación"],...rows.map(m=>[m.occurred_on,m.kind,m.currency,money(m.amount_minor),m.method,m.expense_class,m.description,m.reference,m.status,m.account_id,m.id,m.void_reason])]);
}
