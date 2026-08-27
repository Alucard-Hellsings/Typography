import { requestUrl } from 'obsidian';

export type ProviderProtocol = 'openai-compatible' | 'anthropic' | 'codex-runtime';
export type ProviderPreset = 'openai' | 'anthropic' | 'openrouter' | 'deepseek' | 'custom';
export type ConnectionStatus = 'untested' | 'testing' | 'connected' | 'error';

export interface ProviderConnectionState {
  status: ConnectionStatus;
  message: string;
  latencyMs?: number;
  testedAt?: number;
}

export interface ModelProviderProfile {
  id: string;
  name: string;
  preset: ProviderPreset;
  protocol: ProviderProtocol;
  baseUrl: string;
  apiKeySecretId: string;
  authMode: 'auto' | 'bearer' | 'x-api-key';
  configSource?: 'manual' | 'claude' | 'codex';
  configPath?: string;
  runtimeCommand?: string;
  textEnabled: boolean;
  imageEnabled: boolean;
  textModel: string;
  imageModel: string;
  imageBaseUrl: string;
  timeoutMs: number;
  maxTokens: number;
  temperature: number;
  customHeaders: string;
  discoveredModels: string[];
  connection: ProviderConnectionState;
}

export const PROVIDER_PRESETS: Record<ProviderPreset, {name:string; protocol:ProviderProtocol; baseUrl:string; textModel:string; imageModel:string; textEnabled:boolean; imageEnabled:boolean}> = {
  openai: {name:'OpenAI',protocol:'openai-compatible',baseUrl:'https://api.openai.com/v1',textModel:'gpt-4.1-mini',imageModel:'gpt-image-1',textEnabled:true,imageEnabled:true},
  anthropic: {name:'Anthropic',protocol:'anthropic',baseUrl:'https://api.anthropic.com/v1',textModel:'claude-sonnet-4-5',imageModel:'',textEnabled:true,imageEnabled:false},
  openrouter: {name:'OpenRouter',protocol:'openai-compatible',baseUrl:'https://openrouter.ai/api/v1',textModel:'anthropic/claude-sonnet-4.5',imageModel:'',textEnabled:true,imageEnabled:false},
  deepseek: {name:'DeepSeek',protocol:'openai-compatible',baseUrl:'https://api.deepseek.com',textModel:'deepseek-v4-pro',imageModel:'',textEnabled:true,imageEnabled:false},
  custom: {name:'自定义提供商',protocol:'openai-compatible',baseUrl:'',textModel:'',imageModel:'',textEnabled:true,imageEnabled:false}
};

export function createProvider(preset:ProviderPreset, index=0):ModelProviderProfile {
  const source=PROVIDER_PRESETS[preset];
  const id=`${preset}-${Date.now().toString(36)}-${index.toString(36)}-${Math.random().toString(36).slice(2,7)}`;
  return {
    id,name:source.name,preset,protocol:source.protocol,baseUrl:source.baseUrl,
    apiKeySecretId:secretIdForProvider(id),authMode:'auto',configSource:'manual',textEnabled:source.textEnabled,imageEnabled:source.imageEnabled,
    textModel:source.textModel,imageModel:source.imageModel,imageBaseUrl:source.baseUrl,
    timeoutMs:60000,maxTokens:8192,temperature:0.7,customHeaders:'',discoveredModels:[],
    connection:{status:'untested',message:'尚未测试'}
  };
}

export function normalizeProvider(input:Partial<ModelProviderProfile>, fallbackPreset:ProviderPreset='custom'):ModelProviderProfile {
  const base=createProvider(input.preset||fallbackPreset);
  const profile=Object.assign(base,input);
  profile.baseUrl=normalizeBaseUrl(profile.baseUrl);
  profile.imageBaseUrl=normalizeBaseUrl(profile.imageBaseUrl||profile.baseUrl);
  profile.discoveredModels=Array.isArray(profile.discoveredModels)?Array.from(new Set(profile.discoveredModels.filter(Boolean))).sort():[];
  profile.timeoutMs=Math.min(300000,Math.max(5000,Number(profile.timeoutMs)||60000));
  profile.maxTokens=Math.min(200000,Math.max(1,Number(profile.maxTokens)||8192));
  profile.temperature=Math.min(2,Math.max(0,Number(profile.temperature)||0));
  profile.connection=profile.connection||{status:'untested',message:'尚未测试'};
  profile.apiKeySecretId=secretIdForProvider(profile.id);
  if(profile.connection.status==='testing')profile.connection={status:'untested',message:'上次测试未完成'};
  return profile;
}

export function secretIdForProvider(id:string):string{return `typography-provider-${String(id||'default').toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'')}-api-key`;}

export function normalizeBaseUrl(value:string):string {
  return String(value||'').trim().replace(/\/+$/,'');
}

export function validateProvider(profile:ModelProviderProfile):string[] {
  const errors:string[]=[];
  if(!profile.name.trim())errors.push('提供商名称不能为空');
  if(profile.protocol!=='codex-runtime'&&!profile.baseUrl)errors.push('Base URL 不能为空');
  else if(profile.protocol!=='codex-runtime'){
    try {
      const url=new URL(profile.baseUrl);
      const local=['localhost','127.0.0.1','::1'].includes(url.hostname);
      if(url.protocol!=='https:'&&!local)errors.push('非本机服务必须使用 HTTPS');
    } catch { errors.push('Base URL 格式无效'); }
  }
  if(profile.textEnabled&&!profile.textModel.trim())errors.push('启用文本能力时必须配置文本模型');
  if(profile.imageEnabled&&!profile.imageModel.trim())errors.push('启用图片能力时必须配置图片模型');
  try { parseCustomHeaders(profile.customHeaders); } catch(e:any) { errors.push(e.message); }
  return errors;
}

export function parseCustomHeaders(value:string):Record<string,string> {
  if(!value.trim())return {};
  let parsed:any;
  try { parsed=JSON.parse(value); } catch { throw new Error('自定义请求头必须是有效的 JSON 对象'); }
  if(!parsed||Array.isArray(parsed)||typeof parsed!=='object')throw new Error('自定义请求头必须是 JSON 对象');
  const result:Record<string,string>={};
  for(const key of Object.keys(parsed)){
    const item=parsed[key];
    if(!key.trim()||typeof item!=='string')throw new Error('自定义请求头的键和值都必须是字符串');
    result[key]=item;
  }
  return result;
}

function authHeaders(profile:ModelProviderProfile,apiKey:string):Record<string,string> {
  const headers:Record<string,string>=parseCustomHeaders(profile.customHeaders);
  const mode=profile.authMode==='auto'?(profile.protocol==='anthropic'?'x-api-key':'bearer'):profile.authMode;
  if(mode==='x-api-key'){
    if(apiKey)headers['x-api-key']=apiKey;
  }else if(apiKey&&!headers.authorization&&!headers.Authorization)headers.authorization=`Bearer ${apiKey}`;
  if(profile.protocol==='anthropic'&&!headers['anthropic-version'])headers['anthropic-version']='2023-06-01';
  return headers;
}

async function withTimeout<T>(work:Promise<T>,timeoutMs:number):Promise<T>{
  let timer:number|undefined;
  try{return await Promise.race([work,new Promise<T>((_,reject)=>{timer=window.setTimeout(()=>reject(new Error(`请求超时（${Math.round(timeoutMs/1000)} 秒）`)),timeoutMs);})]);}
  finally{if(timer!==undefined)window.clearTimeout(timer);}
}

export async function discoverModels(profile:ModelProviderProfile,apiKey:string):Promise<string[]> {
  if(profile.protocol==='codex-runtime')return Array.from(new Set([profile.textModel,...profile.discoveredModels].filter(Boolean))).sort((a,b)=>a.localeCompare(b));
  const errors=validateProvider(profile);if(errors.length)throw new Error(errors.join('；'));
  const response=await withTimeout(requestUrl({url:`${profile.baseUrl}/models`,method:'GET',headers:authHeaders(profile,apiKey)}),profile.timeoutMs);
  const rows=response.json?.data||response.json?.models;
  if(!Array.isArray(rows))throw new Error('模型列表响应格式无法识别');
  const models=rows.map((item:any)=>typeof item==='string'?item:item?.id||item?.name).filter((id:any)=>typeof id==='string'&&id.trim());
  return Array.from(new Set(models)).sort((a,b)=>a.localeCompare(b));
}

export async function testProviderConnection(profile:ModelProviderProfile,apiKey:string):Promise<{models:string[]; latencyMs:number; message:string}> {
  if(profile.protocol!=='codex-runtime'&&!apiKey.trim())throw new Error('请先保存 API Key');
  const started=performance.now();
  try{
    const models=await discoverModels(profile,apiKey);
    return {models,latencyMs:Math.round(performance.now()-started),message:`连接正常，发现 ${models.length} 个模型`};
  }catch(error:any){throw new Error(classifyProviderError(error));}
}

export function providerHeaders(profile:ModelProviderProfile,apiKey:string):Record<string,string>{return authHeaders(profile,apiKey);}
export async function providerRequest<T>(promise:Promise<T>,timeoutMs:number):Promise<T>{return withTimeout(promise,timeoutMs);}

export function classifyProviderError(error:any):string {
  const status=Number(error?.status||error?.response?.status||0);
  const source=error?.message||error?.response?.json?.error?.message||error?.response?.text||String(error);
  if(status===401||status===403||/unauthorized|forbidden|invalid.*key|authentication/i.test(source))return '认证失败：请检查 API Key 与权限';
  if(status===404)return '接口或模型不存在：请检查 Base URL 与模型名称';
  if(status===429||/rate.?limit|quota/i.test(source))return '请求受限：已达到速率或额度限制';
  if(status>=500)return `服务端错误（HTTP ${status}）：请稍后重试`;
  if(/timeout|超时/i.test(source))return source;
  return status?`连接失败（HTTP ${status}）：${source}`:`连接失败：${source}`;
}
