type NavigationItem={href:string;label:string;active?:boolean};
/** Keep common tasks visible. All authorized links also appear in the More disclosure. */
export function selectMobileNavigation<T extends NavigationItem>(items:readonly T[]):T[]{
 const priorities=["/panel","/panel/agenda","/panel/finanzas","/panel/clientes","/panel/produccion","/panel/portafolio","/panel/cotizaciones"];
 const selected:T[]=[];
 for(const href of priorities){const item=items.find(x=>x.href===href);if(item&&!selected.includes(item)&&selected.length<3)selected.push(item);}
 for(const item of items){if(selected.length>=3)break;if(!selected.includes(item))selected.push(item);}
 return selected;
}
