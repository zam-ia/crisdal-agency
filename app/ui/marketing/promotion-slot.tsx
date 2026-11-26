import{safePromotions}from"../../lib/commercial/promotion-repository";import type{Promotion}from"../../lib/commercial/promotions";import{PromotionExperience}from"./promotion-experience";
export async function PromotionSlot({page}:{page:Promotion["pages"][number]}){const[item]=await safePromotions(page);return item?<PromotionExperience promotion={item}/>:null;}
