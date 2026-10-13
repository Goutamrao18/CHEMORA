(function(){
"use strict";
const KEY="chemoraChallengeState";
const $=id=>document.getElementById(id);
function readState(){
  try{
    const s=JSON.parse(localStorage.getItem(KEY)||"null");
    if(!s||typeof s!=="object")return {levels:[],xp:0,answers:0,correct:0,levelResults:{},rewards:[]};
    return {...s,levels:Array.isArray(s.levels)?s.levels.filter(n=>Number.isInteger(n)&&n>=1&&n<=100):[],levelResults:s.levelResults&&typeof s.levelResults==="object"?s.levelResults:{},rewards:Array.isArray(s.rewards)?s.rewards:[],xp:Math.max(0,Number(s.xp)||0),answers:Math.max(0,Number(s.answers)||0),correct:Math.max(0,Number(s.correct)||0)};
  }catch(e){return {levels:[],xp:0,answers:0,correct:0,levelResults:{},rewards:[]};}
}
function safeText(tag,text,className){const el=document.createElement(tag);el.textContent=String(text);if(className)el.className=className;return el;}
function empty(container,msg){container.replaceChildren(safeText("p",msg,"empty-state"));}
function fmtDate(value){const n=Number(value);if(!Number.isFinite(n)||n<=0)return "Date unavailable";try{return new Date(n).toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"});}catch(e){return "Date unavailable";}}
async function getLevelData(level){
  const paths=[`challenge/data/level-${String(level).padStart(3,"0")}.json`];
  for(const path of paths){try{const res=await fetch(path);if(res.ok){const data=await res.json();return Array.isArray(data)?data:(data.questions||data.items||[]);}}catch(e){}}
  return [];
}
async function loadTopics(state){
  const topics={};
  const ids=[...new Set([...state.levels,...Object.keys(state.levelResults).map(Number).filter(n=>Number.isInteger(n)&&n>=1&&n<=100)])].sort((a,b)=>a-b);
  // Limit concurrency so older phones and static hosts are not flooded with 100 fetches.
  for(let offset=0;offset<ids.length;offset+=6){
    const batch=ids.slice(offset,offset+6);
    await Promise.all(batch.map(async level=>{
      const qs=await getLevelData(level);if(!qs.length)return;
      const result=state.levelResults[String(level)]||{};
      const answered=Math.max(0,Number(result.correct)||0)+Math.max(0,Number(result.wrong)||0);
      const accuracy=answered?Number(result.correct||0)/answered*100:null;
      const counts={};
      qs.forEach(q=>{const t=String(q.topic||"General chemistry").trim()||"General chemistry";counts[t]=(counts[t]||0)+1;});
      Object.entries(counts).forEach(([topic,count])=>{
        const item=topics[topic]||(topics[topic]={levels:0,questions:0,accuracySum:0,accuracyCount:0});
        item.levels++;item.questions+=count;
        if(accuracy!==null){item.accuracySum+=accuracy;item.accuracyCount++;}
      });
    }));
  }
  return topics;
}
function renderTopics(topics){
  const root=$("topicStrengths");root.replaceChildren();
  const rows=Object.entries(topics).map(([name,v])=>({...v,name,accuracy:v.accuracyCount?v.accuracySum/v.accuracyCount:null})).sort((a,b)=>(b.accuracy??-1)-(a.accuracy??-1)||b.levels-a.levels);
  if(!rows.length){empty(root,"Complete a challenge level to start building your topic strengths.");return rows;}
  rows.slice(0,8).forEach(t=>{
    const row=document.createElement("div");const top=document.createElement("div");top.className="topic-row-top";
    top.append(safeText("strong",t.name),safeText("span",t.accuracy===null?"Developing":Math.round(t.accuracy)+"%"));
    const track=document.createElement("div");track.className="topic-track";const fill=document.createElement("i");fill.style.width=(t.accuracy===null?Math.min(35,t.levels*12):Math.max(4,Math.min(100,t.accuracy)))+"%";track.append(fill);
    row.append(top,track,safeText("div",`${t.levels} level${t.levels===1?"":"s"} represented · ${t.accuracyCount?"best recorded level results":"no scored result yet"}`,"topic-meta"));root.append(row);
  });
  return rows;
}
function renderRecommendations(topics,state){
  const root=$("recommendations");root.replaceChildren();
  const all=Object.entries(topics).map(([name,v])=>({...v,name,accuracy:v.accuracyCount?v.accuracySum/v.accuracyCount:null}));
  const weak=all.filter(t=>t.accuracy!==null).sort((a,b)=>a.accuracy-b.accuracy)[0];
  const completed=state.levels.length;
  const items=[];
  if(weak&&weak.accuracy<85)items.push({icon:"↻",title:`Revisit ${weak.name}`,body:`Your recorded results average ${Math.round(weak.accuracy)}% across represented levels. Re-read explanations, then retry related questions.`});
  if(completed<100){const next=completed?Math.min(100,Math.max(...state.levels)+1):1;items.push({icon:"→",title:`Continue to Level ${next}`,body:completed?`You have completed ${completed} of 100 levels. Keep progressing to unlock new challenge material.`:"Start Level 1 to establish your first score and unlock the learning dashboard."});}
  if(!weak||weak.accuracy>=85)items.push({icon:"✦",title:"Keep your foundations sharp",body:"Review explanations after every answer, even when correct, and aim for 8/10 or better on new levels."});
  items.push({icon:"◎",title:"Build a consistent practice habit",body:"Short, regular sessions make it easier to remember concepts. Your best result for each level is tracked here."});
  items.slice(0,3).forEach(item=>{const el=document.createElement("div");el.className="recommendation";el.append(safeText("div",item.icon,"recommendation-icon"));const body=document.createElement("div");body.append(safeText("h3",item.title),safeText("p",item.body));el.append(body);root.append(el);});
}
function renderHistory(state){
  const root=$("levelHistory");root.replaceChildren();
  const results=Object.entries(state.levelResults).map(([level,r])=>({level:Number(level),...(r||{})})).filter(r=>Number.isInteger(r.level)&&r.level>=1&&r.level<=100).sort((a,b)=>(Number(b.earnedAt)||0)-(Number(a.earnedAt)||0)).slice(0,10);
  if(!results.length){empty(root,"No recorded level results yet. Finish a challenge level and your best result will appear here.");return;}
  const wrap=document.createElement("div");wrap.style.overflowX="auto";const table=document.createElement("table");table.className="history-table";
  const thead=document.createElement("thead"),hr=document.createElement("tr");["Level","Best score","XP recorded","Last improved"].forEach(t=>hr.append(safeText("th",t)));thead.append(hr);table.append(thead);
  const tbody=document.createElement("tbody");
  results.forEach(r=>{const tr=document.createElement("tr");tr.append(safeText("td",`Level ${r.level}`),document.createElement("td"),safeText("td",`+${Math.max(0,Number(r.xp)||0)} XP`),safeText("td",fmtDate(r.earnedAt)));const pill=document.createElement("span");pill.className="result-pill";pill.textContent=`${Math.max(0,Number(r.correct)||0)}/10`;tr.children[1].append(pill);tbody.append(tr);});
  table.append(tbody);wrap.append(table);root.append(wrap);
}
async function render(){
  const state=readState();const done=new Set(state.levels).size;
  $("levelsCompleted").textContent=`${done}/100`; $("levelsBar").style.width=Math.min(100,done)+"%";
  $("totalXp").textContent=state.xp.toLocaleString();$("questionsAnswered").textContent=state.answers.toLocaleString();
  const accuracy=state.answers?Math.round(state.correct/state.answers*100):null;
  $("overallAccuracy").textContent=accuracy===null?"—":accuracy+"%";
  $("accuracyCaption").textContent=accuracy===null?"Answer more questions to establish a baseline":`${state.correct.toLocaleString()} correct out of ${state.answers.toLocaleString()} answers`;
  $("refreshProgress").disabled=true;$("refreshProgress").textContent="Refreshing…";
  try{const topics=await loadTopics(state);const rows=renderTopics(topics);renderRecommendations(topics,state);renderHistory(state);if(!rows.length){}}
  catch(e){empty($("topicStrengths"),"Topic data could not be loaded. Check your connection and refresh.");renderRecommendations({},state);renderHistory(state);}
  finally{$("refreshProgress").disabled=false;$("refreshProgress").textContent="Refresh progress";}
}
$("refreshProgress").addEventListener("click",render);
window.addEventListener("storage",e=>{if(!e.key||e.key===KEY)render();});
window.addEventListener("chemora:progress",render);
render();
})();