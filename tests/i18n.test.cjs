const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'i18n.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function boot(saved,language='en-US',blocked=false){
 const storage=new Map(saved?[['crochet-language',saved]]:[]);
 const c={navigator:{language},localStorage:{getItem:k=>{if(blocked)throw Error();return storage.get(k);},setItem:(k,v)=>{if(blocked)throw Error();storage.set(k,v);}},window:{}};
 vm.createContext(c);vm.runInContext(source,c);return {i:c.window.CrochetI18n,storage};
}
const en=boot();assert.equal(en.i.language,'en');assert.equal(en.i.t('작품 이름'),'Project name');
assert.equal(en.i.t('작품 {0}개를 불러왔습니다',4),'Imported 4 projects.');
assert.equal(en.i.t('{0}일',1),'1 day');
const name='파란 가방 <test>';assert.equal(en.i.t('{0} · {1} 기록했습니다',name,'4mm'),`Saved ${name} · 4mm`);
en.i.setLanguage('ko');assert.equal(en.i.t('작품 이름'),'작품 이름');assert.equal(en.storage.get('crochet-language'),'ko');
assert.equal(boot('en','ko-KR').i.language,'en');assert.equal(boot(undefined,'ko-KR').i.language,'ko');assert.equal(boot(undefined,'ko-KR',true).i.language,'ko');
const api=boot().i;
const keys=[...html.matchAll(/\bt\("([^"\n]+)"/g),...html.matchAll(/data-i18n(?:-placeholder|-alt)?="([^"\n]+)"/g)].map(m=>m[1]);
for(const key of keys){assert.notEqual(api.t(key),key,`Missing English translation: ${key}`);assert.ok(!/[가-힣]/.test(api.t(key)),`Korean remains in English label: ${key}`);}
const inline=html.split('<script>\n')[1].split('</script>')[0];new vm.Script(inline);
assert.match(inline,/indexedDB.open\("knitlog", 1\)/);assert.match(inline,/app: "knit-log", version: 1/);
const ko=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'))),eng=JSON.parse(fs.readFileSync(path.join(root,'manifest.en.webmanifest')));
assert.equal(ko.id,eng.id);assert.equal(ko.start_url,eng.start_url);
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');for(const f of ['i18n.js','manifest.en.webmanifest'])assert.ok(sw.includes('"'+f+'"'));
console.log(`PASS: ${new Set(keys).size} translation keys, language persistence/fallback, unchanged user text, syntax, storage/backup compatibility, shared app identity and offline dependencies`);

// Exercise the photo-add event callback so the clicked button cannot shadow t().
const wiring=inline.slice(inline.indexOf('document.addEventListener("click", e => {'),inline.indexOf('$("#tabActive").onclick'));
let clickHandler, photoTask, message;
const eventContext={document:{addEventListener:(type,fn)=>{clickHandler=fn;}},
 t:api.t, detailing:{id:'test-project'}, addPhotos:async()=>{},
 renderDetailPhotos:async()=>{}, render:()=>{}, toast:value=>{message=value;},
 pickPhotos:fn=>{photoTask=fn([]);}};
vm.runInNewContext(wiring,eventContext);
clickHandler({target:{closest:()=>({id:'detailAddPhoto',dataset:{},hasAttribute:()=>false})}});
photoTask.then(()=>{assert.equal(message,'Photos added.');console.log('PASS: translated photo-add notification');}).catch(error=>{console.error(error);process.exitCode=1;});

// Exercise the real save path with an old project and optional material fields.
const saveCode = inline.slice(inline.indexOf('async function saveEdit()'), inline.indexOf('function upsertLocal'));
const urlCode = inline.slice(inline.indexOf('function safePatternUrl('), inline.indexOf('const fmtMm'));
const fields = {
  '#nameIn': {value:'Test bag', focus(){}}, '#noteIn': {value:'original note'},
  '#craftIn': {value:'crochet'}, '#yarnIn': {value:' Cotton '}, '#colorIn': {value:' Blue '},
  '#patternIn': {value:'https://example.com/pattern', focus(){}},
  '#editDlg': {close(){}}, '#doneAtIn': {value:'2026-01-01'}, '#mmCustom': {focus(){}}
};
let saved, warning;
const saveContext = {URL, Date, Number, $, editing:{id:'old',status:'active',createdAt:1,custom:'keep'},
  readMm:()=>4, putProject:async p=>{saved=p;}, upsertLocal:()=>{}, render:()=>{},
  toast:msg=>{warning=msg;}, t:(key,...args)=>api.t(key,...args), mmText:String};
function $(key){return fields[key];}
vm.runInNewContext(`${urlCode}\n${saveCode}\nthis.saveEdit = saveEdit;`,saveContext);
(async()=>{
  await saveContext.saveEdit();
  assert.equal(saved.craft,'crochet');
  assert.equal(saved.yarn,'Cotton'); assert.equal(saved.color,'Blue');
  assert.equal(saved.patternUrl,'https://example.com/pattern');
  assert.equal(saved.custom,'keep'); assert.equal(saved.id,'old');
  const restored=JSON.parse(JSON.stringify({app:'knit-log',version:1,projects:[saved]}));
  assert.equal(restored.projects[0].yarn,'Cotton'); assert.equal(restored.projects[0].patternUrl,saved.patternUrl);
  fields['#craftIn'].value='knitting'; await saveContext.saveEdit();
  assert.equal(saved.craft,'knitting');
  saved=undefined; fields['#patternIn'].value='javascript:alert(1)'; await saveContext.saveEdit();
  assert.equal(saved,undefined); assert.match(warning,/http/);
  console.log('PASS: existing project fields preserved, materials saved and serialized, unsafe link rejected');
})().catch(error=>{console.error(error);process.exitCode=1;});

// Removing examples must leave ordinary projects and their photos alone.
const removeCode=inline.slice(inline.indexOf('async function removeExamples()'),inline.indexOf('/* ---------- photos ---------- */'));
const deleted={projects:[],photos:[],fulls:[]};
const removalContext={projects:[{id:'sample',example:true},{id:'real'}],
  photos:[{id:'sample-photo',projectId:'sample'},{id:'real-photo',projectId:'real'}],
  Set,confirm:()=>true,t:key=>key,toast:()=>{},loadAll:async()=>{},render:()=>{},
  run:async(_stores,_mode,fn)=>fn({objectStore:name=>({delete:id=>deleted[name].push(id)})})};
vm.runInNewContext(`${removeCode}\nthis.removeExamples=removeExamples;`,removalContext);
removalContext.removeExamples().then(()=>{
  assert.deepEqual(deleted,{projects:['sample'],photos:['sample-photo'],fulls:['sample-photo']});
  console.log('PASS: removing examples preserves real projects and photos');
}).catch(error=>{console.error(error);process.exitCode=1;});
