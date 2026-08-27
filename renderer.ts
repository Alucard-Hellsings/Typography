export type FontSize = 'small' | 'medium' | 'large';

export interface RenderOptions {
  theme: string;
  fontSize: FontSize;
  backgroundType: 'none' | 'default' | 'grid';
  fontWeight?: 'light' | 'regular' | 'bold';
  headingStyle?: 'numbers' | 'eyes' | 'none';
  codeTheme?: 'github-light' | 'github-dark';
  includeReadingTime?: boolean;
  author?: string;
  avatar?: string;
}

export interface ArticleMetadata {
  title: string;
  author: string;
  digest: string;
  cover: string;
}

export interface RenderResult {
  html: string;
  metadata: ArticleMetadata;
  layouts: string[];
  warnings: string[];
  localImages: string[];
}

export interface ThemeOption { id: string; name: string; primary: string; kind: '官网主题' | '可能吧主题' | 'AI 主题' | '先锋模板'; description?: string; }

const TEMPLATE_COLORS: Record<string, [string,string]> = {
  blue:['宝石蓝','#4B6EF5'], gold:['古铜金','#C8A062'], gray:['石墨灰','#4E5969'], green:['翡翠绿','#2BAE85'],
  navy:['深海蓝','#1F4F8A'], orange:['暖橙色','#F89A3A'], red:['中国红','#F25C54'], sky:['天空蓝','#3A7FD5']
};
const FAMILY_NAMES: Record<string,string> = { minimal:'简约', focus:'聚焦', elegant:'精致', bold:'醒目' };
const BASIC_AND_FEATURED: Array<[string,string,string]> = [
  ['default','默认主题','#a34e2e'],['bytedance','字节范','#1677ff'],['apple','苹果范','#007aff'],
  ['sports','运动风','#00A968'],['chinese','中国风','#8b1e22'],['cyber','赛博朋克','#f472b6'],
  ['sspai-red','少数派','#d71a1b'],['wechat-native','微信公众号原生','#07c160'],['nyt-classic','NYT','#326891'],
  ['github-readme','GitHub','#0969da'],['mint-fresh','薄荷','#1a7a5a'],['sunset-amber','日落','#c0582a'],
  ['ink-minimal','水墨','#111111'],['lavender-dream','薰衣草','#6b4c9a'],['coffee-house','咖啡','#6d4c41'],
  ['bauhaus-primary','Bauhaus','#004d9f']
];
const KNB_THEMES: Array<[string,string,string,string,string,string,string,string]> = [
  ['default','绿蓝','可能吧风格：绿色为主，蓝色为辅','rgb(41, 148, 128)','rgb(73, 200, 149)','rgb(26, 149, 165)','#66CCC5','rgb(60, 90, 80)'],
  ['blackwhite','黑白','低饱和灰阶，适合严肃 / 商务文章','#555','#999','#777','#544c4c','#3e3e3e'],
  ['red','红火','热烈红色，适合节日 / 重磅发布','#bb1e1e','#FF4949','#bb3827','#bb3827','#7a3232'],
  ['joker','小丑','柔和紫罗兰，适合书评 / 文艺','#917cb7','#BAA8E4','#a57d96','#917cb7','#5a4f78'],
  ['ironman','钢人','红主调 + 金色点缀','#D03E35','#DEAC43','#D03E35','#D03E35','#7d3835'],
  ['batman','老爷','深灰主调 + 蓝色 + 金色','#4e4e4e','#68b4e4','#68b4e4','#4e4e4e','#3e3e3e'],
  ['blueindigo','蓝靛','柔和蓝色，适合科技产品介绍','rgb(32, 91, 195)','rgb(166, 189, 231)','rgb(99, 141, 213)','#a6bde7','rgb(60, 80, 130)'],
  ['pink','桃红','甜美粉色，适合生活 / 美食','#fe7e93','#feb6a4','#feb6a4','#fe7e93','#8c505f'],
  ['golden','金黄','暖色橙金，适合财经 / 年度回顾','#ffa359','#fee691','#ffa359','#ffa359','#8c5f32'],
  ['loki','洛基','亦正亦邪的洛基风格','#0b450a','#d6d3ae','#50630d','#071a03','#0b450a'],
  ['spiderman','小虫','经典的蜘蛛侠配色','#7E1F27','#2B6BBD','#B4202E','#114C92','#114C92'],
  ['posionivy','毒藤','经典的毒藤配色','#ff6325','#37c412','#37c412','#ff6325','#000000']
];
const STUDIO_THEMES: Array<[string,string,string,string]> = [
  ['quiet-intelligence','静谧智能','#d97757','暖象牙纸、陶土强调与人文编辑秩序'],
  ['studio-noir-index','暗夜索引','#b7ff3c','黑色编辑索引、荧光信号与超大字阶'],
  ['studio-cobalt-motion','钴蓝动势','#2248ff','钴蓝动势、橙色切面与运动型排版'],
  ['studio-aurora-glass','极光玻璃','#6558ff','极光色谱、通透层次与柔性光晕'],
  ['studio-swiss-signal','瑞士信号','#e53935','瑞士网格、强信号红与理性信息层级'],
  ['studio-chrome-future','铬色未来','#23d5e8','深空铬感、青色数据线与未来界面'],
  ['studio-luxe-editorial','奢华编辑','#7d2335','象牙纸张、酒红标题与金色编辑细节']
];
export const THEME_OPTIONS: ThemeOption[] = [
  ...BASIC_AND_FEATURED.map(([id,name,primary])=>({id,name,primary,kind:'官网主题' as const})),
  ...Object.keys(FAMILY_NAMES).flatMap(family=>Object.entries(TEMPLATE_COLORS).map(([color,[colorName,primary]])=>({
    id:`${family}-${color}`, name:`${FAMILY_NAMES[family]} · ${colorName}`, primary, kind:'官网主题' as const
  }))),
  ...KNB_THEMES.map(([id,name,description,primary])=>({id:`knb-${id}`,name,description,primary,kind:'可能吧主题' as const})),
  {id:'autumn-warm',name:'秋日暖光',primary:'#d97758',kind:'AI 主题'},
  {id:'ocean-calm',name:'深海静谧',primary:'#4a7c9b',kind:'AI 主题'},
  {id:'spring-fresh',name:'春日清新',primary:'#6b9b7a',kind:'AI 主题'},
  {id:'custom',name:'自定义 AI 主题',primary:'#7c3aed',kind:'AI 主题'},
  ...STUDIO_THEMES.map(([id,name,primary,description])=>({id,name,primary,description,kind:'先锋模板' as const}))
];
export const THEMES = THEME_OPTIONS.map(theme=>theme.id);

export const LAYOUTS = [
  'audience-fit','author-card','bridge','callout','cards','cases','changelog',
  'checklist','compare','comparison-table','cta','definition','dialogue-pair','faq',
  'figure-caption','flow','gallery-grid','gallery-story','hero','image-annotate',
  'image-compare','image-phone-shot','image-steps','image-text','infographic',
  'label-title','logos','manifesto','matrix','metrics','myth-fact','notice','part',
  'people','pricing','question','quote','quote-card','resource-list','series','specs',
  'split','stat-row','steps','subscribe','summary','svg-reveal','svg-swipe-gallery',
  'timeline','toc','toolbox','tweet','verdict','insight','context','reasoning'
];

interface Palette {
  primary: string;
  secondary: string;
  text: string;
  muted: string;
  surface: string;
  background: string;
  border: string;
  accent: string;
  time: string;
  introText: string;
}

function paletteFor(theme: string): Palette {
  const named: Record<string, Partial<Palette>> = {
    default:{primary:'#a34e2e',secondary:'#f1e6df',background:'#faf9f5',text:'#555555'},
    apple:{primary:'#111827',secondary:'#f3f4f6',background:'#ffffff'},
    bytedance:{primary:'#3370ff',secondary:'#eaf0ff',background:'#ffffff'},
    sports:{primary:'#f97316',secondary:'#fff1e8',background:'#fffdf8'},
    chinese:{primary:'#9f1239',secondary:'#f9e8e7',background:'#fffaf2'},
    cyber:{primary:'#f472b6',secondary:'#f3e8ff',background:'#ffffff',text:'#242424',surface:'#ffffff',muted:'#6b7280'},
    'bauhaus-primary':{primary:'#e11d48',secondary:'#fde047',background:'#f8fafc'},
    'coffee-house':{primary:'#78350f',secondary:'#f5e8d3',background:'#fffaf3'},
    'github-readme':{primary:'#0969da',secondary:'#ddf4ff',background:'#ffffff'},
    'ink-minimal':{primary:'#111111',secondary:'#f5f5f5',background:'#ffffff'},
    'lavender-dream':{primary:'#7c3aed',secondary:'#f3e8ff',background:'#fdfaff'},
    'mint-fresh':{primary:'#0f766e',secondary:'#ccfbf1',background:'#f7fffd'},
    'nyt-classic':{primary:'#111827',secondary:'#eee8d8',background:'#f7f1df'},
    'sspai-red':{primary:'#d71a1b',secondary:'#fde8e8',background:'#ffffff'},
    'sunset-amber':{primary:'#b45309',secondary:'#fef3c7',background:'#fffaf0'},
    'wechat-native':{primary:'#07c160',secondary:'#e8f8ef',background:'#f7f7f7'},
    'autumn-warm':{primary:'#d97758',secondary:'#c06b4d',background:'#faf9f5',text:'#4a413d'},
    'ocean-calm':{primary:'#4a7c9b',secondary:'#3d6a8a',background:'#f0f4f8',text:'#3a4150'},
    'spring-fresh':{primary:'#6b9b7a',secondary:'#4a8058',background:'#f5f8f5',text:'#3d4a3d'}
    ,'studio-noir-index':{primary:'#b7ff3c',secondary:'#252a20',background:'#0c0d0b',surface:'#11130f',text:'#f4f5ef',muted:'#a0a497',border:'#363b30',accent:'#ffffff'}
    ,'studio-cobalt-motion':{primary:'#2248ff',secondary:'#ff5a36',background:'#f4f5ff',surface:'#ffffff',text:'#101426',muted:'#626a86',border:'#cbd3ff',accent:'#ff5a36'}
    ,'studio-aurora-glass':{primary:'#6558ff',secondary:'#c6f4e8',background:'#f5f3ff',surface:'#fbfaff',text:'#24213a',muted:'#77718f',border:'#ddd7ff',accent:'#ff5da2'}
    ,'studio-swiss-signal':{primary:'#e53935',secondary:'#111111',background:'#f4f1e8',surface:'#faf8f1',text:'#111111',muted:'#5f5b54',border:'#b9b4aa',accent:'#165dff'}
    ,'studio-chrome-future':{primary:'#23d5e8',secondary:'#1b3444',background:'#081017',surface:'#0d1821',text:'#e8f8fb',muted:'#84a3ad',border:'#28414d',accent:'#a7ff65'}
    ,'studio-luxe-editorial':{primary:'#7d2335',secondary:'#d8bd82',background:'#f3ecdf',surface:'#fbf7ef',text:'#2d2522',muted:'#796c65',border:'#d5c6b4',accent:'#b08343'}
    ,'quiet-intelligence':{primary:'#d97757',secondary:'#e8e1d5',background:'#f7f4ec',surface:'#fcfaf5',text:'#25231f',muted:'#746f66',border:'#d8d1c5',accent:'#b85e42',time:'#b85e42',introText:'#5f574d'}
  };
  const primary = THEME_OPTIONS.find(item=>item.id===theme)?.primary || '#a34e2e';
  const base: Palette = {primary,secondary:'#eef6f1',text:'#242424',muted:'#6b7280',surface:'#ffffff',background:'#ffffff',border:'#e5e7eb',accent:primary,time:primary,introText:'#3c5a50'};
  const result = Object.assign(base, named[theme] || {});
  result.primary = primary;
  if(theme.startsWith('knb-')){
    const source=KNB_THEMES.find(item=>`knb-${item[0]}`===theme);
    if(source){result.primary=source[3];result.secondary=source[4];result.accent=source[5];result.time=source[6];result.introText=source[7];result.text='rgb(43, 43, 43)';result.background='#ffffff';}
  }
  return result;
}

interface ElementStyles { heading: string; quote: string; font: string; paragraph: string; }
const WECHAT_FONT = "-apple-system,BlinkMacSystemFont,'PingFang SC','Helvetica Neue','Hiragino Sans GB','Microsoft YaHei UI','Microsoft YaHei',Arial,sans-serif";
const SPECIAL_STYLES: Record<string,[string,string]> = {
  default:[`margin:2em 8px .75em 0;padding:0 0 .5em 12px;border-left:4px solid rgb(200,100,66);border-bottom:1px dashed rgb(200,100,66);font-size:20px;font-weight:bold;line-height:1.2;color:rgb(63,63,63);`,`margin:1.5em 0 2em;padding:1em 1em 1em 2em;border-left:4px solid rgb(200,100,66);border-radius:6px;background:rgb(247,247,247);color:rgba(0,0,0,.6);font-style:italic;box-shadow:rgba(0,0,0,.05) 0 4px 6px;`],
  bytedance:[`padding:.4em 1.4em;margin:3em 0 1.5em;color:#fff;background:linear-gradient(135deg,#1677ff,#05d4cd);font-size:20px;font-weight:600;text-align:center;border-radius:8px 24px 8px 24px;box-shadow:0 4px 12px rgba(5,212,205,.15);letter-spacing:.1em;`,`font-style:normal;padding:1em 1em 1em 2em;border-left:4px solid #05d4cd;border-radius:6px;color:#4e5969;background:#f2f3f5;margin:1.5em 0;border:1px solid rgba(5,212,205,.1);`],
  apple:[`padding:.4em 0 .5em .8em;margin:1.8em 0 1em;color:#1d1d1f;font-size:20px;font-weight:600;text-align:left;border-left:3px solid;border-image:linear-gradient(to bottom,#007aff,#5856d6) 1;`,`font-style:normal;padding:1em 1.2em;border-left:4px solid;border-image:linear-gradient(to bottom,#007aff,#5856d6,#ff2d55) 1;color:#333;background:rgba(0,0,0,.02);border-radius:8px;margin:1.5em 0;`],
  sports:[`padding:.4em 1em .5em;margin:1.6em 0 .8em;font-size:20px;font-weight:600;letter-spacing:.06em;line-height:1.4;color:#00A968;background:linear-gradient(to right,rgba(0,169,104,.05),rgba(56,198,244,.05));border-left:4px solid;border-image:linear-gradient(to bottom,#FF6600,#00A968,#38C6F4) 1;border-radius:0 12px 12px 0;box-shadow:0 3px 8px rgba(0,169,104,.12);text-transform:uppercase;font-family:'Titillium Web',sans-serif;`,`font-style:normal;padding:1.2em 1.5em;border-left:5px solid;border-image:linear-gradient(to bottom,#FF6600,#00A968,#38C6F4) 1;color:#3c3c3e;background:#f8f8f8;border-radius:0 8px 8px 0;margin:1.8em 0;`],
  chinese:[`margin:2em 0 .75em;padding:0 0 .5em 12px;border-left:4px solid #8b1e22;border-bottom:1px dashed rgba(139,30,34,.4);font-size:20px;font-weight:bold;line-height:1.2;color:#8b1e22;letter-spacing:.1em;font-family:'KaiTi','STKaiti','SimSun',serif;`,`font-style:normal;padding:.5em 1em;border-left:4px solid #891e22;color:#666;background:rgba(139,30,34,.03);margin:1.2em 0;`],
  cyber:[`margin:2em 8px .75em 0;padding:.5em .5em .5em 15px;border-bottom:1px dashed #8b5cf6;font-size:20px;font-weight:600;line-height:1.2;color:#1d1d1f;background:radial-gradient(80.23% 80.23% at 50% 88.37%,rgba(174,78,245,.22) 0%,rgba(174,78,245,0) 100%);border-radius:4px;box-shadow:0 0 15px rgba(174,78,245,.15),inset 3px 0 #f472b6,inset 2px 0 #8b5cf6,inset 1px 0 #60a5fa;`,`font-style:normal;padding:1em 1.2em;border-left:4px solid transparent;border-image:linear-gradient(to bottom,#f472b6,#8b5cf6,#60a5fa) 1;color:#333;background:linear-gradient(135deg,rgba(244,114,182,.05),rgba(168,85,247,.02));border-radius:8px;margin:1.5em 0;`],
  'sspai-red':[`display:block;font-size:21px;font-weight:700;color:#2d2d2d;line-height:1.45;margin:34px 0 18px;padding:8px 0 8px 14px;border-left:4px solid #d71a1b;letter-spacing:.01em;`,`margin:24px 0;padding:16px 20px;background:linear-gradient(180deg,#fff8f8 0%,#fffdfd 100%);border-left:4px solid #d71a1b;border-right:1px solid #f0e0e0;color:#5b5555;border-radius:10px;`],
  'wechat-native':[`display:block;font-size:23px;font-weight:700;color:#067647;line-height:1.4;margin:34px 0 18px;padding:10px 14px;background:linear-gradient(90deg,rgba(7,193,96,.12) 0%,rgba(7,193,96,.03) 70%,rgba(7,193,96,0) 100%);border-left:4px solid #07c160;border-radius:12px;`,`margin:24px 0;padding:16px 18px;background:linear-gradient(135deg,#f0f7f2 0%,#f8fcf9 100%);border-left:4px solid #07c160;color:#4f6057;border-radius:10px;box-shadow:inset 0 0 12px rgba(7,193,96,.06);`],
  'nyt-classic':[`display:block;font-size:19px;font-weight:700;color:#111;line-height:1.5;margin:38px 0 18px;padding:10px 0;text-transform:uppercase;letter-spacing:.12em;text-align:center;border-top:1px solid rgba(17,17,17,.85);border-bottom:1px solid rgba(17,17,17,.85);`,`margin:24px 0;padding:18px 20px;background:#f7f3ee;border-top:1px solid #d5cfc5;border-bottom:1px solid #d5cfc5;color:#555;border-radius:0;font-style:italic;`],
  'github-readme':[`display:block;font-size:23px;font-weight:700;color:#1f2328;line-height:1.35;margin:34px 0 18px;padding:0 0 10px;border-bottom:2px solid #d8dee4;box-shadow:inset 0 -2px #0969da;`,`margin:18px 0;padding:14px 16px;background:#f6f8fa;border:1px solid #d8dee4;border-left:4px solid #218bff;color:#57606a;border-radius:10px;`],
  'mint-fresh':[`display:block;width:fit-content;font-size:21px;font-weight:700;color:#1a7a5a;line-height:1.4;margin:34px 0 18px;padding:6px 14px;background:rgba(224,245,236,.95);border:1px solid rgba(26,122,90,.16);border-radius:999px;`,`margin:24px 0;padding:16px 20px;background:linear-gradient(180deg,rgba(224,245,236,.96),rgba(240,250,245,.96));border-left:4px solid #1a7a5a;color:#3d5a4e;border-radius:12px;`],
  'sunset-amber':[`display:block;font-size:23px;font-weight:700;color:#a45a33;line-height:1.4;margin:34px 0 18px;padding:10px 14px;background:linear-gradient(90deg,rgba(236,191,132,.24),rgba(236,191,132,0));border-left:3px solid #d78a54;border-radius:12px;`,`margin:24px 0;padding:18px 20px;background:linear-gradient(180deg,rgba(249,236,217,.96),rgba(247,228,204,.88));border-left:4px solid #d78a54;color:#6a4c38;border-radius:12px;font-style:italic;`],
  'ink-minimal':[`display:block;font-size:22px;font-weight:700;color:#111;line-height:1.45;margin:34px 0 18px;padding-left:12px;border-left:3px solid #000;`,`margin:24px 0;padding:16px 18px;background:#fafafa;border-left:3px solid #000;color:#333;border-radius:0;`],
  'lavender-dream':[`display:block;font-size:22px;font-weight:700;color:#6b4c9a;line-height:1.4;margin:34px 0 18px;padding:9px 14px;background:linear-gradient(90deg,rgba(236,228,255,.94),rgba(236,228,255,0));border-left:3px solid #9b7fd4;border-radius:12px;`,`margin:24px 0;padding:16px 20px;background:linear-gradient(180deg,rgba(236,228,255,.98),rgba(245,240,255,.9));border-left:4px solid #9b7fd4;color:#5a4570;border-radius:12px;`],
  'coffee-house':[`display:block;font-size:22px;font-weight:700;color:#5d4037;line-height:1.45;margin:34px 0 18px;padding:0 0 8px;border-bottom:1px solid rgba(161,136,127,.36);`,`margin:24px 0;padding:18px 20px;background:linear-gradient(180deg,rgba(236,226,212,.96),rgba(245,239,230,.96));border-left:4px solid #8d6e63;color:#5d4037;border-radius:12px;`],
  'bauhaus-primary':[`display:block;width:fit-content;font-size:22px;font-weight:800;color:#1a1a1a;line-height:1.35;margin:34px 0 18px;padding:8px 16px;background:linear-gradient(90deg,#f5a623 0%,#f5a623 68%,#fff 68%);border-left:10px solid #004d9f;border-top:3px solid #1a1a1a;border-bottom:3px solid #1a1a1a;text-transform:uppercase;letter-spacing:.08em;`,`margin:24px 0;padding:16px 20px;background:linear-gradient(135deg,#fff4d6,#fff8ea);border-left:6px solid #f5a623;border-right:2px solid #004d9f;border-top:2px solid #1a1a1a;color:#333;border-radius:0;`],
  'studio-noir-index':[`display:block;margin:44px 0 18px;padding:11px 0 11px 18px;color:#b7ff3c;background:#151912;border-left:7px solid #b7ff3c;border-bottom:1px solid #363b30;font-size:25px;font-weight:800;line-height:1.12;letter-spacing:-.03em;text-transform:uppercase;`,`margin:24px 0;padding:18px 20px;color:#f4f5ef;background:#171a15;border:1px solid #363b30;border-left:5px solid #b7ff3c;border-radius:0;box-shadow:8px 8px 0 #252a20;`],
  'studio-cobalt-motion':[`display:block;margin:42px 0 18px;padding:14px 18px;color:#ffffff;background:linear-gradient(105deg,#2248ff 0%,#2248ff 76%,#ff5a36 76%);font-size:24px;font-weight:800;line-height:1.15;letter-spacing:-.025em;border-radius:2px 22px 2px 2px;box-shadow:0 10px 24px rgba(34,72,255,.18);`,`margin:24px 0;padding:18px 20px;color:#101426;background:#eef1ff;border:1px solid #cbd3ff;border-left:6px solid #ff5a36;border-radius:2px 18px 18px 2px;`],
  'studio-aurora-glass':[`display:block;margin:42px 0 18px;padding:14px 18px;color:#352d73;background:linear-gradient(120deg,rgba(198,244,232,.96),rgba(221,215,255,.92),rgba(255,217,235,.9));font-size:23px;font-weight:750;line-height:1.2;letter-spacing:-.02em;border:1px solid rgba(101,88,255,.16);border-radius:18px;box-shadow:0 14px 34px rgba(101,88,255,.14);`,`margin:24px 0;padding:18px 20px;color:#3b3654;background:linear-gradient(135deg,#ffffff,#f1efff);border:1px solid #ddd7ff;border-radius:18px;box-shadow:0 12px 28px rgba(101,88,255,.1);`],
  'studio-swiss-signal':[`display:block;margin:44px 0 16px;padding:10px 0 8px;color:#111111;background:transparent;border-top:8px solid #e53935;border-bottom:2px solid #111111;font-size:27px;font-weight:800;line-height:1.05;letter-spacing:-.045em;text-transform:uppercase;`,`margin:24px 0;padding:16px 18px;color:#111111;background:#faf8f1;border:2px solid #111111;border-left:10px solid #e53935;border-radius:0;box-shadow:6px 6px 0 #d8d2c7;`],
  'studio-chrome-future':[`display:block;margin:42px 0 18px;padding:13px 16px;color:#e8f8fb;background:linear-gradient(110deg,#132733,#0d1821);border:1px solid #31515e;border-left:5px solid #23d5e8;border-radius:4px 16px 4px 16px;font-size:23px;font-weight:700;line-height:1.15;letter-spacing:.02em;box-shadow:0 0 24px rgba(35,213,232,.14);`,`margin:24px 0;padding:18px 20px;color:#d9eef2;background:#101f29;border:1px solid #28414d;border-left:4px solid #23d5e8;border-radius:12px;box-shadow:inset 0 0 28px rgba(35,213,232,.05);`],
  'studio-luxe-editorial':[`display:block;margin:46px 0 18px;padding:9px 0;color:#7d2335;background:transparent;border-top:1px solid #b08343;border-bottom:1px solid #b08343;font-family:Georgia,'Times New Roman',serif;font-size:25px;font-weight:600;line-height:1.18;letter-spacing:.025em;text-align:center;`,`margin:26px 0;padding:20px 22px;color:#4a3d38;background:#f7f0e4;border:1px solid #d5c6b4;border-top:4px solid #7d2335;border-radius:0;font-family:Georgia,'Times New Roman',serif;`]
  ,'quiet-intelligence':[`display:block;margin:42px 0 18px;padding:10px 0;color:#25231f;background:transparent;border-bottom:1px solid #d8d1c5;font-size:24px;font-weight:700;line-height:1.25;letter-spacing:-.025em;`,`margin:26px 0;padding:18px 20px;color:#4b453f;background:#f5efe5;border:1px solid #ded5c8;border-left:4px solid #d97757;border-radius:12px;box-shadow:0 10px 28px rgba(72,55,42,.07);`]
};

function elementStyles(theme: string, p: Palette): ElementStyles {
  const family = theme.split('-')[0];
  let heading = SPECIAL_STYLES[theme]?.[0] || '';
  let quote = SPECIAL_STYLES[theme]?.[1] || '';
  if (FAMILY_NAMES[family]) {
    if (family === 'minimal') heading=`font-size:24px;font-weight:700;color:${p.primary};margin-top:36px;margin-bottom:24px;line-height:1.4;word-break:break-all;letter-spacing:-.02em;font-family:${WECHAT_FONT};`;
    if (family === 'focus') heading=`font-size:22px;font-weight:700;color:${p.primary};line-height:1.35;margin-top:36px;margin-bottom:24px;word-break:break-all;padding:12px 0;text-align:center;background-image:linear-gradient(${p.primary}4d,${p.primary}4d),linear-gradient(${p.primary}4d,${p.primary}4d);background-size:80% 1px,80% 1px;background-position:center top,center bottom;background-repeat:no-repeat;font-family:${WECHAT_FONT};`;
    if (family === 'elegant') heading=`font-size:22px;font-weight:600;color:${p.primary};margin-top:36px;margin-bottom:24px;line-height:1.4;word-break:break-all;padding-left:10px;border-left:4px double ${p.primary};font-family:${WECHAT_FONT};`;
    if (family === 'bold') heading=`font-size:22px;font-weight:600;color:${p.primary};margin-top:36px;margin-bottom:24px;line-height:1.4;word-break:break-all;padding-left:12px;border-left:4px solid ${p.primary};font-family:${WECHAT_FONT};`;
    quote = family==='focus' ? `margin:4px 0;padding:8px;border-left:5px solid ${p.primary};background:${p.primary}0d;line-height:1.7;font-style:italic;font-family:${WECHAT_FONT};`
      : family==='minimal' ? `margin:4px 0;padding:8px;border-left:3px solid ${p.primary};font-style:italic;opacity:.85;font-family:${WECHAT_FONT};`
      : `margin:4px 0;padding:8px;font-size:15px;color:#555;background:linear-gradient(135deg,${p.primary}0d,${p.primary}05);border-left:3px solid ${p.primary};border-radius:0 8px 8px 0;line-height:1.8;font-family:${WECHAT_FONT};`;
  }
  if(theme.startsWith('knb-')){
    heading=`margin:1.6em 8px 1em;color:#3e3e3e;font-size:20px;font-weight:600;line-height:1.5;font-family:${WECHAT_FONT};`;
    quote=`margin:1.4em 8px;padding:4px 14px;border-left:4px solid ${p.primary};border-radius:0;background:transparent;color:rgb(43,43,43);font-size:15px;line-height:28px;letter-spacing:1px;text-align:justify;box-sizing:border-box;max-width:100%;`;
  }
  if (theme==='autumn-warm') { heading=`color:#d97758;border-bottom:1px dashed rgba(74,65,61,.3);padding-bottom:8px;`; quote=`background:#fef4e7;border-left:5px solid #d97758;box-shadow:inset 0 0 15px rgba(217,119,88,.1);padding:16px 20px;`; }
  if (theme==='ocean-calm') { heading=`color:#3d6a8a;border-bottom:1px dashed rgba(74,124,155,.3);padding-bottom:8px;`; quote=`background:#e8f0f8;border-left:5px solid #4a7c9b;box-shadow:inset 0 0 12px rgba(74,124,155,.08);padding:16px 20px;`; }
  if (theme==='spring-fresh') { heading=`color:#4a8058;border-bottom:1px dashed rgba(74,128,88,.25);padding-bottom:8px;`; quote=`background:#e8f0e8;border-left:5px solid #6b9b7a;box-shadow:inset 0 0 12px rgba(107,155,122,.1);padding:16px 20px;`; }
  let paragraph=theme.startsWith('knb-')?`margin:0 8px 8px;color:rgb(43,43,43);font-size:15px;line-height:28px;letter-spacing:1px;text-align:justify;font-family:${WECHAT_FONT};`:`margin:0 0 8px;line-height:1.75;text-align:start;font-weight:400;color:${p.text};word-break:break-all;font-family:${WECHAT_FONT};`;
  if(theme.startsWith('studio-')||theme==='quiet-intelligence')paragraph=`margin:0 0 10px;padding:0;color:${p.text};font-size:15px;line-height:1.85;letter-spacing:.025em;text-align:justify;font-weight:400;font-family:${WECHAT_FONT};`;
  return {heading:heading||`font-size:22px;color:${p.primary};margin:36px 0 24px;`,quote:quote||`margin:18px 0;padding:14px 18px;border-left:4px solid ${p.primary};background:${p.secondary};`,font:WECHAT_FONT,paragraph};
}

function esc(value: string): string {
  return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/**
 * 微信发布会重建文章 DOM，外层 font-family 的继承关系可能丢失。
 * 将正文安全字体写入每个承载文字的节点；pre/code 保留等宽字体。
 */
function lockWechatPublishFonts(html:string,font:string):string {
  const textTags='section|div|h[1-6]|p|span|strong|b|em|i|a|blockquote|ul|ol|li|table|thead|tbody|tfoot|tr|th|td|mark|ins|del|s|small|sup|sub';
  return html.replace(new RegExp(`<(${textTags})(\\s[^>]*?)?>`,'gi'),(whole,tag,attrs='')=>{
    const styleMatch=attrs.match(/\\sstyle="([^"]*)"/i);
    if(styleMatch){
      if(/(?:^|;)\\s*font-family\\s*:/i.test(styleMatch[1]))return whole;
      const style=`${styleMatch[1].replace(/;?\\s*$/,'')};font-family:${font};`;
      return whole.replace(styleMatch[0],` style="${style}"`);
    }
    return `<${tag}${attrs} style="font-family:${font};">`;
  });
}

/** 删除微信保存富文本时容易被转换为空段落的占位内容。 */
function compactWechatPublishHtml(html:string):string {
  return html
    .replace(/<p\b[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi,'')
    .replace(/(?:<br\s*\/?>\s*){2,}/gi,'<br>')
    .replace(/<\/section>\s+<section/gi,'</section><section')
    .replace(/<\/p>\s+<p/gi,'</p><p')
    .trim();
}

function stripFrontmatter(markdown: string): { body: string; metadata: ArticleMetadata } {
  const metadata: ArticleMetadata = {title:'',author:'',digest:'',cover:''};
  const match = markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!match) return {body:markdown,metadata};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const value = m[2].trim().replace(/^['"]|['"]$/g,'');
    if (m[1] === 'title') metadata.title = value;
    if (m[1] === 'author') metadata.author = value;
    if (['digest','summary','description'].includes(m[1]) && !metadata.digest) metadata.digest = value;
    if (['cover','cover_image'].includes(m[1])) metadata.cover = value;
  }
  return {body:markdown.slice(match[0].length),metadata};
}

const LUCIDE_PATHS:Record<string,string>={
  smile:'<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/>',
  rocket:'<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.87 12.87 0 0 1 22 2c0 2.72-.78 7.5-6.05 11a22.35 22.35 0 0 1-3.95 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
  sparkles:'<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/><path d="M5 3v4M19 17v4M3 5h4M17 19h4"/>',
  'triangle-alert':'<path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
  lightbulb:'<path d="M9 18h6M10 22h4"/><path d="M15.09 14c.18-.72.66-1.25 1.17-1.76A6 6 0 1 0 7.74 12.24c.5.5.97 1.03 1.17 1.76"/><path d="M9 14h6v1a3 3 0 0 1-6 0z"/>',
  'notebook-pen':'<path d="M13.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.5"/><path d="M4 6h2M4 10h2M4 14h2M4 18h2"/><path d="M17.5 2.5a2.12 2.12 0 0 1 3 3L13 13l-4 1 1-4Z"/>',
  'circle-check':'<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  'circle-x':'<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
  'message-circle':'<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>',
  'messages-square':'<path d="M14 9a2 2 0 0 1-2 2H6l-4 3V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z"/><path d="M10 15v1a2 2 0 0 0 2 2h6l4 3V11a2 2 0 0 0-2-2h-2"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  quote:'<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2H4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2h3c0 4-1 5-4 6zM14 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2h-4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2h3c0 4-1 5-4 6z"/>',
  eye:'<path d="M2.06 12.35a1 1 0 0 1 0-.7C3.72 7.6 7.68 5 12 5c4.32 0 8.28 2.6 9.94 6.65a1 1 0 0 1 0 .7C20.28 16.4 16.32 19 12 19c-4.32 0-8.28-2.6-9.94-6.65Z"/><circle cx="12" cy="12" r="3"/>',
  square:'<rect width="18" height="18" x="3" y="3" rx="2"/>',
  'square-check':'<rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/>'
  ,'brain-circuit':'<path d="M9.5 4.5A2.5 2.5 0 0 0 7 2a2.5 2.5 0 0 0-2.5 2.5v.7A3 3 0 0 0 3 10.5V12a3 3 0 0 0 1.5 2.6v.9A2.5 2.5 0 0 0 7 18a2.5 2.5 0 0 0 2.5-2.5zM14.5 4.5A2.5 2.5 0 0 1 17 2a2.5 2.5 0 0 1 2.5 2.5v.7a3 3 0 0 1 1.5 5.3V12a3 3 0 0 1-1.5 2.6v.9A2.5 2.5 0 0 1 17 18a2.5 2.5 0 0 1-2.5-2.5z"/><path d="M9.5 6H12l1.5 2H17M14.5 12H12l-1.5 2H7M12 8v4"/>'
  ,'book-open':'<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'
  ,'message-square-text':'<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M8 8h8M8 12h6"/>'
  ,'circle-help':'<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 1 1 5.83 1c0 2-3 2-3 4M12 18h.01"/>'
  ,'user-round':'<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>'
  ,'code-2':'<path d="m18 16 4-4-4-4M6 8l-4 4 4 4M14.5 4l-5 16"/>'
};
function lucideIcon(name:string,size=16):string {
  const paths=LUCIDE_PATHS[name]||LUCIDE_PATHS.sparkles;
  return `<span class="lucide-inline" style="display:inline-flex;width:${size}px;height:${size}px;margin-right:6px;vertical-align:-2px;color:inherit;line-height:0;"><svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg></span>`;
}

function inline(text: string): string {
  let out = esc(text);
  const icons:Record<string,string>={smile:'smile',rocket:'rocket',sparkles:'sparkles',warning:'triangle-alert',bulb:'lightbulb',memo:'notebook-pen',white_check_mark:'circle-check',x:'circle-x'};
  out=out.replace(/:([a-z0-9_+-]+):/g,(all,name)=>icons[name]?lucideIcon(icons[name]):all);
  out=out.replace(/^\[([ xX])\]\s*/,(_m,state)=>`<span style="display:inline-block;margin-right:7px;color:var(--md2w-primary);">${lucideIcon(state===' '?'square':'square-check',16)}</span>`);
  out = out.replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m,src,alt) => {
    const label=alt||src;return `<section style="display:block;margin:0 8px;padding:0;background:transparent;border:0;border-radius:14px;box-shadow:0 8px 22px rgba(15,23,42,.12);text-align:center;line-height:0;overflow:hidden;"><img src="${src}" data-local-src="${src}" alt="${label}" style="display:block;width:100%;max-width:100%;height:auto;margin:0 auto;padding:0;border:0;border-radius:14px;" /></section>`;
  });
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_m,alt,src) =>
    `<section style="display:block;margin:0 8px;padding:0;background:transparent;border:0;border-radius:14px;box-shadow:0 8px 22px rgba(15,23,42,.12);text-align:center;line-height:0;overflow:hidden;"><img src="${src}" data-local-src="${src}" alt="${alt}" style="display:block;width:100%;max-width:100%;height:auto;margin:0 auto;padding:0;border:0;border-radius:14px;" /></section>`);
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,'<a href="$2" style="color:var(--md2w-primary);text-decoration:none;border-bottom:1px solid currentColor;">$1</a>');
  out = out.replace(/`([^`]+)`/g,'<code style="padding:2px 5px;border-radius:4px;background:var(--md2w-secondary);font-family:Consolas,monospace;font-size:.9em;">$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g,'<strong style="color:var(--md2w-primary);font-weight:700;">$1</strong>');
  out = out.replace(/__([^_]+)__/g,'<strong style="color:var(--md2w-primary);font-weight:700;">$1</strong>');
  out = out.replace(/==([^=]+)==/g,'<mark style="padding:0 3px;background:linear-gradient(transparent 58%,var(--md2w-mark) 58%);color:#3e3e3e;">$1</mark>');
  out = out.replace(/\+\+([^+]+)\+\+/g,'<ins style="text-decoration:underline;text-decoration-color:var(--md2w-time);text-decoration-thickness:2px;text-underline-offset:3px;">$1</ins>');
  out = out.replace(/~~([^~]+)~~/g,'<del>$1</del>');
  out = out.replace(/([A-Za-z0-9)\]])~([^~\s]+)~/g,'$1<sub>$2</sub>');
  out = out.replace(/([A-Za-z0-9)\]])\^([^\^\s]+)\^/g,'$1<sup>$2</sup>');
  out = out.replace(/\[\^([^\]]+)\]/g,'<sup style="color:var(--md2w-primary);font-size:.78em;line-height:1;vertical-align:super;margin-left:1px;">[$1]</sup>');
  out = out.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g,'<em>$1</em>');
  return out.split(/(<[^>]+>)/g).map(part=>part.startsWith('<')?part:part.replace(/([\u3400-\u9fff])([A-Za-z0-9])/g,'$1 $2').replace(/([A-Za-z0-9])([\u3400-\u9fff])/g,'$1 $2')).join('');
}

const KNB_CONTAINERS = ['intro','highlight','tip','info','note','warning','danger','say','chat','insight','context','reasoning','question','summary'];
function renderKnbContainer(name:string, raw:string, p:Palette):string {
  const content=raw.trim().split(/\r?\n/).filter(Boolean);
  if(name==='intro') return `<section class="container-intro" style="margin:1.6em 8px 2em;padding:.9em .4em;border-top:1px dashed ${p.primary};border-bottom:1px dashed ${p.primary};background:transparent;">${content.map(line=>`<p style="margin:.3em 0;color:${p.introText};font-size:15px;line-height:1.85;letter-spacing:.04em;text-align:left;">${inline(line)}</p>`).join('')}</section>`;
  if(name==='highlight') return `<section class="container-highlight" style="position:relative;margin:1.8em 8px;padding:.8em .6em 1em;background:transparent;color:${p.primary};text-align:center;"><span style="display:block;color:${p.primary};font:700 30px/1 Georgia;text-align:left;">“</span>${content.map(line=>`<p style="margin:0;color:${p.primary};font-size:16px;line-height:1.8;font-weight:600;letter-spacing:1px;text-align:center;">${inline(line)}</p>`).join('')}<span style="display:block;color:${p.primary};font:700 30px/1 Georgia;text-align:right;">”</span></section>`;
  if(name==='chat'){
    const icons=[lucideIcon('message-circle',15),lucideIcon('messages-square',15)];const roles:string[]=[];
    const rows=content.map(line=>{const m=line.match(/^([^:：\s][^:：]{0,15})\s*[:：]\s*(.+)$/);if(!m)return `<p style="margin:0 0 .55em;color:#2b2b2b;font-size:15px;line-height:1.8;">${inline(line)}</p>`;let index=roles.indexOf(m[1]);if(index<0){roles.push(m[1]);index=roles.length-1;}return `<p style="margin:.7em 0 .15em;color:${p.primary};font-size:14px;line-height:1.7;font-weight:700;letter-spacing:1px;"><span style="margin-right:5px;font-size:13px;">${icons[index%2]}</span>${esc(m[1])}</p><p style="margin:0 0 .55em;color:#2b2b2b;font-size:15px;line-height:1.8;letter-spacing:1px;text-align:left;">${inline(m[2])}</p>`;}).join('');
    return `<section class="knb-chat" style="margin:1.4em 8px;padding:0;">${rows}</section>`;
  }
  const labels:Record<string,[string,string]>={tip:['lightbulb','提示'],info:['info','说明'],note:['notebook-pen','笔记'],warning:['triangle-alert','注意'],danger:['circle-x','危险'],say:['message-circle','独白'],insight:['sparkles','核心洞察'],context:['book-open','背景信息'],reasoning:['brain-circuit','推理过程'],question:['circle-help','关键问题'],summary:['circle-check','结论摘要']};
  const [iconName,defaultLabel]=labels[name]||['sparkles',name];const icon=lucideIcon(iconName,16);
  const titleIndex=content.findIndex(line=>/^title\s*[:：]/i.test(line));
  const label=titleIndex>=0?content.splice(titleIndex,1)[0].replace(/^title\s*[:：]\s*/i,''):defaultLabel;
  const isThoughtCard=['insight','context','reasoning','question','summary'].includes(name);
  const cardStyle=isThoughtCard?`background:${p.surface};border:1px solid ${p.border};border-left:4px solid ${p.primary};border-radius:14px;box-shadow:0 10px 28px rgba(72,55,42,.07);`:`background:transparent;border:1px solid ${p.secondary};border-radius:10px;`;
  return `<section class="container container-${name}" style="display:block;width:auto;box-sizing:border-box;margin:1.4em 8px;padding:${isThoughtCard?'16px 18px':'.6em 14px'};${cardStyle}color:${p.text};font-size:15px;line-height:28px;letter-spacing:1px;text-align:justify;"><p style="margin:0 0 .4em;color:${p.primary};font-weight:650;letter-spacing:1.2px;text-align:left;">${icon}${esc(label)}</p>${content.map(line=>`<p style="margin:.4em 0;padding:0;color:${p.text};">${inline(line)}</p>`).join('')}</section>`;
}

function articleMap(markdown:string,p:Palette):string {
  const matches=[...markdown.matchAll(/^##\s+(.+)$/gm)];
  if(!matches.length)return '';
  const sections=matches.map((match,index)=>({title:match[1].replace(/[*_`]/g,''),chars:(markdown.slice((match.index||0)+match[0].length,matches[index+1]?.index??markdown.length).replace(/\s/g,'').length)}));
  const max=Math.max(1,...sections.map(item=>item.chars));
  const rows=sections.map((item,index)=>{const width=Math.max(8,Math.round(item.chars/max*100));return `<section style="margin:10px 0;"><p style="margin:0;padding:0;font-size:13px;color:#2b2b2b;line-height:1.6;letter-spacing:0;text-align:left;"><span style="color:${p.primary};font-weight:600;margin-right:8px;">${index+1}</span>${esc(item.title)}</p><section style="margin-top:4px;height:3px;background:rgba(0,0,0,.06);border-radius:2px;overflow:hidden;"><section style="width:${width}%;height:3px;background:linear-gradient(to right,${p.primary},${p.secondary});border-radius:2px;"><br/></section></section></section>`}).join('');
  return `<section class="article-map" style="margin:0 8px 1.6em;"><p style="margin:0 0 10px;color:${p.primary};font-size:12px;line-height:1.4;letter-spacing:2px;font-weight:600;">全文导航</p>${rows}</section>`;
}

function readingTime(markdown:string,author:string,avatar:string,p:Palette):string {
  const chars=markdown.replace(/```[\s\S]*?```/g,'').replace(/[#>*_`\[\]()!~+\-\s]/g,'').length;
  const minutes=Math.max(1,Math.ceil(chars/400)),fast=Math.max(1,Math.ceil(chars/800));
  const avatarHtml=avatar?`<img src="${esc(avatar)}" alt="${esc(author)}" style="box-sizing:border-box;width:60px;height:60px;display:inline-block;vertical-align:middle;border-radius:50%;object-fit:cover;"/>`:`<span style="display:inline-block;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,${p.primary},${p.secondary});vertical-align:middle;"></span>`;
  return `<section class="reading-time" style="text-align:center;margin:0 8px 1.6em;font-size:0;box-sizing:border-box;"><section style="display:inline-block;vertical-align:middle;padding:8px 5px;width:50%;box-sizing:border-box;text-align:center;border-right:1px solid ${p.time};">${avatarHtml}<p style="margin:6px 0 0;font-size:14px;color:${p.time};line-height:1.6;text-align:center;letter-spacing:0;">${esc(author||'作者')}</p></section><section style="display:inline-block;vertical-align:middle;padding:6px;width:50%;box-sizing:border-box;"><section style="border:1px solid ${p.time};padding:8px 5px;width:120px;max-width:100%;color:${p.time};border-radius:4px;margin:auto;line-height:20px;font-size:14px;text-align:center;"><p style="margin:0;color:${p.time};">读完需要</p><section style="font-size:30px;color:${p.time};line-height:32px;">${minutes}</section><span>分钟</span><p style="margin:0;font-size:11px;color:#aaa;padding-top:3px;">速读仅需 ${fast} 分钟</p></section></section></section>`;
}

function highlightCode(source:string):string {
  const token=/\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->|\/\/[^\n]*|(^|\n)\s*#[^\n]*|`(?:\\.|[^`])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:const|let|var|function|return|async|await|class|extends|import|from|export|default|if|else|for|while|switch|case|break|continue|try|catch|finally|throw|new|typeof|instanceof|in|of|true|false|null|undefined|interface|type|enum|public|private|protected|static|def|self|lambda|yield|with|as|pass|raise|package|func|struct|map|range|defer|go|select|SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|TABLE|VALUES|AND|OR|NOT)\b|\b(?:JSON|Math|Date|Promise|Array|Object|String|Number|Boolean|console|fetch|require|print|len)\b|\b(?:0x[\da-fA-F]+|\d+(?:\.\d+)?)\b/gm;
  let html='',last=0,match:RegExpExecArray|null;
  while((match=token.exec(source))){html+=esc(source.slice(last,match.index));const value=match[0];let style='color:#005cc5;';
    if(/^\s*(?:\/\/|\/\*|<!--|#)/.test(value))style='color:#6a737d;font-style:italic;';
    else if(/^[`"']/.test(value))style='color:#032f62;';
    else if(/^(?:JSON|Math|Date|Promise|Array|Object|String|Number|Boolean|console|fetch|require|print|len)$/.test(value))style='color:#6f42c1;';
    else if(!/^\d|^0x/i.test(value))style='color:#d73a49;font-weight:bold;';
    html+=`<span style="${style}font-family:inherit;">${esc(value)}</span>`;last=match.index+value.length;
  }
  html+=esc(source.slice(last));
  return html.replace(/ /g,'&nbsp;').replace(/\t/g,'&nbsp;&nbsp;').replace(/\r?\n/g,'<br>');
}

function officialCodeBlock(source:string,language:string):string {
  const lang=language||'text';
  return `<pre style="display:block;box-sizing:border-box;max-width:100%;color:#24292e;background:#fff;font-size:90%;line-height:1.5;margin:10px 8px;padding:0;border:1px solid rgba(0,0,0,.04);border-radius:8px;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;"><span class="mac-sign" style="display:flex;padding:10px 14px 0;"><svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="45" height="13" viewBox="0 0 450 130"><ellipse cx="50" cy="65" rx="50" ry="52" stroke="rgb(220,60,54)" stroke-width="2" fill="rgb(237,108,96)"></ellipse><ellipse cx="225" cy="65" rx="50" ry="52" stroke="rgb(218,151,33)" stroke-width="2" fill="rgb(247,193,81)"></ellipse><ellipse cx="400" cy="65" rx="50" ry="52" stroke="rgb(27,161,37)" stroke-width="2" fill="rgb(100,200,86)"></ellipse></svg></span><code class="hljs language-${esc(lang)}" style="display:-webkit-box;box-sizing:border-box;padding:.5em 1em 1em;margin:0;overflow-x:auto;overflow-y:hidden;color:inherit;background:none;white-space:nowrap;word-break:normal;overflow-wrap:normal;font-family:'Fira Code',Menlo,'Operator Mono',Consolas,Monaco,monospace;tab-size:2;"><span class="code-block__inner" style="display:block;">${highlightCode(source)}</span></code></pre>`;
}

function knbCodeBlock(source:string,language:string,dark:boolean):string {
  return `<section class="shiki ${dark?'github-dark':'github-light'}" style="margin:1em 8px;padding:0;background:${dark?'#24292e':'#f6f8fa'};border-radius:8px;overflow:hidden;color:${dark?'#e1e4e8':'#24292e'};box-sizing:border-box;"><section style="padding:.9em 1em .35em;overflow-x:auto;box-sizing:border-box;"><code data-language="${esc(language||'text')}" style="display:block;min-width:100%;background:transparent;color:inherit;padding:0;font-size:13px;line-height:19px;white-space:nowrap;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">${dark?esc(source).replace(/ /g,'&nbsp;').replace(/\r?\n/g,'<br>'):highlightCode(source)}</code></section></section>`;
}

function quietCodeBlock(source:string,language:string):string {
  return `<section class="quiet-code" style="margin:22px 0;padding:0;background:#eee9df;border:1px solid #d8d1c5;border-radius:10px;overflow:hidden;color:#2b2925;box-sizing:border-box;"><section style="display:flex;align-items:center;padding:9px 12px;border-bottom:1px solid #d8d1c5;color:#746f66;font-size:11px;line-height:1.2;letter-spacing:.12em;text-transform:uppercase;">${lucideIcon('code-2',14)}${esc(language||'text')}</section><section style="padding:13px 15px;overflow-x:auto;box-sizing:border-box;"><code data-language="${esc(language||'text')}" style="display:block;min-width:100%;padding:0;background:transparent;color:#2b2925;font-size:13px;line-height:20px;white-space:nowrap;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">${highlightCode(source)}</code></section></section>`;
}

function liquidGlassHighlight(source:string,dark:boolean):string {
  const highlighted=highlightCode(source);
  if(dark)return highlighted
    .replace(/#005cc5/g,'#78b7ff').replace(/#6a737d/g,'#9ba8bb')
    .replace(/#032f62/g,'#a8d8ff').replace(/#6f42c1/g,'#d3adff')
    .replace(/#d73a49/g,'#ff91a4');
  return highlighted
    .replace(/#005cc5/g,'#075cca').replace(/#6a737d/g,'#596579')
    .replace(/#032f62/g,'#174a78').replace(/#6f42c1/g,'#7041a8')
    .replace(/#d73a49/g,'#bc2945');
}

/**
 * Apple Liquid Glass 风格的发布安全版本。
 *
 * 微信发表阶段会移除 SVG filter 与 backdrop-filter，所以发布 HTML 只使用微信
 * 能保留的实体底色、渐变、圆角和阴影模拟玻璃。Obsidian 预览中的真实背景模糊
 * 由 styles.css 渐进增强，不进入复制的富文本结构。
 */
function liquidGlassCodeBlock(source:string,language:string,p:Palette,theme:string):string {
  const lang=language||'text',dark=theme==='studio-noir-index'||theme==='studio-chrome-future';
  const shell=dark?'#15212c':'#f7f5f2';
  const body=dark?'#101a24':'#fbfaf8';
  const text=dark?'#eef5ff':'#172033',muted=dark?'#aebbcf':'#647087';
  const divider=dark?'rgba(255,255,255,.11)':'rgba(55,72,91,.08)';
  const shadow=dark
    ? '0 16px 38px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.20),inset 0 -1px 0 rgba(255,255,255,.07)'
    : '0 16px 38px rgba(39,57,78,.13),inset 0 1px 0 rgba(255,255,255,.90),inset 0 -1px 0 rgba(255,255,255,.32)';
  const glass=dark
    ? `linear-gradient(135deg,#223442 0%,#15212c 48%,#1b2934 100%)`
    : `linear-gradient(135deg,#fffefd 0%,#f7f5f2 48%,#edf2f0 100%)`;
  return `<section class="studio-liquid-glass-code" style="display:block;box-sizing:border-box;margin:26px 8px 30px;border:0;border-radius:22px;background-color:${shell};background-image:${glass};box-shadow:${shadow};overflow:hidden;"><section style="display:block;box-sizing:border-box;min-height:38px;padding:5px 14px;border:0;border-bottom:1px solid ${divider};background-color:${dark?'#192631':'#f8f6f3'};font-size:0;line-height:0;"><span style="display:inline-block;box-sizing:border-box;width:70%;color:${text};vertical-align:middle;text-align:left;white-space:nowrap;line-height:28px;">${lucideIcon('code-2',15)}</span><span style="display:inline-block;box-sizing:border-box;width:30%;color:${muted};font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;font-weight:600;line-height:28px;letter-spacing:.04em;text-align:right;vertical-align:middle;white-space:nowrap;">${esc(lang)}</span></section><section style="display:block;padding:18px 19px 21px;border:0;background-color:${body};overflow-x:auto;-webkit-overflow-scrolling:touch;box-sizing:border-box;"><code data-language="${esc(lang)}" style="display:block;min-width:100%;padding:0;margin:0;background:transparent;color:${text};font-size:15px;font-weight:560;line-height:25px;letter-spacing:.006em;white-space:nowrap;word-break:normal;overflow-wrap:normal;font-family:'SFMono-Regular','SF Mono','JetBrains Mono','Fira Code',Menlo,Consolas,monospace;tab-size:2;">${liquidGlassHighlight(source,dark)}</code></section></section>`;
}

function renderLayout(name: string, raw: string, p: Palette, opener = ''): string {
  if(KNB_CONTAINERS.includes(name))return renderKnbContainer(name,raw,p);
  const fields: Record<string,string> = {};
  const body: string[] = [];
  const rows: string[][] = [];
  for (const line of raw.trim().split(/\r?\n/)) {
    const m = line.match(/^([\w-]+)\s*:\s*(.+)$/);
    if (line.includes('|')) rows.push(line.split('|').map(v=>v.trim()).filter(Boolean));
    else if (m) fields[m[1]] = m[2]; else body.push(line);
  }
  const caption = opener.match(/\[([^\]]+)\]/)?.[1] || '';
  const title = fields.title || fields.heading || fields.label || caption || name.replace(/-/g,' ');
  const eyebrow = fields.eyebrow || fields.kicker || '';
  const fieldRows = Object.entries(fields).filter(([k]) => !['title','heading','label','eyebrow','kicker'].includes(k))
    .map(([k,v]) => `<div style="display:flex;gap:10px;margin:6px 0;"><b style="min-width:82px;color:${p.primary};">${esc(k)}</b><span>${inline(v)}</span></div>`).join('');
  const bodyHtml = body.filter(Boolean).map(v => `<p style="margin:8px 0;">${inline(v)}</p>`).join('');
  const rowHtml = rows.map((row,index)=>`<section style="display:flex;gap:12px;align-items:flex-start;padding:10px 0;${index?`border-top:1px solid ${p.border};`:''}">${row.map((cell,column)=>`<p style="margin:0;flex:${column?'2':'1'};${column?'':`color:${p.primary};font-weight:700;`}">${inline(cell)}</p>`).join('')}</section>`).join('');
  const visual = ['hero','verdict','cta','subscribe','quote-card','callout','notice'].includes(name)
    ? `background:linear-gradient(135deg,${p.secondary},${p.surface});border-top:4px solid ${p.primary};text-align:${name==='hero'?'center':'left'};`
    : ['metrics','stat-row','pricing','compare','comparison-table','specs','matrix'].includes(name)
      ? `background:${p.surface};border-top:3px solid ${p.primary};`
      : `background:${p.surface};border-left:5px solid ${p.primary};`;
  return `<section data-md2wechat-layout="${esc(name)}" style="margin:22px 0;padding:20px;border:1px solid ${p.border};border-left:5px solid ${p.primary};border-radius:12px;background:${p.surface};box-shadow:0 6px 20px rgba(15,23,42,.06);">
    ${eyebrow ? `<div style="font-size:12px;letter-spacing:2px;color:${p.primary};font-weight:700;text-transform:uppercase;">${inline(eyebrow)}</div>` : ''}
    <div style="font-size:20px;line-height:1.35;font-weight:800;color:${p.text};margin:${eyebrow?'7px':'0'} 0 10px;">${inline(title)}</div>
    ${fieldRows}${rowHtml}${bodyHtml}</section>`.replace(`background:${p.surface};box-shadow`,`${visual}box-shadow`);
}

function renderTable(lines: string[], p: Palette): string {
  const rows = lines.map(line => line.trim().replace(/^\||\|$/g,'').split('|').map(v=>v.trim()));
  if (rows.length > 1 && rows[1].every(v => /^:?-{3,}:?$/.test(v))) rows.splice(1,1);
  return `<table style="width:100%;border-collapse:collapse;margin:18px 0;font-size:14px;">${rows.map((row,i)=>`<tr>${row.map(cell=>`<${i===0?'th':'td'} style="padding:9px;border:1px solid ${p.border};background:${i===0?p.secondary:p.surface};text-align:left;">${inline(cell)}</${i===0?'th':'td'}>`).join('')}</tr>`).join('')}</table>`;
}

export function renderMarkdown(markdown: string, options: RenderOptions): RenderResult {
  const p = paletteFor(options.theme);
  const official = elementStyles(options.theme, p);
  const isKnb=options.theme.startsWith('knb-');
  const isStudio=options.theme.startsWith('studio-');
  const isQuiet=options.theme==='quiet-intelligence';
  const parsed = stripFrontmatter(markdown);
  const metadata = parsed.metadata;
  const warnings: string[] = [];
  const layouts: string[] = [];
  const localImages: string[] = [];
  const footnotes:Array<[string,string]>=[];
  const bodyWithoutFootnotes=parsed.body.replace(/^\[\^([^\]]+)\]:\s*(.+)$/gm,(_m,id,text)=>{footnotes.push([id,text]);return '';});
  const lines = bodyWithoutFootnotes.replace(/\r\n/g,'\n').split('\n');
  const chunks: string[] = [];
  let i = 0;
  let h2Index=0;let h3Index=0;
  const totalH2=Math.max(1,(bodyWithoutFootnotes.match(/^##\s+/gm)||[]).length);
  let listType = '';
  const closeList = () => { if (listType) { chunks.push(`</${listType}>`); listType = ''; } };
  while (i < lines.length) {
    const line = lines[i];
    if(/^\[TOC\]\s*$/.test(line)) { closeList();chunks.push(articleMap(bodyWithoutFootnotes,p));i++;continue; }
    const layoutStart = line.match(/^:::\s*([\w-]+)(.*?)\s*$/);
    if (layoutStart) {
      closeList();
      const body: string[] = []; i++;
      while (i < lines.length && lines[i].trim() !== ':::') body.push(lines[i++]);
      if (i >= lines.length) warnings.push(`布局 ${layoutStart[1]} 缺少结束 :::`); else i++;
      layouts.push(layoutStart[1]);
      if (!LAYOUTS.includes(layoutStart[1])) warnings.push(`未知布局模块：${layoutStart[1]}`);
      chunks.push(renderLayout(layoutStart[1], body.join('\n'), p, layoutStart[2] || ''));
      continue;
    }
    if (/^```/.test(line)) {
      closeList(); const language = line.slice(3).trim(); const code: string[]=[]; i++;
      while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++]);
      if (i < lines.length) i++;
      const dark=(options.codeTheme||'github-dark')==='github-dark';
      chunks.push(isQuiet||isStudio?liquidGlassCodeBlock(code.join('\n'),language,p,options.theme):isKnb?knbCodeBlock(code.join('\n'),language,dark):officialCodeBlock(code.join('\n'),language));
      continue;
    }
    // 独占一行的图片必须作为顶层块输出。若将 section 放入 p，浏览器和微信富文本
    // 清洗器会修复这段非法嵌套，并在图片前后补出可编辑的空段落。
    if(/^\s*(?:!\[\[[^\]]+\]\]|!\[[^\]]*\]\([^)]*\))\s*$/.test(line)){
      closeList();chunks.push(inline(line.trim()));i++;continue;
    }
    if (line.includes('|') && i+1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i+1])) {
      closeList(); const table=[line,lines[i+1]]; i+=2;
      while(i<lines.length && lines[i].includes('|') && lines[i].trim()) table.push(lines[i++]);
      chunks.push(renderTable(table,p)); continue;
    }
    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      closeList(); const level=h[1].length;
      if (!metadata.title && level===1) metadata.title = h[2].replace(/[*_`]/g,'');
      if(isQuiet){
        if(level===1){chunks.push(`<section style="margin:22px 0 38px;padding:0;"><p style="margin:0 0 11px;color:#b85e42;font-size:11px;line-height:1.4;font-weight:700;letter-spacing:.18em;text-transform:uppercase;">Quiet Intelligence</p><section style="width:54px;height:2px;margin:0 0 18px;background:#d97757;border-radius:2px;"><br/></section><h1 style="margin:0;color:#25231f;font-size:30px;line-height:1.25;font-weight:700;letter-spacing:-.035em;">${inline(h[2])}</h1></section>`);i++;continue;}
        if(level===2){h2Index++;h3Index=0;chunks.push(`<section style="margin:42px 0 18px;padding:0 0 12px;border-bottom:1px solid #d8d1c5;"><p style="margin:0 0 5px;color:#d97757;font-size:12px;line-height:1.3;font-weight:700;letter-spacing:.14em;">${String(h2Index).padStart(2,'0')}</p><h2 style="margin:0;color:#25231f;font-size:23px;line-height:1.32;font-weight:700;letter-spacing:-.025em;">${inline(h[2])}</h2></section>`);i++;continue;}
        if(level===3){h3Index++;chunks.push(`<h3 style="margin:28px 0 12px;padding-left:12px;color:#4a4039;border-left:3px solid #d97757;font-size:18px;line-height:1.45;font-weight:700;">${inline(h[2])}</h3>`);i++;continue;}
      }
      if(isKnb){
        const weight=options.fontWeight==='light'?500:options.fontWeight==='bold'?700:600;
        if(level===1){chunks.push(`<h1 style="margin:1.6em 8px 1em;color:${p.primary};font-size:22px;font-weight:300;text-align:center;line-height:1.5;border:0;"><strong style="color:${p.primary};font-weight:${weight};margin-right:8px;">/</strong>${inline(h[2])}<strong style="color:${p.primary};font-weight:${weight};margin-left:8px;">/</strong></h1>`);i++;continue;}
        if(level===2){h2Index++;h3Index=0;const progress=Math.round(h2Index/totalH2*100);const marker=options.headingStyle==='none'?'':options.headingStyle==='eyes'?`<p style="margin:1.6em 8px -.1em;color:${p.primary};font-size:18px;font-weight:${weight};">${lucideIcon('eye',18)}</p>`:`<p style="margin:1.6em 8px .4em;color:${p.primary};font-weight:${weight};font-size:22px;font-style:italic;line-height:1.2;">${h2Index}</p>`;chunks.push(`${marker}<h2 style="margin:0 8px;padding:0;line-height:9px;min-height:9px;border-radius:10px;background:linear-gradient(to right,${p.primary} ${progress}%,${p.secondary} ${progress}%);font-size:0;border:0;">&nbsp;</h2><p style="margin:.6em 8px 1em;color:#3e3e3e;font-size:20px;font-weight:${weight};line-height:1.5;">${inline(h[2])}</p>`);i++;continue;}
        if(level===3){h3Index++;const marker=options.headingStyle==='numbers'?`<p style="margin:1.4em 8px .3em;color:${p.accent};font-weight:${weight};font-style:italic;font-size:18px;line-height:1.2;">${Math.max(h2Index,1)}.${h3Index}</p>`:'';chunks.push(`${marker}<h3 style="margin:0 8px;padding:0;line-height:5px;min-height:5px;border-radius:10px;background:linear-gradient(to right,${p.accent},${p.secondary});font-size:0;border:0;">&nbsp;</h3><p style="margin:.6em 8px .8em;color:#3e3e3e;font-size:18px;font-weight:${weight};line-height:1.5;">${inline(h[2])}</p>`);i++;continue;}
      }
      const sizes=[28,22,18,17,16,15];
      const headingStyle = level <= 2 ? official.heading : `margin:28px 0 16px;font-size:${sizes[level-1]}px;line-height:1.45;font-weight:650;color:${p.primary};font-family:${official.font};`;
      chunks.push(`<h${level} style="${headingStyle}${level===1?`font-size:${sizes[0]}px;`:''}">${inline(h[2])}</h${level}>`);
      i++; continue;
    }
    const ul = line.match(/^\s*[-*+]\s+(.+)$/); const ol = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (ul || ol) {
      const type = ul ? 'ul':'ol'; if (listType !== type) { closeList(); listType=type; chunks.push(`<${type} style="margin:${isKnb?'1em 8px':'14px 0'};padding-left:${isKnb?'2em':'24px'};color:${p.primary};list-style-type:${type==='ul'?'disc':'decimal'};">`); }
      chunks.push(`<li style="margin:${isKnb?'.4em 0':'7px 0'};line-height:${isKnb?'28px':'1.8'};"><span style="color:${p.text};">${inline((ul||ol)![1])}</span></li>`); i++; continue;
    }
    closeList();
    if (/^>\s?/.test(line)) {
      const q: string[]=[]; while(i<lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/,''));
      chunks.push(`<blockquote style="${official.quote}">${isQuiet?`<p style="margin:0 0 8px;color:#d97757;line-height:1;">${lucideIcon('quote',18)}</p>`:''}${q.map(v=>`<p style="margin:5px 0;color:inherit;">${inline(v)}</p>`).join('')}</blockquote>`); continue;
    }
    if (/^\s*([-*_])\1\1+\s*$/.test(line)) { chunks.push(`<hr style="border:0;border-top:1px solid ${isKnb?p.primary:p.border};margin:${isKnb?'2em 8px':'28px 0'};" />`); i++; continue; }
    if (!line.trim()) { i++; continue; }
    const para=[line]; i++;
    while(i<lines.length && lines[i].trim() && !/^(#{1,6})\s|^:::|^```|^>\s?|^\s*[-*+]\s+|^\s*\d+[.)]\s+/.test(lines[i])) para.push(lines[i++]);
    chunks.push(`<p style="${official.paragraph}">${inline(para.join('\n')).replace(/\n/g,'<br/>')}</p>`);
  }
  closeList();
  if(footnotes.length)chunks.push(`<section class="knb-footnotes" style="margin:1.8em 8px 0;padding-top:.75em;border-top:1px solid ${p.primary};color:#2b2b2b;font-size:13px;line-height:24px;letter-spacing:1px;">${footnotes.map(([id,text])=>`<p style="margin:.35em 0;"><span style="display:inline-block;margin-right:.45em;color:${p.primary};font-weight:600;">[${esc(id)}]</span>${inline(text)}</p>`).join('')}</section>`);
  const imagePattern = /!\[[^\]]*\]\(([^)\s]+)[^)]*\)/g; let m: RegExpExecArray | null;
  while ((m=imagePattern.exec(parsed.body))) if (!/^https?:\/\//i.test(m[1])) localImages.push(m[1]);
  const wikiImagePattern=/!\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;while((m=wikiImagePattern.exec(parsed.body)))localImages.push(m[1]);
  if (!metadata.title) metadata.title = '未命名文章';
  if (!metadata.digest) metadata.digest = parsed.body.replace(/[#>*_`\[\]()!-]/g,' ').replace(/\s+/g,' ').trim().slice(0,120);
  const fs = options.fontSize === 'small' ? 14 : options.fontSize === 'large' ? 16 : 15;
  const bg = options.backgroundType === 'grid'
    ? `background-color:${p.background};background-image:linear-gradient(${p.border}55 1px,transparent 1px),linear-gradient(90deg,${p.border}55 1px,transparent 1px);background-size:22px 22px;`
    : `background:${options.backgroundType==='none'?p.surface:p.background};`;
  const weight=options.fontWeight==='light'?300:options.fontWeight==='bold'?500:400;
  const before=options.includeReadingTime?readingTime(parsed.body,options.author||metadata.author,options.avatar||'',p):'';
  // 微信正式发布会清除 CSS 自定义变量。生成阶段直接展开颜色值，避免
  // 编辑器里正常、发布后链接/加粗/高亮/行内代码等样式集体失效。
  let publishSafeContent=compactWechatPublishHtml(lockWechatPublishFonts(`${before}${chunks.join('')}`
    .replace(/var\(--md2w-primary\)/g,p.primary)
    .replace(/var\(--md2w-secondary\)/g,p.secondary)
    .replace(/var\(--md2w-time\)/g,p.time)
    .replace(/var\(--md2w-mark\)/g,p.secondary),official.font));
  if(isQuiet)publishSafeContent=publishSafeContent.replace(/box-shadow:0 8px 22px rgba\(15,23,42,\.12\)/g,'box-shadow:0 18px 45px rgba(72,55,42,.12),0 3px 10px rgba(72,55,42,.06)');
  const html = `<section data-md2wechat-local="true" data-theme="${esc(options.theme)}" style="${bg}box-sizing:border-box;max-width:680px;width:100%;margin:0 auto;padding:16px;color:${p.text};font-family:${official.font};font-size:${fs}px;line-height:${isKnb?'28px':'1.75'};font-weight:${weight};letter-spacing:${isKnb?'1px':'normal'};word-break:break-all;border-radius:12px;">${publishSafeContent}</section>`;
  return {html,metadata,layouts:Array.from(new Set(layouts)),warnings,localImages:Array.from(new Set(localImages))};
}

export function inspectMarkdown(markdown: string): Record<string, unknown> {
  const result = renderMarkdown(markdown,{theme:'default',fontSize:'medium',backgroundType:'none'});
  const headings = (markdown.match(/^#{1,6}\s+.+$/gm)||[]).length;
  const images = (markdown.match(/!\[[^\]]*\]\([^)]+\)/g)||[]).length;
  const links = (markdown.match(/(?<!!)\[[^\]]+\]\([^)]+\)/g)||[]).length;
  return {
    metadata: result.metadata,
    statistics: {characters:markdown.length,words:markdown.trim().split(/\s+/).filter(Boolean).length,headings,images,links},
    layouts: result.layouts,
    warnings: result.warnings,
    readiness: {
      preview: markdown.trim().length > 0,
      export: markdown.trim().length > 0,
      draft: Boolean(result.metadata.title && result.metadata.cover),
      blockers: [!result.metadata.title?'缺少标题':'',!result.metadata.cover?'缺少 cover frontmatter':''].filter(Boolean)
    }
  };
}
