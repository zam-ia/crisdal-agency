"use client";
import {useEffect,useRef,type ReactNode} from "react";
/** Measure the actual banner so translated or zoomed consent text doesn't cover WhatsApp. */
export function FloatingContact({children}:{children:ReactNode}){
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{
   const host=ref.current;if(!host)return;
   let banner:HTMLElement|null=null;
   const measure=()=>{
    if(!banner){host.style.setProperty("--crisdal-contact-clearance","0px");return;}
    const rect=banner.getBoundingClientRect();
    host.style.setProperty("--crisdal-contact-clearance",Math.max(0,Math.ceil(window.innerHeight-rect.top))+"px");
   };
   const resize=typeof ResizeObserver!=="undefined"?new ResizeObserver(measure):null;
   const attach=()=>{const next=document.querySelector<HTMLElement>(".consent-banner");if(next===banner)return;resize?.disconnect();banner=next;if(banner)resize?.observe(banner);measure();};
   const mutation=new MutationObserver(attach);
   mutation.observe(document.body,{childList:true,subtree:true});
   attach();measure();window.addEventListener("resize",measure);
   return ()=>{mutation.disconnect();resize?.disconnect();window.removeEventListener("resize",measure);};
 },[]);
 return <div ref={ref}>{children}</div>;
}
