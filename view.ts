import { ItemView, Notice, WorkspaceLeaf, setIcon } from 'obsidian';
import type Md2WechatPlugin from './main';
import { THEME_OPTIONS } from './renderer';
import type { AiTaskSnapshot } from './ai-task';

export const MD2WECHAT_VIEW_TYPE = 'md2wechat-html-view';

export class Md2WechatView extends ItemView {
  private plugin: Md2WechatPlugin;
  private preview!: HTMLElement;
  private currentHtml = '';
  private currentMarkdown = '';
  private deviceMode: 'phone'|'tablet' = 'phone';
  private darkPreview = false;
  private aiPanel!:HTMLElement;private aiPanelTitle!:HTMLElement;private aiPanelMeta!:HTMLElement;private aiSteps!:HTMLElement;private aiOutput!:HTMLElement;private aiStop!:HTMLButtonElement;private aiRetry!:HTMLButtonElement;private unsubscribeAiTask:(()=>void)|null=null;
  private dismissedTaskId='';
  constructor(leaf: WorkspaceLeaf, plugin: Md2WechatPlugin) { super(leaf); this.plugin=plugin; }
  getViewType() { return MD2WECHAT_VIEW_TYPE; }
  getDisplayText() { return 'Typography 工作台'; }
  getIcon() { return 'newspaper'; }
  async onOpen() {
    this.containerEl.empty();
    const root=this.containerEl.createDiv({cls:'md2w-local-view'});
    const toolbar=root.createDiv({cls:'md2w-local-toolbar'});
    toolbar.createDiv({cls:'md2w-local-title',text:'Typography'});
    const select=toolbar.createEl('select',{cls:'md2w-theme-select',attr:{title:'主题'}});
    for(const kind of ['先锋模板','官网主题','可能吧主题','AI 主题'] as const){
      const group=select.createEl('optgroup',{attr:{label:kind}});
      THEME_OPTIONS.filter(theme=>theme.kind===kind).forEach(theme=>group.createEl('option',{value:theme.id,text:theme.name}));
    }
    select.value=this.plugin.settings.theme;
    select.onchange=async()=>{this.plugin.settings.theme=select.value;await this.plugin.saveSettings();if(this.currentMarkdown)await this.plugin.convertCurrent();};
    const font=toolbar.createEl('select',{cls:'md2w-font-select',attr:{title:'正文字号'}});
    font.createEl('option',{value:'small',text:'小 14px'});font.createEl('option',{value:'medium',text:'中 15px'});font.createEl('option',{value:'large',text:'大 16px'});font.value=this.plugin.settings.fontSize;
    font.onchange=async()=>{this.plugin.settings.fontSize=font.value as 'small'|'medium'|'large';await this.plugin.saveSettings();if(this.currentMarkdown)await this.plugin.convertCurrent();};
    const background=toolbar.createEl('select',{cls:'md2w-bg-select',attr:{title:'背景'}});
    background.createEl('option',{value:'none',text:'无背景'});background.createEl('option',{value:'default',text:'主题背景'});background.createEl('option',{value:'grid',text:'网格背景'});background.value=this.plugin.settings.backgroundType;
    background.onchange=async()=>{this.plugin.settings.backgroundType=background.value as 'none'|'default'|'grid';await this.plugin.saveSettings();if(this.currentMarkdown)await this.plugin.convertCurrent();};
    const phone=this.iconButton(toolbar,'smartphone','手机预览',()=>{this.deviceMode='phone';phone.addClass('is-active');tablet.removeClass('is-active');this.applyPreviewMode();});
    const tablet=this.iconButton(toolbar,'tablet','平板预览',()=>{this.deviceMode='tablet';tablet.addClass('is-active');phone.removeClass('is-active');this.applyPreviewMode();});
    phone.addClass('is-active');
    const dark=this.iconButton(toolbar,'moon','近似微信暗色模式',()=>{this.darkPreview=!this.darkPreview;dark.toggleClass('is-active',this.darkPreview);this.applyPreviewMode();});
    this.iconButton(toolbar,'refresh-cw','重新排版',()=>this.plugin.convertCurrent());
    this.iconButton(toolbar,'copy','复制富文本',()=>this.copy());
    this.iconButton(toolbar,'file-down','导出 HTML',()=>this.plugin.exportCurrentHtml());
    this.iconButton(toolbar,'brain-circuit','AI 任务面板',()=>{this.dismissedTaskId='';this.aiPanel?.removeClass('is-dismissed');const task=this.plugin.getAiTask();if(task)this.renderAiTask(task);else this.aiPanel?.removeClass('is-hidden');});
    let actions:HTMLElement;
    this.iconButton(toolbar,'panel-top-open','显示工作台操作',()=>actions.toggleClass('is-collapsed',!actions.hasClass('is-collapsed')));
    actions=root.createDiv({cls:'md2w-action-dock'});
    const aiGroup=actions.createDiv({cls:'md2w-action-group'});this.groupTitle(aiGroup,'sparkles','AI 创作',this.aiStatus());
    this.actionButton(aiGroup,'file-plus-2','写文章','根据主题生成完整文章',()=>this.plugin.textTask('write'));
    this.actionButton(aiGroup,'wand-sparkles','自然化','优化当前文章表达',()=>this.plugin.textTask('humanize'));
    this.actionButton(aiGroup,'heading-1','生成标题','为当前文章生成标题',()=>this.plugin.textTask('title'));
    this.actionButton(aiGroup,'image-plus','生成封面','调用图片模型生成封面',()=>this.plugin.imageTask('cover'));
    this.actionButton(aiGroup,'chart-no-axes-combined','生成信息图','调用图片模型生成信息图',()=>this.plugin.imageTask('infographic'));
    const publishGroup=actions.createDiv({cls:'md2w-action-group'});this.groupTitle(publishGroup,'send','微信发布',this.wechatStatus());
    this.actionButton(publishGroup,'upload','上传素材','上传图片到微信公众号',()=>this.plugin.uploadImageInteractive());
    this.actionButton(publishGroup,'newspaper','创建草稿','将当前排版发布到草稿箱',()=>this.plugin.createDraftFromCurrent());
    this.actionButton(publishGroup,'images','图片草稿','创建图片型公众号草稿',()=>this.plugin.createImagePost());
    const stage=root.createDiv({cls:'md2w-workspace-stage'});this.preview=stage.createDiv({cls:'md2w-local-preview'});this.buildAiPanel(stage);this.aiPanel.querySelector('.md2w-ai-task-head>button')?.addEventListener('click',()=>this.aiPanel.addClass('is-dismissed'));this.unsubscribeAiTask=this.plugin.subscribeAiTask(task=>this.renderAiTask(task));
    this.applyPreviewMode();
    this.preview.createDiv({cls:'md2w-placeholder',text:'打开 Markdown 文件后，点击左侧排版图标开始创作。'});
  }
  async onClose(){this.unsubscribeAiTask?.();this.unsubscribeAiTask=null;}
  private iconButton(parent:HTMLElement, icon:string, label:string, action:()=>void|Promise<void>) {
    const b=parent.createEl('button',{cls:'clickable-icon',attr:{'aria-label':label,title:label}}); setIcon(b,icon); b.onclick=()=>void action(); return b;
  }
  private groupTitle(parent:HTMLElement,icon:string,label:string,status:{label:string;ready:boolean}){const title=parent.createDiv({cls:'md2w-action-group-title'});setIcon(title.createSpan(),icon);title.createEl('strong',{text:label});title.createSpan({cls:`md2w-config-status${status.ready?' is-ready':''}`,text:status.label});}
  private actionButton(parent:HTMLElement,icon:string,label:string,description:string,action:()=>void|Promise<void>,primary=false){const button=parent.createEl('button',{cls:`md2w-action-button${primary?' is-primary':''}`,attr:{title:description,'aria-label':`${label}：${description}`}});setIcon(button.createSpan({cls:'md2w-action-button-icon'}),icon);const copy=button.createSpan({cls:'md2w-action-button-copy'});copy.createEl('strong',{text:label});copy.createEl('small',{text:description});button.onclick=()=>void action();return button;}
  private aiStatus(){const text=this.plugin.settings.providers.find(p=>p.id===this.plugin.settings.activeTextProviderId),image=this.plugin.settings.providers.find(p=>p.id===this.plugin.settings.activeImageProviderId);const ready=Boolean((text&&this.plugin.isProviderConfigured(text))||(image&&this.plugin.isProviderConfigured(image)));return {ready,label:ready?'模型已配置':'等待配置'};}
  private wechatStatus(){const ready=Boolean(this.plugin.settings.wechatAppId&&this.plugin.settings.wechatSecret);return {ready,label:ready?'凭证已配置':'等待配置'};}
  private buildAiPanel(parent:HTMLElement){this.aiPanel=parent.createEl('aside',{cls:'md2w-ai-task-panel is-hidden'});const head=this.aiPanel.createDiv({cls:'md2w-ai-task-head'});const identity=head.createDiv();setIcon(identity.createSpan(),'brain-circuit');const copy=identity.createDiv();this.aiPanelTitle=copy.createEl('strong',{text:'AI 任务'});this.aiPanelMeta=copy.createEl('small',{text:'等待任务'});const close=head.createEl('button',{cls:'clickable-icon',attr:{title:'关闭任务面板','aria-label':'关闭任务面板'}});setIcon(close,'x');close.onclick=()=>this.aiPanel.addClass('is-hidden');this.aiSteps=this.aiPanel.createDiv({cls:'md2w-ai-timeline'});const outputWrap=this.aiPanel.createDiv({cls:'md2w-ai-output-wrap'});const outputHead=outputWrap.createDiv({cls:'md2w-ai-output-head'});outputHead.createEl('strong',{text:'实时输出'});const copyButton=outputHead.createEl('button',{cls:'clickable-icon',attr:{title:'复制输出','aria-label':'复制输出'}});setIcon(copyButton,'copy');copyButton.onclick=async()=>{await navigator.clipboard.writeText(this.aiOutput.innerText);new Notice('AI 输出已复制');};this.aiOutput=outputWrap.createEl('pre',{cls:'md2w-ai-output',text:'模型开始生成后，内容会在这里实时出现。'});const actions=this.aiPanel.createDiv({cls:'md2w-ai-task-actions'});this.aiStop=actions.createEl('button',{text:'停止生成'});setIcon(this.aiStop.createSpan(),'square');this.aiStop.onclick=()=>this.plugin.cancelAiTask();this.aiRetry=actions.createEl('button',{text:'重新生成',cls:'mod-cta'});setIcon(this.aiRetry.createSpan(),'rotate-ccw');this.aiRetry.onclick=()=>void this.plugin.retryAiTask();}
  private renderAiTask(task:AiTaskSnapshot){this.aiPanel.removeClass('is-hidden');this.aiPanel.dataset.status=task.status;this.aiPanelTitle.setText(task.title);const seconds=(task.elapsedMs/1000).toFixed(1),first=task.firstTokenMs!==undefined?` · 首字 ${(task.firstTokenMs/1000).toFixed(1)}s`:'';this.aiPanelMeta.setText(`${task.provider} · ${task.model} · ${seconds}s${first}`);this.aiSteps.empty();for(const step of task.steps){const row=this.aiSteps.createDiv({cls:`md2w-ai-step is-${step.status}`});const icon=row.createSpan({cls:'md2w-ai-step-icon'});setIcon(icon,step.status==='completed'?'check':step.status==='active'?'loader-circle':step.status==='failed'?'x':'circle');const text=row.createDiv();text.createEl('strong',{text:step.label});if(step.detail)text.createEl('small',{text:step.detail});}this.aiOutput.setText(task.output||task.error||'模型正在准备响应…');this.aiOutput.scrollTop=this.aiOutput.scrollHeight;this.aiStop.disabled=task.status!=='running';this.aiRetry.disabled=task.status==='running'||!task.canRetry;this.aiStop.setText(task.status==='running'?'停止生成':'任务已结束');setIcon(this.aiStop.createSpan(),'square');}
  setContent(html:string, markdown:string) { this.currentHtml=html;this.currentMarkdown=markdown;this.preview.empty();this.preview.innerHTML=html;this.preview.scrollTop=0; }
  getHtml(){return this.currentHtml;}
  private async copy(){
    if(!this.currentHtml){new Notice('请先排版');return;}
    try{
      const runtimeRequire=(globalThis as any).require||(window as any).require;
      const electronClipboard=runtimeRequire?.('electron')?.clipboard;
      if(electronClipboard){electronClipboard.write({html:this.currentHtml,text:this.preview.innerText});new Notice('已复制富文本和内嵌图片，可粘贴到公众号编辑器');return;}
      await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([this.currentHtml],{type:'text/html'}),'text/plain':new Blob([this.preview.innerText],{type:'text/plain'})})]);
      new Notice('已复制富文本和内嵌图片，可粘贴到公众号编辑器');
    }catch{
      const range=document.createRange();range.selectNodeContents(this.preview);const sel=window.getSelection();sel?.removeAllRanges();sel?.addRange(range);document.execCommand('copy');sel?.removeAllRanges();new Notice('已复制');
    }
  }
  private applyPreviewMode(){if(!this.preview)return;this.preview.toggleClass('is-phone',this.deviceMode==='phone');this.preview.toggleClass('is-tablet',this.deviceMode==='tablet');this.preview.toggleClass('is-dark-preview',this.darkPreview);}
}
