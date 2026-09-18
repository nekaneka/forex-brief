import {FACTORS,CALENDAR_FACTORS} from './config.mjs';
const str={type:'string'},num={type:['number','null']},nullable={type:['string','null']},bool={type:'boolean'};
const obj=properties=>({type:'object',additionalProperties:false,properties,required:Object.keys(properties)});
export const researchSchema=obj({
 evidence:{type:'array',items:obj({currency:str,factor:{type:'string',enum:FACTORS},status:{type:'string',enum:['verified','unavailable']},series:str,actual:num,unit:str,reading:str,consensus:num,prior:num,referencePeriod:str,sourceName:str,sourceUrl:nullable,sourceDate:nullable,consensusSourceUrl:nullable,definitionMatched:bool,comparisonMatched:bool,tone:{type:'string',enum:['strong_hawkish','moderate_hawkish','neutral','mixed','moderate_dovish','strong_dovish','not_applicable']},notes:str,searchQuery:str})},
 events:{type:'array',items:obj({currency:str,category:{type:'string',enum:CALENDAR_FACTORS},event:str,date:str,time:nullable,timezone:nullable,instant:nullable,consensus:nullable,sourceUrl:str,relevance:str})},
 calendarChecks:{type:'array',items:obj({currency:str,category:{type:'string',enum:CALENDAR_FACTORS},status:{type:'string',enum:['scheduled','none_verified','unavailable']},sourceUrl:nullable,note:str})},
 risk:obj({equityChangePct:num,vixChangePct:num,asOf:nullable,equitySourceUrl:nullable,vixSourceUrl:nullable,notes:str})
});
