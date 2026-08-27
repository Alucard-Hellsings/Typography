import { App, MarkdownView, Modal, Notice, Plugin, Setting, TFile, normalizePath, requestUrl } from 'obsidian';
import { readFile } from 'fs/promises';
import * as path from 'path';
import { spawn } from 'child_process';
import * as http from 'http';
import * as https from 'https';
import { DEFAULT_SETTINGS, TypographySettings, TypographySettingTab } from './industrial-settings';
import { classifyProviderError, createProvider, discoverModels, ModelProviderProfile, normalizeProvider, providerHeaders, providerRequest, secretIdForProvider, testProviderConnection, validateProvider } from './model-config';
import { detectLocalModelConfigs } from './local-config-detector';
import { inspectMarkdown, renderMarkdown, RenderOptions, RenderResult } from './renderer';
import { MD2WECHAT_VIEW_TYPE, Md2WechatView } from './view';
import { AiTaskListener, AiTaskSnapshot } from './ai-task';

export default class Md2WechatPlugin extends Plugin {
  settings!: TypographySettings;
  private lastRender: RenderResult | null = null;
  private lastMarkdown = '';
  private lastSourceFile: TFile | null = null;
  private liveRefreshTimer: number | null = null;
  private wechatTokenCache: {token:string;expiresAt:number} | null = null;
  private aiTask:AiTaskSnapshot|null=null;
  private aiTaskListeners=new Set<AiTaskListener>();
  private aiAbort:AbortController|null=null;
  private aiRetry:(()=>Promise<void>)|null=null;
  private aiTicker:number|null=null;
  async onload() {
    await this.loadSettings();
    this.registerView(MD2WECHAT_VIEW_TYPE,leaf=>new Md2WechatView(leaf,this));
    this.addRibbonIcon('newspaper','本地排版到公众号',()=>this.convertCurrent());
    this.addSettingTab(new TypographySettingTab(this.app,this));
    this.command('local-convert','本地排版并预览（无需 API Key）',()=>this.convertCurrent());
    this.command('local-inspect','检查当前文章',()=>this.inspectCurrent());
    this.command('local-layout-validate','验证 ::: 高级排版模块',()=>this.validateLayouts());
    this.command('local-export-html','导出当前排版 HTML',()=>this.exportCurrentHtml());
    this.command('local-write','AI：根据想法写文章（配置模型 API）',()=>this.textTask('write'));
    this.command('local-humanize','AI：文章去 AI 痕迹（配置模型 API）',()=>this.textTask('humanize'));
    this.command('local-title','AI：生成公众号标题（配置模型 API）',()=>this.textTask('title'));
    this.command('local-cover','AI：生成封面（配置图片 API）',()=>this.imageTask('cover'));
    this.command('local-infographic','AI：生成信息图（配置图片 API）',()=>this.imageTask('infographic'));
    this.command('wechat-upload-image','微信：上传图片素材',()=>this.uploadImageInteractive());
    this.command('wechat-draft','微信：创建当前文章草稿',()=>this.createDraftFromCurrent());
    this.command('wechat-image-post','微信：创建图片型草稿',()=>this.createImagePost());
    this.command('local-capabilities','显示本地完整能力与状态',()=>this.showCapabilities());
    this.registerEvent(this.app.workspace.on('file-open',file=>{
      if(file instanceof TFile&&file.extension.toLowerCase()==='md')this.lastSourceFile=file;
    }));
    this.registerEvent(this.app.vault.on('modify',file=>{
      if(!(file instanceof TFile)||file.extension.toLowerCase()!=='md'||file.path!==this.lastSourceFile?.path)return;
      if(!this.app.workspace.getLeavesOfType(MD2WECHAT_VIEW_TYPE).length)return;
      if(this.liveRefreshTimer!==null)window.clearTimeout(this.liveRefreshTimer);
      this.liveRefreshTimer=window.setTimeout(()=>{this.liveRefreshTimer=null;void this.refreshTrackedSource(false,true);},280);
    }));
  }
  onunload(){if(this.liveRefreshTimer!==null)window.clearTimeout(this.liveRefreshTimer);if(this.aiTicker!==null)window.clearInterval(this.aiTicker);this.aiAbort?.abort();this.app.workspace.detachLeavesOfType(MD2WECHAT_VIEW_TYPE);}
  private command(id:string,name:string,callback:()=>any){this.addCommand({id,name,callback});}
  subscribeAiTask(listener:AiTaskListener){this.aiTaskListeners.add(listener);if(this.aiTask)listener(this.aiTask);return()=>this.aiTaskListeners.delete(listener);}
  getAiTask(){return this.aiTask;}
  cancelAiTask(){if(this.aiTask?.status!=='running')return;this.aiAbort?.abort();this.aiTask.status='cancelled';this.aiTask.error='用户已停止生成';this.aiTask.steps.forEach(step=>{if(step.status==='active')step.status='failed';});this.publishAiTask();}
  async retryAiTask(){if(this.aiTask?.status==='running'||!this.aiRetry)return;await this.aiRetry();}
  private beginAiTask(title:string,provider:ModelProviderProfile,steps:string[],model=provider.textModel||provider.imageModel){this.aiAbort?.abort();if(this.aiTicker!==null)window.clearInterval(this.aiTicker);this.aiAbort=new AbortController();this.aiTask={id:`ai-${Date.now()}`,title,provider:provider.name,model,status:'running',startedAt:Date.now(),elapsedMs:0,output:'',outputChars:0,steps:steps.map((label,index)=>({label,status:index===0?'active':'pending'})),canRetry:true};this.aiTicker=window.setInterval(()=>this.publishAiTask(),500);this.publishAiTask();return this.aiAbort.signal;}
  private aiStep(index:number,detail?:string){if(!this.aiTask)return;this.aiTask.steps.forEach((step,i)=>{if(i<index&&step.status!=='failed')step.status='completed';else if(i===index)step.status='active';});if(detail)this.aiTask.steps[index].detail=detail;this.publishAiTask();}
  private aiOutput(text:string,append=true){if(!this.aiTask)return;if(!this.aiTask.firstTokenMs&&text)this.aiTask.firstTokenMs=Date.now()-this.aiTask.startedAt;this.aiTask.output=append?this.aiTask.output+text:text;this.aiTask.outputChars=this.aiTask.output.length;this.publishAiTask();}
  private finishAiTask(error?:string){if(!this.aiTask)return;if(this.aiTicker!==null){window.clearInterval(this.aiTicker);this.aiTicker=null;}this.aiTask.elapsedMs=Date.now()-this.aiTask.startedAt;if(error){this.aiTask.status=this.aiTask.status==='cancelled'?'cancelled':'failed';this.aiTask.error=error;const active=this.aiTask.steps.find(step=>step.status==='active');if(active)active.status='failed';}else{this.aiTask.status='completed';this.aiTask.steps.forEach(step=>step.status='completed');}this.publishAiTask();this.aiAbort=null;}
  private publishAiTask(){if(!this.aiTask)return;this.aiTask.elapsedMs=Date.now()-this.aiTask.startedAt;const snapshot:AiTaskSnapshot=JSON.parse(JSON.stringify(this.aiTask));this.aiTaskListeners.forEach(listener=>listener(snapshot));}
  async loadSettings(){
    const loaded:any=await this.loadData()||{};delete loaded.cliPath;
    let migratedKey='';
    if(Array.isArray(loaded.providers)&&loaded.providers.length)loaded.providers=loaded.providers.map((p:any)=>normalizeProvider(p));
    else{
      const legacy=createProvider(loaded.aiProvider==='anthropic'?'anthropic':'custom');
      legacy.name=loaded.aiProvider==='anthropic'?'Anthropic':'兼容模型';legacy.protocol=loaded.aiProvider||'openai-compatible';legacy.baseUrl=loaded.aiBaseUrl||'https://api.openai.com/v1';legacy.textModel=loaded.aiModel||'gpt-4.1-mini';legacy.imageBaseUrl=loaded.imageBaseUrl||legacy.baseUrl;legacy.imageModel=loaded.imageModel||'gpt-image-1';legacy.imageEnabled=Boolean(legacy.imageModel);migratedKey=loaded.aiApiKey||loaded.imageApiKey||'';
      loaded.providers=[normalizeProvider(legacy)];loaded.activeTextProviderId=legacy.id;loaded.activeImageProviderId=legacy.imageEnabled?legacy.id:'';
    }
    for(const key of ['aiProvider','aiBaseUrl','aiApiKey','aiModel','imageBaseUrl','imageApiKey','imageModel'])delete loaded[key];
    this.settings=Object.assign({},DEFAULT_SETTINGS,loaded);this.settings.providers=this.settings.providers.map(p=>normalizeProvider(p));for(const p of this.settings.providers){if(p.preset==='deepseek'&&p.baseUrl==='https://api.deepseek.com/v1')p.baseUrl='https://api.deepseek.com';if(p.preset==='deepseek'&&p.imageBaseUrl==='https://api.deepseek.com/v1')p.imageBaseUrl='https://api.deepseek.com';if(p.preset==='deepseek'&&(p.textModel==='deepseek-chat'||p.textModel==='deepseek-reasoner'))p.textModel='deepseek-v4-pro';}this.reconcileProviderRoutes();
    if(migratedKey){await this.setProviderSecret(this.settings.providers[0],migratedKey);await this.saveSettings();}
    await this.scanLocalModelConfigs(false);
  }
  async saveSettings(){await this.saveData(this.settings);}
  private secretStorage():any{const storage=(this.app as any).secretStorage;if(!storage)throw new Error('当前 Obsidian 不支持 SecretStorage，请升级到 1.11.4 或更高版本');return storage;}
  getProviderSecret(provider:ModelProviderProfile):string{provider.apiKeySecretId=secretIdForProvider(provider.id);return this.secretStorage().getSecret(provider.apiKeySecretId)||'';}
  hasProviderSecret(provider:ModelProviderProfile):boolean{try{return Boolean(this.getProviderSecret(provider));}catch{return false;}}
  isProviderConfigured(provider:ModelProviderProfile):boolean{return provider.protocol==='codex-runtime'?Boolean(provider.runtimeCommand):this.hasProviderSecret(provider);}
  async setProviderSecret(provider:ModelProviderProfile,value:string){const storage=this.secretStorage();provider.apiKeySecretId=secretIdForProvider(provider.id);if(value)await Promise.resolve(storage.setSecret(provider.apiKeySecretId,value));else await Promise.resolve(storage.setSecret(provider.apiKeySecretId,''));}
  private provider(id:string):ModelProviderProfile{const result=this.settings.providers.find(p=>p.id===id);if(!result)throw new Error('所选模型提供商不存在');return result;}
  private textProvider():ModelProviderProfile{const p=this.provider(this.settings.activeTextProviderId);if(!p.textEnabled)throw new Error('当前提供商未启用文本能力');return p;}
  private imageProvider():ModelProviderProfile{const p=this.provider(this.settings.activeImageProviderId);if(!p.imageEnabled)throw new Error('当前提供商未启用图片能力');return p;}
  private reconcileProviderRoutes(){
    if(!this.settings.providers.some(p=>p.id===this.settings.activeTextProviderId&&p.textEnabled))this.settings.activeTextProviderId=this.settings.providers.find(p=>p.textEnabled)?.id||'';
    if(!this.settings.providers.some(p=>p.id===this.settings.activeImageProviderId&&p.imageEnabled))this.settings.activeImageProviderId=this.settings.providers.find(p=>p.imageEnabled)?.id||'';
  }
  async removeProvider(id:string){const p=this.provider(id);this.settings.providers=this.settings.providers.filter(item=>item.id!==id);this.reconcileProviderRoutes();await this.saveSettings();try{await this.setProviderSecret(p,'');}catch{/* 配置删除不应被密钥清理失败阻断 */}}
  async refreshProviderModels(id:string){const p=this.provider(id),key=this.getProviderSecret(p);if(p.protocol!=='codex-runtime'&&!key)throw new Error('请先保存 API Key');p.discoveredModels=await discoverModels(p,key);await this.saveSettings();return p.discoveredModels;}
  async testProvider(id:string){
    const p=this.provider(id);p.connection={status:'testing',message:'正在验证认证信息与模型目录'};await this.saveSettings();
    try{let result:{models:string[];latencyMs:number;message:string};if(p.protocol==='codex-runtime'){const started=performance.now();await this.callCodexRuntime(p,'你是连接测试助手。','只回复 OK');result={models:[p.textModel],latencyMs:Math.round(performance.now()-started),message:'Codex 登录会话可用'};}else try{result=await testProviderConnection(p,this.getProviderSecret(p));}catch{result=await this.probeProviderCompletion(p);}p.discoveredModels=result.models.length?result.models:p.discoveredModels;p.connection={status:'connected',message:result.message,latencyMs:result.latencyMs,testedAt:Date.now()};await this.saveSettings();new Notice(`${p.name} 连接正常 · ${result.latencyMs} ms`);return result;}
    catch(error:any){p.connection={status:'error',message:error.message,testedAt:Date.now()};await this.saveSettings();new Notice(`${p.name}：${error.message}`,8000);throw error;}
  }
  private async probeProviderCompletion(p:ModelProviderProfile){const key=this.getProviderSecret(p);if(!key)throw new Error('请先保存 API Key 或 Auth Token');const started=performance.now(),headers=Object.assign({'content-type':'application/json'},providerHeaders(p,key));if(p.protocol==='anthropic'){const response:any=await providerRequest(requestUrl({url:`${p.baseUrl}/messages`,method:'POST',headers,body:JSON.stringify({model:p.textModel,max_tokens:1,messages:[{role:'user',content:'Reply OK'}]})}),p.timeoutMs);if(!response.json?.content)throw new Error(response.json?.error?.message||'接口没有返回有效响应');}else{const response:any=await providerRequest(requestUrl({url:`${p.baseUrl}/chat/completions`,method:'POST',headers,body:JSON.stringify({model:p.textModel,max_tokens:1,messages:[{role:'user',content:'Reply OK'}]})}),p.timeoutMs);if(!response.json?.choices)throw new Error(response.json?.error?.message||'接口没有返回有效响应');}return {models:[],latencyMs:Math.round(performance.now()-started),message:'连接正常；当前服务不提供模型目录，已通过最小请求验证'};}
  async scanLocalModelConfigs(showNotice=true){
    try{
      const detected=await detectLocalModelConfigs();let imported=0,usable=0;
      for(const item of detected){
        let provider=this.settings.providers.find(p=>p.id===item.id);
        if(!provider){provider=createProvider(item.source==='claude'?'anthropic':'custom');provider.id=item.id;provider.apiKeySecretId=secretIdForProvider(item.id);this.settings.providers.push(provider);imported++;}
        provider.name=item.name;provider.preset=item.source==='claude'?'anthropic':'custom';provider.protocol=item.protocol;provider.baseUrl=item.baseUrl;provider.imageBaseUrl=item.baseUrl;provider.textModel=item.model;provider.discoveredModels=Array.from(new Set([...(item.models||[]),...provider.discoveredModels])).sort();provider.textEnabled=true;provider.imageEnabled=false;provider.authMode=item.authMode;provider.configSource=item.source;provider.configPath=item.configPath;provider.runtimeCommand=item.runtimeCommand;provider.connection={status:'untested',message:item.message};
        if(item.apiKey)await this.setProviderSecret(provider,item.apiKey);if(item.usable){usable++;const active=this.settings.providers.find(p=>p.id===this.settings.activeTextProviderId);if(!active||!this.isProviderConfigured(active))this.settings.activeTextProviderId=provider.id;}
      }
      this.reconcileProviderRoutes();await this.saveSettings();if(showNotice)new Notice(detected.length?`检测到 ${detected.length} 个本机模型配置，其中 ${usable} 个可直接使用`:'未检测到 Claude 或 Codex 配置',6000);return detected;
    }catch(error:any){if(showNotice)new Notice(`本机配置检测失败：${error.message}`,8000);return [];}
  }
  private renderOptions():RenderOptions{return {theme:this.settings.theme,fontSize:this.settings.fontSize,backgroundType:this.settings.backgroundType,fontWeight:this.settings.fontWeight,headingStyle:this.settings.headingStyle,codeTheme:this.settings.codeTheme,includeReadingTime:this.settings.includeReadingTime,author:this.settings.author,avatar:this.settings.avatarUrl};}

  private active(): {view:MarkdownView;file:TFile;markdown:string}|null {
    const view=this.app.workspace.getActiveViewOfType(MarkdownView); const file=view?.file;
    if(!view||!file){new Notice('请先打开 Markdown 文件');return null;}
    return {view,file,markdown:view.editor.getValue()};
  }
  private markdownViewFor(file:TFile):MarkdownView|null {
    for(const leaf of this.app.workspace.getLeavesOfType('markdown')){
      const view=leaf.view;if(view instanceof MarkdownView&&view.file?.path===file.path)return view;
    }
    return null;
  }
  private trackedSourceFile():TFile|null {
    const activeView=this.app.workspace.getActiveViewOfType(MarkdownView);
    if(activeView?.file){this.lastSourceFile=activeView.file;return activeView.file;}
    const workspaceFile=this.app.workspace.getActiveFile();
    if(workspaceFile instanceof TFile&&workspaceFile.extension.toLowerCase()==='md'){this.lastSourceFile=workspaceFile;return workspaceFile;}
    if(this.lastSourceFile){const current=this.app.vault.getAbstractFileByPath(this.lastSourceFile.path);if(current instanceof TFile)return current;}
    return null;
  }
  private async refreshTrackedSource(reveal=true,silent=false){
    const file=this.trackedSourceFile();
    if(!file){if(!silent)new Notice('没有可重新排版的 Markdown 源文件');return;}
    const view=this.markdownViewFor(file);
    const markdown=view?.editor.getValue()??await this.app.vault.cachedRead(file);
    await this.convertMarkdown(markdown,file,reveal,silent);
  }
  async convertCurrent(){
    const activeView=this.app.workspace.getActiveViewOfType(MarkdownView);
    if(activeView?.file){
      this.lastSourceFile=activeView.file;
      const selected=activeView.editor.getSelection().trim();
      await this.convertMarkdown(selected||activeView.editor.getValue(),activeView.file,true,false);
      return;
    }
    await this.refreshTrackedSource(true,false);
  }
  async convertMarkdown(markdown:string,explicitSource:TFile|null=null,reveal=true,silent=false){
    if(!markdown.trim()){new Notice('当前文档为空');return;}
    this.lastMarkdown=markdown;
    this.lastRender=renderMarkdown(markdown,this.renderOptions());
    const activeSource=explicitSource||this.app.workspace.getActiveViewOfType(MarkdownView)?.file||null;
    if(activeSource)this.lastSourceFile=activeSource;
    const sourceFile=activeSource||this.lastSourceFile;
    if(sourceFile)await this.embedLocalImages(this.lastRender,sourceFile);
    let leaf=this.app.workspace.getLeavesOfType(MD2WECHAT_VIEW_TYPE)[0];
    if(!leaf){if(!reveal)return;leaf=this.app.workspace.getRightLeaf(false)!;await leaf.setViewState({type:MD2WECHAT_VIEW_TYPE,active:true});}
    if(reveal)this.app.workspace.revealLeaf(leaf);(leaf.view as Md2WechatView).setContent(this.lastRender.html,markdown);
    if(!silent)new Notice(this.lastRender.warnings.length?`排版完成，${this.lastRender.warnings.length} 条布局提示`:'排版完成');
  }
  private async inspectCurrent(){const a=this.active();if(a)new OutputModal(this.app,'文章检查',JSON.stringify(inspectMarkdown(a.markdown),null,2)).open();}
  private async validateLayouts(){
    const a=this.active();if(!a)return;
    const local=inspectMarkdown(a.markdown);new OutputModal(this.app,'布局验证',JSON.stringify(local,null,2)).open();
  }
  async exportCurrentHtml(){
    const file=this.trackedSourceFile();if(!file){new Notice('没有可导出的 Markdown 源文件');return;}
    const sourceView=this.markdownViewFor(file);const markdown=sourceView?.editor.getValue()??await this.app.vault.cachedRead(file);if(!markdown.trim()){new Notice('当前 Markdown 文档为空');return;}
    this.lastMarkdown=markdown;this.lastSourceFile=file;this.lastRender=renderMarkdown(markdown,this.renderOptions());await this.embedLocalImages(this.lastRender,file);
    const target=normalizePath(file.path.replace(/\.md$/i,'.wechat.html'));
    const full=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${this.lastRender.metadata.title}</title></head><body>${this.lastRender.html}</body></html>`;
    const old=this.app.vault.getAbstractFileByPath(target);if(old instanceof TFile)await this.app.vault.modify(old,full);else await this.app.vault.create(target,full);new Notice(`已导出：${target}`);
  }

  async textTask(kind:'write'|'humanize'|'title'){
    const sourceFile=this.trackedSourceFile();const sourceView=sourceFile?this.markdownViewFor(sourceFile):null;const source=sourceFile?(sourceView?.editor.getValue()??await this.app.vault.cachedRead(sourceFile)):'';
    if(kind!=='write'&&!sourceFile){new Notice('请先打开一篇 Markdown 文章');return;}
    const initial=kind==='write'?'请输入文章主题或写作要求':kind==='title'?'补充目标读者或标题偏好（可留空）':'补充改写要求（可留空）';
    const extra=await prompt(this.app,kind==='write'?'本地 AI 写作':kind==='title'?'本地标题建议':'本地去 AI 痕迹',initial,'');if(extra===null)return;
    const instructions={
      write:'你是中文公众号主编。根据主题和资料写一篇结构完整、事实克制、适合移动阅读的 Markdown 文章。不要解释过程，只输出文章。',
      humanize:'你是资深中文编辑。保持事实和观点不变，去除机械排比、空泛总结、过度连接词与 AI 腔，增加自然节奏。只输出改写后的 Markdown。',
      title:'你是微信公众号标题编辑。基于文章给出 10 个不超过 25 个汉字的标题，兼顾准确、具体和点击意愿，避免标题党。每行一个标题。'
    }[kind];
    const activeProvider=this.textProvider(),taskTitle=kind==='write'?'AI 写文章':kind==='title'?'生成公众号标题':'文章自然化';
    const execute=async()=>{const signal=this.beginAiTask(taskTitle,activeProvider,['检查模型配置','读取文章上下文','发送模型请求','接收生成内容','保存任务结果']);new Notice(`正在调用 ${activeProvider.name} · ${activeProvider.textModel}…`,5000);try{this.aiStep(0,'验证提供商、模型和认证方式');if(!this.isProviderConfigured(activeProvider))throw new Error(`请先配置 ${activeProvider.name} 的认证信息`);this.aiStep(1,sourceFile?`已读取 ${source.length} 个字符`:'使用用户输入作为创作主题');this.aiStep(2,`正在连接 ${activeProvider.name}`);let streamed='';const text=await this.callTextModel(instructions,`用户要求：${extra}\n\n原文：\n${source}`,delta=>{this.aiStep(3,'正在流式接收模型输出');streamed+=delta;this.aiOutput(delta,true);},signal);if(!streamed)this.aiOutput(text,false);this.aiStep(4,kind==='title'?'准备标题结果':'正在写入新的 Markdown 文件');if(kind==='title')new OutputModal(this.app,'标题建议',text).open();else await this.saveGeneratedNote(sourceFile,text,kind);this.finishAiTask();}catch(e:any){const cancelled=signal.aborted||e?.name==='AbortError';const message=cancelled?'生成已停止':classifyProviderError(e);if(cancelled&&this.aiTask)this.aiTask.status='cancelled';this.finishAiTask(message);if(!cancelled)new Notice(`模型 API 调用失败：${message}`,8000);}};
    this.aiRetry=execute;await execute();
  }
  private async saveGeneratedNote(source:TFile|null,text:string,kind:string){
    const base=source?source.path.replace(/\.md$/i,''):'未命名';let target=normalizePath(`${base}.${kind}.md`);let n=2;
    while(this.app.vault.getAbstractFileByPath(target))target=normalizePath(`${base}.${kind}-${n++}.md`);
    const file=await this.app.vault.create(target,text);await this.app.workspace.getLeaf(true).openFile(file);new Notice(`已生成：${target}`);
  }
  async imageTask(kind:'cover'|'infographic'){
    const source=await this.currentArticleSource();if(!source)return;const meta=renderMarkdown(source.markdown,this.renderOptions()).metadata;
    const user=await prompt(this.app,kind==='cover'?'本地生成封面':'本地生成信息图','补充视觉要求',kind==='cover'?`${meta.title}，微信公众号封面，简洁专业，无水印`:`${meta.title}，中文信息图，结构清晰，留白充足`);if(user===null)return;
    const activeProvider=this.imageProvider(),execute=async()=>{const signal=this.beginAiTask(kind==='cover'?'生成文章封面':'生成信息图',activeProvider,['检查图片模型','分析视觉要求','生成图片','保存到附件目录','插入当前文章']);try{this.aiStep(0,`${activeProvider.name} · ${activeProvider.imageModel}`);if(!this.isProviderConfigured(activeProvider))throw new Error(`请先配置 ${activeProvider.name} 的认证信息`);this.aiStep(1,`已整理 ${user.length} 个字符的视觉描述`);this.aiStep(2,'图片模型正在渲染');new Notice(`正在调用 ${activeProvider.name} · ${activeProvider.imageModel}…`,5000);const bytes=await this.callImageModel(user);if(signal.aborted)throw Object.assign(new Error('生成已停止'),{name:'AbortError'});this.aiStep(3,'正在写入 Obsidian 附件目录');await this.ensureFolder(this.settings.imageFolder);const name=`${kind}-${Date.now()}.png`;const vaultPath=normalizePath(`${this.settings.imageFolder}/${name}`);await this.app.vault.createBinary(vaultPath,bytes);this.aiStep(4,'正在更新 Markdown 图片引用');const insertion=`\n![${kind}](${vaultPath})\n`;const sourceView=this.markdownViewFor(source.file);if(sourceView)sourceView.editor.replaceSelection(insertion);else await this.app.vault.modify(source.file,`${source.markdown.replace(/\s*$/,'')}\n${insertion}`);if(kind==='cover'){this.settings.defaultCover=vaultPath;await this.saveSettings();}this.aiOutput(`图片已保存：${vaultPath}`,false);this.finishAiTask();new Notice(`图片已保存：${vaultPath}`);}catch(e:any){const cancelled=signal.aborted||e?.name==='AbortError',message=cancelled?'生成已停止':classifyProviderError(e);if(cancelled&&this.aiTask)this.aiTask.status='cancelled';this.finishAiTask(message);if(!cancelled)new Notice(`图片 API 调用失败：${message}`,8000);}};this.aiRetry=execute;await execute();
  }

  private async callTextModel(system:string,user:string,onDelta?:(text:string)=>void,signal?:AbortSignal):Promise<string>{
    const provider=this.textProvider();if(provider.protocol==='codex-runtime')return this.callCodexRuntime(provider,system,user,onDelta,signal);
    const key=this.getProviderSecret(provider);if(!key)throw new Error(`请先在 ${provider.name} 中保存 API Key`);
    const errors=validateProvider(provider);if(errors.length)throw new Error(errors.join('；'));
    const headers=Object.assign({'content-type':'application/json'},providerHeaders(provider,key));
    if(onDelta)return this.streamTextModel(provider,key,system,user,onDelta,signal);
    if(provider.protocol==='anthropic'){
      const response:any=await providerRequest(requestUrl({url:`${provider.baseUrl}/messages`,method:'POST',headers,body:JSON.stringify({model:provider.textModel,max_tokens:provider.maxTokens,system,messages:[{role:'user',content:user}]})}),provider.timeoutMs);
      const content=response.json?.content;const text=Array.isArray(content)?content.filter((v:any)=>v?.type==='text').map((v:any)=>v.text).join('\n'):'';
      if(!text)throw new Error(response.json?.error?.message||`Anthropic HTTP ${response.status} 未返回文本`);return text;
    }
    const response:any=await providerRequest(requestUrl({url:`${provider.baseUrl}/chat/completions`,method:'POST',headers,body:JSON.stringify({model:provider.textModel,messages:[{role:'system',content:system},{role:'user',content:user}],temperature:provider.temperature,max_tokens:provider.maxTokens})}),provider.timeoutMs);
    const content=response.json?.choices?.[0]?.message?.content;
    const text=typeof content==='string'?content:Array.isArray(content)?content.map((v:any)=>v?.text||'').join('\n'):'';
    if(!text)throw new Error(response.json?.error?.message||`OpenAI-compatible HTTP ${response.status} 未返回文本`);return text;
  }

  private streamTextModel(provider:ModelProviderProfile,key:string,system:string,user:string,onDelta:(text:string)=>void,signal?:AbortSignal):Promise<string>{
    const anthropic=provider.protocol==='anthropic',url=new URL(`${provider.baseUrl}${anthropic?'/messages':'/chat/completions'}`),headers=Object.assign({'content-type':'application/json','accept':'text/event-stream'},providerHeaders(provider,key));
    const payload=anthropic?{model:provider.textModel,max_tokens:provider.maxTokens,stream:true,system,messages:[{role:'user',content:user}]}:{model:provider.textModel,stream:true,messages:[{role:'system',content:system},{role:'user',content:user}],temperature:provider.temperature,max_tokens:provider.maxTokens};
    return new Promise((resolve,reject)=>{let full='',buffer='',rawError='',settled=false;const client=url.protocol==='https:'?https:http;const finish=(error?:Error)=>{if(settled)return;settled=true;if(signal)signal.removeEventListener('abort',abort);if(error)reject(error);else if(full)resolve(full);else reject(new Error('模型没有返回文本内容'));};const abort=()=>{request.destroy();const error=new Error('生成已停止');error.name='AbortError';finish(error);};
      const request=client.request(url,{method:'POST',headers},response=>{const status=response.statusCode||0;response.setEncoding('utf8');response.on('data',(chunk:string)=>{if(status>=400){rawError+=chunk;return;}buffer+=chunk;const lines=buffer.split(/\r?\n/);buffer=lines.pop()||'';for(const line of lines){if(!line.startsWith('data:'))continue;const data=line.slice(5).trim();if(!data||data==='[DONE]')continue;try{const event=JSON.parse(data);let delta='';if(anthropic&&event?.type==='content_block_delta'&&event?.delta?.type==='text_delta')delta=event.delta.text||'';else if(!anthropic)delta=event?.choices?.[0]?.delta?.content||'';if(delta){full+=delta;onDelta(delta);}}catch{}}});response.on('end',()=>{if(status>=400){let message=rawError;try{const parsed=JSON.parse(rawError);message=parsed?.error?.message||message;}catch{}return finish(Object.assign(new Error(message||`HTTP ${status}`),{status}));}finish();});response.on('error',finish);});
      request.setTimeout(provider.timeoutMs,()=>request.destroy(new Error(`请求超时（${Math.round(provider.timeoutMs/1000)} 秒）`)));request.on('error',finish);if(signal){if(signal.aborted)return abort();signal.addEventListener('abort',abort,{once:true});}request.end(JSON.stringify(payload));
    });
  }

  private callCodexRuntime(provider:ModelProviderProfile,system:string,user:string,onDelta?:(text:string)=>void,signal?:AbortSignal):Promise<string>{
    const command=provider.runtimeCommand;if(!command)throw new Error('没有找到可用的 Codex 登录会话');const promptText=`${system}\n\n${user}\n\n只完成上述文本任务，不读取工作区文件、不调用工具，只输出最终内容。`;
    const args=['exec','-','--ephemeral','--skip-git-repo-check','--ignore-rules','--sandbox','read-only','--color','never','--json'];if(/^[A-Za-z0-9_./:-]+$/.test(provider.textModel))args.push('--model',provider.textModel);
    return new Promise((resolve,reject)=>{let output='',pending='',errors='',answer='',settled=false;const finish=(error?:Error,value?:string)=>{if(settled)return;settled=true;window.clearTimeout(timer);if(signal)signal.removeEventListener('abort',abort);if(error)reject(error);else resolve(value||'');};const cwd=(this.app.vault.adapter as any).getBasePath?.()||process.cwd();const child=spawn(command,args,{cwd,windowsHide:true,shell:process.platform==='win32',env:process.env});const abort=()=>{child.kill();const error=new Error('生成已停止');error.name='AbortError';finish(error);};const timer=window.setTimeout(()=>{child.kill();finish(new Error(`Codex 请求超时（${Math.round(provider.timeoutMs/1000)} 秒）`));},provider.timeoutMs);child.stdout.on('data',chunk=>{const value=String(chunk);output+=value;pending+=value;const lines=pending.split(/\r?\n/);pending=lines.pop()||'';for(const line of lines){try{const event=JSON.parse(line);if(event?.type==='item.completed'&&event?.item?.type==='agent_message'&&typeof event.item.text==='string'){answer=event.item.text;if(onDelta)onDelta(answer);}}catch{}}if(output.length>20_000_000){child.kill();finish(new Error('Codex 响应超过大小限制'));}});child.stderr.on('data',chunk=>errors+=String(chunk));child.on('error',error=>finish(error));child.on('close',code=>{if(settled)return;if(code!==0)return finish(new Error(errors.trim()||`Codex 进程退出码 ${code}`));if(!answer.trim())return finish(new Error('Codex 登录会话没有返回文本'));finish(undefined,answer.trim());});if(signal){if(signal.aborted)return abort();signal.addEventListener('abort',abort,{once:true});}child.stdin.end(promptText);});
  }

  private async callImageModel(promptText:string):Promise<ArrayBuffer>{
    const provider=this.imageProvider(),key=this.getProviderSecret(provider);if(!key)throw new Error(`请先在 ${provider.name} 中保存 API Key`);if(provider.protocol!=='openai-compatible')throw new Error('图片生成目前需要 OpenAI-compatible Images API');
    const base=(provider.imageBaseUrl||provider.baseUrl).replace(/\/$/,'');const headers=Object.assign({'content-type':'application/json'},providerHeaders(provider,key));
    const response:any=await providerRequest(requestUrl({url:`${base}/images/generations`,method:'POST',headers,body:JSON.stringify({model:provider.imageModel,prompt:promptText,size:this.settings.imageSize,n:1,response_format:'b64_json'})}),provider.timeoutMs);
    const item=response.json?.data?.[0];if(!item)throw new Error(response.json?.error?.message||`Images HTTP ${response.status} 未返回图片`);
    if(item.b64_json){const raw=String(item.b64_json).replace(/^data:image\/\w+;base64,/,'');return Uint8Array.from(atob(raw),c=>c.charCodeAt(0)).buffer;}
    if(item.url){const image=await requestUrl({url:item.url,method:'GET'});return image.arrayBuffer;}
    throw new Error('图片响应既没有 b64_json 也没有 url');
  }

  private wechatBaseUrl(){return (this.settings.wechatProxyUrl||'https://api.weixin.qq.com').replace(/\/$/,'');}
  private checkWechatResponse(data:any){if(data?.errcode&&data.errcode!==0)throw new Error(`微信接口 ${data.errcode}：${data.errmsg||'请求失败'}`);return data;}
  private async wechatAccessToken():Promise<string>{
    if(this.wechatTokenCache&&Date.now()<this.wechatTokenCache.expiresAt)return this.wechatTokenCache.token;
    const appid=this.settings.wechatAppId.trim(),secret=this.settings.wechatSecret.trim();
    if(!appid||!secret)throw new Error('请在插件设置填写微信公众号 AppID / AppSecret');
    const response=await requestUrl({url:`${this.wechatBaseUrl()}/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(appid)}&secret=${encodeURIComponent(secret)}`,method:'GET'});
    const data=this.checkWechatResponse(response.json);if(!data?.access_token)throw new Error('微信接口没有返回 access_token');
    this.wechatTokenCache={token:data.access_token,expiresAt:Date.now()+Math.max(60,(Number(data.expires_in)||7200)-300)*1000};return data.access_token;
  }
  private async wechatJson(endpoint:string,payload:any):Promise<any>{
    const token=await this.wechatAccessToken();const joiner=endpoint.includes('?')?'&':'?';
    const response=await requestUrl({url:`${this.wechatBaseUrl()}${endpoint}${joiner}access_token=${encodeURIComponent(token)}`,method:'POST',headers:{'content-type':'application/json; charset=utf-8'},body:JSON.stringify(payload)});
    return this.checkWechatResponse(response.json);
  }
  private async readImageAsset(value:string,sourceFile:TFile|null=this.lastSourceFile):Promise<{bytes:ArrayBuffer;filename:string;mime:string}>{
    const clean=decodeURIComponent(value.replace(/^<|>$/g,''));let bytes:ArrayBuffer;let filename=path.basename(clean);
    if(path.isAbsolute(clean)){const file=await readFile(clean);bytes=file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength);}
    else{
      const normalized=normalizePath(clean);const target=(sourceFile?this.app.metadataCache.getFirstLinkpathDest(clean,sourceFile.path):null)
        ||this.app.vault.getAbstractFileByPath(normalized)
        ||(sourceFile?this.app.vault.getAbstractFileByPath(normalizePath(`${sourceFile.parent?.path||''}/${clean}`)):null);
      if(!(target instanceof TFile))throw new Error(`图片不存在：${value}`);bytes=await this.app.vault.readBinary(target);filename=target.name;
    }
    return {bytes,filename,mime:this.imageMime(filename)};
  }
  private multipartImage(asset:{bytes:ArrayBuffer;filename:string;mime:string}):{body:ArrayBuffer;contentType:string}{
    const boundary=`----Md2Wechat${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
    const filename=asset.filename.replace(/["\r\n]/g,'_');
    const head=Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="${filename}"\r\nContent-Type: ${asset.mime}\r\n\r\n`,'utf8');
    const tail=Buffer.from(`\r\n--${boundary}--\r\n`,'utf8');const body=Buffer.concat([head,Buffer.from(asset.bytes),tail]);
    return {body:body.buffer.slice(body.byteOffset,body.byteOffset+body.byteLength),contentType:`multipart/form-data; boundary=${boundary}`};
  }
  private async uploadWechatImage(value:string,kind:'cover'|'content',sourceFile:TFile|null=this.lastSourceFile):Promise<any>{
    const token=await this.wechatAccessToken();const asset=await this.readImageAsset(value,sourceFile);const multipart=this.multipartImage(asset);
    const endpoint=kind==='cover'?'/cgi-bin/material/add_material?type=image':'/cgi-bin/media/uploadimg';
    const joiner=endpoint.includes('?')?'&':'?';const response=await requestUrl({url:`${this.wechatBaseUrl()}${endpoint}${joiner}access_token=${encodeURIComponent(token)}`,method:'POST',headers:{'content-type':multipart.contentType},body:multipart.body});
    return this.checkWechatResponse(response.json);
  }
  private async currentArticleSource():Promise<{file:TFile;markdown:string}|null>{
    const file=this.trackedSourceFile();if(!file){new Notice('没有可发布的 Markdown 源文件');return null;}
    const view=this.markdownViewFor(file);return {file,markdown:view?.editor.getValue()??await this.app.vault.cachedRead(file)};
  }
  async uploadImageInteractive(){const value=await prompt(this.app,'上传微信图片素材','仓库内图片路径',this.settings.defaultCover);if(value)try{const r=await this.uploadWechatImage(value,'cover');new OutputModal(this.app,'上传成功',JSON.stringify(r,null,2)).open();}catch(e:any){new Notice(e.message,8000);}}
  async createDraftFromCurrent(){
    const source=await this.currentArticleSource();if(!source)return;const rendered=renderMarkdown(source.markdown,this.renderOptions());
    const cover=rendered.metadata.cover||this.settings.defaultCover;if(!cover){new Notice('创建草稿需要封面：请在 frontmatter 设置 cover，或在插件设置填写默认封面',8000);return;}
    try{
      new Notice('正在上传封面和正文图片…',5000);const coverResp=await this.uploadWechatImage(cover,'cover',source.file);const thumb=coverResp.media_id;if(!thumb)throw new Error('封面上传成功但未返回 media_id');
      let html=rendered.html;
      for(const image of rendered.localImages){const resp=await this.uploadWechatImage(image,'content',source.file);const url=resp.url;if(url){const safe=image.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');html=html.replace(new RegExp(`src="${safe}"\\s+data-local-src="${safe}"`,'g'),`src="${url}"`);}}
      const article={title:rendered.metadata.title.slice(0,32),author:(rendered.metadata.author||this.settings.author).slice(0,16),digest:rendered.metadata.digest.slice(0,128),content:html,thumb_media_id:thumb,show_cover_pic:1};
      await this.wechatJson('/cgi-bin/draft/add',{articles:[article]});new OutputModal(this.app,'微信公众号草稿已创建','文章已成功保存到微信公众号后台的草稿箱。\n\n请登录微信公众号后台，在“草稿箱”中预览、编辑或发布。',false).open();new Notice('草稿创建成功');
    }catch(e:any){new Notice(`创建草稿失败：${e.message}`,10000);}
  }
  async createImagePost(){
    const source=await this.currentArticleSource();if(!source)return;const title=await prompt(this.app,'创建图片型草稿','标题',source.file.basename);if(!title)return;
    const images=await prompt(this.app,'创建图片型草稿','图片路径，用逗号分隔','');if(!images)return;
    try{const paths=images.split(',').map(v=>v.trim()).filter(Boolean);if(!paths.length)throw new Error('请至少填写一张图片');const cover=await this.uploadWechatImage(paths[0],'cover',source.file);const urls=[];for(const item of paths){const uploaded=await this.uploadWechatImage(item,'content',source.file);if(uploaded.url)urls.push(uploaded.url);}const digest=renderMarkdown(source.markdown,{theme:'default',fontSize:'medium',backgroundType:'none'}).metadata.digest;const content=`<section style="max-width:680px;margin:0 auto;padding:0;">${urls.map(url=>`<p style="margin:0 0 10px;padding:0;line-height:0;"><img src="${url}" style="display:block;width:100%;height:auto;margin:0;padding:0;border:0;border-radius:12px;" /></p>`).join('')}<p style="margin:12px 0;color:#555;font-size:15px;line-height:1.8;">${this.escapeHtmlAttribute(digest)}</p></section>`;const article={title:title.slice(0,32),author:this.settings.author.slice(0,16),digest:digest.slice(0,128),content,thumb_media_id:cover.media_id,show_cover_pic:0};await this.wechatJson('/cgi-bin/draft/add',{articles:[article]});new OutputModal(this.app,'图片型草稿已创建','图片内容已成功保存到微信公众号后台的草稿箱。\n\n请登录微信公众号后台，在“草稿箱”中预览、编辑或发布。',false).open();}
    catch(e:any){new Notice(`图片消息失败：${e.message}`,10000);}
  }
  private async showCapabilities(){
    const text=this.settings.providers.find(p=>p.id===this.settings.activeTextProviderId),image=this.settings.providers.find(p=>p.id===this.settings.activeImageProviderId);
    const info={renderer:'local',md2wechat_api_key_required:false,external_cli_required:false,themes:71,layout_syntaxes:56,studio_templates:7,icons:'Lucide',emoji_ui:false,knb_features:['12 themes','[TOC] content bars','reading time','font weight','heading markers','GitHub code themes','intro/highlight/callout/chat','mark/underline/sub/sup','footnotes'],ai:{provider_count:this.settings.providers.length,secret_storage:true,text:text?{provider:text.name,model:text.textModel,base_url:text.baseUrl,configured:this.isProviderConfigured(text),status:text.connection.status}:null,image:image?{provider:image.name,model:image.imageModel,base_url:image.imageBaseUrl||image.baseUrl,configured:this.isProviderConfigured(image),status:image.connection.status}:null},wechat:{native:true,configured:Boolean(this.settings.wechatAppId&&this.settings.wechatSecret),requires_official_account_credentials:true},commands:['convert','inspect','preview','export','local layout validate','write','humanize','title','generate cover','generate infographic','upload image','create draft','create image draft']};
    new OutputModal(this.app,'本地能力',JSON.stringify(info,null,2)).open();
  }
  private async embedLocalImages(rendered:RenderResult,sourceFile:TFile){
    for(const image of rendered.localImages){
      try{
        const clean=decodeURIComponent(image.replace(/^<|>$/g,''));
        let bytes:ArrayBuffer;
        if(path.isAbsolute(clean)){
          const file=await readFile(clean);bytes=file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength);
        }else{
          const target=this.app.metadataCache.getFirstLinkpathDest(clean,sourceFile.path)
            || this.app.vault.getAbstractFileByPath(normalizePath(clean))
            || this.app.vault.getAbstractFileByPath(normalizePath(`${sourceFile.parent?.path||''}/${clean}`));
          if(!(target instanceof TFile))throw new Error('附件文件不存在');
          bytes=await this.app.vault.readBinary(target);
        }
        const mime=this.imageMime(clean);const base64=Buffer.from(bytes).toString('base64');
        const original=this.escapeHtmlAttribute(image);
        const pattern=new RegExp(`src="${original.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}"\\s+data-local-src="${original.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}"`,'g');
        rendered.html=rendered.html.replace(pattern,`src="data:${mime};base64,${base64}" data-local-src="${original}" data-embedded="true"`);
      }catch(error:any){rendered.warnings.push(`本地图片无法嵌入：${image}（${error?.message||error}）`);}
    }
  }
  private imageMime(file:string){const ext=path.extname(file).toLowerCase();return ({'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.gif':'image/gif','.webp':'image/webp','.svg':'image/svg+xml','.bmp':'image/bmp','.avif':'image/avif'} as Record<string,string>)[ext]||'application/octet-stream';}
  private escapeHtmlAttribute(value:string){return value.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  private async ensureFolder(folder:string){let built='';for(const part of normalizePath(folder).split('/')){built=built?`${built}/${part}`:part;if(!this.app.vault.getAbstractFileByPath(built))await this.app.vault.createFolder(built);}}
}

class PromptModal extends Modal {
  private titleText:string;private label:string;private initial:string;private done:(value:string|null)=>void;
  constructor(app:App,title:string,label:string,initial:string,done:(v:string|null)=>void){super(app);this.titleText=title;this.label=label;this.initial=initial;this.done=done;}
  onOpen(){this.titleEl.setText(this.titleText);let value=this.initial;new Setting(this.contentEl).setName(this.label).addTextArea(t=>{t.setValue(value);t.inputEl.rows=7;t.inputEl.style.width='100%';t.onChange(v=>value=v);});const row=this.contentEl.createDiv({cls:'modal-button-container'});const cancel=row.createEl('button',{text:'取消'});cancel.onclick=()=>{this.done(null);this.close();};const ok=row.createEl('button',{text:'确定',cls:'mod-cta'});ok.onclick=()=>{this.done(value);this.close();};}
}
function prompt(app:App,title:string,label:string,initial:string):Promise<string|null>{return new Promise(resolve=>new PromptModal(app,title,label,initial,resolve).open());}
class OutputModal extends Modal {
  private heading:string;private text:string;private showCopy:boolean;constructor(app:App,heading:string,text:string,showCopy=true){super(app);this.heading=heading;this.text=text;this.showCopy=showCopy;}
  onOpen(){this.titleEl.setText(this.heading);if(!this.showCopy){const message=this.contentEl.createDiv();message.style.fontSize='15px';message.style.lineHeight='1.8';for(const paragraph of this.text.split(/\n\s*\n/)){const p=message.createEl('p',{text:paragraph});p.style.margin='8px 0';}return;}const pre=this.contentEl.createEl('pre',{text:this.text});pre.style.whiteSpace='pre-wrap';pre.style.maxHeight='65vh';pre.style.overflow='auto';const b=this.contentEl.createEl('button',{text:'复制'});b.onclick=()=>{navigator.clipboard.writeText(this.text);new Notice('已复制');};}
}
