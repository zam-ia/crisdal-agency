import {limaDate,parseMoney,parseVoucherNumber} from "./operations";
export function inferDocumentType(number:string){return /^\d{8}$/.test(number)?"DNI":/^\d{11}$/.test(number)?"RUC":"";}
export function readInlineVoucher(data:FormData,issuerConfigured:boolean){
 const s=(key:string)=>String(data.get(key)??"").trim();
 const number=parseVoucherNumber(s("inlineNumber"));
 if(!number)throw new Error("Escribe el número de la boleta emitida. Ej.: EB01-27.");
 const issuerRuc=issuerConfigured?undefined:s("inlineIssuer");
 if(issuerRuc!==undefined&&!/^\d{11}$/.test(issuerRuc))throw new Error("Escribe el RUC de Crisdal de 11 dígitos.");
 const customer=s("inlineCustomer");
 if(!customer||customer.length>160)throw new Error("Escribe el nombre o razón social según SUNAT.");
 const documentNumber=s("inlineDocument"),documentType=s("inlineDocumentType");
 if((documentType==="DNI"&&!/^\d{8}$/.test(documentNumber))||(documentType==="RUC"&&!/^\d{11}$/.test(documentNumber))||Boolean(documentType)!==Boolean(documentNumber)||!["","DNI","RUC","CE","PASSPORT","OTHER"].includes(documentType)||documentNumber.length>30)throw new Error("Revisa el tipo y número de documento del cliente.");
 const date=s("inlineDate"),parsedDate=new Date(date+"T00:00:00Z");
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(parsedDate.getTime())||parsedDate.toISOString().slice(0,10)!==date||date>limaDate())throw new Error("Revisa la fecha de emisión.");
 const amountMinor=parseMoney(s("inlineAmount")),description=s("inlineDescription");
 if(amountMinor<=0||!description||description.length>240)throw new Error("Revisa el importe y concepto de la boleta.");
 const igvMinor=s("inlineIgv")?parseMoney(s("inlineIgv")):null;
 const discountMinor=s("inlineDiscount")?parseMoney(s("inlineDiscount")):null;
 if(igvMinor!==null&&igvMinor>amountMinor)throw new Error("El IGV consignado no puede superar el total.");
 return {issuerRuc,...number,date,amountMinor,customer,documentType:documentType||null,documentNumber:documentNumber||null,description,igvMinor,discountMinor};
}
