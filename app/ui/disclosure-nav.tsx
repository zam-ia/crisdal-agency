"use client";
import {useEffect,useRef,type ReactNode} from "react";
/** Native disclosure preserves built-in keyboard and expanded-state semantics. */
export function DisclosureNav({className,label,navLabel,children}:{className:string;label:ReactNode;navLabel:string;children:ReactNode}){
 const ref=useRef<HTMLDetailsElement>(null);
 useEffect(()=>{
   const el=ref.current;if(!el)return;
   const closeOutside=(e:PointerEvent)=>{if(el.open&&e.target instanceof Node&&!el.contains(e.target))el.open=false;};
   const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape"&&el.open){e.preventDefault();el.open=false;el.querySelector("summary")?.focus();}};
   const onLink=(e:MouseEvent)=>{if(e.target instanceof Element&&e.target.closest("nav a"))el.open=false;};
   document.addEventListener("pointerdown",closeOutside);
   el.addEventListener("keydown",onKey);
   el.addEventListener("click",onLink);
   return ()=>{document.removeEventListener("pointerdown",closeOutside);el.removeEventListener("keydown",onKey);el.removeEventListener("click",onLink);};
 },[]);
 return <details ref={ref} className={className}><summary>{label}</summary><nav aria-label={navLabel}>{children}</nav></details>;
}
