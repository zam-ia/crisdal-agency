"use client";
import { useEffect,useRef,type ReactNode } from "react";
/** Native disclosure keeps keyboard behavior and works without custom menu roles. */
export function DisclosureNav({className,label,navLabel,children}:{className:string;label:string;navLabel:string;children:ReactNode}){
 const ref=useRef<HTMLDetailsElement>(null);
 useEffect(()=>{
   const closeOutside=(e:PointerEvent)=>{const el=ref.current;if(el?.open&&e.target instanceof Node&&!el.contains(e.target))el.open=false;};
   document.addEventListener("pointerdown",closeOutside);
   return ()=>document.removeEventListener("pointerdown",closeOutside);
 },[]);
 return <details ref={ref} className={className} onKeyDown={e=>{if(e.key==="Escape"&&ref.current?.open){e.preventDefault();ref.current.open=false;ref.current.querySelector("summary")?.focus();}}}>
  <summary>{label}</summary>
  <nav aria-label={navLabel} onClick={e=>{if(e.target instanceof Element&&e.target.closest("a")&&ref.current)ref.current.open=false;}}>{children}</nav>
 </details>;
}
