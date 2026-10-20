(() => {
"use strict";
const canvas = document.getElementById("game"), ctx = canvas.getContext("2d");
const $ = id => document.getElementById(id);
const W = canvas.width, H = canvas.height;
let running=false, paused=false, last=0, elapsed=0, spawnTimer=0, wave=1, kills=0, score=0;
let player, bullets=[], enemies=[], particles=[], riftTrails=[], keys={}, mouse={x:W/2+100,y:H/2,down:false};
let best=Number(localStorage.getItem("neonRiftBest")||0), toastTimer=0;
$("best").textContent=best;
function reset(){player={x:W/2,y:H/2,r:12,hp:100,energy:100,speed:245,fire:0,rift:0,invuln:0,aim:0};bullets=[];enemies=[];particles=[];riftTrails=[];wave=1;kills=0;score=0;elapsed=0;spawnTimer=.7;updateHUD();}
function updateHUD(){$("wave").textContent=wave;$("kills").textContent=kills;$("hpText").textContent=Math.ceil(player.hp)+"%";$("hpBar").style.width=player.hp+"%";$("energyText").textContent=Math.ceil(player.energy)+"%";$("energyBar").style.width=player.energy+"%";}
function toast(text){$("toast").textContent=text;$("toast").classList.add("show");toastTimer=1.3;}
function start(){reset();running=true;paused=false;$("overlay").classList.add("hidden");last=performance.now();requestAnimationFrame(loop);}
function end(){running=false;best=Math.max(best,kills);localStorage.setItem("neonRiftBest",best);$("best").textContent=best;$("overlay").classList.remove("hidden");$("overlay").querySelector(".eyebrow").textContent="SIMULATION TERMINATED // "+kills+" ELIMS";$("overlay").querySelector("h1").innerHTML='RIFT<br><em>COLLAPSED.</em>';$("overlay").querySelector("p").textContent=`Ты уничтожил ${kills} дронов и достиг волны ${wave}. Попробуй продержаться дольше.`;$("startBtn").innerHTML='ПОВТОРИТЬ ЗАПУСК <span>↗</span>';}
function togglePause(){if(!running)return;paused=!paused;$("pauseBtn").textContent=paused?"▶":"Ⅱ";if(!paused){last=performance.now();requestAnimationFrame(loop)}else toast("SIMULATION PAUSED");}
$("startBtn").addEventListener("click",start);$("pauseBtn").addEventListener("click",togglePause);
window.addEventListener("keydown",e=>{keys[e.code]=true;if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))e.preventDefault();if(e.code==="Escape")togglePause();if(e.code==="Space"&&running&&!paused)riftJump();});
window.addEventListener("keyup",e=>keys[e.code]=false);
function pointerPos(e){const r=canvas.getBoundingClientRect();mouse.x=(e.clientX-r.left)*W/r.width;mouse.y=(e.clientY-r.top)*H/r.height;}
canvas.addEventListener("pointermove",pointerPos);canvas.addEventListener("pointerdown",e=>{pointerPos(e);mouse.down=true;canvas.setPointerCapture?.(e.pointerId)});window.addEventListener("pointerup",()=>mouse.down=false);
function riftJump(){if(player.energy<35||player.rift>0)return;player.energy-=35;player.rift=.8;const dx=mouse.x-player.x,dy=mouse.y-player.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;const old={x:player.x,y:player.y};player.x=Math.max(22,Math.min(W-22,player.x+ux*145));player.y=Math.max(22,Math.min(H-22,player.y+uy*145));riftTrails.push({x1:old.x,y1:old.y,x2:player.x,y2:player.y,life:.45,max:.45});burst(old.x,old.y,"#b27aff",22);burst(player.x,player.y,"#61f5ff",24);toast("RIFT SHIFT");for(const e of enemies){if(distToSegment(e.x,e.y,old.x,old.y,player.x,player.y)<e.r+12)damageEnemy(e,2);}}
function distToSegment(px,py,x1,y1,x2,y2){const dx=x2-x1,dy=y2-y1,t=Math.max(0,Math.min(1,((px-x1)*dx+(py-y1)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(px-x1-t*dx,py-y1-t*dy);}
function spawnEnemy(){const side=Math.floor(Math.random()*4);let x=side===0?-20:side===1?W+20:Math.random()*W,y=side===2?-20:side===3?H+20:Math.random()*H;const tank=Math.random()<Math.min(.12+(wave*.015),.35);enemies.push({x,y,r:tank?17:11,hp:tank?3:1,maxhp:tank?3:1,speed:(tank?48:70)+Math.min(wave*3,42),hit:0,tank});}
function shoot(){const dx=mouse.x-player.x,dy=mouse.y-player.y,len=Math.hypot(dx,dy)||1;bullets.push({x:player.x+dx/len*16,y:player.y+dy/len*16,vx:dx/len*590,vy:dy/len*590,life:1.1,r:3});burst(player.x+dx/len*15,player.y+dy/len*15,"#61f5ff",3);}
function damageEnemy(e,n=1){if(!enemies.includes(e))return;e.hp-=n;e.hit=.12;burst(e.x,e.y,e.tank?"#ff7b9d":"#b27aff",5);if(e.hp<=0){enemies.splice(enemies.indexOf(e),1);kills++;score+=e.tank?30:10;player.energy=Math.min(100,player.energy+(e.tank?12:5));burst(e.x,e.y,"#61f5ff",14);if(kills%10===0){wave++;toast("WAVE "+wave+" // THREAT INCREASED");}updateHUD();}}
function burst(x,y,color,n){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=25+Math.random()*180;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.2+Math.random()*.5,max:.7,color,r:1+Math.random()*2});}}
function loop(now){if(!running||paused)return;const dt=Math.min((now-last)/1000,.033);last=now;update(dt);draw();if(running&&!paused)requestAnimationFrame(loop);}
function update(dt){elapsed+=dt;spawnTimer-=dt;player.fire=Math.max(0,player.fire-dt);player.rift=Math.max(0,player.rift-dt);player.invuln=Math.max(0,player.invuln-dt);player.energy=Math.min(100,player.energy+dt*3.2);
if(spawnTimer<=0){spawnEnemy();spawnTimer=Math.max(.28,1.05-wave*.045)*(0.65+Math.random()*.7);}
let dx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),dy=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0),len=Math.hypot(dx,dy)||1;
player.x=Math.max(16,Math.min(W-16,player.x+dx/len*player.speed*dt));player.y=Math.max(16,Math.min(H-16,player.y+dy/len*player.speed*dt));player.aim=Math.atan2(mouse.y-player.y,mouse.x-player.x);
if(mouse.down&&player.fire<=0){shoot();player.fire=.14;}
for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(b.life<=0||b.x<0||b.x>W||b.y<0||b.y>H){bullets.splice(i,1);continue;}for(const e of [...enemies])if(Math.hypot(b.x-e.x,b.y-e.y)<e.r+b.r){damageEnemy(e);bullets.splice(i,1);break;}}
for(const e of enemies){const dx=player.x-e.x,dy=player.y-e.y,l=Math.hypot(dx,dy)||1;e.x+=dx/l*e.speed*dt;e.y+=dy/l*e.speed*dt;e.hit=Math.max(0,e.hit-dt);if(l<e.r+player.r&&player.invuln<=0){player.hp-=e.tank?20:12;player.invuln=.65;burst(player.x,player.y,"#ff577d",12);updateHUD();if(player.hp<=0){player.hp=0;updateHUD();end();return;}}}
for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.97;p.vy*=.97;p.life-=dt;if(p.life<=0)particles.splice(i,1);}
for(let i=riftTrails.length-1;i>=0;i--){riftTrails[i].life-=dt;if(riftTrails[i].life<=0)riftTrails.splice(i,1);}
if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$("toast").classList.remove("show");}
updateHUD();}
function draw(){ctx.clearRect(0,0,W,H);ctx.fillStyle="#080d1a";ctx.fillRect(0,0,W,H);
const grid=40,off=(elapsed*5)%grid;ctx.strokeStyle="#18233b";ctx.lineWidth=1;ctx.beginPath();for(let x=-off;x<W;x+=grid){ctx.moveTo(x,0);ctx.lineTo(x,H)}for(let y=-off;y<H;y+=grid){ctx.moveTo(0,y);ctx.lineTo(W,y)}ctx.stroke();
ctx.save();ctx.globalAlpha=.2;ctx.strokeStyle="#61f5ff";ctx.setLineDash([4,8]);ctx.strokeRect(12,12,W-24,H-24);ctx.restore();
for(const t of riftTrails){ctx.save();ctx.globalAlpha=Math.max(0,t.life/t.max);ctx.strokeStyle="#b27aff";ctx.lineWidth=18;ctx.shadowBlur=30;ctx.shadowColor="#b27aff";ctx.beginPath();ctx.moveTo(t.x1,t.y1);ctx.lineTo(t.x2,t.y2);ctx.stroke();ctx.restore();}
for(const b of bullets){ctx.save();ctx.fillStyle="#bffcff";ctx.shadowColor="#61f5ff";ctx.shadowBlur=15;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();ctx.restore();}
for(const e of enemies){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(elapsed*1.5*(e.tank?-1:1));ctx.shadowBlur=e.hit?25:12;ctx.shadowColor=e.hit?"#fff":e.tank?"#ff577d":"#b27aff";ctx.fillStyle=e.hit?"#fff":e.tank?"#ff577d":"#9b6cff";ctx.strokeStyle=e.tank?"#ffc0d0":"#e0d2ff";ctx.lineWidth=1.5;ctx.beginPath();if(e.tank){ctx.rect(-e.r,-e.r,e.r*2,e.r*2)}else{ctx.moveTo(0,-e.r-2);ctx.lineTo(e.r+2,0);ctx.lineTo(0,e.r+2);ctx.lineTo(-e.r-2,0);ctx.closePath()}ctx.fill();ctx.stroke();ctx.restore();if(e.maxhp>1){ctx.fillStyle="#382136";ctx.fillRect(e.x-15,e.y-e.r-9,30,3);ctx.fillStyle="#ff7898";ctx.fillRect(e.x-15,e.y-e.r-9,30*e.hp/e.maxhp,3);}}
for(const p of particles){ctx.save();ctx.globalAlpha=Math.max(0,p.life/.7);ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=8;ctx.fillRect(p.x,p.y,p.r,p.r);ctx.restore();}
drawPlayer();ctx.fillStyle="#8fa1c4";ctx.font="10px ui-monospace,monospace";ctx.fillText("SECTOR 07",20,H-20);ctx.textAlign="right";ctx.fillText("THREAT: "+(enemies.length<4?"LOW":enemies.length<8?"ELEVATED":"CRITICAL"),W-20,H-20);ctx.textAlign="left";}
function drawPlayer(){ctx.save();ctx.translate(player.x,player.y);ctx.rotate(player.aim);ctx.shadowColor=player.invuln>0?"#ff577d":"#61f5ff";ctx.shadowBlur=22;ctx.fillStyle="#e7ffff";ctx.strokeStyle="#61f5ff";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(17,0);ctx.lineTo(-9,-10);ctx.lineTo(-5,0);ctx.lineTo(-9,10);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle="#b27aff";ctx.beginPath();ctx.arc(0,0,18+Math.sin(elapsed*7)*2,0,Math.PI*2);ctx.stroke();ctx.restore();}
draw();
})();