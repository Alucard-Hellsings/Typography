import { readFile, access } from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import type { ProviderProtocol } from './model-config';

export interface DetectedModelConfig {
  id:'detected-claude'|'detected-codex';
  name:string;
  source:'claude'|'codex';
  configPath:string;
  protocol:ProviderProtocol;
  runtimeCommand?:string;
  models:string[];
  baseUrl:string;
  model:string;
  apiKey:string;
  authMode:'auto'|'bearer'|'x-api-key';
  usable:boolean;
  message:string;
}

async function exists(file:string){try{await access(file);return true;}catch{return false;}}
async function findCommand(name:string){const extensions=process.platform==='win32'?['.cmd','.exe','.bat','']:[''];for(const folder of String(process.env.PATH||'').split(path.delimiter)){for(const ext of extensions){const candidate=path.join(folder,name+ext);if(await exists(candidate))return candidate;}}return '';}
async function text(file:string){try{return await readFile(file,'utf8');}catch{return '';}}
function unquote(value:string){const v=value.trim();return v.replace(/^['"]|['"]$/g,'');}
function envFile(source:string){const result:Record<string,string>={};for(const line of source.split(/\r?\n/)){const match=line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);if(match)result[match[1]]=unquote(match[2]);}return result;}
function tomlScalar(source:string,key:string){const match=source.match(new RegExp(`^\\s*${key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\s*=\\s*([^#\\r\\n]+)`,'m'));return match?unquote(match[1]):'';}
function tomlSection(source:string,name:string){const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const match=source.match(new RegExp(`^\\s*\\[model_providers\\.${escaped}\\]\\s*$([\\s\\S]*?)(?=^\\s*\\[|$)`,'m'));return match?.[1]||'';}

async function detectClaude(home:string):Promise<DetectedModelConfig|null>{
  const configDir=process.env.CLAUDE_CONFIG_DIR||path.join(home,'.claude');const settingsPath=path.join(configDir,'settings.json');if(!await exists(settingsPath))return null;
  let json:any={};try{json=JSON.parse(await text(settingsPath));}catch{}
  const env={...process.env,...(json?.env||{})} as Record<string,string|undefined>;
  const apiKey=String(env.ANTHROPIC_API_KEY||env.ANTHROPIC_AUTH_TOKEN||env.CLAUDE_CODE_OAUTH_TOKEN||'');
  const authMode:DetectedModelConfig['authMode']=env.ANTHROPIC_API_KEY?'x-api-key':'bearer';
  const baseUrl=String(env.ANTHROPIC_BASE_URL||'https://api.anthropic.com').replace(/\/+$/,'');
  const model=String(env.ANTHROPIC_MODEL||env.ANTHROPIC_DEFAULT_SONNET_MODEL||env.ANTHROPIC_DEFAULT_OPUS_MODEL||'claude-sonnet-4-5');
  const models=Array.from(new Set([model,String(env.ANTHROPIC_DEFAULT_FABLE_MODEL||''),String(env.ANTHROPIC_DEFAULT_HAIKU_MODEL||''),String(env.ANTHROPIC_DEFAULT_OPUS_MODEL||''),String(env.ANTHROPIC_DEFAULT_SONNET_MODEL||'')].filter(Boolean)));
  return {id:'detected-claude',name:'Claude 配置',source:'claude',configPath:settingsPath,protocol:'anthropic',baseUrl,model,models,apiKey,authMode,usable:Boolean(apiKey),message:apiKey?'已读取 Claude 的接口、模型与认证配置':'检测到 Claude 配置，但没有发现可复用的 API 认证信息'};
}

async function detectCodex(home:string):Promise<DetectedModelConfig|null>{
  const configDir=process.env.CODEX_HOME||path.join(home,'.codex');const configPath=path.join(configDir,'config.toml');if(!await exists(configPath))return null;
  const source=await text(configPath),fileEnv=envFile(await text(path.join(configDir,'.env'))),runtimeEnv={...fileEnv,...process.env} as Record<string,string|undefined>;
  const providerName=tomlScalar(source,'model_provider')||'openai';const section=tomlSection(source,providerName);const baseUrl=(tomlScalar(section,'base_url')||String(runtimeEnv.OPENAI_BASE_URL||'https://api.openai.com/v1')).replace(/\/+$/,'');const envKey=tomlScalar(section,'env_key')||'OPENAI_API_KEY';let apiKey=String(runtimeEnv[envKey]||'');
  if(!apiKey){try{const auth=JSON.parse(await text(path.join(configDir,'auth.json')));apiKey=String(auth?.OPENAI_API_KEY||auth?.api_key||'');}catch{}}
  const model=tomlScalar(source,'model')||String(runtimeEnv.OPENAI_MODEL||'gpt-4.1-mini'),runtimeCommand=await findCommand('codex');const protocol:ProviderProtocol=apiKey?'openai-compatible':runtimeCommand?'codex-runtime':'openai-compatible';let cachedModels:string[]=[];try{const cache=JSON.parse(await text(path.join(configDir,'models_cache.json')));cachedModels=(Array.isArray(cache?.models)?cache.models:[]).map((item:any)=>typeof item==='string'?item:item?.slug||item?.id||item?.model).filter((id:any)=>typeof id==='string'&&id.trim());}catch{}const models=Array.from(new Set([model,...cachedModels]));
  return {id:'detected-codex',name:'Codex 配置',source:'codex',configPath,protocol,baseUrl,model,models,apiKey,authMode:'bearer',runtimeCommand,usable:Boolean(apiKey||runtimeCommand),message:apiKey?'已读取 Codex 的 API 提供商、模型与认证配置':runtimeCommand?`已检测到 Codex 登录会话和 ${models.length} 个可用模型`:'检测到 Codex 配置，但没有发现 API Key 或可用的登录会话'};
}

export async function detectLocalModelConfigs():Promise<DetectedModelConfig[]>{const home=os.homedir();const rows=await Promise.all([detectClaude(home),detectCodex(home)]);return rows.filter((item):item is DetectedModelConfig=>Boolean(item));}
