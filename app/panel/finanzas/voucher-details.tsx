"use client";
import { useState } from "react";
import { parseMoney, type FinanceVoucher, type VoucherItem } from "../../lib/os/finance/operations";
import styles from "./finance.module.css";

const decimal=(minor:number)=>(minor/100).toFixed(2);
const blank={quantity:"1",description:"",unit:"",total:""};
type Row={id:number;quantity:string;description:string;unit:string;total:string};
export const sourceLabels={sunat_original:"Comprobante original SUNAT",commercial_summary:"Resumen comercial",manual_reference:"Referencia manual"} as const;

export function readVoucherItems(data:FormData):VoucherItem[]{
 const quantities=data.getAll("voucherQuantity"), descriptions=data.getAll("voucherDescription"), units=data.getAll("voucherUnit"), totals=data.getAll("voucherLine");
 if(quantities.length!==descriptions.length||units.length!==quantities.length||totals.length!==quantities.length)throw new Error("Detalle de servicios incompleto.");
 return quantities.map((q,i)=>({quantity:Number(q),description:String(descriptions[i]).trim(),unitMinor:parseMoney(String(units[i])),lineMinor:parseMoney(String(totals[i]))}));
}

export function VoucherDetails({voucher,disabled}:{voucher?:FinanceVoucher;disabled:boolean}){
 const [rows,setRows]=useState<Row[]>(()=> (voucher?.items??[]).map((item,i)=>({id:i,quantity:String(item.quantity),description:item.description,unit:decimal(item.unitMinor),total:decimal(item.lineMinor)})));
 const [nextId,setNextId]=useState(rows.length);
 const change=(id:number,key:Exclude<keyof Row,"id">,value:string)=>setRows(old=>old.map(row=>row.id===id?{...row,[key]:value}:row));
 return <>
 <label>Documento utilizado<select name="sourceKind" defaultValue={voucher?.source_kind??"manual_reference"}>{Object.entries(sourceLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
 <label>Descuento consignado (opcional)<input name="discount" inputMode="decimal" defaultValue={voucher?.discount_minor!=null?decimal(voucher.discount_minor):""} placeholder="Sin dato"/></label>
 <details className={styles.full} open={rows.length>0||undefined}>
   <summary>Detalle de servicios (opcional)</summary>
   <p className={styles.hint}>Copia cantidades, valores unitarios e importes tal como aparecen en el documento. No se recalculan impuestos ni se acredita un pago.</p>
   {rows.map(row=><fieldset key={row.id} className={styles.voucherLine} disabled={disabled}><legend>Concepto</legend>
     <label>Cantidad<input name="voucherQuantity" type="number" min={1} max={10000} step={1} required value={row.quantity} onChange={e=>change(row.id,"quantity",e.target.value)}/></label>
     <label>Descripción<input name="voucherDescription" maxLength={240} required value={row.description} onChange={e=>change(row.id,"description",e.target.value)}/></label>
     <label>Valor unitario<input name="voucherUnit" inputMode="decimal" required value={row.unit} onChange={e=>change(row.id,"unit",e.target.value)}/></label>
     <label>Importe de línea<input name="voucherLine" inputMode="decimal" required value={row.total} onChange={e=>change(row.id,"total",e.target.value)}/></label>
     <button type="button" onClick={()=>setRows(old=>old.filter(x=>x.id!==row.id))}>Quitar concepto</button>
   </fieldset>)}
   <button type="button" disabled={disabled||rows.length>=20} onClick={()=>{setRows(old=>[...old,{id:nextId,...blank}]);setNextId(n=>n+1);}}>+ Añadir concepto</button>
 </details>
 </>;
}
