const KEY="12weekfocus.v1";
const DAYS=["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
const state=load();
let currentView="dashboard";

function blank(){
  const now=new Date(); const start=toISODate(now);
  return {version:1, theme:"light", cycle:{name:"Мой 12-недельный цикл",start,why:"",vision:""},goals:[],weeks:Array.from({length:12},(_,i)=>({number:i+1,actions:[],review:{worked:"",change:"",win:""}})),settings:{weekStartsMonday:true}};
}
function load(){try{const x=JSON.parse(localStorage.getItem(KEY));return x||blank()}catch{return blank()}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));render();showToast("Сохранено")}
function toISODate(d){return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)}
function dateObj(s){return new Date(s+"T00:00:00")}
function addDays(s,n){const d=dateObj(s);d.setDate(d.getDate()+n);return toISODate(d)}
function diffDays(a,b){return Math.floor((dateObj(b)-dateObj(a))/86400000)}
function weekIndex(){
  const diff=diffDays(state.cycle.start,toISODate(new Date()));
  return Math.max(0,Math.min(11,Math.floor(diff/7)));
}
function cycleEnd(){return addDays(state.cycle.start,83)}
function esc(s=""){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function allActions(){return state.weeks.flatMap(w=>w.actions)}
function weekScore(i){
  const a=state.weeks[i]?.actions||[]; if(!a.length)return null;
  return Math.round(a.filter(x=>x.done).length/a.length*100);
}
function cycleScore(){
  const scores=state.weeks.map((_,i)=>weekScore(i)).filter(x=>x!==null);
  return scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):0;
}
function goalProgress(g){
  const a=state.weeks.flatMap(w=>w.actions).filter(x=>x.goalId===g.id);
  return a.length?Math.round(a.filter(x=>x.done).length/a.length*100):0;
}
function currentWeekActions(){return state.weeks[weekIndex()].actions}
function nav(){
  document.querySelectorAll("#nav button").forEach(b=>b.onclick=()=>setView(b.dataset.view));
  document.getElementById("themeBtn").onclick=()=>{state.theme=state.theme==="dark"?"light":"dark";applyTheme();save()};
  document.getElementById("quickAdd").onclick=()=>openActionModal();
  document.getElementById("menuBtn").onclick=()=>document.querySelector(".sidebar").classList.toggle("open");
}
function setView(v){currentView=v;document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));document.getElementById(v).classList.add("active");document.querySelectorAll("#nav button").forEach(x=>x.classList.toggle("active",x.dataset.view===v));document.getElementById("pageTitle").textContent={dashboard:"Обзор",week:"Эта неделя",plan:"План 12 недель",goals:"Цели",review:"Разбор",settings:"Настройки"}[v];render();window.scrollTo(0,0);document.querySelector(".sidebar").classList.remove("open")}
function applyTheme(){document.body.classList.toggle("dark",state.theme==="dark")}
function render(){applyTheme();renderDashboard();renderWeek();renderPlan();renderGoals();renderReview();renderSettings()}
function renderDashboard(){
 const wi=weekIndex(), score=weekScore(wi), a=currentWeekActions(), done=a.filter(x=>x.done).length;
 const daysLeft=Math.max(0,diffDays(toISODate(new Date()),cycleEnd())+1);
 document.getElementById("dashboard").innerHTML=`
 <div class="hero"><div><div class="eyebrow">12 WEEK FOCUS</div><h1>${esc(state.cycle.name)}</h1><div class="muted">Неделя ${wi+1} из 12 · ${daysLeft} дн. осталось</div></div><div class="hero-actions"><button class="secondary" onclick="setView('plan')">План цикла</button><button class="primary" onclick="openActionModal()">+ Добавить действие</button></div></div>
 <div class="grid grid-4">
  <div class="card"><div class="stat">${score===null?"—":score+"%"}</div><div class="stat-label">Исполнение этой недели</div></div>
  <div class="card"><div class="stat">${cycleScore()}%</div><div class="stat-label">Средний score цикла</div></div>
  <div class="card"><div class="stat">${done}/${a.length}</div><div class="stat-label">Действий выполнено</div></div>
  <div class="card"><div class="stat">${state.goals.length}</div><div class="stat-label">Активных целей</div></div>
 </div>
 <div class="grid grid-2" style="margin-top:16px">
  <div class="card"><div class="section-title" style="margin:0 0 12px"><h3>Фокус недели</h3><button class="link-btn" onclick="setView('week')">Открыть →</button></div>
    ${a.length? a.slice(0,6).map(taskHTML).join(""):`<div class="empty">На эту неделю пока нет действий.<br><button class="link-btn" onclick="openActionModal()">Добавить первое</button></div>`}
  </div>
  <div class="card"><div class="section-title" style="margin:0 0 12px"><h3>Прогресс целей</h3><button class="link-btn" onclick="setView('goals')">Все цели →</button></div>
    ${state.goals.length?state.goals.map(g=>`<div class="goal-card" style="margin-bottom:16px"><div class="goal-head"><div class="goal-title">${esc(g.title)}</div><span class="pill">${goalProgress(g)}%</span></div><div class="goal-meta"><span>${esc(g.why||"")}</span><span>${goalProgress(g)}%</span></div><div class="progress"><i style="width:${goalProgress(g)}%"></i></div></div>`).join(""):`<div class="empty">Добавь 1–3 результата, ради которых стоит прожить эти 12 недель.</div>`}
  </div>
 </div>
 <div class="section-title"><h2>12-недельная карта</h2><button class="link-btn" onclick="setView('plan')">Подробнее</button></div>
 <div class="week-strip">${state.weeks.map((w,i)=>`<button class="week-dot ${i===wi?"current":""} ${weekScore(i)!==null?"scored":""}" onclick="jumpWeek(${i})">W${i+1}<br>${weekScore(i)===null?"—":weekScore(i)+"%"}</button>`).join("")}</div>`;
}
function taskHTML(x){
 return `<div class="task ${x.done?"done":""}"><button class="check ${x.done?"done":""}" onclick="toggleAction('${x.id}')">${x.done?"✓":""}</button><div style="flex:1"><div class="task-name">${esc(x.title)}</div><div class="task-sub">${esc(x.day?x.day+" · ":"")}${esc(x.goalName||"")}</div></div><button class="link-btn" onclick="editAction('${x.id}')">⋯</button></div>`;
}
function renderWeek(){
 const wi=weekIndex(), w=state.weeks[wi], score=weekScore(wi), dates=DAYS.map((_,d)=>addDays(addDays(state.cycle.start,wi*7),d));
 document.getElementById("week").innerHTML=`
 <div class="hero"><div><div class="eyebrow">WEEK ${wi+1}</div><h1>Эта неделя</h1><div class="muted">${fmt(dates[0])} — ${fmt(dates[6])}</div></div><div class="score-wrap">${score!==null?`<div class="score-ring" style="--p:${score}%"><b>${score}%</b></div>`:`<div class="score-ring" style="--p:0%"><b>—</b></div>`}</div></div>
 <div class="card"><div class="kpi"><div><h3 style="margin-bottom:3px">Weekly Scorecard</h3><div class="muted">Считаем выполнение ключевых действий, а не настроение или результат.</div></div><span class="pill ${score>=85?"good":score>=65?"warn":""}">${score===null?"Нет оценки":score>=85?"Победная неделя":score>=65?"Есть запас для улучшения":"Нужно скорректировать план"}</span></div></div>
 <div class="section-title"><h2>Ключевые действия</h2><button class="primary small" onclick="openActionModal()">+ Действие</button></div>
 <div class="card">${w.actions.length?w.actions.map(taskHTML).join(""):`<div class="empty">Запиши 3–10 действительно важных действий на эту неделю.</div>`}</div>
 <div class="section-title"><h2>Разбор недели</h2><button class="link-btn" onclick="setView('review')">Открыть полный разбор →</button></div>
 <div class="grid grid-3">
  <div class="card"><h3>Что сработало?</h3><div class="muted">${esc(w.review.worked)||"Пока не заполнено"}</div></div>
  <div class="card"><h3>Что изменить?</h3><div class="muted">${esc(w.review.change)||"Пока не заполнено"}</div></div>
  <div class="card"><h3>Победа недели</h3><div class="muted">${esc(w.review.win)||"Пока не заполнено"}</div></div>
 </div>`;
}
function renderPlan(){
 const wi=weekIndex();
 document.getElementById("plan").innerHTML=`
 <div class="hero"><div><div class="eyebrow">THE 12-WEEK PLAN</div><h1>План цикла</h1><div class="muted">${fmt(state.cycle.start)} — ${fmt(cycleEnd())}</div></div><button class="primary" onclick="openCycleModal()">Изменить цикл</button></div>
 <div class="card"><h3>Почему это важно</h3><div class="muted">${esc(state.cycle.why)||"Заполни, ради чего тебе нужен этот цикл."}</div><div class="section-title" style="margin:16px 0 0"><h3>Видение</h3></div><div class="muted">${esc(state.cycle.vision)||"Как будет выглядеть жизнь/работа после успешных 12 недель?"}</div></div>
 <div class="section-title"><h2>Недели</h2><span class="muted">85%+ = хороший ориентир</span></div>
 <div class="card"><table class="table"><thead><tr><th>Неделя</th><th>Период</th><th>Действия</th><th>Score</th><th></th></tr></thead><tbody>${state.weeks.map((w,i)=>`<tr><td><b>W${i+1}</b>${i===wi?' · сейчас':''}</td><td>${fmt(addDays(state.cycle.start,i*7))} — ${fmt(addDays(state.cycle.start,i*7+6))}</td><td>${w.actions.length}</td><td><span class="pill ${weekScore(i)>=85?"good":""}">${weekScore(i)===null?"—":weekScore(i)+"%"}</span></td><td><button class="link-btn" onclick="jumpWeek(${i})">Открыть</button></td></tr>`).join("")}</tbody></table></div>`;
}
function renderGoals(){
 document.getElementById("goals").innerHTML=`
 <div class="hero"><div><div class="eyebrow">OUTCOMES</div><h1>Цели 12 недель</h1><div class="muted">Держи 1–3 главных результата. Действия — мост к ним.</div></div><button class="primary" onclick="openGoalModal()">+ Цель</button></div>
 <div class="grid grid-2">${state.goals.length?state.goals.map(g=>`<div class="card goal-card"><div class="goal-head"><div><div class="goal-number">ЦЕЛЬ ${state.goals.indexOf(g)+1}</div><div class="goal-title">${esc(g.title)}</div></div><button class="link-btn" onclick="editGoal('${g.id}')">⋯</button></div><p class="muted">${esc(g.why||"")}</p><div class="goal-meta"><span>Исполнение связанных действий</span><b>${goalProgress(g)}%</b></div><div class="progress"><i style="width:${goalProgress(g)}%"></i></div><div class="section-title" style="margin:14px 0 0"><span class="muted">${allActions().filter(x=>x.goalId===g.id).length} действий</span><button class="link-btn" onclick="openActionModal('${g.id}')">+ действие</button></div></div>`).join(""):`<div class="card empty" style="grid-column:1/-1">Начни с 1–3 измеримых результатов. Например: «Получить 5 новых клиентов», а не «заниматься продажами».</div>`}</div>`;
}
function renderReview(){
 const wi=weekIndex(), w=state.weeks[wi], score=weekScore(wi);
 document.getElementById("review").innerHTML=`
 <div class="hero"><div><div class="eyebrow">WEEKLY REVIEW</div><h1>Разбор недели ${wi+1}</h1><div class="muted">2–5 минут. Цель — научиться лучше исполнять план.</div></div></div>
 <div class="grid grid-3">
 <div class="card"><h3>Score</h3><div class="stat">${score===null?"—":score+"%"}</div><div class="muted">${score>=85?"Ты выполнил критические действия.":score===null?"Добавь действия, чтобы появился score.":"Посмотри, что мешало выполнению."}</div></div>
 <div class="card"><h3>Выполнено</h3><div class="stat">${w.actions.filter(x=>x.done).length}/${w.actions.length}</div><div class="muted">ключевых действий</div></div>
 <div class="card"><h3>Средний score</h3><div class="stat">${cycleScore()}%</div><div class="muted">по завершённым неделям</div></div>
 </div>
 <div class="card" style="margin-top:16px"><div class="form-grid">
 <div><label class="label">Что сработало?</label><textarea class="textarea review-box" id="worked">${esc(w.review.worked)}</textarea></div>
 <div><label class="label">Что изменить на следующей неделе?</label><textarea class="textarea review-box" id="change">${esc(w.review.change)}</textarea></div>
 <div><label class="label">Главная победа недели</label><textarea class="textarea review-box" id="win">${esc(w.review.win)}</textarea></div>
 </div><div class="modal-actions"><button class="primary" onclick="saveReview()">Сохранить разбор</button></div></div>`;
}
function renderSettings(){
 document.getElementById("settings").innerHTML=`
 <div class="hero"><div><div class="eyebrow">SETTINGS</div><h1>Настройки</h1><div class="muted">Приложение работает без сервера.</div></div></div>
 <div class="grid grid-2">
  <div class="card"><h3>Данные</h3><p class="muted">Экспортируй резервную копию JSON. Её можно вернуть на другом устройстве/браузере.</p><button class="primary" onclick="exportData()">Экспортировать</button> <button class="secondary" onclick="importData()">Импортировать</button></div>
  <div class="card"><h3>Установить на iPhone</h3><p class="muted">Открой сайт в Safari → Поделиться → «На экран Домой». Приложение будет открываться почти как отдельная программа.</p></div>
  <div class="card"><h3>Сброс</h3><p class="muted">Удалит все цели, действия и разборы из этого браузера.</p><button class="secondary danger-bg" onclick="resetAll()">Сбросить всё</button></div>
 </div>`;
}
function fmt(s){return dateObj(s).toLocaleDateString("ru-RU",{day:"2-digit",month:"short"}).replace(".","")}
function openModal(html){document.getElementById("modalCard").innerHTML=html;document.getElementById("modal").classList.remove("hidden")}
function closeModal(){document.getElementById("modal").classList.add("hidden")}
document.addEventListener("click",e=>{if(e.target.classList.contains("modal-backdrop"))closeModal()});

function openCycleModal(){
 openModal(`<h2>Настройка 12-недельного цикла</h2><div class="form-grid">
 <div><label class="label">Название</label><input class="input" id="cname" value="${esc(state.cycle.name)}"></div>
 <div><label class="label">Дата начала</label><input class="input" type="date" id="cstart" value="${state.cycle.start}"></div>
 <div><label class="label">Почему это важно?</label><textarea class="textarea" id="cwhy">${esc(state.cycle.why)}</textarea></div>
 <div><label class="label">Видение</label><textarea class="textarea" id="cvision">${esc(state.cycle.vision)}</textarea></div>
 </div><div class="modal-actions"><button class="secondary" onclick="closeModal()">Отмена</button><button class="primary" onclick="saveCycle()">Сохранить</button></div>`);
}
function saveCycle(){state.cycle.name=document.getElementById("cname").value.trim()||"Мой 12-недельный цикл";state.cycle.start=document.getElementById("cstart").value;state.cycle.why=document.getElementById("cwhy").value.trim();state.cycle.vision=document.getElementById("cvision").value.trim();closeModal();save()}
function openGoalModal(id=null){
 const g=id?state.goals.find(x=>x.id===id):{title:"",why:""};
 openModal(`<h2>${id?"Редактировать":"Новая"} цель</h2><div class="form-grid"><div><label class="label">Измеримый результат</label><input class="input" id="gtitle" placeholder="Например: получить 5 новых клиентов" value="${esc(g.title)}"></div><div><label class="label">Почему это важно?</label><textarea class="textarea" id="gwhy">${esc(g.why||"")}</textarea></div></div><div class="modal-actions">${id?`<button class="secondary danger-bg" onclick="deleteGoal('${id}')">Удалить</button>`:""}<button class="secondary" onclick="closeModal()">Отмена</button><button class="primary" onclick="saveGoal('${id||""}')">Сохранить</button></div>`);
}
function saveGoal(id){const title=document.getElementById("gtitle").value.trim();if(!title)return showToast("Напиши цель");if(id){let g=state.goals.find(x=>x.id===id);g.title=title;g.why=document.getElementById("gwhy").value.trim()}else{if(state.goals.length>=3)return showToast("Лучше держать максимум 3 главные цели");state.goals.push({id:uid(),title,why:document.getElementById("gwhy").value.trim()})}closeModal();save()}
function editGoal(id){openGoalModal(id)}
function deleteGoal(id){if(confirm("Удалить цель? Действия останутся без привязки.")){state.goals=state.goals.filter(g=>g.id!==id);state.weeks.forEach(w=>w.actions.forEach(a=>{if(a.goalId===id)a.goalId="" }));closeModal();save()}}
function openActionModal(goalId=""){
 const wi=weekIndex(), w=state.weeks[wi];
 openModal(`<h2>Ключевое действие</h2><div class="form-grid">
 <div><label class="label">Что конкретно нужно сделать?</label><input class="input" id="atitle" placeholder="Например: написать 10 потенциальным клиентам"></div>
 <div class="form-row"><div><label class="label">Неделя</label><select class="select" id="aweek">${state.weeks.map((x,i)=>`<option value="${i}" ${i===wi?"selected":""}>Неделя ${i+1}</option>`).join("")}</select></div><div><label class="label">День</label><select class="select" id="aday">${DAYS.map(x=>`<option>${x}</option>`).join("")}</select></div></div>
 <div><label class="label">Связать с целью</label><select class="select" id="agoal"><option value="">Без привязки</option>${state.goals.map(g=>`<option value="${g.id}" ${goalId===g.id?"selected":""}>${esc(g.title)}</option>`).join("")}</select></div>
 </div><div class="modal-actions"><button class="secondary" onclick="closeModal()">Отмена</button><button class="primary" onclick="saveAction()">Добавить</button></div>`);
}
function saveAction(){const title=document.getElementById("atitle").value.trim();if(!title)return showToast("Напиши действие");const wi=+document.getElementById("aweek").value;const gid=document.getElementById("agoal").value;state.weeks[wi].actions.push({id:uid(),title,day:document.getElementById("aday").value,goalId:gid,goalName:state.goals.find(g=>g.id===gid)?.title||"",done:false});closeModal();save()}
function toggleAction(id){for(const w of state.weeks){const a=w.actions.find(x=>x.id===id);if(a){a.done=!a.done;localStorage.setItem(KEY,JSON.stringify(state));render();return}}}
function editAction(id){let found;let wi;state.weeks.forEach((w,i)=>{const a=w.actions.find(x=>x.id===id);if(a){found=a;wi=i}});if(!found)return;openModal(`<h2>Действие</h2><div class="form-grid"><div><label class="label">Название</label><input class="input" id="eTitle" value="${esc(found.title)}"></div><div class="form-row"><div><label class="label">Неделя</label><select class="select" id="eWeek">${state.weeks.map((x,i)=>`<option value="${i}" ${i===wi?"selected":""}>Неделя ${i+1}</option>`).join("")}</select></div><div><label class="label">День</label><select class="select" id="eDay">${DAYS.map(x=>`<option ${x===found.day?"selected":""}>${x}</option>`).join("")}</select></div></div></div><div class="modal-actions"><button class="secondary danger-bg" onclick="deleteAction('${id}')">Удалить</button><button class="secondary" onclick="closeModal()">Отмена</button><button class="primary" onclick="updateAction('${id}',${wi})">Сохранить</button></div>`)}
function updateAction(id,oldWi){const a=state.weeks[oldWi].actions.find(x=>x.id===id);const nw=+document.getElementById("eWeek").value;a.title=document.getElementById("eTitle").value.trim()||a.title;a.day=document.getElementById("eDay").value;if(nw!==oldWi){state.weeks[oldWi].actions=state.weeks[oldWi].actions.filter(x=>x.id!==id);state.weeks[nw].actions.push(a)}closeModal();save()}
function deleteAction(id){if(confirm("Удалить действие?")){state.weeks.forEach(w=>w.actions=w.actions.filter(x=>x.id!==id));closeModal();save()}}
function jumpWeek(i){const start=addDays(state.cycle.start,i*7); // временный переход: показываем выбранную неделю через session
 sessionStorage.setItem("selectedWeek",i);setView("week")}
function selectedWeek(){const x=sessionStorage.getItem("selectedWeek");return x===null?weekIndex():+x}
function saveReview(){const w=state.weeks[selectedWeek()];w.review.worked=document.getElementById("worked").value.trim();w.review.change=document.getElementById("change").value.trim();w.review.win=document.getElementById("win").value.trim();save();showToast("Разбор сохранён")}
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="12-week-focus-backup.json";a.click();URL.revokeObjectURL(a.href)}
function importData(){const input=document.createElement("input");input.type="file";input.accept=".json";input.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x.cycle||!x.weeks)throw 0;Object.assign(state,x);save();showToast("Импортировано")}catch{showToast("Не удалось прочитать файл")}};r.readAsText(f)};input.click()}
function resetAll(){if(confirm("Точно удалить ВСЕ данные?")){localStorage.removeItem(KEY);location.reload()}}
function showToast(t){const el=document.getElementById("toast");el.textContent=t;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),1600)}
function init(){nav();render();setView("dashboard")}
init();