export type ContainerType="20FT"|"40FT"|"LCL";
export interface DimensionItem { length_cm:number; width_cm:number; height_cm:number; quantity:number; weight_kg:number; }
export interface CBMResult { total_cbm:number; gross_weight_kg:number; container_type:ContainerType; container_count:number; utilization_percent:number; volume_utilization_percent:number; weight_utilization_percent:number; }
const specs={"20FT":{cbm:33.2,payload:28000},"40FT":{cbm:67.7,payload:26500}} as const;
function valid(v:number,n:string){if(!Number.isFinite(v)||v<0)throw new Error(`${n} must be a finite non-negative number`);return v}
function round(v:number,d=6){const p=10**d;return Math.round((v+Number.EPSILON)*p)/p}
export function calculateItemCBM(i:DimensionItem){return round(valid(i.length_cm,"length_cm")*valid(i.width_cm,"width_cm")*valid(i.height_cm,"height_cm")*valid(i.quantity,"quantity")/1_000_000)}
export function calculatePacking(items:DimensionItem[]):CBMResult{
 if(!items.length)throw new Error("At least one dimension item is required"); let cbm=0,w=0;
 for(const i of items){cbm+=calculateItemCBM(i);w+=valid(i.weight_kg,"weight_kg")*valid(i.quantity,"quantity")}
 cbm=round(cbm);w=round(w,3); if(cbm===0||w===0)return{total_cbm:cbm,gross_weight_kg:w,container_type:"LCL",container_count:0,utilization_percent:0,volume_utilization_percent:0,weight_utilization_percent:0};
 if(cbm<=specs["20FT"].cbm&&w<=specs["20FT"].payload)return make(cbm,w,"20FT",1);
 if(cbm<=specs["40FT"].cbm&&w<=specs["40FT"].payload)return make(cbm,w,"40FT",1);
 const n=Math.max(Math.ceil(cbm/specs["40FT"].cbm),Math.ceil(w/specs["40FT"].payload));
 return make(cbm,w,"40FT",n);
}
function make(cbm:number,w:number,type:"20FT"|"40FT",count:number):CBMResult{const s=specs[type];const vp=round(cbm/(s.cbm*count)*100,2),wp=round(w/(s.payload*count)*100,2);return{total_cbm:cbm,gross_weight_kg:w,container_type:type,container_count:count,utilization_percent:Math.max(vp,wp),volume_utilization_percent:vp,weight_utilization_percent:wp}}
export class M20ContainerCBMService{calculate(items:DimensionItem[]){return calculatePacking(items)}}
