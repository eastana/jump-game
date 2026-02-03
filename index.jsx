import { useState, useEffect, useRef, useCallback } from "react";

/* ═══ CONSTANTS ═══ */
const W = 800, H = 450;
const GRAVITY = 0.42;
const JUMP1 = -11.5;
const JUMP2 = -9.5;
const GROUND_Y = H - 80;
const SPEED_BASE = 3;
const SPEED_MAX = 6;
const CHEESE_INT_MIN = 2800;
const CHEESE_INT_MAX = 4400;
const OBS_INT_MIN = 3200;
const OBS_INT_MAX = 5000;
const STAR_INT_MIN = 4500;
const STAR_INT_MAX = 7000;

/* ═══ DRAW HELPERS ═══ */
function drawFatima(ctx, x, y, frame, grounded) {
  ctx.save();
  ctx.translate(x, y);
  const p = grounded ? (frame % 2) : 0;

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath(); ctx.ellipse(28, 64, 16, 4, 0, 0, Math.PI * 2); ctx.fill();

  // LEGS
  ctx.strokeStyle = "#e8a87c"; ctx.lineWidth = 5; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(22, 42); ctx.lineTo(grounded ? (p===0?10:32) : 16, 62); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(32, 42); ctx.lineTo(grounded ? (p===0?40:16) : 38, 62); ctx.stroke();

  // SHOES
  ctx.fillStyle = "#5c3d2e";
  ctx.beginPath(); ctx.roundRect(grounded?(p===0?6:28):12, 58, 10, 5, 3); ctx.fill();
  ctx.beginPath(); ctx.roundRect(grounded?(p===0?36:12):34, 58, 10, 5, 3); ctx.fill();

  // BODY
  ctx.fillStyle = "#f06292";
  ctx.beginPath(); ctx.moveTo(16,22); ctx.lineTo(12,44); ctx.lineTo(44,44); ctx.lineTo(40,22); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#ec407a";
  ctx.beginPath(); ctx.roundRect(14, 36, 28, 6, 2); ctx.fill();

  // ARMS
  ctx.strokeStyle = "#e8a87c"; ctx.lineWidth = 4; ctx.lineCap = "round";
  const ap = grounded ? p : 0.5;
  ctx.beginPath(); ctx.moveTo(18,26); ctx.lineTo(ap===0?4:28, 40); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(38,26); ctx.lineTo(ap===0?48:22, 38); ctx.stroke();

  // HEAD
  ctx.fillStyle = "#f0c9a0";
  ctx.beginPath(); ctx.arc(28,14,11,0,Math.PI*2); ctx.fill();

  // HIJAB
  ctx.fillStyle = "#4caf50";
  ctx.beginPath(); ctx.arc(28,12,12,-Math.PI,0); ctx.fill();
  ctx.beginPath(); ctx.moveTo(16,12); ctx.lineTo(13,28); ctx.lineTo(20,28); ctx.lineTo(17,13); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(40,12); ctx.lineTo(43,28); ctx.lineTo(36,28); ctx.lineTo(39,13); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#66bb6a";
  ctx.beginPath(); ctx.roundRect(15,9,26,5,2); ctx.fill();

  // FACE
  ctx.fillStyle = "#3e2723";
  ctx.beginPath(); ctx.arc(23,14,1.5,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(33,14,1.5,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = "#3e2723"; ctx.lineWidth = 1.3; ctx.lineCap = "round";
  ctx.beginPath(); ctx.arc(28,17,3.2,0.15,Math.PI-0.15); ctx.stroke();

  ctx.restore();
}

function drawCheese(ctx, x, y, rot=0) {
  ctx.save();
  ctx.translate(x+19, y+14); ctx.rotate(rot); ctx.translate(-19,-14);
  ctx.shadowColor="#ffe066"; ctx.shadowBlur=14;
  ctx.fillStyle="#ffcc00";
  ctx.beginPath(); ctx.moveTo(0,28); ctx.lineTo(38,28); ctx.lineTo(19,2); ctx.closePath(); ctx.fill();
  ctx.fillStyle="#ffe566";
  ctx.beginPath(); ctx.moveTo(4,26); ctx.lineTo(34,26); ctx.lineTo(19,6); ctx.closePath(); ctx.fill();
  ctx.fillStyle="#e6b800";
  ctx.beginPath(); ctx.arc(14,20,3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(24,18,2,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(19,13,1.8,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle="#cc9900"; ctx.lineWidth=1.8;
  ctx.beginPath(); ctx.moveTo(0,28); ctx.lineTo(38,28); ctx.lineTo(19,2); ctx.closePath(); ctx.stroke();
  ctx.restore();
}

function drawStar(ctx, x, y, t) {
  const pulse = 0.88 + 0.12*Math.sin(t*0.008);
  ctx.save();
  ctx.translate(x,y); ctx.scale(pulse,pulse);
  ctx.shadowColor="#fff176"; ctx.shadowBlur=16;
  ctx.fillStyle="#fff176";
  ctx.beginPath();
  for(let i=0;i<5;i++){
    const aO = (Math.PI/2)+(i*2*Math.PI/5)-Math.PI;
    const aI = aO+Math.PI/5;
    ctx.lineTo(Math.cos(aO)*14, Math.sin(aO)*14);
    ctx.lineTo(Math.cos(aI)*6,  Math.sin(aI)*6);
  }
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle="#ffee58"; ctx.lineWidth=1.2; ctx.stroke();
  ctx.restore();
}

function drawLog(ctx, x, y, w) {
  ctx.fillStyle="#6d4c2a";
  ctx.beginPath(); ctx.roundRect(x,y,w,28,5); ctx.fill();
  ctx.fillStyle="#8b6914";
  ctx.beginPath(); ctx.roundRect(x+3,y+3,w-6,7,2); ctx.fill();
  ctx.strokeStyle="#5a3a1a"; ctx.lineWidth=1.4;
  ctx.beginPath(); ctx.moveTo(x+10,y); ctx.lineTo(x+10,y+28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x+w-10,y); ctx.lineTo(x+w-10,y+28); ctx.stroke();
}

function drawRock(ctx, x, y) {
  ctx.fillStyle="#7a7a7a";
  ctx.beginPath(); ctx.ellipse(x+24,y+16,26,17,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#9a9a9a";
  ctx.beginPath(); ctx.ellipse(x+17,y+11,13,9,-0.3,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#6a6a6a";
  ctx.beginPath(); ctx.ellipse(x+33,y+18,9,6,0.2,0,Math.PI*2); ctx.fill();
}

function drawTree(ctx, x, y, scale=1) {
  ctx.save();
  ctx.translate(x,y); ctx.scale(scale,scale);
  ctx.fillStyle="#795548";
  ctx.beginPath(); ctx.roundRect(-6,-20,12,30,3); ctx.fill();
  [["#2e7d32",-2,-55,30],["#388e3c",-8,-42,25],["#43a047",2,-30,22]].forEach(([c,ox,oy,r])=>{
    ctx.fillStyle=c; ctx.beginPath(); ctx.arc(ox,oy,r,0,Math.PI*2); ctx.fill();
  });
  ctx.restore();
}

function drawFlower(ctx, x, y, t, hue) {
  ctx.save(); ctx.translate(x,y);
  ctx.strokeStyle="#4caf50"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-12); ctx.stroke();
  const a = t*0.001;
  const cols=["#f48fb1","#ce93d8","#fff176","#ef5350"];
  for(let i=0;i<5;i++){
    const ang = a+(i/5)*Math.PI*2;
    ctx.fillStyle=cols[hue%cols.length];
    ctx.beginPath(); ctx.arc(Math.cos(ang)*4, -12+Math.sin(ang)*4, 3.5, 0, Math.PI*2); ctx.fill();
  }
  ctx.fillStyle="#fff176";
  ctx.beginPath(); ctx.arc(0,-12,2.2,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawButterfly(ctx, x, y, t) {
  ctx.save(); ctx.translate(x,y);
  const fl = Math.sin(t*0.012)*0.6;
  ctx.save(); ctx.rotate(-fl);
  ctx.fillStyle="#ce93d8"; ctx.beginPath(); ctx.ellipse(-7,0,8,5,-0.4,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#ab47bc"; ctx.beginPath(); ctx.ellipse(-7,0,4,2.5,-0.4,0,Math.PI*2); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.rotate(fl);
  ctx.fillStyle="#ce93d8"; ctx.beginPath(); ctx.ellipse(7,0,8,5,0.4,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#ab47bc"; ctx.beginPath(); ctx.ellipse(7,0,4,2.5,0.4,0,Math.PI*2); ctx.fill();
  ctx.restore();
  ctx.fillStyle="#4e342e"; ctx.beginPath(); ctx.ellipse(0,0,2,5,0,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawCloud(ctx, x, y, w) {
  ctx.fillStyle="rgba(255,255,255,0.82)";
  ctx.beginPath();
  ctx.arc(x+w*0.2,  y,         w*0.17, 0, Math.PI*2);
  ctx.arc(x+w*0.5,  y-w*0.07,  w*0.21, 0, Math.PI*2);
  ctx.arc(x+w*0.78, y,         w*0.16, 0, Math.PI*2);
  ctx.fill();
}

/* ─── particles ─── */
function spawnSparkles(x, y, color="#ffe066", cnt=16) {
  const cols = color==="#ffe066"
    ? ["#ffe066","#fff176","#ffcc00","#fff","#ff9800"]
    : color==="#fff176"
      ? ["#fff176","#fff","#fff9c4","#ffe566"]
      : color==="#ef5350"
        ? ["#ef5350","#ff7961","#ffcdd2","#fff"]
        : ["#a5d6a7","#c8e6c9","#fff"];
  return Array.from({length:cnt},(_,i)=>{
    const a=(Math.PI*2*i)/cnt+(Math.random()-.5)*.5;
    const s=1.8+Math.random()*2.5;
    return {x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,size:2.2+Math.random()*2.8,color:cols[i%cols.length]};
  });
}

/* ═══ COMPONENT ═══ */
export default function FatimaGame() {
  const canvasRef = useRef(null);
  const gameRef   = useRef(null);
  const [status, setStatus]       = useState("idle");
  const [score, setScore]         = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [cheeseCnt, setCheeseCnt] = useState(0);

  const makeBg = useCallback(() => {
    const trees=[]; for(let i=0;i<7;i++) trees.push({x:60+i*115, y:GROUND_Y-10, scale:0.55+Math.random()*0.35});
    const flowers=[]; for(let i=0;i<14;i++) flowers.push({x:25+i*56, y:GROUND_Y+8, hue:i});
    const butterflies=[]; for(let i=0;i<3;i++) butterflies.push({x:120+i*260, y:110+Math.random()*60, baseY:110+Math.random()*60, phase:i*2.1});
    return {trees, flowers, butterflies};
  },[]);

  const initState = useCallback(() => {
    const bg = makeBg();
    return {
      fatima:{x:80,y:GROUND_Y-64,vy:0,grounded:true,jumps:0,frame:0,frameTimer:0},
      cheeses:[], obstacles:[], stars:[],
      clouds:[
        {x:80,y:55,w:130,speed:0.22},
        {x:320,y:82,w:95,speed:0.16},
        {x:560,y:38,w:150,speed:0.28},
        {x:710,y:95,w:100,speed:0.19},
      ],
      trees:bg.trees, flowers:bg.flowers, butterflies:bg.butterflies,
      sparkles:[], trail:[], shake:{dur:0,mag:0}, collectRings:[],
      score:0, cheeseCnt:0, speed:SPEED_BASE,
      nextCheese:Date.now()+2200, nextObs:Date.now()+3200, nextStar:Date.now()+5500,
      alive:false, started:false, treeOffset:0,
    };
  }, [makeBg]);

  useEffect(()=>{ gameRef.current = initState(); },[initState]);

  /* ── input ── */
  useEffect(()=>{
    const doJump = ()=>{
      const g = gameRef.current;
      if(!g) return;
      if(!g.started){ g.alive=true; g.started=true; setStatus("playing"); }
      if(!g.alive) return;
      if(g.fatima.grounded){
        g.fatima.vy=JUMP1; g.fatima.grounded=false; g.fatima.jumps=1;
      } else if(g.fatima.jumps<2){
        g.fatima.vy=JUMP2; g.fatima.jumps=2;
        g.sparkles.push(...spawnSparkles(g.fatima.x+28, g.fatima.y+30, "#fff", 10));
      }
    };
    const onKey=(e)=>{ if(e.code==="Space"||e.code==="ArrowUp"||e.code==="KeyW"){ e.preventDefault(); doJump(); }};
    window.addEventListener("keydown", onKey);
    return ()=> window.removeEventListener("keydown", onKey);
  },[]);

  /* ══════════ LOOP ══════════ */
  useEffect(()=>{
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;
    let prevTime = performance.now();

    const loop = (now)=>{
      const dt = Math.min((now - prevTime)/16.67, 3);
      prevTime = now;
      const g = gameRef.current;
      if(!g){ animId=requestAnimationFrame(loop); return; }
      const t = Date.now();

      /* ════ UPDATE ════ */
      if(g.alive){
        g.speed = Math.min(SPEED_MAX, SPEED_BASE + g.score*0.0018);

        // physics
        g.fatima.vy += GRAVITY*dt;
        g.fatima.y  += g.fatima.vy*dt;
        if(g.fatima.y >= GROUND_Y-64){
          const wasAir = !g.fatima.grounded;
          g.fatima.y=GROUND_Y-64; g.fatima.vy=0; g.fatima.grounded=true; g.fatima.jumps=0;
          if(wasAir){
            g.fatima.vy = -1.8; // tiny bounce
            g.sparkles.push(...spawnSparkles(g.fatima.x+28, GROUND_Y-4, "#c8e6c9", 6));
          }
        }
        g.fatima.frameTimer += g.speed*dt;
        if(g.fatima.frameTimer>9){ g.fatima.frame++; g.fatima.frameTimer=0; }

        // trail
        if(g.fatima.grounded && g.fatima.frame%2===0)
          g.trail.push({x:g.fatima.x+28+(Math.random()-.5)*10, y:GROUND_Y-6, life:1, size:2+Math.random()*2});
        g.trail.forEach(p=>{ p.life-=0.04*dt; p.y-=0.5*dt; });
        g.trail = g.trail.filter(p=>p.life>0);

        // score
        g.score += dt;
        setScore(Math.floor(g.score));

        // spawns
        if(t>g.nextCheese){
          const ys=[GROUND_Y-108, GROUND_Y-158, GROUND_Y-208];
          g.cheeses.push({x:W+20, y:ys[Math.floor(Math.random()*ys.length)], bobPhase:Math.random()*Math.PI*2, rot:0, rotSpd:(Math.random()-.5)*0.07});
          g.nextCheese = t+CHEESE_INT_MIN+Math.random()*(CHEESE_INT_MAX-CHEESE_INT_MIN);
        }
        if(t>g.nextObs){
          const type = Math.random()<0.55?"log":"rock";
          g.obstacles.push({x:W+20, y:GROUND_Y-(type==="log"?28:36), type, w:type==="log"?38+Math.random()*28:48});
          g.nextObs = t+OBS_INT_MIN+Math.random()*(OBS_INT_MAX-OBS_INT_MIN);
        }
        if(t>g.nextStar){
          g.stars.push({x:W+20, y:75+Math.random()*130});
          g.nextStar = t+STAR_INT_MIN+Math.random()*(STAR_INT_MAX-STAR_INT_MIN);
        }

        // move
        const spd = g.speed*dt;
        g.cheeses.forEach(c=>{ c.x-=spd; c.rot+=c.rotSpd*dt; });
        g.cheeses = g.cheeses.filter(c=>c.x>-60);
        g.obstacles.forEach(o=>{ o.x-=spd; });
        g.obstacles = g.obstacles.filter(o=>o.x>-80);
        g.stars.forEach(s=>{ s.x-=spd*0.85; });
        g.stars = g.stars.filter(s=>s.x>-40);

        // bg parallax
        g.clouds.forEach(c=>{ c.x-=c.speed*dt; if(c.x+c.w<-30) c.x=W+50; });
        g.treeOffset = (g.treeOffset + g.speed*0.22*dt) % 115;
        g.butterflies.forEach(b=>{
          b.x -= 0.28*dt;
          b.y = b.baseY + Math.sin((t+b.phase*1000)*0.003)*28;
          if(b.x<-30){ b.x=W+50; b.baseY=110+Math.random()*60; }
        });

        // particles
        g.sparkles.forEach(p=>{ p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=0.025*dt; });
        g.sparkles = g.sparkles.filter(p=>p.life>0);
        g.collectRings.forEach(r=>{ r.life-=0.04*dt; r.scale+=0.6*dt; });
        g.collectRings = g.collectRings.filter(r=>r.life>0);
        if(g.shake.dur>0) g.shake.dur-=dt;

        /* ── COLLISIONS ── */
        const fx=g.fatima.x, fy=g.fatima.y, fW=56, fH=64;

        g.cheeses = g.cheeses.filter(c=>{
          const cy = c.y + Math.sin(t*0.005+c.bobPhase)*5;
          if(fx+10<c.x+36 && fx+fW-10>c.x+2 && fy+12<cy+28 && fy+fH>cy){
            g.sparkles.push(...spawnSparkles(c.x+19, cy+14));
            g.collectRings.push({x:c.x+19, y:cy+14, scale:1, life:1});
            g.cheeseCnt++; setCheeseCnt(g.cheeseCnt);
            g.score+=50; setScore(Math.floor(g.score));
            return false;
          }
          return true;
        });

        g.stars = g.stars.filter(s=>{
          if(fx+10<s.x+14 && fx+fW-10>s.x-14 && fy+10<s.y+14 && fy+fH>s.y-14){
            g.sparkles.push(...spawnSparkles(s.x, s.y, "#fff176", 12));
            g.collectRings.push({x:s.x, y:s.y, scale:1, life:1});
            g.score+=25; setScore(Math.floor(g.score));
            return false;
          }
          return true;
        });

        for(const o of g.obstacles){
          const oW = o.type==="log"?o.w:48;
          const oH = o.type==="log"?28:36;
          if(fx+12<o.x+oW-4 && fx+fW-12>o.x+4 && fy+fH>o.y+6 && fy+fH-10<o.y+oH+16){
            g.alive=false;
            g.shake={dur:14, mag:8};
            g.sparkles.push(...spawnSparkles(fx+28, fy+32, "#ef5350", 22));
            setStatus("dead");
            setHighScore(prev=>Math.max(prev, Math.floor(g.score)));
            break;
          }
        }
      } else {
        // idle / dead — still animate bg
        g.clouds.forEach(c=>{ c.x-=c.speed*dt; if(c.x+c.w<-30) c.x=W+50; });
        g.butterflies.forEach(b=>{ b.y=b.baseY+Math.sin((t+b.phase*1000)*0.003)*28; });
        g.sparkles.forEach(p=>{ p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=0.025*dt; });
        g.sparkles = g.sparkles.filter(p=>p.life>0);
        g.collectRings.forEach(r=>{ r.life-=0.04*dt; r.scale+=0.6*dt; });
        g.collectRings = g.collectRings.filter(r=>r.life>0);
        if(g.shake.dur>0) g.shake.dur-=dt;
      }

      /* ════ DRAW ════ */
      ctx.save();
      if(g.shake.dur>0){
        const m = g.shake.mag*(g.shake.dur/14);
        ctx.translate((Math.random()-.5)*m*2, (Math.random()-.5)*m*2);
      }

      // SKY
      const sky = ctx.createLinearGradient(0,0,0,H);
      sky.addColorStop(0,"#1565c0");
      sky.addColorStop(0.55,"#42a5f5");
      sky.addColorStop(1,"#90caf9");
      ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);

      // SUN + rays
      ctx.save();
      ctx.shadowColor="#fff9c4"; ctx.shadowBlur=38;
      ctx.fillStyle="#fff9c4";
      ctx.beginPath(); ctx.arc(W-90,65,36,0,Math.PI*2); ctx.fill();
      ctx.restore();
      ctx.strokeStyle="rgba(255,249,196,0.22)"; ctx.lineWidth=3;
      for(let i=0;i<8;i++){
        const a=(i/8)*Math.PI*2 + t*0.0003;
        ctx.beginPath();
        ctx.moveTo(W-90+Math.cos(a)*40, 65+Math.sin(a)*40);
        ctx.lineTo(W-90+Math.cos(a)*60, 65+Math.sin(a)*60);
        ctx.stroke();
      }

      // CLOUDS back
      g.clouds.slice(0,2).forEach(c=>drawCloud(ctx,c.x,c.y,c.w));

      // FAR HILLS — closed polygon, fills to bottom
      ctx.fillStyle="#a5d6a7";
      ctx.beginPath();
      ctx.moveTo(0, H);
      for(let hx=-80;hx<W+120;hx+=160){
        const pH = GROUND_Y-100-Math.sin(hx*0.012)*50;
        ctx.quadraticCurveTo(hx+50, pH-40, hx+100, pH);
      }
      ctx.lineTo(W, H);
      ctx.closePath(); ctx.fill();

      // MID HILLS — closed polygon
      ctx.fillStyle="#81c784";
      ctx.beginPath();
      ctx.moveTo(0, H);
      const mOff = (g.treeOffset*0.6)%200;
      for(let hx=-mOff-40;hx<W+250;hx+=200){
        const pH = GROUND_Y-68-Math.sin(hx*0.015+1.2)*32;
        ctx.quadraticCurveTo(hx+65, pH-26, hx+130, pH);
      }
      ctx.lineTo(W, H);
      ctx.closePath(); ctx.fill();

      // CLOUDS front
      g.clouds.slice(2).forEach(c=>drawCloud(ctx,c.x,c.y,c.w));

      // TREES
      g.trees.forEach(tr=>{
        const tx = ((tr.x - g.treeOffset)%( W+40) + W+40)%(W+40) - 20;
        drawTree(ctx, tx, tr.y, tr.scale);
      });

      // BUTTERFLIES
      g.butterflies.forEach(b=> drawButterfly(ctx,b.x,b.y,t));

      // GROUND
      const gGrad = ctx.createLinearGradient(0, GROUND_Y-12, 0, H);
      gGrad.addColorStop(0,"#43a047");
      gGrad.addColorStop(0.12,"#388e3c");
      gGrad.addColorStop(1,"#2e7d32");
      ctx.fillStyle=gGrad;
      ctx.fillRect(0, GROUND_Y-12, W, H-GROUND_Y+12);
      ctx.fillStyle="#66bb6a";
      ctx.fillRect(0, GROUND_Y-14, W, 4);

      // FLOWERS
      g.flowers.forEach(f=>{
        const fx2 = ((f.x - g.treeOffset*0.7)%(W+60)+W+60)%(W+60)-30;
        drawFlower(ctx, fx2, f.y, t, f.hue);
      });

      // TRAIL
      g.trail.forEach(p=>{
        ctx.save(); ctx.globalAlpha=p.life*0.45; ctx.fillStyle="#a5d6a7";
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2); ctx.fill(); ctx.restore();
      });

      // OBSTACLES
      g.obstacles.forEach(o=>{ o.type==="log"?drawLog(ctx,o.x,o.y,o.w):drawRock(ctx,o.x,o.y); });

      // CHEESES
      g.cheeses.forEach(c=>{
        const cy = c.y + Math.sin(t*0.005+c.bobPhase)*5;
        drawCheese(ctx, c.x, cy, c.rot);
      });

      // STARS
      g.stars.forEach(s=> drawStar(ctx,s.x,s.y,t));

      // COLLECT RINGS
      g.collectRings.forEach(r=>{
        ctx.save(); ctx.globalAlpha=r.life*0.7;
        ctx.strokeStyle="#fff176"; ctx.lineWidth=2.5;
        ctx.beginPath(); ctx.arc(r.x,r.y,6+r.scale*18,0,Math.PI*2); ctx.stroke();
        ctx.restore();
      });

      // SPARKLES
      g.sparkles.forEach(p=>{
        ctx.save(); ctx.globalAlpha=p.life;
        ctx.fillStyle=p.color; ctx.shadowColor=p.color; ctx.shadowBlur=5;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2); ctx.fill(); ctx.restore();
      });

      // FATIMA
      drawFatima(ctx, g.fatima.x, g.fatima.y, g.fatima.frame, g.fatima.grounded);

      /* ════ HUD ════ */
      if(status==="playing"||status==="dead"){
        // score
        ctx.fillStyle="rgba(0,0,0,0.4)";
        ctx.beginPath(); ctx.roundRect(12,12,148,38,10); ctx.fill();
        ctx.fillStyle="#fff"; ctx.font="bold 20px 'Georgia',serif"; ctx.textAlign="left";
        ctx.fillText(`⭐ ${Math.floor(g.score)}`,28,37);
        // cheese
        ctx.fillStyle="rgba(0,0,0,0.4)";
        ctx.beginPath(); ctx.roundRect(170,12,105,38,10); ctx.fill();
        ctx.fillStyle="#ffe566"; ctx.font="bold 18px 'Georgia',serif";
        ctx.fillText(`🧀 ${g.cheeseCnt}`,184,37);
        // speed bar
        const barX=285, barY=22, barW=100, barH=8;
        ctx.fillStyle="rgba(0,0,0,0.4)";
        ctx.beginPath(); ctx.roundRect(barX,barY,barW,barH,4); ctx.fill();
        const pct=(g.speed-SPEED_BASE)/(SPEED_MAX-SPEED_BASE);
        ctx.fillStyle = pct<0.4?"#66bb6a":pct<0.75?"#ffb74d":"#ef5350";
        ctx.beginPath(); ctx.roundRect(barX,barY,barW*pct,barH,4); ctx.fill();
        ctx.fillStyle="rgba(255,255,255,0.55)"; ctx.font="11px sans-serif";
        ctx.fillText("SPD",barX,barY+20);
        // double-jump hint
        if(!g.fatima.grounded && g.fatima.jumps<2){
          ctx.fillStyle="rgba(0,0,0,0.38)";
          ctx.beginPath(); ctx.roundRect(W-82,12,70,34,8); ctx.fill();
          ctx.fillStyle="#fff"; ctx.font="bold 15px 'Georgia',serif"; ctx.textAlign="center";
          ctx.fillText("↑ ×2", W-47, 35); ctx.textAlign="left";
        }
      }

      /* ════ OVERLAYS ════ */
      if(status==="idle"){
        ctx.fillStyle="rgba(0,22,50,0.54)"; ctx.fillRect(0,0,W,H);
        ctx.textAlign="center";
        ctx.fillStyle="#fff"; ctx.font="bold 54px 'Georgia',serif";
        ctx.fillText("🧀 Фатима", W/2, 128);
        ctx.fillStyle="#ffe566"; ctx.font="22px 'Georgia',serif";
        ctx.fillText("Собери все сырки!", W/2, 175);
        // controls card
        ctx.fillStyle="rgba(255,255,255,0.1)";
        ctx.beginPath(); ctx.roundRect(W/2-165,205,330,78,14); ctx.fill();
        ctx.strokeStyle="rgba(255,255,255,0.18)"; ctx.lineWidth=1;
        ctx.beginPath(); ctx.roundRect(W/2-165,205,330,78,14); ctx.stroke();
        ctx.fillStyle="rgba(255,255,255,0.9)"; ctx.font="16px 'Georgia',serif";
        ctx.fillText("Пробел / ↑ / Тап — прыжок", W/2, 237);
        ctx.fillText("Двойной прыжок — нажми ещё раз ✨", W/2, 262);
        // start btn
        ctx.fillStyle="rgba(76,175,80,0.88)";
        ctx.beginPath(); ctx.roundRect(W/2-100,300,200,52,16); ctx.fill();
        ctx.strokeStyle="rgba(255,255,255,0.25)"; ctx.lineWidth=2;
        ctx.beginPath(); ctx.roundRect(W/2-100,300,200,52,16); ctx.stroke();
        ctx.fillStyle="#fff"; ctx.font="bold 24px 'Georgia',serif";
        ctx.fillText("▶  Старт", W/2, 333);
        ctx.textAlign="left";
      }

      if(status==="dead"){
        ctx.fillStyle="rgba(10,16,30,0.76)"; ctx.fillRect(0,0,W,H);
        ctx.textAlign="center";
        ctx.fillStyle="#ef5350"; ctx.font="bold 50px 'Georgia',serif";
        ctx.fillText("Упала!", W/2, 115);
        // divider
        ctx.strokeStyle="rgba(255,255,255,0.2)"; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(W/2-140,138); ctx.lineTo(W/2+140,138); ctx.stroke();
        // score big
        ctx.fillStyle="#fff"; ctx.font="bold 38px 'Georgia',serif";
        ctx.fillText(`${Math.floor(g.score)}`, W/2, 182);
        ctx.fillStyle="rgba(255,255,255,0.48)"; ctx.font="15px 'Georgia',serif";
        ctx.fillText("очков", W/2, 206);
        // cheese
        ctx.fillStyle="#ffe566"; ctx.font="bold 20px 'Georgia',serif";
        ctx.fillText(`🧀 Сырков: ${g.cheeseCnt}`, W/2, 240);
        // best
        ctx.fillStyle="rgba(255,255,255,0.42)"; ctx.font="16px 'Georgia',serif";
        ctx.fillText(`Лучший: ${highScore}`, W/2, 268);
        // retry btn
        ctx.fillStyle="rgba(76,175,80,0.88)";
        ctx.beginPath(); ctx.roundRect(W/2-112,292,224,50,16); ctx.fill();
        ctx.strokeStyle="rgba(255,255,255,0.25)"; ctx.lineWidth=2;
        ctx.beginPath(); ctx.roundRect(W/2-112,292,224,50,16); ctx.stroke();
        ctx.fillStyle="#fff"; ctx.font="bold 21px 'Georgia',serif";
        ctx.fillText("🔄 Попробовать снова", W/2, 323);
        ctx.textAlign="left";
      }

      ctx.restore();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return ()=> cancelAnimationFrame(animId);
  }, [status, highScore]);

  /* ── canvas click ── */
  const handleClick = useCallback(()=>{
    const g = gameRef.current;
    if(!g) return;
    if(status==="idle"){
      g.alive=true; g.started=true; setStatus("playing");
    } else if(status==="dead"){
      gameRef.current = initState();
      gameRef.current.alive=true; gameRef.current.started=true;
      setScore(0); setCheeseCnt(0); setStatus("playing");
    } else if(status==="playing"){
      if(g.fatima.grounded){
        g.fatima.vy=JUMP1; g.fatima.grounded=false; g.fatima.jumps=1;
      } else if(g.fatima.jumps<2){
        g.fatima.vy=JUMP2; g.fatima.jumps=2;
        g.sparkles.push(...spawnSparkles(g.fatima.x+28, g.fatima.y+30, "#fff", 10));
      }
    }
  }, [status, initState]);

  return (
    <div style={outerS}>
      <canvas ref={canvasRef} width={W} height={H} onClick={handleClick} style={canvasS} />
      <p style={capS}>Пробел / ↑ / Тап — прыжок &nbsp;|&nbsp; Двойной прыжок — жми дважды &nbsp;|&nbsp; Собери 🧀 и ⭐</p>
    </div>
  );
}

const outerS = {minHeight:"100vh",background:"#0d1b2a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px 12px",fontFamily:"'Georgia',serif",userSelect:"none",WebkitUserSelect:"none"};
const canvasS = {borderRadius:16,boxShadow:"0 8px 40px rgba(0,0,0,0.5)",maxWidth:"100%",cursor:"pointer",touchAction:"none"};
const capS = {color:"rgba(255,255,255,0.42)",fontSize:14,marginTop:14,textAlign:"center",maxWidth:580};
