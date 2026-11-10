// Animations des exercices — Coach Foot
// Terrain 100 x 64. Bleu = ton équipe, rouge = adversaires, jaune = gardien, vert clair = joker.
const ANIM = (() => {
  const COL = { a:"#2563eb", b:"#e11d48", g:"#f2b632", j:"#d6f43a", n:"#ffffff" };
  const TXT = { a:"#fff", b:"#fff", g:"#1d2a05", j:"#1d2a05", n:"#0b3b27" };
  const NS = "http://www.w3.org/2000/svg";
  const cl = o => JSON.parse(JSON.stringify(o));
  const ease = t => t<.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2;

  // ---------- calcul des états successifs ----------
  function build(sc){
    let P = {}; for (const [id,p] of Object.entries(sc.players)) P[id] = {x:p[1], y:p[2]};
    let B = (sc.balls||[]).map(b => typeof b==="string" ? {o:b,x:0,y:0} : {o:null,x:b[0],y:b[1]});
    const place = (P,B) => B.forEach(b => { if (b.o && P[b.o]) { b.x = P[b.o].x+1.7; b.y = P[b.o].y+1.5; } });
    place(P,B); const S = [{P:cl(P), B:cl(B)}];
    for (const step of sc.steps){
      const NP = cl(P), NB = cl(B);
      for (const a of step) if (a[0]==="run"||a[0]==="drib") NP[a[1]] = {x:a[2], y:a[3]};
      for (const a of step){
        if (a[0]==="pass"){ const b = NB.find(b=>b.o===a[1]); if (b) b.o = a[2]; }
        if (a[0]==="shot"){ const b = NB.find(b=>b.o===a[1]); if (b){ b.o=null; b.x=a[2]; b.y=a[3]; } }
        if (a[0]==="take"){
          let b = a[2] ? NB.find(b=>b.o===a[2]) : null;
          if (!b){ const p = NP[a[1]]; let best=1e9; NB.forEach(x=>{ const d=(x.x-p.x)**2+(x.y-p.y)**2; if(!x.o && d<best){best=d;b=x;} }); }
          if (b) b.o = a[1];
        }
      }
      place(NP,NB); S.push({P:NP, B:NB}); P = NP; B = NB;
    }
    return S;
  }

  // ---------- dessin ----------
  const el = (tag, at, parent) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (parent) parent.appendChild(e); return e; };
  function drawField(svg, f){
    const g = el("g", {}, svg);
    el("rect", {width:100, height:64, fill:"#14774a"}, g);
    for (let x=0; x<100; x+=12.5) el("rect", {x, y:0, width:6.25, height:64, fill:"#118045"}, g);
    const L = {fill:"none", stroke:"#fff", "stroke-opacity":.75, "stroke-width":.5};
    const goal = (x, left) => { el("rect", {x:left?x-2.4:x, y:26.5, width:2.4, height:11, fill:"#fff", "fill-opacity":.9}, g); };
    if (f.t==="half" || f.t==="halfL"){
      const R = f.t==="half";
      el("rect", {x:3, y:3, width:94, height:58, ...L}, g);
      el("rect", {x:R?80:3, y:15, width:17, height:34, ...L}, g);
      el("rect", {x:R?91:3, y:24, width:6, height:16, ...L}, g);
      el("circle", {cx:R?86:14, cy:32, r:.6, fill:"#fff"}, g);
      goal(R?97:3, !R);
    }
    if (f.t==="full"){
      el("rect", {x:3, y:3, width:94, height:58, ...L}, g);
      el("line", {x1:50, y1:3, x2:50, y2:61, ...L}, g);
      el("circle", {cx:50, cy:32, r:8, ...L}, g);
      el("rect", {x:3, y:18, width:13, height:28, ...L}, g); el("rect", {x:84, y:18, width:13, height:28, ...L}, g);
      if (!f.noGoals){ goal(3, true); goal(97, false); }
    }
    if (f.t==="zone"){ const [x,y,w,h] = f.r; el("rect", {x, y, width:w, height:h, ...L, "stroke-dasharray":"1.5 1"}, g); [[x,y],[x+w,y],[x,y+h],[x+w,y+h]].forEach(([cx,cy])=>cone(g,cx,cy,"#ff8a00")); }
    if (f.circle){ const [cx,cy,r] = f.circle; el("circle", {cx, cy, r, ...L, "stroke-dasharray":"1.5 1"}, g); }
    (f.hl||[]).forEach(y => el("line", {x1:3, y1:y, x2:97, y2:y, stroke:"#fff", "stroke-opacity":.45, "stroke-width":.4, "stroke-dasharray":"2 1.5"}, g));
    (f.vl||[]).forEach(x => el("line", {x1:x, y1:3, x2:x, y2:61, stroke:"#fff", "stroke-opacity":.45, "stroke-width":.4, "stroke-dasharray":"2 1.5"}, g));
    (f.zones||[]).forEach(([x,y,w,h]) => el("rect", {x, y, width:w, height:h, ...L, "stroke-dasharray":"1.5 1"}, g));
    (f.cones||[]).forEach(([x,y,c]) => cone(g, x, y, c||"#ff8a00"));
    (f.mini||[]).forEach(([x,y,v]) => v ? el("rect", {x:x-3, y:y-1, width:6, height:2, fill:"#fff", "fill-opacity":.9}, g) : el("rect", {x:x-1, y:y-3, width:2, height:6, fill:"#fff", "fill-opacity":.9}, g));
    (f.labels||[]).forEach(([x,y,t]) => { const tx = el("text", {x, y, "font-size":3, "text-anchor":"middle", fill:"#fff", "font-weight":700, "fill-opacity":.85, "font-family":"sans-serif"}, g); tx.textContent = t; });
  }
  function cone(g, x, y, c){ el("polygon", {points:`${x-1.2},${y+1} ${x+1.2},${y+1} ${x},${y-1.4}`, fill:c}, g); }

  function mount(box, sc){
    const S = build(sc);
    const D = sc.d || 1250, HOLD = 1400;
    box.innerHTML = "";
    const wrap = document.createElement("div"); wrap.className = "anim"; box.appendChild(wrap);
    const svg = el("svg", {viewBox:"0 0 100 64", class:"anim-svg", role:"img", "aria-label":"Animation de l'exercice"}); wrap.appendChild(svg);
    const defs = el("defs", {}, svg);
    const mk = (id, c) => { const m = el("marker", {id, viewBox:"0 0 6 6", refX:4.5, refY:3, markerWidth:3.2, markerHeight:3.2, orient:"auto"}, defs); el("path", {d:"M0,0 L6,3 L0,6 z", fill:c}, m); };
    const uidp = "m" + Math.random().toString(36).slice(2,7);
    mk(uidp+"w","#ffffff"); mk(uidp+"y","#ffe14d"); Object.entries(COL).forEach(([k,c]) => mk(uidp+k, c));
    drawField(svg, sc.f);
    const gA = el("g", {}, svg), gP = el("g", {}, svg), gB = el("g", {}, svg);
    const flash = el("text", {x:50, y:12, "text-anchor":"middle", "font-size":7, "font-weight":900, fill:"#ffe14d", stroke:"#0b3b27", "stroke-width":.6, "paint-order":"stroke", opacity:0, "font-family":"sans-serif"}, svg);
    const pe = {};
    for (const [id,p] of Object.entries(sc.players)){
      const g = el("g", {}, gP);
      el("circle", {r:2.7, fill:COL[p[0]], stroke:"#fff", "stroke-width":.5}, g);
      const t = el("text", {y:1, "text-anchor":"middle", "font-size":2.6, "font-weight":800, fill:TXT[p[0]], "font-family":"sans-serif"}, g); t.textContent = p[3] || "";
      pe[id] = g;
    }
    const be = S[0].B.map(() => el("circle", {r:1.25, fill:"#fff", stroke:"#111", "stroke-width":.35}, gB));
    const cap = document.createElement("div"); cap.className = "anim-cap"; wrap.appendChild(cap);
    const bar = document.createElement("div"); bar.className = "anim-bar";
    bar.innerHTML = `<button data-a="play" aria-label="Pause">❚❚</button><button data-a="replay" aria-label="Recommencer">↺</button><button data-a="speed">1×</button><div class="anim-prog"><i></i></div>`;
    wrap.appendChild(bar);
    const leg = document.createElement("div"); leg.className = "anim-leg";
    leg.innerHTML = `<span><b style="background:${COL.a}"></b>Ton équipe</span><span><b style="background:${COL.b}"></b>Adversaire</span><span><b style="background:${COL.g}"></b>Gardien</span>${Object.values(sc.players).some(p=>p[0]==="j")?`<span><b style="background:${COL.j}"></b>Joker</span>`:""}<span><i class="l pass"></i>Passe</span><span><i class="l run"></i>Course</span><span><i class="l drib"></i>Conduite</span>`;
    wrap.appendChild(leg);

    let step = 0, t0 = performance.now(), playing = true, speed = 1, raf = 0, pausedAt = 0, lastStep = -1;
    const N = sc.steps.length;
    function arrows(i){
      gA.innerHTML = ""; if (i >= N) return;
      const A = S[i], Bn = S[i+1];
      for (const a of sc.steps[i]){
        const k = a[0];
        if (k==="run" || k==="drib"){
          const p0 = A.P[a[1]], p1 = Bn.P[a[1]]; if (!p0 || (Math.hypot(p1.x-p0.x, p1.y-p0.y) < 2)) continue;
          const t = sc.players[a[1]][0];
          el("line", {x1:p0.x, y1:p0.y, x2:p1.x, y2:p1.y, stroke:k==="drib"?"#fff":COL[t], "stroke-width":k==="drib"?.7:.6, "stroke-dasharray":k==="drib"?".4 1":"1.6 1", "stroke-linecap":"round", "marker-end":`url(#${uidp}${k==="drib"?"w":t})`, opacity:.95}, gA);
        }
        if (k==="pass" || k==="shot"){
          const b0 = A.B.find(b=>b.o===a[1]); if (!b0) continue;
          const idx = A.B.indexOf(b0), b1 = Bn.B[idx];
          el("line", {x1:b0.x, y1:b0.y, x2:b1.x, y2:b1.y, stroke:k==="shot"?"#ffe14d":"#fff", "stroke-width":k==="shot"?.8:.6, "marker-end":`url(#${uidp}${k==="shot"?"y":"w"})`, opacity:.9}, gA);
        }
      }
    }
    function setCap(i){ const c = (sc.caps||[])[Math.min(i, N-1)]; cap.textContent = c || ""; cap.style.visibility = c ? "visible" : "hidden"; }
    function render(i, u){
      const A = S[i], Bn = S[Math.min(i+1, S.length-1)], e = ease(u);
      for (const id in pe){ const p0 = A.P[id], p1 = Bn.P[id]; pe[id].setAttribute("transform", `translate(${p0.x+(p1.x-p0.x)*e},${p0.y+(p1.y-p0.y)*e})`); }
      A.B.forEach((b0,k) => { const b1 = Bn.B[k]; be[k].setAttribute("cx", b0.x+(b1.x-b0.x)*e); be[k].setAttribute("cy", b0.y+(b1.y-b0.y)*e); });
      const goal = i < N && sc.steps[i].some(a => a[0]==="shot") && sc.goal !== false;
      flash.textContent = (sc.flash && sc.flash[i]) || (goal ? "BUT !" : "");
      flash.setAttribute("opacity", flash.textContent && u > .8 ? 1 : 0);
      bar.querySelector(".anim-prog i").style.width = ((i + u) / N * 100) + "%";
    }
    function frame(now){
      const el2 = Math.max(0, (now - t0) * speed);
      let i = Math.floor(el2 / D), u = (el2 % D) / D;
      if (i >= N){ if (el2 > N*D + HOLD){ t0 = now; i = 0; u = 0; } else { i = N-1; u = 1; } }
      if (i !== lastStep){ arrows(i); setCap(i); lastStep = i; }
      const mv = u < .22 ? 0 : (u - .22) / .78;
      render(i, mv);
      raf = requestAnimationFrame(frame);
    }
    bar.onclick = ev => {
      const b = ev.target.closest("button"); if (!b) return;
      if (b.dataset.a === "play"){ if (playing){ cancelAnimationFrame(raf); pausedAt = performance.now(); b.textContent = "▶"; } else { t0 += performance.now() - pausedAt; raf = requestAnimationFrame(frame); b.textContent = "❚❚"; } playing = !playing; }
      if (b.dataset.a === "replay"){ t0 = performance.now(); lastStep = -1; if (!playing){ playing = true; bar.querySelector('[data-a="play"]').textContent = "❚❚"; raf = requestAnimationFrame(frame); } }
      if (b.dataset.a === "speed"){ const now = performance.now(); const el2 = (now - t0) * speed; speed = speed === 1 ? .5 : 1; t0 = now - el2 / speed; b.textContent = speed === 1 ? "1×" : "½×"; }
    };
    render(0, 0); arrows(0); setCap(0);
    raf = requestAnimationFrame(frame);
    return { stop(){ cancelAnimationFrame(raf); } };
  }

  // ---------- scénarios types ----------
  const T = {};
  T.rondo = (o={}) => {
    const z = o.big ? [16,6,68,52] : (o.three ? [20,6,60,52] : [28,10,44,44]);
    const cx = z[0]+z[2]/2, cy = z[1]+z[3]/2, pl = {};
    let att = [[cx,z[1]],[z[0]+z[2],cy],[cx,z[1]+z[3]],[z[0],cy]];
    if (o.big) att = [[26,14],[74,14],[74,50],[26,50],[50,22],[50,44]];
    if (o.three) att = [[30,12],[70,12],[70,52],[30,52],[50,10],[50,54]];
    att.forEach((p,i) => pl["a"+i] = [o.three && i>=4 ? "j" : "a", p[0], p[1], ""+(i+1)]);
    if (o.pivot) pl.p = ["j", cx, cy, "P"];
    if (o.big){ pl.j0 = ["j", 20, 32, "J"]; pl.j1 = ["j", 80, 32, "J"]; }
    const defs = o.big ? [[44,30],[56,34],[40,40],[60,24]] : (o.three ? [[44,28],[56,36],[50,32]] : [[cx-4,cy-3],[cx+4,cy+3]]);
    defs.forEach((p,i) => pl["d"+i] = ["b", p[0], p[1], ""]);
    let seq = o.big ? ["a0","a4","a1","j1","a2","a5","a3","j0","a0"] : o.three ? ["a0","a1","a4","a2","a3","a5","a0"] : ["a0","a1","a2","p","a3","a0","a1"];
    seq = seq.filter(x => pl[x]);
    const steps = [];
    for (let i=1; i<seq.length; i++){
      const st = [["pass", seq[i-1], seq[i]]];
      defs.forEach((d,k) => { const tg = pl[seq[Math.min(i+k, seq.length-1)]]; const f = k===0 ? .62 : .38; st.push(["run", "d"+k, cx+(tg[1]-cx)*f+(k%2?2.5:-2.5), cy+(tg[2]-cy)*f+(k>1?3:0)]); });
      steps.push(st);
    }
    const caps = seq.slice(1).map((s,i) => i===0 ? "On fait circuler le ballon, 2 touches maximum" : (s==="p" ? "On passe par le pivot au centre" : (i===seq.length-2 ? "Les défenseurs pressent à deux sur le porteur" : "Toujours 2 solutions de passe pour le porteur")));
    if (o.cp){
      steps.push([["pass", seq[seq.length-1], "d0"], ["run","d0", cx+(pl[seq[seq.length-1]][1]-cx)*.45, cy+(pl[seq[seq.length-1]][2]-cy)*.45]]);
      const last = seq[seq.length-1];
      steps.push([["run", last, cx+(pl[last][1]-cx)*.6, cy+(pl[last][2]-cy)*.6], ["run","a2", cx+2, cy+6], ["drib","d0", cx-2, cy]]);
      steps.push([["run", last, cx-1, cy-1], ["take", last, "d0"], ["run","a2", cx+1, cy+3]]);
      caps.push("Ballon perdu…", "Contre-pressing : on saute sur le porteur", "Récupéré en moins de 5 secondes !");
    }
    return {f:{t:"zone", r:z}, players:pl, balls:[seq[0]], steps, caps};
  };
  T.dribble = (o={}) => {
    const pl = {}, balls = [], n = o.n || 6, pos = [[24,16],[50,14],[76,18],[26,46],[52,48],[74,44]];
    for (let i=0; i<n; i++){ pl["a"+i] = ["a", pos[i][0], pos[i][1], ""+(i+1)]; balls.push("a"+i); }
    const tgts = [[[40,26],[64,24],[60,40],[38,40],[66,32],[34,30]],[[58,40],[36,38],[42,22],[64,26],[30,22],[70,46]],[[30,30],[70,30],[50,46],[50,20],[44,36],[58,28]],[[24,16],[50,14],[76,18],[26,46],[52,48],[74,44]]];
    const sc = o.small ? .25 : 1;
    const steps = tgts.map(t => t.slice(0,n).map((p,i) => ["drib", "a"+i, pos[i][0]+(p[0]-pos[i][0])*sc, pos[i][1]+(p[1]-pos[i][1])*sc]));
    const cones = o.cones ? [[38,20,"#ff3b3b"],[62,20,"#3b82f6"],[50,32,"#ffd400"],[36,44,"#3b82f6"],[64,44,"#ff3b3b"],[50,52,"#ffd400"]] : [];
    return {f:{t:"zone", r:[14,6,72,52], cones}, players:pl, balls, steps, caps:o.small ? ["Chacun son ballon, ballon près du pied","Petites touches, regard sur le ballon","Pied droit, pied gauche…","On recommence"] : ["Conduite libre, tête levée","On change de direction souvent","On utilise intérieur et extérieur du pied","Et on recommence !"]};
  };
  T.slalom = (o={}) => {
    const pl = {a0:["a",10,30,"1"], a1:["a",6,40,"2"], g:["g",94,32,"G"]};
    const cones = [22,30,38,46,54].map(x => [x,30]);
    const pts = [[22,25],[30,35],[38,25],[46,35],[54,25],[68,30]];
    const steps = pts.map(p => [["drib","a0",p[0],p[1]]]);
    steps.push([["shot","a0",97,28],["run","g",94,29]]);
    steps.push([["drib","a1",22,40],["run","a0",8,22]]);
    return {f:{t:"half", cones}, players:pl, balls:["a0","a1"], steps, d:900, caps:["Petites touches dans le slalom","Pied droit, pied gauche","On garde le ballon près","Toujours près des plots","Dernier plot…","Grande touche dans l'espace libre","Tête levée, puis frappe !","Le suivant part, le tireur va au bout de la file"]};
  };
  T.shape = (o={}) => {
    const pts = o.s==="diamond" ? [[50,10],[80,32],[50,54],[20,32]] : [[50,10],[76,50],[24,50]];
    const n = pts.length, c = [50,32];
    const qpos = (k, q) => { const p = pts[k], dx = p[0]-c[0], dy = p[1]-c[1], L = Math.hypot(dx,dy)||1; return [p[0]+dx/L*5*q, p[1]+dy/L*5*q]; };
    const pl = {}, occ = pts.map(() => []);
    for (let i=0; i<=n; i++){ const k = i % n, q = occ[k].length, pp = qpos(k, q); pl["a"+i] = ["a", pp[0], pp[1], ""+(i+1)]; occ[k].push("a"+i); }
    const steps = [], caps = [];
    for (let s=0; s<n+2; s++){
      const k = s % n, k2 = (k+1) % n, from = occ[k][0], to = occ[k2][0];
      const st = [["pass", from, to]];
      occ[k].shift(); occ[k2].push(from);
      const pp = qpos(k2, occ[k2].length-1); st.push(["run", from, pp[0], pp[1]]);
      occ[k].forEach((id,q) => { const r = qpos(k, q); st.push(["run", id, r[0], r[1]]); });
      steps.push(st); caps.push(s===0 ? "Passe… et je suis ma passe" : (s%2 ? "Contrôle orienté vers le plot suivant" : "Le suivant avance sur le plot"));
    }
    return {f:{t:"zone", r:[12,2,76,60], cones:pts}, players:pl, balls:[occ[0][0] ? "a0" : "a0"], steps, caps};
  };
  T.pairs = () => {
    const pl = {}, balls = []; [25,50,75].forEach((x,i) => { pl["a"+i] = ["a", x, 16, ""+(i+1)]; pl["c"+i] = ["a", x, 48, ""+(i+1)]; balls.push("a"+i); });
    const steps = []; let dx = 0;
    for (let k=0; k<4; k++){ dx = k%2 ? -8 : 8; const st = []; [0,1,2].forEach(i => { const f = k%2 ? "c"+i : "a"+i, t = k%2 ? "a"+i : "c"+i; st.push(["pass", f, t]); }); [0,1,2].forEach(i => { st.push(["run","a"+i, [25,50,75][i]+(k%2?0:8), 16]); st.push(["run","c"+i, [25,50,75][i]+(k%2?0:8), 48]); }); steps.push(st); }
    return {f:{t:"zone", r:[10,8,80,48]}, players:pl, balls, steps, caps:["Passes en se déplaçant en pas chassés","Appuis légers, pied d'appui vers la cible","On communique avec son partenaire","Et retour !"]};
  };
  T.oneTwo = () => ({f:{t:"half", cones:[[60,40]]}, players:{a0:["a",18,40,"1"], a1:["a",48,24,"2"], a2:["a",10,48,"3"], g:["g",94,32,"G"]}, balls:["a0"],
    steps:[[["pass","a0","a1"]], [["run","a0",68,44],["pass","a1","a0"]], [["shot","a0",97,35],["run","g",94,34]], [["run","a1",14,44],["run","a0",48,24],["run","a2",18,40]]],
    caps:["Passe au pivot","Appel au moment de la passe : une-deux en une touche","Frappe cadrée !","Rotation : le passeur devient pivot"]});
  T.thirdMan = () => ({f:{t:"zone", r:[10,6,82,52]}, players:{A:["a",20,48,"A"], B:["a",52,32,"B"], C:["a",28,18,"C"], D:["a",84,22,"D"], d:["b",58,26,""]}, balls:["A"],
    steps:[[["pass","A","B"],["run","C",40,30]], [["pass","B","C"],["run","C",46,40],["run","d",56,32]], [["pass","C","D"],["run","B",66,40],["run","A",34,44]], [["drib","D",88,32]]],
    caps:["A joue dans les pieds de B (dos au jeu)","B remet en une touche à C qui arrive lancé","C, face au jeu, joue vers l'avant : c'est le 3ᵉ homme !","On enchaîne vers l'avant"]});
  T.duel = () => ({f:{t:"zone", r:[16,16,68,32], mini:[[16,32],[84,32]]}, players:{a0:["a",24,32,"1"], d:["b",64,32,""]}, balls:["a0"],
    steps:[[["drib","a0",44,32],["run","d",58,32]], [["drib","a0",51,27],["run","d",55,29]], [["drib","a0",57,38],["run","d",55,31]], [["drib","a0",72,37],["run","d",63,35]], [["shot","a0",84,32]]],
    caps:["J'attaque le défenseur","Feinte vers la gauche…","Crochet de l'autre côté !","Changement de rythme","But dans le petit but !"]});
  T.protect = () => ({f:{t:"zone", r:[24,6,52,52], circle:[50,32,20]}, players:{a0:["a",50,32,"1"], d:["b",40,24,""]}, balls:["a0"], goal:false,
    steps:[[["run","d",45,36],["drib","a0",54,30]], [["run","d",57,22],["drib","a0",50,38]], [["run","d",58,41],["drib","a0",45,30]], [["run","d",41,33],["drib","a0",54,34]]],
    caps:["Le corps entre le ballon et l'adversaire","Je tourne pour garder le ballon loin de lui","Semelle pour contrôler","Je tiens 30 secondes !"]});
  T.overload = (o={}) => {
    if (o.n===3) return {f:{t:"half"}, players:{a0:["a",40,16,"1"], a1:["a",40,48,"2"], a2:["a",36,32,"3"], d0:["b",72,28,""], d1:["b",72,40,""], g:["g",94,32,"G"]}, balls:["a2"],
      steps:[[["drib","a2",56,32],["run","a0",58,16],["run","a1",58,48],["run","d0",68,30],["run","d1",68,36]], [["pass","a2","a1"],["run","a1",66,48],["run","d1",70,42],["run","a2",64,30]], [["drib","a1",76,46],["run","a0",80,22],["run","d0",74,32]], [["pass","a1","a0"],["run","a0",84,26],["run","d1",78,42]], [["shot","a0",97,29],["run","g",94,30]]],
      caps:["Contre-attaque à 3 contre 2 : la 1ʳᵉ passe va vers l'avant","Le porteur fixe un défenseur et ouvre sur le côté","Les autres font des appels croisés","Centre en retrait au second poteau","But !"]};
    return {f:{t:"half"}, players:{a0:["a",40,22,"1"], a1:["a",40,44,"2"], d0:["b",72,32,""], g:["g",94,32,"G"]}, balls:["a0"],
      steps:[[["drib","a0",58,26],["run","a1",56,44],["run","d0",66,29]], [["pass","a0","a1"],["run","a1",70,44],["run","d0",70,37]], [["drib","a1",82,40],["run","a0",84,24]], [["shot","a1",97,35],["run","g",94,34]]],
      caps:["Le porteur attaque le défenseur pour le fixer","Le défenseur est fixé : passe au partenaire libre","On fonce vers le but","Frappe !"]};
  };
  T.finish = () => ({f:{t:"half", cones:[[42,22],[50,26],[58,22],[42,42],[50,38],[58,42]]}, players:{a0:["a",20,22,"1"], a1:["a",20,42,"2"], g:["g",94,32,"G"]}, balls:["a0","a1"], d:1000,
    steps:[[["drib","a0",38,26]], [["drib","a0",50,20]], [["drib","a0",66,26]], [["shot","a0",97,27],["run","g",94,29]], [["drib","a1",44,38]], [["drib","a1",62,40]], [["shot","a1",97,37],["run","g",94,35]]],
    caps:["Conduite rapide","Slalom entre les plots","Dernière touche pour se mettre sur le bon pied","Frappe, côté du but !","À l'autre colonne, pied gauche","On se prépare…","Frappe !"]});
  T.beret = (o={}) => {
    const pl = {}; [35,50,65].forEach((x,i) => { pl["a"+i] = ["a", x, 8, ""+(i+1)]; pl["b"+i] = ["b", x, 56, ""+(i+1)]; });
    return {f:{t:"zone", r:[6,4,88,56], mini:[[6,32],[94,32]]}, players:pl, balls:[[50,32]], flash:["« Numéro 2 ! »"],
      steps:[[], [["run","a1",48,29],["run","b1",52,35],["take","a1"]], [["drib","a1",72,26],["run","b1",64,32]], [["drib","a1",86,30],["run","b1",76,32]], [["shot","a1",94,32]]],
      caps:["Le coach annonce un numéro","Les deux numéros 2 foncent sur le ballon","Le plus rapide protège et attaque","Il garde le ballon avec le corps","But !"]};
  };
  T.crosses = (o={}) => {
    const pl = {a0:["a",62,7,"1"], a1:["a",56,24,"2"], a2:["a",52,40,"3"], g:["g",94,32,"G"]};
    if (o.n===3 || o.combo) pl.a3 = ["a",48,32,"4"];
    if (o.combo){ pl.a0 = ["a",44,10,"1"]; }
    const steps = [];
    if (o.combo){ steps.push([["pass","a0","a3"]]); steps.push([["pass","a3","a0"],["run","a0",70,8]]); steps[1].push(["run","a3",60,30]); }
    steps.push([["drib","a0",84,8]]);
    steps.push([["run","a1",88,28],["run","a2",90,40],...(pl.a3?[["run","a3",80,33]]:[]),["pass","a0",o.n===3?"a2":"a1"]]);
    steps.push([["shot",o.n===3?"a2":"a1",97,o.n===3?37:30],["run","g",94,o.n===3?35:30]]);
    const caps = o.combo ? ["Le milieu joue dans les pieds…","…remise pour l'ailier lancé","Débordement","Les attaquants attaquent la surface : 1ᵉʳ poteau, 2ᵉ poteau, retrait","But !"] : ["L'ailier déborde le long de la ligne","Centre ! Un attaquant au 1ᵉʳ poteau, un au 2ᵉ" + (pl.a3?", un en retrait":""),"Reprise en une touche : but !"];
    return {f:{t:"half"}, players:pl, balls:["a0"], steps, caps};
  };
  T.switchZones = () => ({f:{t:"zone", r:[4,4,92,56], zones:[[8,16,26,32],[66,16,26,32]]}, players:{a0:["a",12,20,"1"], a1:["a",30,26,"2"], a2:["a",18,44,"3"], a3:["a",70,20,"4"], a4:["a",88,32,"5"], a5:["a",74,44,"6"], d0:["b",22,30,""], d1:["b",78,32,""]}, balls:["a0"],
    steps:[[["pass","a0","a1"],["run","d0",26,26]], [["pass","a1","a2"],["run","d0",22,38]], [["pass","a2","a4"],["run","d1",82,34]], [["pass","a4","a3"],["run","d1",74,26]], [["pass","a3","a5"],["run","d1",74,38]]],
    caps:["3 passes dans le carré…","…pour attirer le défenseur","Changement de jeu : passe longue !","Contrôle amorti dans l'autre carré","Et on recommence de l'autre côté"]});
  T.lanes = (o={}) => {
    const hl = [14.6,26.2,37.8,49.4];
    const pl = {g0:["g",6,32,"G"], a0:["a",22,22,"2"], a1:["a",22,42,"3"], a2:["a",36,32,"6"], a3:["a",44,8,"7"], a4:["a",44,56,"11"], a5:["a",58,20,"8"], a6:["a",66,32,"9"],
      b0:["b",60,10,""], b1:["b",60,26,""], b2:["b",60,40,""], b3:["b",74,20,""], b4:["b",74,44,""], g1:["g",94,32,"G"]};
    return {f:{t:"full", hl}, players:pl, balls:["a0"],
      steps:[[["pass","a0","a5"],["run","b1",56,22],["run","b0",54,12],["run","b3",70,16]], [["pass","a5","a3"],["run","a5",54,28],["run","b0",48,10],["run","b1",52,18],["run","b2",58,30]], [["pass","a3","a2"],["run","b2",52,30],["run","b4",70,36],["run","a4",58,56]], [["pass","a2","a4"],["run","a4",64,56],["run","b4",72,46]], [["drib","a4",84,54],["run","a6",84,34],["run","a5",76,26]], [["pass","a4","a6"],["run","a6",88,34]], [["shot","a6",97,30],["run","g1",94,31]]],
      caps:["Un joueur par couloir, collés aux lignes","On attire l'adversaire du côté fort…","…on revient dans l'axe","Renversement vers le côté faible !","Le joueur du côté faible attaque l'espace","Centre en retrait","But !"]};
  };
  T.buildUp = (o={}) => {
    const pl = {g:["g",6,32,"G"], a0:["a",20,20,"2"], a1:["a",20,44,"3"], a2:["a",32,32,"6"], b0:["b",36,24,""], b1:["b",36,40,""]};
    const f = {t:"halfL", cones:[[60,14],[60,22],[60,42],[60,50]]};
    const steps = [[["run","a0",16,9],["run","a1",16,55],["run","a2",28,32]], [["pass","g","a1"],["run","b1",26,48],["run","b0",32,34]]];
    const caps = ["Le gardien a le ballon : les défenseurs s'écartent","Relance courte au sol"];
    if (o.press){
      steps.push([["pass","a1","b0"],["run","b0",24,40],["run","b1",20,52]], [["drib","b0",14,36],["run","a2",22,38]], [["shot","b0",3,34],["run","g",6,33]]);
      caps.push("Déclencheur : passe difficile… interception !","Récupération haute : on attaque tout de suite","But !");
    } else {
      steps.push([["pass","a1","a2"],["run","a2",36,24],["run","b1",22,52],["run","b0",30,30]], [["drib","a2",50,20],["run","b0",40,28]], [["drib","a2",66,18],["run","a0",40,10]]);
      caps.push("Le milieu se montre entre les deux attaquants","Il se retourne et joue vers l'avant","Porte franchie !");
    }
    return {f, players:pl, balls:["g"], steps, caps, goal:!!o.press, flash:o.press?null:[null,null,null,null,"PORTE !"]};
  };
  T.match = (o={}) => {
    const pl = {g0:["g",6,32,"G"], a0:["a",22,14,"2"], a1:["a",22,50,"3"], a2:["a",38,32,"6"], a3:["a",56,20,"7"], a4:["a",56,46,"11"], a5:["a",66,32,"9"],
      g1:["g",94,32,"G"], b0:["b",80,16,""], b1:["b",80,48,""], b2:["b",68,24,""], b3:["b",66,40,""], b4:["b",48,28,""], b5:["b",44,42,""]};
    const f = o.mini ? {t:"full", noGoals:true, mini:[[3,14],[3,50],[97,14],[97,50]]} : o.gates ? {t:"full", noGoals:true, cones:[[3,12],[3,20],[3,44],[3,52],[97,12],[97,20],[97,44],[97,52]]} : {t:"full"};
    if (o.mini || o.gates){ delete pl.g0; delete pl.g1; }
    const start = pl.g0 ? "g0" : "a0";
    let steps, caps;
    if (o.press){
      steps = [[["pass", start, "a1"], ["run","b5",34,44], ["run","b4",36,30]], [["pass","a1","b5"],["run","b5",30,46],["run","b4",30,38]], [["run","a1",28,50],["run","a2",32,42],["drib","b5",24,40]], [["run","a1",26,42],["take","a1","b5"],["run","a2",34,38]], [["pass","a1","a2"],["run","a2",44,36],["run","a4",64,46]], [["pass","a2","a4"],["run","a4",76,44],["run","b1",78,44]], [["drib","a4",86,40],["run","a5",86,30]], [["pass","a4","a5"]], [["shot","a5",97,o.mini?14:30]]];
      caps = ["Relance","Ballon perdu !","Contre-pressing : les deux plus proches sautent","Récupéré en moins de 5 secondes !","1ʳᵉ passe vers l'avant","On attaque vite","Débordement","Centre en retrait","But !"];
    } else {
      steps = [[["pass", start, o.mini||o.gates ? "a2" : "a0"], ["run","b5",36,38]],
        [["pass", o.mini||o.gates ? "a2" : "a0", o.mini||o.gates ? "a3" : "a2"], ["run","a2",40,24], ["run","b4",46,26]],
        [["pass", o.mini||o.gates ? "a3" : "a2", o.mini||o.gates ? "a2" : "a3"], ["run","a3",62,16], ["run","a2",54,30], ["run","b2",64,20]],
        [["pass", o.mini||o.gates ? "a2" : "a3", o.mini||o.gates ? "a4" : "a2"], ["run","a2",66,30], ["run","a4",70,48], ["run","b3",70,38]],
        [["drib", o.mini||o.gates ? "a4" : "a2", o.mini||o.gates ? 84 : 80, o.mini||o.gates ? 50 : 30], ["run","b2",74,28], ["run","a5",82,22]],
        [["shot", o.mini||o.gates ? "a4" : "a2", 97, o.gates ? 48 : (o.mini ? 50 : 29)], ...(pl.g1 ? [["run","g1",94,30]] : [])]];
      caps = [o.mini||o.gates ? "On construit depuis l'arrière" : "Relance courte du gardien", "On cherche le joueur entre les lignes", "Une-deux pour éliminer", "Le 3ᵉ homme arrive lancé", o.mini ? "Le côté faible est libre : on y va !" : "On attaque l'espace", o.gates ? "Porte franchie !" : "But !"];
    }
    return {f, players:pl, balls:[start], steps, caps, d:1150};
  };
  T.counter = () => ({f:{t:"zone", r:[16,6,68,52], mini:[[16,10],[84,10],[16,54],[84,54]]}, players:{a0:["a",28,16,"1"], a1:["a",70,16,"2"], a2:["a",70,46,"3"], a3:["a",30,46,"4"], j:["j",50,32,"J"], b0:["b",46,22,""], b1:["b",58,38,""], b2:["b",42,40,""]}, balls:["a0"],
    steps:[[["pass","a0","a1"],["run","b0",56,20]], [["pass","a1","j"],["run","b1",54,34]], [["pass","j","b2"],["run","b2",40,34]], [["run","a3",36,38],["run","j",44,34],["drib","b2",34,30]], [["run","a3",32,32],["take","a3","b2"],["run","j",38,30]], [["drib","a3",22,16]], [["shot","a3",16,10]]],
    caps:["On garde le ballon","On joue par le joker","Ballon perdu !","Les deux plus proches sautent sur le porteur","Récupéré en moins de 5 secondes : 1 point","On file vers un petit but","But !"]});
  T.block = () => {
    const pl = {g:["g",6,32,"G"], d0:["b",24,10,""], d1:["b",24,22,""], d2:["b",24,32,""], d3:["b",24,42,""], d4:["b",24,54,""], a0:["a",52,8,"1"], a1:["a",58,22,"2"], a2:["a",62,36,"3"], a3:["a",56,52,"4"], a4:["a",40,16,"5"], a5:["a",42,46,"6"]};
    const shift = dy => ["d0","d1","d2","d3","d4"].map((d,i) => ["run", d, 24, [10,22,32,42,54][i]*.6+12.8+dy]);
    return {f:{t:"halfL"}, players:pl, balls:["a2"],
      steps:[[["pass","a2","a1"], ...shift(-4)], [["pass","a1","a0"], ...shift(-9)], [["pass","a0","a2"], ...shift(0)], [["pass","a2","a3"], ...shift(9)], [["pass","a3","d4"], ["run","d4",28,52]], [["drib","d4",50,52], ["run","d3",40,40], ["run","a3",44,52]]],
      caps:["Le bloc reste serré, 15 m maximum entre les lignes","Tout le bloc coulisse côté ballon","On se recentre quand le ballon revient dans l'axe","On coulisse de l'autre côté","Interception !","Contre-attaque"], goal:false};
  };
  T.sprint = (o={}) => {
    const ys = [14,26,38,50], pl = {}, balls = [];
    ys.forEach((y,i) => { pl["a"+i] = ["a", 12, y, ""+(i+1)]; if (o.ball) balls.push("a"+i); });
    const k = o.ball ? "drib" : "run";
    let steps, caps;
    if (o.gammes){
      steps = [ys.map((y,i)=>["run","a"+i,40,y]), ys.map((y,i)=>["run","a"+i,12,y]), ys.map((y,i)=>["run","a"+i,70+(i%2?-4:3),y]), ys.map((y,i)=>["run","a"+i,12,y])];
      caps = ["Aller : montées de genoux","Retour en trottinant","Accélération progressive sur 20 m","Récupération"];
    } else {
      steps = [[], ys.map((y,i)=>[k,"a"+i,[72,66,70,64][i],y]), ys.map((y,i)=>[k,"a"+i,[80,78,80,77][i],y]), ys.map((y,i)=>["run","a"+i,12,y])];
      caps = ["Prêts… attention au signal !","SPRINT !","Départ explosif, petits appuis puis grandes foulées","Retour au calme, récupération complète"];
    }
    return {f:{t:"zone", r:[8,6,78,52], cones:ys.flatMap(y=>[[8,y],[74,y]])}, players:pl, balls, steps, caps, flash:o.gammes?null:["",o.ball?"":"GO !"], goal:false};
  };
  T.circuit = () => {
    const st = [[22,16],[50,12],[78,16],[78,48],[50,52],[22,48]], pl = {};
    st.forEach((p,i) => pl["a"+i] = ["a", p[0], p[1]+5, ""+(i+1)]);
    const steps = [1,2,3].map(r => st.map((p,i) => ["run","a"+i, st[(i+r)%6][0], st[(i+r)%6][1]+5]));
    steps.unshift([]);
    return {f:{t:"zone", r:[8,4,84,56], labels:st.map((p,i)=>[p[0],p[1]-2.5,["Gainage","Latéral","Équilibre","Squat","Fentes","Pont"][i]]), cones:st}, players:pl, balls:[], steps, caps:["40 secondes d'effort à chaque atelier","Rotation vers l'atelier suivant","On garde la qualité du geste","2 tours au total"], goal:false};
  };
  T.gk = (o={}) => {
    if (o.cross) return {f:{t:"halfL"}, players:{g:["g",6,32,"G"], a0:["a",34,8,"1"], a1:["a",30,32,"9"], a2:["a",44,54,"2"]}, balls:["a0"],
      steps:[[["drib","a0",20,6]], [["pass","a0","g"],["run","g",12,26],["run","a1",14,30]], [["pass","g","a2"],["run","a2",40,56]]], caps:["Le centreur déborde","Le gardien annonce « gardien ! » et capte au point le plus haut","Relance rapide vers l'ailier"], goal:false};
    if (o.dist) return {f:{t:"halfL", cones:[[30,8,"#ff3b3b"],[30,56,"#3b82f6"],[40,32,"#ffd400"]]}, players:{g:["g",6,32,"G"], a0:["a",24,10,"2"], a1:["a",24,54,"3"], a2:["a",36,32,"6"], c:["n",50,20,"C"], b:["b",30,22,""]}, balls:["c"],
      steps:[[["pass","c","g"]], [["pass","g","a1"],["run","b",28,44]], [["pass","a1","g"],["run","b",24,30]], [["pass","g","a2"],["run","a2",38,28]]], caps:["Le coach envoie le ballon","Contrôle orienté, passe au sol vers le joueur libre","Remise au gardien","L'attaquant ferme un côté : on joue de l'autre"], goal:false};
    return {f:{t:"halfL"}, players:{g:["g",6,32,"G"], a0:["a",28,32,"1"]}, balls:["a0"], goal:false, flash:["","ARRÊT !","","ARRÊT !"],
      steps:[[["drib","a0",22,30]], [["shot","a0",5,26],["run","g",6,26],["take","g"]], [["pass","g","a0"],["run","g",6,32],["run","a0",24,34]], [["shot","a0",5,39],["run","g",6,38],["take","g"]], [["pass","g","a0"],["run","g",6,32]]],
      caps:["Position de base : fléchi, sur l'avant des pieds","Plongeon : les mains en W derrière le ballon","On se relève vite et on relance","De l'autre côté !","Se replacer au centre"]};
  };
  T.circle = (o={}) => {
    const pl = {}, n = 8, pts = [];
    for (let i=0; i<n; i++){ const a = i/n*Math.PI*2; pts.push([50+22*Math.cos(a), 32+20*Math.sin(a)]); pl["a"+i] = ["a", pts[i][0], pts[i][1], ""+(i+1)]; }
    pl.c = ["n",50,32,"C"];
    if (o.ball) return {f:{t:"zone", r:[20,6,60,52], circle:[50,32,21]}, players:pl, balls:["a0"], goal:false, d:900,
      steps:[[["pass","a0","a3"]], [["pass","a3","a6"]], [["pass","a6","a1"]], [["pass","a1","a5"]], [["pass","a5","a2"]]], caps:["On se passe le ballon de plus en plus vite","Passe précise","On reste calme","Le coach dit « stop ! »","Celui qui a le ballon dit un mot sur la séance"]};
    const steps = [1,2].map(r => pts.map((p,i) => ["run","a"+i, pts[(i+r)%n][0], pts[(i+r)%n][1]]));
    steps.push(pts.map((p,i) => ["run","a"+i, 50+(p[0]-50)*.7, 32+(p[1]-32)*.7]));
    return {f:{t:"zone", r:[20,6,60,52]}, players:pl, balls:[], steps, caps:["Trottinement léger","On respire calmement","On se rapproche du coach : étirements et bilan"], goal:false};
  };

  const MAP = {e1:["dribble"], e2:["dribble",{cones:true}], e3:["rondo"], e4:["shape",{s:"diamond"}], e5:["sprint",{gammes:true}], e6:["beret"], e7:["pairs"],
    t1:["slalom"], t2:["duel"], t3:["shape"], t4:["dribble",{n:5, small:true}], t5:["oneTwo"], t6:["switchZones"], t7:["protect"],
    s1:["rondo",{big:true}], s2:["match",{gates:true}], s3:["overload"], s4:["buildUp",{press:true}], s5:["counter"], s6:["lanes"], s7:["rondo",{three:true}], s8:["duel"], s9:["buildUp"],
    f1:["finish"], f2:["crosses"], f3:["beret"], f4:["crosses",{combo:true}], f5:["match",{mini:true}],
    p1:["sprint"], p2:["sprint",{ball:true}], p3:["circuit"], p4:["slalom"],
    m1:["match"], m2:["match"], m3:["match",{press:true}], m4:["match",{mini:true}], m5:["crosses",{n:3}], m6:["block"],
    g1:["gk"], g2:["gk",{cross:true}], c1:["circle"], c2:["circle",{ball:true}],
    x1:["rondo",{pivot:true, cp:true}], x2:["lanes"], x3:["buildUp"], x4:["thirdMan"], x5:["counter"], x6:["buildUp",{press:true}], x7:["lanes"], x8:["overload",{n:3}],
    x9:["crosses",{n:3}], x10:["duel"], x11:["block"], x12:["match"], x13:["match",{press:true}], x14:["match"], x15:["gk",{dist:true}], x16:["rondo",{three:true}]};
  const BYTYPE = {echauffement:["dribble"], technique:["shape"], situation:["rondo"], finition:["finish"], physique:["sprint"], match:["match"], gardien:["gk"], calme:["circle"]};

  function sceneFor(e){ const m = MAP[e.id] || BYTYPE[e.type] || ["dribble"]; return T[m[0]](m[1] || {}); }
  return { mount, sceneFor, T };
})();

// ---------- intégration dans la fiche exercice ----------
(function(){
  const css = `.anim{background:#0b3b27;border-radius:16px;padding:8px;margin-bottom:10px}
.anim-svg{width:100%;display:block;border-radius:10px}
.anim-cap{color:#fff;font-weight:700;font-size:14px;text-align:center;min-height:40px;padding:8px 6px 2px;line-height:1.3}
.anim-bar{display:flex;align-items:center;gap:6px;padding:4px 2px}
.anim-bar button{background:rgba(255,255,255,.14);color:#fff;border-radius:10px;min-width:38px;height:34px;font-weight:800;font-size:15px}
.anim-prog{flex:1;height:5px;background:rgba(255,255,255,.18);border-radius:9px;overflow:hidden}.anim-prog i{display:block;height:100%;width:0;background:#d6f43a}
.anim-leg{display:flex;flex-wrap:wrap;gap:4px 10px;padding:6px 4px 2px;font-size:11.5px;color:#cfe3d6;font-weight:600}
.anim-leg span{display:inline-flex;align-items:center;gap:4px}.anim-leg b{width:10px;height:10px;border-radius:50%;display:inline-block;border:1px solid #fff}
.anim-leg i.l{display:inline-block;width:18px;height:0;border-top:2px solid #fff}.anim-leg i.run{border-top-style:dashed}.anim-leg i.drib{border-top-style:dotted}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  let cur = null;
  const stop = () => { if (cur){ cur.stop(); cur = null; } };
  window.addEventListener("DOMContentLoaded", () => {
    if (typeof openExo !== "function") return;
    const _open = openExo, _sheet = sheet, _close = closeSheet;
    window.sheet = sheet = function(h, f){ stop(); return _sheet(h, f); };
    window.closeSheet = closeSheet = function(){ stop(); return _close.apply(this, arguments); };
    window.openExo = openExo = function(id){
      _open(id);
      const svg = document.querySelector("#sheet .pitch-svg"), e = EXOS.find(x => x.id === id);
      if (!svg || !e) return;
      const box = document.createElement("div"); svg.replaceWith(box);
      try { cur = ANIM.mount(box, ANIM.sceneFor(e)); } catch(err){ box.replaceWith(svg); }
    };
  });
})();
