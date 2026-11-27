"use client";
import { useCallback,useEffect,useRef,useState } from "react";
import { estimateBreakEven,formatMoney,limaDate,parseMoney,receiptReference,receiptVoucherNumber, type FinanceAccount,type FinanceMovement,type FinanceSnapshot,type FinanceVoucher } from "../../lib/os/finance/operations";
import styles from "./finance.module.css";
import {financeExport} from "../../lib/os/finance/export";
import {canReuseFinanceWrite,markFinanceWriteUncertain,type PendingFinanceWrite} from "../../lib/os/form-safeguards";
import { useUnsavedNavigation } from "../../ui/os/use-unsaved-navigation";
import { VoucherDetails, readVoucherItems, sourceLabels } from "./voucher-details";

type Currency="PEN"|"USD";
type Tab="summary"|"accounts"|"movements"|"vouchers";
type Draft={kind:"account"|"adjust"|"receipt"|"refund"|"expense"|"voucher"|"correct"|"voidMovement"|"voidVoucher";account?:FinanceAccount;movement?:FinanceMovement;voucher?:FinanceVoucher};
const methodLabels:Record<string,string>={cash:"Efectivo",transfer:"Transferencia",yape:"Yape",plin:"Plin",card:"Tarjeta",other:"Otro"};
const movementLabels:Record<string,string>={receipt:"Cobro",refund:"Devolución",expense:"Gasto"};
const expenseLabels:Record<string,string>={direct:"Directo del evento",fixed:"Fijo del negocio",other:"Otro gasto"};
const decimal=(minor:number)=> (minor/100).toFixed(2);
const getText=(data:FormData,key:string)=>String(data.get(key)||"").trim();
function PageButtons({offset,total,onChange}:{offset:number;total:number;onChange:(value:number)=>void}){
 return <div className={styles.pagination}><span>{total===0?"0 registros":`${offset+1}–${Math.min(offset+50,total)} de ${total}`}</span><button type="button" disabled={!offset} onClick={()=>onChange(Math.max(0,offset-50))}>Anterior</button><button type="button" disabled={offset+50>=total} onClick={()=>onChange(offset+50)}>Siguiente</button></div>;
}
function BreakEven({currency,fixed}:{currency:Currency;fixed:number}){
 const [values,setValues]=useState({fixed:"",sale:"",variable:""});
 const [result,setResult]=useState<ReturnType<typeof estimateBreakEven>|null>(null);
 const [error,setError]=useState("");
 const money=(n:number)=>formatMoney(n,currency);
 return <section className={styles.section}><div className={styles.sectionHead}><div><span className={styles.eyebrow}>PLANIFICACIÓN</span><h2>¿Cuántos eventos necesito vender?</h2><p>Calcula una meta mensual a partir de tus propios costos y precios. No es una liquidación de impuestos.</p></div></div>
 <form className={styles.formGrid} onSubmit={e=>{e.preventDefault();try{setResult(estimateBreakEven({fixedMinor:parseMoney(values.fixed),averageSaleMinor:parseMoney(values.sale),variableMinor:parseMoney(values.variable)}));setError("");}catch{setResult(null);setError("Revisa los tres importes.");}}}>
 <label>Gastos fijos al mes<input required inputMode="decimal" value={values.fixed} onChange={e=>{setValues({...values,fixed:e.target.value});setResult(null);}} placeholder="Ej. 1500"/></label>
 <label>Precio promedio por evento<input required inputMode="decimal" value={values.sale} onChange={e=>{setValues({...values,sale:e.target.value});setResult(null);}} placeholder="Ej. 1200"/></label>
 <label>Costo variable por evento<input required inputMode="decimal" value={values.variable} onChange={e=>{setValues({...values,variable:e.target.value});setResult(null);}} placeholder="Ej. 400"/></label>
 <div className={styles.formActions}><button type="button" onClick={()=>{setValues({...values,fixed:decimal(fixed)});setResult(null);}}>Usar gastos fijos registrados</button><button className={styles.primary} type="submit">Calcular meta</button></div></form>
 <p className={styles.hint}>Incluye costos futuros y obligaciones en tu presupuesto. Usa importes comparables, con el mismo criterio tributario. Los gastos fijos registrados corresponden al mes elegido y pueden estar incompletos.</p>
 {error&&<p role="alert" className={styles.error}>{error}</p>}
 {result&&<div className={styles.result} role="status">{result.events===null?<><strong>No hay punto de equilibrio con estos valores.</strong><p>El precio debe superar el costo variable de cada evento.</p></>:<><strong>{result.events} evento{result.events===1?"":"s"} al mes</strong><p>Meta de ventas: {money(result.revenueMinor!)}. Cada evento aporta {money(result.contributionMinor)} para cubrir los gastos fijos.</p></>}</div>}</section>;
}
export function FinanceClient({canWrite,initialAction}:{canWrite:boolean;initialAction?:"receipt"|"expense"|"voucher"}){
 const [currency,setCurrency]=useState<Currency>("PEN");
 const [month,setMonth]=useState(()=>limaDate().slice(0,7));
 const [tab,setTab]=useState<Tab>("summary");
 const [offsets,setOffsets]=useState({accountOffset:0,movementOffset:0,voucherOffset:0});
 const [revision,setRevision]=useState(0);
 const [snapshot,setSnapshot]=useState<FinanceSnapshot|null>(null);
 const [loadError,setLoadError]=useState("");
 const [notice,setNotice]=useState("");
 const [formError,setFormError]=useState("");
 const [draft,setDraft]=useState<Draft|null>(()=>canWrite&&initialAction?{kind:initialAction}:null);
 const [expenseClass,setExpenseClass]=useState("direct");
 const [accountChoice,setAccountChoice]=useState("");
 const [busy,setBusy]=useState(false);
 const [exporting,setExporting]=useState(false);
 const retry=useRef<PendingFinanceWrite|null>(null);
 const formDirty=useRef(false);
 const inFlight=useRef(false);
 const query=new URLSearchParams({currency,month,...Object.fromEntries(Object.entries(offsets).map(([k,v])=>[k,String(v)]))}).toString();
 const [loadedKey,setLoadedKey]=useState("");
 const key=query+":"+revision;
 const current=loadedKey===key?snapshot:null;
 const error=loadedKey===key?loadError:"";
 const money=(n:number)=>formatMoney(n,currency);
 useEffect(()=>{
   const controller=new AbortController();
   void fetch("/api/panel/finance?"+query,{signal:controller.signal,cache:"no-store"}).then(async r=>{
     const data=await r.json();
     if(!r.ok)throw new Error(data.error||"No se pudo cargar.");
     if(!controller.signal.aborted){setSnapshot(data as FinanceSnapshot);setLoadError("");setLoadedKey(key);}
   }).catch(e=>{if(!controller.signal.aborted){setSnapshot(null);setLoadError(e instanceof Error?e.message:"Error de conexión.");setLoadedKey(key);}});
   return ()=>controller.abort();
 },[query,key]);
 const leaveState = useCallback(() => ({
   writing: inFlight.current,
   warning: retry.current?.uncertain
     ? "El servidor no confirmó el último guardado. Antes de repetir la operación, revisa los registros. ¿Salir de este formulario?"
     : formDirty.current ? "Tienes datos sin guardar. ¿Descartarlos?" : "",
 }), []);
 useUnsavedNavigation(leaveState);

 function mayDiscard() {
   const { writing, warning } = leaveState();
   return !writing && (!warning || window.confirm(warning));
 }
 function closeDraft() {
   if (!mayDiscard()) return;
   setDraft(null);
   retry.current = null;
   formDirty.current = false;
   setFormError("");
 }
 function open(next:Draft){if(!mayDiscard())return;formDirty.current=false;setDraft(next);setExpenseClass("direct");setAccountChoice(next.account?.id||next.voucher?.account_id||next.movement?.account_id||"");setNotice("");setFormError("");retry.current=null;}
 function switchFilters(nextCurrency:Currency,nextMonth:string){if(exporting||!mayDiscard())return;formDirty.current=false;retry.current=null;setCurrency(nextCurrency);setMonth(nextMonth);setOffsets({accountOffset:0,movementOffset:0,voucherOffset:0});setDraft(null);setNotice("");}
 function page(field:keyof typeof offsets,value:number){if(!mayDiscard())return;formDirty.current=false;retry.current=null;setOffsets(old=>({...old,[field]:value}));setDraft(null);}
 async function submit(e:React.FormEvent<HTMLFormElement>){
   e.preventDefault();if(!draft||busy||inFlight.current||!canWrite)return;
   const d=new FormData(e.currentTarget),s=(k:string)=>getText(d,k),optional=(k:string)=>s(k)||null;
   let payload:Record<string,unknown>;
   try{
     if(draft.kind==="voidMovement"||draft.kind==="voidVoucher")payload={action:draft.kind==="voidMovement"?"void_movement":"external_void_voucher",id:draft.movement?.id||draft.voucher?.id,reason:s("reason")};
     else if(draft.kind==="adjust")payload={action:"adjust_account",accountId:draft.account?.id,amountMinor:parseMoney(s("amount")),reason:s("reason")};
     else if(draft.kind==="account")payload={action:"account",currency,title:s("title"),customer:s("customer"),date:s("date"),eventDate:optional("eventDate"),amountMinor:parseMoney(s("amount")),reference:optional("reference")};
     else if(draft.kind==="voucher"||draft.kind==="correct")payload={action:draft.kind==="correct"?"correct_voucher":"voucher",...(draft.kind==="correct"?{id:draft.voucher?.id,reason:s("reason")}:{}),accountId:optional("accountId"),receiptId:accountChoice?optional("receiptId"):null,currency,issuerRuc:s("issuerRuc"),series:s("series"),number:s("number"),date:s("date"),amountMinor:parseMoney(s("amount")),igvMinor:s("igv")?parseMoney(s("igv")):null,discountMinor:s("discount")?parseMoney(s("discount")):null,sourceKind:s("sourceKind"),items:readVoucherItems(d),customer:s("customer"),documentType:optional("documentType"),documentNumber:optional("documentNumber"),description:s("description")};
     else payload={action:"movement",kind:draft.kind,currency,accountId:draft.kind==="expense"&&expenseClass!=="direct"?null:optional("accountId"),amountMinor:parseMoney(s("amount")),date:s("date"),method:s("method"),expenseClass:draft.kind==="expense"?expenseClass:null,description:s("description"),reference:optional("reference")};
   }catch(e){setFormError(e instanceof Error?e.message:"Importe inválido.");return;}
   const body=JSON.stringify(payload);
   if(!canReuseFinanceWrite(retry.current,body)){setFormError("El guardado anterior no fue confirmado. Reintenta con exactamente los mismos datos o revisa tus registros antes de iniciar otra operación.");return;}
   if(retry.current?.body!==body)retry.current={body,id:crypto.randomUUID(),uncertain:false};
   const requestId = retry.current.id;
   const generatedReference = draft.kind === "receipt" && payload.method === "cash" && !payload.reference;
   if (draft.kind === "receipt") {
     payload.reference = receiptReference(typeof payload.reference === "string" ? payload.reference : null, String(payload.method), requestId);
   }
   inFlight.current=true;setBusy(true);setFormError("");
   try{
     const response=await fetch("/api/panel/finance",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...payload,requestId})});
     const result=await response.json();
     if (!response.ok) {
       if (response.status >= 500 || response.status === 408) {
         retry.current = markFinanceWriteUncertain(retry.current);
       }
       if (!retry.current?.uncertain) retry.current = null;
       setFormError(retry.current?.uncertain
         ? "No se pudo confirmar el guardado. Reintenta con los mismos datos o revisa tus registros."
         : result.error || "No se pudo guardar.");
       return;
     }
     if(!result.ok||typeof result.id!=="string")throw new Error("No se confirmó el guardado.");
     formDirty.current=false;
     setNotice(draft.kind==="voucher"||draft.kind==="correct"?"Boleta registrada internamente. No se ha enviado nada a SUNAT.":"Registro guardado correctamente.");
     if(draft.kind==="receipt"&&d.get("nextVoucher")==="yes"){
       const movement:FinanceMovement={id:result.id,account_id:String(payload.accountId),kind:"receipt",currency,amount_minor:Number(payload.amountMinor),occurred_on:String(payload.date),method:String(payload.method),expense_class:null,description:String(payload.description),reference:payload.reference?String(payload.reference):null,status:"posted",void_reason:null};
       setDraft({kind:"voucher",movement,account:current?.accounts.find(a=>a.id===movement.account_id)});setAccountChoice(movement.account_id||"");setTab("vouchers");setNotice("Cobro guardado. Ahora registra la boleta SUNAT, si ya fue emitida.");
     } else {
       if (generatedReference) setNotice("Cobro guardado. Referencia de efectivo: " + payload.reference);
       setDraft(null);
     }
     retry.current=null;setRevision(x=>x+1);
   }catch(e){retry.current=markFinanceWriteUncertain(retry.current);setFormError((e instanceof Error?e.message+" ":"")+"No se pudo confirmar. Reintenta con los mismos datos; si cierras, revisa los registros antes de repetir.");}
   finally{inFlight.current=false;setBusy(false);}
 }
 async function downloadMonthly(kind:"vouchers"|"movements"){
  if(exporting||busy)return;
  setExporting(true);
  try{
   const params=new URLSearchParams({currency,month,kind});
   const response=await fetch("/api/panel/finance/export?"+params,{cache:"no-store"});
   if(!response.ok){const data=await response.json().catch(()=>null);throw new Error(data?.error||"No se pudo exportar.");}
   const blob=await response.blob(),url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=`crisdal-${kind==="vouchers"?"boletas":"movimientos"}-${month}-${currency}.csv`;document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);setNotice("Informe solicitado. Contiene información contable privada; compártelo solo por un canal autorizado.");
  }catch(e){setNotice(e instanceof Error?e.message:"No se pudo exportar el mes.");}finally{setExporting(false);}
 }
 function download(){
  if(!current||busy)return;
  try{
   const content=financeExport(current,tab);
   const offset=tab==="accounts"?offsets.accountOffset:tab==="movements"?offsets.movementOffset:tab==="vouchers"?offsets.voucherOffset:0;
   const scope=tab==="summary"?"resumen":"pagina-"+(Math.floor(offset/50)+1);
   const url=URL.createObjectURL(new Blob([content],{type:"text/csv;charset=utf-8"}));
   const link=document.createElement("a");link.href=url;link.download="crisdal-"+tab+"-"+currency+"-"+month+"-"+scope+".csv";document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
   setNotice("Se solicitó la descarga del informe. Conserva el archivo en un lugar seguro.");
  }catch{setNotice("No se pudo preparar el informe. Actualiza los datos y reintenta.");}
 }
 const totals=current?.totals;
 const net=totals?totals.received_minor-totals.refunded_minor:0;
 const result=totals?net-totals.expenses_minor:0;
 const maxBar=current?Math.max(1,...current.trend.flatMap(x=>[x.received_minor,x.expenses_minor+x.refunded_minor])):1;
 const selectedAccount=draft?.account?.id||draft?.voucher?.account_id||draft?.movement?.account_id||"";
 const linkedReceipt=draft?.kind==="voucher"&&draft.movement?.kind==="receipt"?draft.movement:undefined;
 const chosenAccount=current?.accounts.find(a=>a.id===accountChoice);
 const selectedVoucher=draft?.voucher;
 const suggestedVoucher=receiptVoucherNumber(linkedReceipt?.reference);
 const isVoucher=draft?.kind==="voucher"||draft?.kind==="correct";
 const isVoid=draft?.kind==="voidMovement"||draft?.kind==="voidVoucher";
 return <div className={styles.page}>
 <header className={styles.header}><div><span className={styles.eyebrow}>CRISDAL OS · CONTROL FINANCIERO</span><h1>Tu dinero, claro.</h1><p>Lo que entró, lo que salió y lo que todavía te deben. Las boletas se registran aquí, pero se emiten únicamente en SUNAT.</p></div><div className={styles.filters}><label>Mes<input type="month" min="2000-01" max="2099-12" value={month} disabled={busy} onChange={e=>{if(e.target.value)switchFilters(currency,e.target.value);}}/></label><label>Moneda<select value={currency} disabled={busy} onChange={e=>switchFilters(e.target.value as Currency,month)}><option value="PEN">Soles (PEN)</option><option value="USD">Dólares (USD)</option></select></label></div></header>
 {notice&&<div className={styles.success} role="status">{notice}</div>}
 {error?<section className={styles.section}><h2>Finanzas no está disponible</h2><p>{error} No se mostrarán saldos ficticios.</p><button type="button" onClick={()=>setRevision(x=>x+1)}>Reintentar</button></section>:!current?<section className={styles.section} aria-busy="true">Cargando información financiera…</section>:<>
 {canWrite&&<div className={styles.quick}><button className={styles.primary} type="button" disabled={busy} onClick={()=>open({kind:"receipt"})}>+ Registrar cobro</button><button type="button" disabled={busy} onClick={()=>open({kind:"expense"})}>+ Registrar gasto</button><button type="button" disabled={busy} onClick={()=>open({kind:"voucher"})}>+ Registrar boleta</button><button type="button" disabled={busy} onClick={()=>open({kind:"account"})}>+ Contrato anterior (manual)</button></div>}
 {draft&&canWrite&&<section className={`${styles.section} ${styles.entryForm}`} aria-label="Formulario financiero"><div className={styles.sectionHead}><div><span className={styles.eyebrow}>REGISTRO INTERNO</span><h2>{({account:"Registrar contrato anterior",adjust:"Corregir importe contratado",receipt:"Registrar cobro",refund:"Registrar devolución",expense:"Registrar gasto",voucher:"Registrar boleta emitida",correct:"Corregir datos de boleta",voidMovement:"Anular registro de movimiento",voidVoucher:"Registrar baja informada en SUNAT"})[draft.kind]}</h2></div><button type="button" disabled={busy} onClick={closeDraft}>Cerrar</button></div>
 <form key={draft.kind+":"+selectedAccount+":"+(selectedVoucher?.id||"")+":"+(linkedReceipt?.id||"")} className={styles.formGrid} aria-busy={busy} onChangeCapture={()=>{formDirty.current=true;}} onSubmit={submit}><fieldset className={styles.formFields} disabled={busy}>
 {isVoucher?<p className={styles.full}>Copia la boleta electrónica original de SUNAT. El resumen con diseño Crisdal utiliza el mismo número y no es otra venta. No subas PDF: conserva los archivos en tu carpeta de Drive.</p>:draft.kind==="receipt"?<p className={styles.full}>Registra únicamente el dinero que realmente recibiste. Si ya emitiste una boleta, podrás vincularla en el siguiente paso.</p>:null}
 {isVoid?<><p className={styles.full}>{draft.kind==="voidVoucher"?"Confirma primero la baja real en SUNAT. Esta acción solo cambia nuestro registro interno y no devuelve dinero.":"Esta acción conserva el historial y excluye el movimiento de los cálculos. No ejecuta un reembolso."}</p><label className={styles.full}>Motivo y referencia de respaldo<textarea name="reason" required minLength={3} maxLength={240}/></label></>:draft.kind==="adjust"?<><p className={styles.full}>{draft.account?.title} · Cobrado neto: {money((draft.account?.received_minor||0)-(draft.account?.refunded_minor||0))}</p><label>Importe contratado correcto<input required name="amount" inputMode="decimal" defaultValue={decimal(draft.account?.total_minor||0)}/></label><label>Motivo<textarea name="reason" required minLength={3} maxLength={240}/></label></>:<>
 {draft.kind==="account"?<><label>Cliente<input name="customer" required maxLength={160}/></label><label>Servicio o evento<input name="title" required maxLength={160} placeholder="Ej. Boda, cobertura fotográfica"/></label><label>Fecha del evento (opcional)<input type="date" name="eventDate"/></label></>:<>
 {draft.kind==="expense"&&<label>Tipo de gasto<select value={expenseClass} onChange={e=>setExpenseClass(e.target.value)}>{Object.entries(expenseLabels).map(([k,v])=><option value={k} key={k}>{v}</option>)}</select></label>}
 {(draft.kind!=="expense"||expenseClass==="direct")&&<label>Contrato o evento {isVoucher?"(opcional)":""}<select name="accountId" value={accountChoice} onChange={e=>setAccountChoice(e.target.value)} required={!isVoucher}><option value="">{isVoucher?"Sin vincular":"Seleccionar"}</option>{selectedAccount&&!current.accounts.some(a=>a.id===selectedAccount)&&<option value={selectedAccount}>Contrato asociado anteriormente</option>}{current.accounts.map(a=><option key={a.id} value={a.id}>{a.customer} — {a.title}</option>)}</select></label>}
 </>}
 <label>Fecha {isVoucher?"de emisión":draft.kind==="account"?"de contratación":"del movimiento"}<input type="date" name="date" required max={limaDate()} defaultValue={selectedVoucher?.issued_on||limaDate()}/></label>
 <label>Importe ({currency})<input required name="amount" inputMode="decimal" defaultValue={selectedVoucher?decimal(selectedVoucher.total_minor):linkedReceipt?decimal(linkedReceipt.amount_minor):""} placeholder="Ej. 500.00"/></label>
 {isVoucher?<><label>RUC de Crisdal (emisor)<small>Los 11 dígitos del emisor de la boleta, no del cliente.</small><input required name="issuerRuc" inputMode="numeric" pattern="[0-9]{11}" maxLength={11} defaultValue={selectedVoucher?.issuer_ruc||""}/></label><div className={styles.voucherNumber}><label>Serie *<input required name="series" maxLength={4} placeholder="EB01" defaultValue={selectedVoucher?.series ?? suggestedVoucher?.series ?? ""}/><small>Parte anterior al guion.</small></label><label>Número *<input required name="number" inputMode="numeric" pattern="[0-9]{1,8}" maxLength={8} placeholder="1" defaultValue={selectedVoucher?.number ?? suggestedVoucher?.number ?? ""}/><small>Parte posterior al guion.</small></label><p>Ejemplo: EB01-1</p></div><label>IGV consignado (opcional)<small>Copia el importe exacto. Cero si dice 0.00; vacío si no figura.</small><input name="igv" inputMode="decimal" defaultValue={selectedVoucher?.igv_minor!=null?decimal(selectedVoucher.igv_minor):""}/></label><label>Cliente según la boleta<small>Nombre o razón social tal como aparece en SUNAT. Si cambias de contrato, verifica este dato antes de guardar.</small><input name="customer" maxLength={160} defaultValue={selectedVoucher?.customer||draft.account?.customer||chosenAccount?.customer||""}/></label><label>Tipo de documento (si figura)<select name="documentType" defaultValue={selectedVoucher?.document_type||""}><option value="">No consignado</option>{["DNI","RUC","CE","PASSPORT","OTHER"].map(v=><option key={v}>{v}</option>)}</select></label><label>DNI / RUC / otro número (si figura)<small>Identificación del comprador, no del emisor.</small><input name="documentNumber" maxLength={30} defaultValue={selectedVoucher?.document_number||""}/></label><label>Vincular con cobro registrado (opcional)<small>Lista del mes y página de movimientos elegidos. Si el cobro es anterior, selecciónalo desde Cobros y gastos de ese mes. La fecha de emisión puede ser distinta.</small><select key={accountChoice} name="receiptId" defaultValue={linkedReceipt&&linkedReceipt.account_id===accountChoice?linkedReceipt.id:selectedVoucher?.account_id===accountChoice?selectedVoucher?.receipt_id||"":""} disabled={!accountChoice}><option value="">Sin vincular</option>{linkedReceipt&&linkedReceipt.account_id===accountChoice&&!current.movements.some(m=>m.id===linkedReceipt?.id)&&<option value={linkedReceipt.id}>Cobro recién registrado · {money(linkedReceipt.amount_minor)}</option>}{selectedVoucher?.receipt_id&&selectedVoucher.account_id===accountChoice&&!current.movements.some(m=>m.id===selectedVoucher.receipt_id)&&<option value={selectedVoucher.receipt_id}>Cobro asociado anteriormente</option>}{current.movements.filter(m=>m.kind==="receipt"&&m.status==="posted"&&m.account_id===accountChoice).map(m=><option value={m.id} key={m.id}>{m.occurred_on} · {money(m.amount_minor)} · {m.description}</option>)}</select></label><VoucherDetails voucher={selectedVoucher} disabled={busy}/>{draft.kind==="correct"&&<label>Motivo de corrección interna<textarea name="reason" required minLength={3} maxLength={240}/></label>}<p className={styles.full}>Copia los datos tal como aparecen en SUNAT. No se calcula IGV ni se genera un comprobante. Registrar la boleta no registra un cobro.</p></>:draft.kind!=="account"?<label>Medio de pago<select name="method">{Object.entries(methodLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>:null}
 {draft.kind!=="account"&&<label className={styles.full}>Concepto o descripción<input required name="description" maxLength={240} defaultValue={selectedVoucher?.description||linkedReceipt?.description||""} placeholder={isVoucher?"Ej. Servicio de cobertura fotográfica y audiovisual":"Ej. Adelanto de cobertura audiovisual"}/></label>}
  {!isVoucher && (draft.kind === "receipt"
   ? <label>Boleta SUNAT (si ya fue emitida)<small>Copia la serie y el correlativo que figuran en SUNAT. Si el pago fue en efectivo y dejas este campo vacío, se genera una referencia interna al guardar.</small><input name="reference" maxLength={160} placeholder="Ej. EB01-27"/></label>
   : <label>Referencia de pago (opcional)<input name="reference" maxLength={160} placeholder="N.º de operación"/></label>)}
 </>}
 {draft.kind==="receipt"&&<div className={`${styles.full} ${styles.checkRow}`}><input id="next-voucher" type="checkbox" name="nextVoucher" value="yes" aria-describedby="next-voucher-help"/><span><label htmlFor="next-voucher">Registrar también la boleta emitida en SUNAT</label><small id="next-voucher-help">Primero se guarda el cobro. Después se abre la boleta con los datos del pago.</small></span></div>}
 {formError&&<p className={styles.error} role="alert">{formError}</p>}
 <div className={styles.formActions}><button type="submit" className={styles.primary} disabled={busy}>{busy?"Guardando…":"Guardar registro"}</button><button type="button" disabled={busy} onClick={closeDraft}>Cancelar</button></div>
 </fieldset></form></section>}
 <nav className={styles.tabs} aria-label="Secciones de finanzas">{([["summary","Resumen"],["accounts","Contratos y saldos"],["movements","Cobros y gastos"],["vouchers","Boletas SUNAT"]] as const).map(([v,l])=><button key={v} type="button" aria-pressed={tab===v} disabled={busy} onClick={()=>setTab(v)}>{l}</button>)}</nav>
 <section className={styles.accountingExport}><div><span className={styles.eyebrow}>PARA CONTABILIDAD</span><h2>Registros del mes</h2><p>Todos los registros del periodo y moneda elegidos, incluso los que están en otras páginas. Incluye bajas y anulaciones identificadas. No es un libro tributario oficial.</p></div><div className={styles.rowActions}><button type="button" disabled={exporting||busy} onClick={()=>void downloadMonthly("vouchers")}>{exporting?"Preparando…":"Boletas del mes · CSV"}</button><button type="button" disabled={exporting||busy} onClick={()=>void downloadMonthly("movements")}>Cobros y gastos del mes · CSV</button></div><small>Las boletas incluyen nombre y documento del cliente. Los PDF y XML permanecen en Drive.</small></section>
 <div className={styles.exportBar}><div><strong>{tab==="summary"?"Informe del mes seleccionado":"Exportación de la página actual"}</strong><p>{tab==="summary"?"Incluye totales reales y saldo global por cobrar en la moneda elegida.":"Incluye únicamente los registros de esta página. No incluye DNI, RUC ni nombres de clientes como campos separados."}</p></div><button type="button" disabled={busy} onClick={download}>{tab==="summary"?"Descargar resumen CSV":"Descargar esta página CSV"}</button></div>
 {tab==="summary"&&totals&&<>
 <div className={styles.metrics}>{[
 ["Dinero que entró",money(net),"Cobros menos devoluciones"],
 ["Dinero que salió",money(totals.expenses_minor),"Gastos pagados"],
 ["Resultado de caja",money(result),"Entradas menos salidas del mes; no es el saldo bancario"],
 ["Aún por cobrar",money(current.open_balance_minor),"Saldo de todos los contratos"],
 ["Boletas registradas",money(totals.documented_minor),`${totals.voucher_count} comprobantes vigentes · no se suman a caja`],
 ].map(([title,value,hint])=><article key={title} className={styles.metric}><span>{title}</span><strong>{value}</strong><small>{hint}</small></article>)}</div>
 <section className={styles.section}><h2>Cómo va el negocio</h2><p>Entradas brutas y salidas (gastos más devoluciones) de los últimos seis meses.</p><div className={styles.legend}><span>Entradas</span><span>Salidas</span></div><div className={styles.trend}>{current.trend.map(x=><div key={x.month} className={styles.trendRow}><strong>{x.month}</strong><div><div className={styles.barTrack}><div className={styles.inBar} style={{width:`${x.received_minor/maxBar*100}%`}}/></div><small>{money(x.received_minor)}</small><div className={styles.barTrack}><div className={styles.outBar} style={{width:`${(x.expenses_minor+x.refunded_minor)/maxBar*100}%`}}/></div><small>{money(x.expenses_minor+x.refunded_minor)}</small></div></div>)}</div></section>
 <section className={styles.section}><h2>¿En qué se fue el dinero?</h2><div className={styles.costs}><div>Gastos fijos<strong>{money(totals.fixed_minor)}</strong></div><div>Gastos de eventos<strong>{money(totals.direct_minor)}</strong></div><div>Otros gastos<strong>{money(totals.other_minor)}</strong></div></div></section>
 <BreakEven key={currency+month} currency={currency} fixed={totals.fixed_minor}/>
 </>}
 {tab==="accounts"&&<section className={styles.section}><h2>Contratos y saldos</h2><p>Las nuevas cotizaciones aceptadas generan automáticamente su cuenta por cobrar. Usa el alta manual solo para contratos anteriores no registrados. Lo contratado no es lo mismo que lo cobrado. La contribución estimada resta únicamente los gastos directos registrados; no incluye gastos futuros, impuestos ni gastos generales.</p>{!current.accounts.length?<div className={styles.empty}>Aún no hay contratos registrados en esta moneda.</div>:<div className={styles.records}>{current.accounts.map(a=><article key={a.id} className={styles.record}><div className={styles.recordHead}><div><strong>{a.title}</strong><small>{a.customer} {a.event_date?`· Evento: ${a.event_date}`:""}</small></div><span className={styles.status}>{a.pending_minor===0?"Pagado":a.received_minor-a.refunded_minor>0?"Pago parcial":"Por cobrar"}</span></div><div className={styles.recordValues}><div>Contratado<strong>{money(a.total_minor)}</strong></div><div>Cobrado neto<strong>{money(a.received_minor-a.refunded_minor)}</strong></div><div>Falta cobrar<strong>{money(a.pending_minor)}</strong></div><div>Costo directo pagado<strong>{money(a.direct_cost_minor)}</strong></div><div>Contribución estimada<strong>{money(a.total_minor-a.direct_cost_minor)}</strong><small>{((a.total_minor-a.direct_cost_minor)/a.total_minor*100).toFixed(1)}% del contratado</small></div></div>{canWrite&&<div className={styles.rowActions}><button type="button" onClick={()=>open({kind:"receipt",account:a})}>Cobrar</button><button type="button" onClick={()=>open({kind:"expense",account:a})}>Gasto</button><button type="button" onClick={()=>open({kind:"voucher",account:a})}>Boleta</button><button type="button" onClick={()=>open({kind:"refund",account:a})}>Devolución</button>{!a.quote_id&&<button type="button" onClick={()=>open({kind:"adjust",account:a})}>Corregir monto</button>}</div>}</article>)}</div>}<PageButtons offset={offsets.accountOffset} total={current.accounts_count} onChange={v=>page("accountOffset",v)}/></section>}
 {tab==="movements"&&<section className={styles.section}><h2>Cobros y gastos del mes</h2><p>Solo los movimientos vigentes afectan la caja. Las devoluciones son dinero que salió del cobro original.</p>{!current.movements.length?<div className={styles.empty}>No hay movimientos registrados en este periodo.</div>:<div className={styles.records}>{current.movements.map(m=><article className={styles.record} key={m.id}><div className={styles.recordHead}><div><strong>{movementLabels[m.kind]} · {m.description}</strong><small>{m.occurred_on} · {methodLabels[m.method]} {m.expense_class?`· ${expenseLabels[m.expense_class]}`:""}</small>{m.reference&&<small>Ref. {m.reference}</small>}</div><div><strong className={m.kind==="receipt"?styles.positive:styles.negative}>{m.kind==="receipt"?"+":"−"}{money(m.amount_minor)}</strong><small>{m.status==="voided"?"Registro anulado":"Vigente"}</small></div></div>{m.void_reason&&<p>Motivo: {m.void_reason}</p>}{canWrite&&m.status==="posted"&&<div className={styles.rowActions}><button type="button" onClick={()=>open({kind:"voidMovement",movement:m})}>Anular registro</button>{m.kind==="receipt"&&<button type="button" onClick={()=>open({kind:"voucher",movement:m,account:current.accounts.find(a=>a.id===m.account_id)})}>Registrar boleta de este cobro</button>}</div>}</article>)}</div>}<PageButtons offset={offsets.movementOffset} total={current.movements_count} onChange={v=>page("movementOffset",v)}/></section>}
 {tab==="vouchers"&&<section className={styles.section}><div className={styles.sectionHead}><div><h2>Boletas emitidas en SUNAT</h2><p>Registro interno. Emite, consulta o da de baja los comprobantes directamente en SUNAT. No sustituye el registro tributario oficial.</p></div><a href="https://www.sunat.gob.pe/" target="_blank" rel="noopener noreferrer">Abrir SUNAT</a></div>{!current.vouchers.length?<div className={styles.empty}>Aún no hay boletas registradas en este periodo.</div>:<div className={styles.records}>{current.vouchers.map(v=><article key={v.id} className={styles.record}><div className={styles.recordHead}><div><strong>{v.series}-{v.number}</strong><small>{v.issued_on} · {v.customer||"Sin nombre consignado"}</small><small>{v.description}</small></div><div><strong>{money(v.total_minor)}</strong><small>{v.status==="external_void"?"Baja informada":v.status==="corrected"?"Registro corregido":"Registrada"}</small></div></div><div className={styles.recordValues}><div>RUC emisor<strong>{v.issuer_ruc}</strong></div><div>IGV registrado<strong>{v.igv_minor===null?"No consignado":money(v.igv_minor)}</strong></div><div>Documento registrado<strong>{sourceLabels[v.source_kind]??"Referencia manual"}</strong></div><div>Descuento<strong>{v.discount_minor==null?"No consignado":money(v.discount_minor)}</strong></div><div>Vínculo<strong>{v.receipt_id?"Cobro relacionado":v.account_id?"Contrato relacionado":"Sin vincular"}</strong></div></div>{v.items?.length>0&&<details><summary>Ver detalle de servicios ({v.items.length})</summary>{v.items.map((item,i)=><p key={i}>{item.quantity} × {item.description} · Valor unitario: {money(item.unitMinor)} · Importe: {money(item.lineMinor)}</p>)}</details>}{v.correction_reason&&<p>Referencia: {v.correction_reason}</p>}{canWrite&&v.status!=="external_void"&&<div className={styles.rowActions}><button type="button" onClick={()=>open({kind:"correct",voucher:v})}>Corregir registro</button><button type="button" onClick={()=>open({kind:"voidVoucher",voucher:v})}>Registrar baja informada</button></div>}</article>)}</div>}<PageButtons offset={offsets.voucherOffset} total={current.vouchers_count} onChange={v=>page("voucherOffset",v)}/></section>}
 </>}
 </div>;
}
