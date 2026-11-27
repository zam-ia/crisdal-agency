"use client";
import {useState} from "react";
import {limaDate} from "../../lib/os/finance/operations";
import {inferDocumentType} from "../../lib/os/finance/inline-voucher";
import styles from "./finance.module.css";
export function InlineVoucher({issuer,customer,amount,description,date,currency}:{issuer:string;customer:string;amount:string;description:string;date:string;currency:string}){
 const [buyer,setBuyer]=useState<string|null>(null),[total,setTotal]=useState<string|null>(null),[concept,setConcept]=useState<string|null>(null),[issued,setIssued]=useState<string|null>(null);
 const [document,setDocument]=useState(""),[kind,setKind]=useState<string|null>(null);
 const type=kind??inferDocumentType(document);
 return <section className={styles.inlineVoucher} aria-labelledby="inline-voucher-heading">
 <div className={styles.inlineVoucherHead}><div><span className={styles.eyebrow}>COMPROBANTE EMITIDO</span><h3 id="inline-voucher-heading">Datos de la boleta SUNAT</h3><p>Verifica el comprobante original. Reutilizamos los datos del cobro; puedes corregirlos si son diferentes.</p></div>{issuer&&<small>Emisor: Crisdal · RUC configurado</small>}</div>
 {!issuer&&<label>RUC emisor<input required name="inlineIssuer" inputMode="numeric" pattern="[0-9]{11}" maxLength={11}/><small>Configúralo una vez en el servidor para no repetirlo.</small></label>}
 <label>Número de boleta *<input required name="inlineNumber" maxLength={20} placeholder="EB01-27"/><small>Serie y correlativo de SUNAT.</small></label>
 <label>Fecha de emisión *<input required type="date" name="inlineDate" max={limaDate()} value={issued??date} onChange={e=>setIssued(e.target.value)}/><small>Se propone la fecha del cobro; verifica la original.</small></label>
 <label>Documento del cliente<input name="inlineDocument" inputMode={type==="DNI"||type==="RUC"||!type?"numeric":"text"} maxLength={30} value={document} placeholder="DNI o RUC" onChange={e=>setDocument(e.target.value)}/><small>Se reconoce DNI de 8 dígitos o RUC de 11.</small></label>
 <label>Tipo de documento<select name="inlineDocumentType" value={type} onChange={e=>setKind(e.target.value||null)}><option value="">No consignado / automático</option><option value="DNI">DNI</option><option value="RUC">RUC</option><option value="CE">Carné de extranjería</option><option value="PASSPORT">Pasaporte</option><option value="OTHER">Otro</option></select></label>
 <label className={styles.full}>Nombre completo o razón social *<input name="inlineCustomer" required maxLength={160} value={buyer??customer} onChange={e=>setBuyer(e.target.value)} placeholder="Tal como figura en SUNAT"/><small>Se sugiere el cliente del contrato; puedes editarlo.</small></label>
 <label>Importe de la boleta ({currency}) *<input name="inlineAmount" required inputMode="decimal" value={total??amount} onChange={e=>setTotal(e.target.value)} placeholder="500.00"/><small>Puede ser distinto al dinero recibido.</small></label>
 <label>Concepto de la boleta *<input name="inlineDescription" required maxLength={240} value={concept??description} onChange={e=>setConcept(e.target.value)} placeholder="Cobertura audiovisual"/></label>
 <details className={styles.full}><summary>IGV y descuento, si figuran en el comprobante</summary><div className={styles.inlineTax}><label>IGV consignado<input name="inlineIgv" inputMode="decimal" placeholder="Sin dato"/></label><label>Descuento consignado<input name="inlineDiscount" inputMode="decimal" placeholder="Sin dato"/></label></div><p className={styles.hint}>Cero si el original dice 0.00; vacío si no figura. No se calculan impuestos.</p></details>
 <p className={styles.full}>Un solo guardado registra el cobro y su boleta vinculada. No emite comprobantes ni suma dinero dos veces.</p>
 </section>;
}
