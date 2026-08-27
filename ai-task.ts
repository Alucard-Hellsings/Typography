export type AiTaskStatus='idle'|'running'|'completed'|'failed'|'cancelled';
export type AiTaskStepStatus='pending'|'active'|'completed'|'failed';
export interface AiTaskStep{label:string;status:AiTaskStepStatus;detail?:string;}
export interface AiTaskSnapshot{
  id:string;
  title:string;
  provider:string;
  model:string;
  status:AiTaskStatus;
  startedAt:number;
  elapsedMs:number;
  output:string;
  outputChars:number;
  firstTokenMs?:number;
  error?:string;
  steps:AiTaskStep[];
  canRetry:boolean;
}
export type AiTaskListener=(task:AiTaskSnapshot)=>void;
