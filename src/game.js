// Barrilete v4: un barrilete de Sumpango, cuerda y viento. Un solo botón.
const C=document.getElementById('c'),M=Math,R=M.random,PI=M.PI,{sin,cos,min,max,hypot,abs,exp,atan2}=M,
  DK='#0a0513',WT='#fff',KR=30,LMIN=130,GRAV=200,T0=1500,TAP=.22,Y='#fd4',G='#6e8',RD='#f55',WH='rgba(255,255,255,',
  SH=[['Rombo',4],['Hexágono',6],['Octágono',8],['Estrella',16]],
  PA=[['Volcán',5,22,90],['Cempasúchil',28,12,95],['Jacaranda',265,28,75],['Selva',110,40,70],['Fiesta',330,90,85],['Hielo',190,18,70],['Papel picado',0,60,85],['Atardecer',350,35,85],['Mar',172,24,75]],
  PT=[['Sectores',1,0],['Alterno',2,0],['Espiral',1,1],['Mosaico',2,1]],
  FR=['Sin flecos','Cortos','Largos'],TL=['Sin cola','Moños','Cintas','Borlas'],
  EV=[['VENTARRÓN','¡Suelta cuerda, aprieta el viento!'],['CALMA CHICHA','¡Jala para no caer!'],['TORBELLINO','El viento late: sigue el ritmo']],
  // muñeco: piel, camisa/huipil [nombre,base,franja,adorno], pantalón/corte [nombre,base,franja], sombrero, pelo [nombre,color,estilo]
  SK=['#fdb','#eb8','#c85','#a63','#742'],
  SHI=[['Rojo','#d42'],['Azul','#36d'],['Huipil rojo','#b23','#fc3',WT],['Huipil morado','#628','#f83','#3cc'],['Huipil turquesa','#299','#e37','#fe9']],
  PN=[['Pantalón azul','#348'],['Pantalón café','#532'],['Pantalón negro','#222'],['Corte morado','#727','#e59'],['Corte rojo','#a23','#fb3']],
  HT=['Sin sombrero','Sombrero de palma','Gorra'],
  HR=[['Negro corto','#111',0],['Negro con trenza','#111',1],['Castaño corto','#532',0],['Castaño largo','#532',2],['Canoso','#bbc',0]],
  CT=[SH,PA,PT,FR,TL,SK,SHI,PN,HT,HR], // cfg = índice elegido en cada lista: barrilete (0-4) y muñeco (5-9)
  ld=(n,d)=>{try{return JSON.parse(localStorage[n])||d}catch{return d}},
  sv=(n,v)=>{try{localStorage[n]=JSON.stringify(v)}catch{}},
  cl=(v,a,b)=>max(a,min(b,v)),
  rndCfg=()=>CT.map(a=>R()*a.length|0),
  okCfg=g=>g&&g.length==10&&CT.every((a,i)=>a[g[i]]),
  pal=p=>[0,1,2,3].map(i=>`hsl(${(PA[p][1]+i*PA[p][2])%360} ${PA[p][3]}% ${50+i%2*14}%)`),
  hs0=['Mantén para jalar','Suelta para dar cuerda','Toque rápido: ¡tirón!'];
let X=C.getContext('2d'),W,H,GY,AX,AY,Lmax,sc,F,bg,fuego,cx,cw,oy,st='menu',T=0,tg=0,tr=1,over=0,cause='',rank=0,hl=-1,hp=0,ct=0,
  ptr=new Set,keys=new Set,pt=0,jc=0,hd=0,tapq=0,sus=0,pd=0,hs=3,ht=0,prac=0,seen=ld('barrilete_seen',0),items=[],fi=0,shake=0,wt=0,
  k,L,rr,Tf,strain,score,combo,comboT,got,cut,tilt,lean=0,lv=1,inv=0,mu=1,evs=1,ev,dg,
  strips,rivals,gusts,parts,pops,streaks=[],tail,ptl=[],tnext,rnext,snext,enext,K,
  ac,wg,wf,cg,co,wn,NB,
  tb=ld('barrilete_top',[]),cfg=ld('barrilete_cfg',0),nm=[...String(ld('barrilete_ini','AAA'))];
if(!okCfg(cfg))cfg=rndCfg();

// ---------- dibujo básico (todo sobre X) ----------
const ga=v=>X.globalAlpha=v,sa=()=>X.save(),re=()=>X.restore(),tt=(x,y)=>X.translate(x,y),
  P=(a,c)=>{X.beginPath();a.forEach((v,i)=>i%2||X[i?'lineTo':'moveTo'](v,a[i+1]));if(c)X.fillStyle=c,X.fill()},
  fR=(c,x,y,w,h)=>{X.fillStyle=c;X.fillRect(x,y,w,h)},
  ci=(c,x,y,r,a=0,b=7)=>{X.fillStyle=c;X.beginPath();X.arc(x,y,r,a,b);X.fill()},
  ar=(c,w,x,y,r,a=0,b=7)=>{X.strokeStyle=c;X.lineWidth=w;X.beginPath();X.arc(x,y,r,a,b);X.stroke()},
  ln=(c,w,...a)=>{P(a);X.strokeStyle=c;X.lineWidth=w;X.stroke()},
  rrc=(x,y,w,h,r,f,s)=>{X.beginPath();X.roundRect(x,y,w,h,r);if(f)X.fillStyle=f,X.fill();if(s)X.strokeStyle=s,X.lineWidth=2,X.stroke()},
  txt=(s,x,y,z,c,a,w)=>{X.font=`${w||700} ${z}px system-ui,sans-serif`;X.textAlign=a||'center';X.fillStyle=c;X.fillText(s,x,y)},
  D=()=>min(1,tg/200),alt=y=>cl((AY-y)/(Lmax*.85),0,1),
  base=()=>(115+60*D())*(1+.2*sin(T*.5))*evs;

// ---------- viento ----------
const windAt=(x)=>{let w=base();for(const g of gusts)w+=g.s*exp(-(((x-g.x)/g.w)**2));return max(0,w)}

// ---------- audio ----------
const cn=(...a)=>a.reduce((p,q)=>p.connect(q)),
  ramp=(p,a,b,t,d)=>{p.setValueAtTime(a,t);p.exponentialRampToValueAtTime(b,t+d)};
const audio=()=>{
  if(ac)return;
  try{
    ac=new AudioContext;const n=NB=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate),d=n.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=R()*2-1;
    wn=ac.createBufferSource();wn.buffer=n;wn.loop=1;
    wf=ac.createBiquadFilter();wf.type='bandpass';wf.Q.value=.8;wg=ac.createGain();wg.gain.value=0;
    cn(wn,wf,wg,ac.destination);wn.start();
    co=ac.createOscillator();co.type='sawtooth';cg=ac.createGain();cg.gain.value=0;cn(co,cg,ac.destination);co.start()
  }catch{ac=0}
}
const tone=(f,f2,d,ty,v,n)=>{ // n: ruido filtrado en vez de oscilador
  if(!ac)return;const t=ac.currentTime,g=ac.createGain(),o=n?ac.createBufferSource():ac.createOscillator(),q=n?ac.createBiquadFilter():o;
  if(n)o.buffer=NB,q.type='lowpass',ramp(q.frequency,f,80,t,d);else o.type=ty,ramp(o.frequency,f,f2,t,d);
  ramp(g.gain,v,.001,t,d);cn(...n?[o,q,g]:[o,g],ac.destination);o.start(t);o.stop(t+d)
}
const burst=(d,f,v)=>tone(f,0,d,0,v,1),click=()=>tone(660,990,.07,'square',.06),
  wake=()=>{audio();if(ac&&ac.state=='suspended')ac.resume()};
const sound=(w)=>{
  if(!ac)return;const t=ac.currentTime,p=st=='play',s=(a,v,r)=>a.setTargetAtTime(v,t,r);
  s(wg.gain,min(.3,w/700)*(p?1:.5),.1);s(wf.frequency,250+w*3,.1);
  s(cg.gain,p&&Tf>T0*.5?min(.06,Tf/T0*.03+strain*.05):0,.05);s(co.frequency,160+strain*500+Tf/T0*80,.05)
}

// ---------- barrilete (forma, paleta, patrón, flecos, cola) ----------
const mkKite=()=>{
  const[a,b,c,d,e]=cfg,N=SH[a][1],star=a==3,[,m,tw]=PT[c],pl=pal(b),o=document.createElement('canvas'),S=X,
    vx=(r,i)=>{const a=i*2*PI/N,q=star&&i%2?.55:1;return[r*q*cos(a),r*q*sin(a)]};
  o.width=o.height=144;X=o.getContext('2d');tt(72,72);X.lineJoin='round';
  [1,.76,.52,.28].forEach((r,ri)=>{
    sa();X.rotate(tw*PI/N*ri);
    for(let i=0;i<N;i++)P([0,0,...vx(64*r,i),...vx(64*r,i+1)],pl[(i*m+ri)%4]);
    re()
  });
  ln(WT,3,...[...Array(N+1)].flatMap((_,i)=>vx(64,i)));ci(WT,0,0,5);X=S;
  return{spr:o,pal:pl,N,star,vx,fl:[0,9,17][d],tl:e}
}
const apply=()=>{K=mkKite();sv('barrilete_cfg',cfg)}
const drawKite=(x,y,rot,s,w)=>{
  sa();tt(x,y);X.rotate(rot);X.scale(s,s);X.drawImage(K.spr,-31.5,-31.5,63,63);
  if(K.fl)for(let i=0;i<K.N;i++){
    if(K.star&&i%2)continue;
    const v=K.vx(KR*.93,i),a=i*2*PI/K.N,c=cos(a),n=sin(a),sw=sin(T*9+i*2)*3+w*.02,l=K.fl;
    P([v[0]-n*3,v[1]+c*3,v[0]+n*3,v[1]-c*3,v[0]+c*l-n*sw*.5+sw*.6,v[1]+n*l+c*sw*.5+l*.5],K.pal[i%4])
  }
  re()
}
const tailUp=(tl,ax,ay,w,dt,n)=>{
  while(tl.length<n)tl.push({x:ax,y:ay+tl.length*8});
  tl.length=n;if(!n)return;tl[0].x=ax;tl[0].y=ay;
  for(let i=1;i<n;i++){
    const p=tl[i],q=tl[i-1];
    p.x+=(w*.45+sin(T*6+i)*14)*dt;p.y+=60*dt;
    const dx=p.x-q.x,dy=p.y-q.y,l=hypot(dx,dy)||1;p.x=q.x+dx/l*9;p.y=q.y+dy/l*9
  }
}
const drawTail=(tl)=>{
  if(!K.tl||tl.length<2)return;
  ln(WH+'.7)',1.5,...tl.flatMap(p=>[p.x,p.y]));
  tl.forEach((p,i)=>{
    if(!i)return;const q=tl[i-1],c=K.pal[i%4];sa();tt(p.x,p.y);
    if(K.tl==3)ci(c,0,0,5);
    else X.rotate(atan2(p.y-q.y,p.x-q.x)+sin(T*8+i)*.5),K.tl==1?fR(c,-1,-6,6,12):fR(c,-2,-2,16,4);
    re()
  })
}

// ---------- muñeco: pies en (x,y), escala s, inclinación l, brazo hacia el ángulo ag; devuelve la mano ----------
const kid=(x,y,s,l,ag)=>{
  const[,,,,,a,b,c,d,e]=cfg,S=SHI[b],B=PN[c],Hr=HR[e],sk=SK[a],al=ag-l,ax=cos(al),ay=sin(al);
  sa();tt(x,y);X.scale(s,s);X.rotate(l);
  if(Hr[2]==1)ln(Hr[1],3,-3,-29,-6,-22,-7,-14);
  if(Hr[2]==2)fR(Hr[1],-7,-33,6,17);
  fR(B[2]?sk:B[1],-4.5,-12,4,12);fR(B[2]?sk:B[1],.5,-12,4,12);fR('#222',-5,-1.5,10,1.5);
  if(B[2]){P([-5.5,-13,5.5,-13,8,-2,-8,-2],B[1]);for(let i=-2;i<3;i++)ln(B[2],1.2,i*2.2,-13,i*3.2,-2);ln(B[2],2,-7.6,-3,7.6,-3)}
  fR(S[1],-5.5,-25,11,14);
  if(S[2]){[-3.4,0,3.4].forEach(v=>P([v,-23.5,v+2,-21.5,v,-19.5,v-2,-21.5],S[2]));fR(S[3],-5.5,-17.5,11,1.5);fR(S[2],-5.5,-14.5,11,1.2);fR(S[2],-5.5,-25,11,1.2)}
  ln(S[1],3.4,0,-22,ax*9,-22+ay*9);ci(sk,ax*10.5,-22+ay*10.5,2.4);
  ci(sk,0,-30,5.5);ci('#222',2.6,-30.5,.8);ci(Hr[1],0,-31,5.8,PI,2*PI);
  if(d==1){sa();X.scale(1,.25);ci('#ec6',0,-136,11);re();ci('#ec6',0,-34,5,PI,2*PI);fR('#a42',-5,-35.2,10,1.3)}
  if(d==2){ci('#27b',0,-33,5.8,PI,2*PI);P([3,-33,10,-32,10,-31,3,-31.2],'#185')}
  re();
  return[x+s*(22*sin(l)+10.5*cos(ag)),y+s*(-22*cos(l)+10.5*sin(ag))]
}

const reset=()=>{
  k={x:AX+130,y:GY-190,vx:60,vy:0};L=210;rr=0;Tf=0;strain=0;score=0;combo=1;comboT=0;got=0;
  cut=0;lv=1;inv=0;tilt=0;strips=[];rivals=[];gusts=[];parts=[];pops=[];tg=0;tnext=1;rnext=26;snext=2;enext=36;
  ev=0;evs=1;tail=[];over=0;shake=0;pt=-9;dg=0;tapq=0
}

// ---------- fondo ----------
const drawBG=()=>{
  const S=X,f=bg.width/W;let sd=7;X=bg.getContext('2d');
  const rn=()=>(sd=sd*16807%2147483647)/2147483647,s=X.createLinearGradient(0,0,0,GY);
  X.setTransform(f,0,0,f,0,0);
  [[0,'#0f0a2c'],[.4,'#4a2480'],[.72,'#c93f6e'],[1,'#ffb35c']].forEach(a=>s.addColorStop(...a));
  fR(s,0,0,W,H);
  for(let i=0;i<70;i++)ga(rn()*.7),fR(WT,rn()*W,rn()*GY*.6,1.5,1.5);
  ga(.15);ci('#fe9',W*.82,90,44);ga(1);ci('#ffe',W*.82,90,24);
  const cone=(c,hh,bw,col,tw)=>{
    const a=[c-bw,GY],b=[c+bw,GY];
    for(let i=1;i<10;i++){const u=i/10,y=()=>GY-hh*u**1.6*(1+(rn()-.5)*.04);a.push(c-bw*(1-u),y());b.unshift(c+bw*(1-u),y())}
    P([...a,c-8,GY-hh,c+8,GY-hh,...b],col);
    if(tw)P([c+bw*.5,GY,c+bw*.62,GY-hh*.78,c+bw*.7,GY-hh*.75,c+bw*1.4,GY],col)
  };
  cone(W*.74,240,300,'#3a1a5a');cone(W*.16,200,260,'#2b1248',1);
  fuego={x:W*.16+260*.66,y:GY-200*.77+2};
  const a=[0,GY];for(let x=0;x<=W;x+=40)a.push(x,GY-40-30*sin(x*.01)-rn()*14);P([...a,W,GY],'#1d0d33');
  fR(DK,0,GY,W,H-GY);X.fillStyle=DK;
  const win=[];
  for(let x=-10;x<W;){
    const t=rn(),w=26+rn()*28,h=18+rn()*26,gy=GY+1;
    if(x>W*.62&&x<W*.9){ // cementerio
      for(let i=0;i<3&&x<W*.9;i++,x+=22){
        const hh=14+rn()*16;
        fR(DK,x+7,gy-hh,4,hh);fR(DK,x+2,gy-hh+5,14,4);
        if(rn()<.7)win.push([x+4,gy-3,'#f91'],[x+12,gy-2,'#fb3'])
      }continue
    }
    fR(DK,x,gy-h,w,h);
    if(t<.45)P([x-3,gy-h,x+w/2,gy-h-14,x+w+3,gy-h],DK);
    else if(t<.55){fR(DK,x+w*.3,gy-h-34,w*.4,34);P([x+w*.3,gy-h-34,x+w/2,gy-h-50,x+w*.7,gy-h-34],DK);fR(DK,x+w/2-1,gy-h-62,2,12);fR(DK,x+w/2-5,gy-h-58,10,2)}
    for(let i=0;i<2;i++)if(rn()<.5)win.push([x+4+rn()*(w-10),gy-h+4+rn()*(h-10),'#fc6']);
    x+=w+4+rn()*10
  }
  win.forEach(a=>fR(a[2],a[0],a[1],3,3));
  for(let x=W*.05;x<W;x+=W*.3){ln(DK,2,x,GY,x,GY-78);fR(DK,x-9,GY-76,18,2)}
  X=S
}

const resize=()=>{
  const dpr=min(2,devicePixelRatio||1),iw=innerWidth,ih=innerHeight,s=min(ih/600,iw/400);
  C.width=iw*dpr;C.height=ih*dpr;W=iw/s;H=ih/s;F=dpr*s;sc=s;
  GY=H-70;AX=W*(W<600?.2:.3);AY=GY-24;Lmax=min(.8*GY,.9*(W-AX));
  cx=W/2;cw=min(W-24,440);oy=max(0,(H-600)*.3);
  bg=document.createElement('canvas');bg.width=C.width;bg.height=C.height;drawBG()
}

// ---------- simulación ----------
const spawnStrip=()=>{
  for(let n=0;n<20;n++){
    const r=LMIN+50+R()*(Lmax-LMIN-80),a=.27+R()*.8,x=AX+r*cos(a),y=AY-r*sin(a);
    if(x<W-30&&y>50){strips.push({x,y,hx:x,hy:y,dx:0,dy:0,vx:0,t:10-D()*4,m:10-D()*4,c:K.pal[R()*4|0],p:R()*6});return}
  }
}
const pop=(x,y,c,n)=>{for(let i=0;i<n;i++)parts.push({x,y,vx:(R()-.5)*260,vy:(R()-.5)*260-40,l:.8,c})}
const pup=(x,y,s,c,z)=>pops.push({x,y,s,c,z:z||18,t:1.1});
const go=(s)=>{st=s;tr=1;fi=0;items=[];if(s=='menu')reset()}
const jerk=()=>{
  jc=T+.9;k.vy-=140;if(!cut)L=max(LMIN,L-20);shake=max(shake,.12);
  burst(.12,6000,.12);tone(300,900,.1,'triangle',.14);pup(k.x,k.y-44,'¡Tirón!',WT,14);
  for(let i=0;i<14;i++){const a=i*PI/7;parts.push({x:k.x,y:k.y,vx:cos(a)*170,vy:sin(a)*170-60,l:.35,c:WT})}
  if(hs==2)done()
}
const die=(why,snap)=>{
  if(lv>=1&&!inv){ // salvavidas: perdona el primer descuido y se recarga en 45 s
    lv=0;inv=2.5;strain=0;combo=1;shake=.4;tone(400,1200,.3,'triangle',.25);
    if(snap)k.vx*=.5;else k.y=GY-70,k.vy=-260;
    pup(k.x,k.y-50,'¡SALVADO!','#6f8',17);return
  }
  go('over');over=0;cause=why;cut=snap;shake=.6;ev=0;
  const s=score|0;rank=!prac&&s>0&&(tb.length<10||s>tb[tb.length-1].s)?1+tb.filter(e=>e.s>=s).length:0;
  snap?(tone(1800,200,.25,'sine',.25),burst(.3,6000,.3)):burst(.6,1500,.5);
  pop(k.x,k.y,WT,18)
}
const done=()=>{hs=3;seen=1;sv('barrilete_seen',1)}
const bump=(r)=>{
  const dx=k.x-r.x,dy=k.y-r.yy,l=hypot(dx,dy)||1;
  k.vx+=dx/l*200;k.vy+=dy/l*200;combo=1;comboT=0;shake=.4;burst(.2,3000,.3);
  pup(k.x,k.y-44,'¡Choque!','#f85');pop(r.x,r.yy,'#e22',10)
}

const step=(dt)=>{
  T+=dt;const play=st=='play';if(play)tg+=dt;
  inv=max(0,inv-dt);if(play&&!inv&&lv<1)lv=min(1,lv+dt/45);
  const d=D(),hold=play?hd:st=='over'?0:k.y>GY-260,ez=(v,t,r)=>v+(t-v)*min(1,dt*r);
  if(play){
    if(tapq){tapq=0;if(T>jc)jerk()}
    if(hd&&!sus&&T-pt>=TAP){sus=1;tone(200,330,.16,'sine',.12);if(hs==0)hs=1}
    if(hs==1&&!hd){hs=2;ht=T}
    if(hs==2&&T-ht>9)done()
  }
  // eventos de viento con nombre: aviso de 3 s y luego 8 s activos
  if(play&&!prac){
    if(!ev&&(enext-=dt)<0){ev={k:R()*3|0,ph:0,t:3};tone(220,180,.5,'sawtooth',.12)}
    if(ev&&(ev.t-=dt)<0){
      if(ev.ph){ev=0;enext=16+R()*10}else{ev.ph=1;ev.t=8;tone(110,70,.9,'sawtooth',.2);shake=.3}
    }
  }
  evs=ez(evs,ev&&ev.ph?[1.5,.68,1+.4*sin(T*5.2)][ev.k]:1,6);
  // ráfagas: avanzan hacia el barrilete para avisar
  if((tnext-=dt)<0){
    tnext=max(1.6,4.5-2.8*d)*(.6+R()*.8);
    const lull=R()<.3;
    gusts.push({x:-120,w:80+R()*80,s:lull?-(.15+.4*R()*min(1,tg/90))*base():(60+R()*(60+190*d))*min(1,.5+tg/60),ys:[...Array(9)].map(R)})
  }
  gusts.forEach(g=>g.x+=230*dt);gusts=gusts.filter(g=>g.x<W+200);
  // cuerda
  rr=ez(rr,cut?0:hold?-40:130,6);
  L=cl(L+rr*dt,LMIN,Lmax);
  // barrilete
  const w=windAt(k.x),rx=w-k.vx,pitch=hold?1:.28;
  k.vx+=2.2*rx*dt;k.vy+=(GRAV-1.2*k.vy-.047*pitch*w*w)*dt;
  k.x+=k.vx*dt;k.y+=k.vy*dt;
  let tens=0;
  if(!cut){
    const dx=k.x-AX,dy=k.y-AY,r=hypot(dx,dy);
    if(r>L){
      const nx=dx/r,ny=dy/r,vr=k.vx*nx+k.vy*ny;
      k.x=AX+nx*L;k.y=AY+ny*L;
      if(vr>rr){tens=(vr-rr)/dt;k.vx-=nx*(vr-rr);k.vy-=ny*(vr-rr)}
    }
  }
  if(k.x<12){k.x=12;k.vx=abs(k.vx)*.3}
  if(k.x>W-12){k.x=W-12;k.vx=-abs(k.vx)*.3}
  if(k.y>GY-22){k.y=GY-22;k.vy=0;k.vx*=.9;if(play){if(inv)k.vy=-230;else die('Cayó el barrilete',0)}}
  if(st=='menu'){const a=.1+.04*sin(T*.8);k.x=AX+.9*Lmax*cos(a);k.y=AY-.9*Lmax*sin(a);k.vx=k.vy=0;L=.9*Lmax} // en el menú el barrilete flota abajo a la derecha, lejos de los botones
  Tf=ez(Tf,tens,10);
  if(play){
    strain=inv?0:Tf>T0?strain+(Tf/T0-1)*dt*1.4:max(0,strain-dt);
    if(strain>=1)die('Se reventó el hilo',1)
  }else if(st=='over'||st=='name')strain=max(0,strain-dt);
  tilt=ez(tilt,hold?-.35:.25,5);lean=ez(lean,hold?-.14:.04,6);
  // cola
  const rot=tilt+.12*sin(T*3.1)*w/150;
  tailUp(tail,k.x-sin(rot)*KR,k.y+cos(rot)*KR,w,dt,K.tl?6+min(8,got):0);
  // partículas
  while(streaks.length<70)streaks.push({x:R()*W,y:R()*GY,p:R()*6});
  for(const s of streaks){s.x+=windAt(s.x)*dt*.9;s.y+=sin(T*.7+s.p)*8*dt;if(s.x>W+30){s.x=-30;s.y=R()*GY}}
  parts.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=300*dt;p.l-=dt});parts=parts.filter(p=>p.l>0);
  pops.forEach(p=>{p.y-=36*dt;p.t-=dt});pops=pops.filter(p=>p.t>0);
  if(!play){sound(w);return}
  // puntos: altura, tensión al filo y eventos multiplican
  mu=(1+1.5*alt(k.y))*(Tf>T0*.6?1.5:1)*(ev&&ev.ph?2:1);
  score+=dt*3*mu;
  if(k.y>GY-95&&(wt-=dt)<0){wt=.35;tone(240,200,.1,'square',.1)}
  if(comboT>0&&(comboT-=dt)<=0)combo=1;
  if((snext-=dt)<0&&strips.length<(d>.5?3:2)){snext=1.2+R()*1.5;spawnStrip()}
  for(const s of strips){
    s.t-=dt;
    // papel de china: se deja llevar por el viento (deriva y ondula alrededor de su sitio; la calma lo frena, la ráfaga lo empuja y lo eleva)
    const ww=windAt(s.x),px=s.x,tx=.65*max(0,ww-40);
    s.dx=ez(s.dx,tx,tx>s.dx?2.2:.7);s.dy=ez(s.dy,cl((120-ww)*.1,-30,30),2.2);
    s.x=min(s.hx+s.dx+6*sin(T*1.3+s.p),W-30);s.y=cl(s.hy+s.dy+(3+ww/60)*sin(T*2+s.p),50,GY-60);
    const q=hypot(s.x-AX,s.y-AY),mq=Lmax-12;if(q>mq)s.x=AX+(s.x-AX)*mq/q,s.y=AY+(s.y-AY)*mq/q;
    s.vx=ez(s.vx,(s.x-px)/dt,8);
    if(hypot(k.x-s.x,k.y-s.y)<KR+14){
      s.t=-1;combo=comboT>0?min(combo+1,8):1;comboT=5;got++;
      const v=M.round(10*combo*mu);score+=v;shake=max(shake,.1);
      tone(520*1.12**combo,1040*1.12**combo,.18,'sine',.25);pop(s.x,s.y,s.c,14);
      pup(s.x,s.y-20,'+'+v,Y,20+combo*2);if(combo>1)pup(s.x,s.y-48,'combo ×'+combo,WT,13)
    }else if(s.t<0)combo=1
  }
  strips=strips.filter(s=>s.t>=0);
  // rivales: cortan solo si cruzan el tramo del hilo cerca del barrilete
  if(tg>26&&!prac&&(rnext-=dt)<0){
    rnext=max(3.2,8-4.8*d)*(.7+R()*.6);
    for(let i=0;i<1+(d>.55&&R()<.5);i++)
      rivals.push({x:W+260+i*190,y:cl(k.y+(R()-.5)*(300+200*d),90,GY-110),v:-(75+70*d+R()*30),p:R()*6})
  }
  const bx=k.x-sin(tilt)*KR*.9,by=k.y+KR*.9,hx=AX+6,hy=AY,tl=hypot(hx-bx,hy-by)||1,
    ux=(hx-bx)/tl,uy=(hy-by)/tl,vl=min(70+60*d,tl);dg=0;
  for(const r of rivals){
    r.x+=r.v*dt;r.yy=r.y+35*sin(r.p+T*1.7);
    const qx=r.x-bx,qy=r.yy-by,pr=qx*ux+qy*uy,sd=ux*qy-uy*qx;
    if(r.sd*sd<0&&pr>0&&pr<vl&&!cut&&!inv){die('Te cortaron el hilo',1);break}
    r.sd=sd;
    if(r.x>bx-30&&r.x<bx+380&&r.yy>by-45&&r.yy<by+uy*vl+45)dg=1;
    if(!r.b&&hypot(k.x-r.x,k.y-r.yy)<KR+16){r.b=1;bump(r)}
  }
  rivals=rivals.filter(r=>r.x>-80);
  sound(w)
}

// ---------- dibujo ----------
const wrap=(s,x,y,mw,lh,z,c)=>{
  X.font=`400 ${z}px system-ui,sans-serif`;X.textAlign='left';X.fillStyle=c;let l='';
  for(const w of s.split(' ')){const t=l?l+' '+w:w;if(X.measureText(t).width>mw&&l)X.fillText(l,x,y),y+=lh,l=w;else l=t}
  X.fillText(l,x,y)
}
const paper=(c,f=0)=>{
  const a=[-16,-10,16,-10,16,10];for(let i=0;i<6;i++)a.push(16-i*6.4-3.2,10-(i%2?0:5)+sin(T*9+i*1.7)*f);
  P([...a,-16,10],c);fR(WH+'.55)',-16,-10,32,3)
}
const scene=()=>{
  for(let i=0;i<7;i++){const u=(T*.08+i/7)%1;ga(.22*(1-u));ci('#8a7a9a',fuego.x+u*90+sin(i*3)*5,fuego.y-u*140,6+u*22)}
  ga(.5+.3*sin(T*5));ci('#f62',fuego.x,fuego.y,4);ga(1);
  // viento: partículas que aceleran dentro de la ráfaga
  X.lineCap='round';
  for(const s of streaks){const w=windAt(s.x);ln(WH+(.08+w/900)+')',1.5,s.x,s.y,s.x-6-w*.12,s.y)}
  for(const g of gusts){
    const a=min(1,abs(g.s)/200),c=`rgba(${g.s>0?'255,255,255':'90,140,255'},${.03+.05*a})`;
    fR(c,g.x-g.w*1.3,0,g.w*2.6,GY);fR(c,g.x-g.w*.6,0,g.w*1.2,GY);
    X.setLineDash(g.s>0?[]:[6,10]);
    g.ys.forEach((y,i)=>{const yy=y*GY*.9+10,x=g.x+(i%3-1)*g.w*.4;ln(g.s>0?WH+(.35+.4*a)+')':'rgba(120,170,255,.5)',2,x-abs(g.s)*.35,yy,x,yy)})
  }
  X.setLineDash([]);
  // papel de china
  for(const s of strips){
    const fr=s.t/s.m,w=windAt(s.x);sa();tt(s.x,s.y);
    for(let i=1;i<4;i++)ga(.3/i),ci(s.c,-s.vx*.12*i,0,6);
    ga(1);X.rotate(sin(T*1.5+s.p)*.3+w/700*sin(T*9+s.p));X.transform(1,0,sin(T*6+s.p)*w/1200,1,0,0);
    ar(fr<.3?`rgba(255,120,120,${.5+.5*sin(T*14)})`:WH+'.6)',2,0,0,30,-PI/2,-PI/2+2*PI*fr);paper(s.c,w/80);re()
  }
  // rivales
  for(const r of rivals){
    const y=r.yy??r.y;
    if(r.x>W-10)P([W-8,y,W-30,y-14,W-30,y+14],`rgba(255,60,60,${.5+.5*sin(T*12)})`),txt('!',W-42,y+8,22,'#f55');
    ln(WH+'.35)',1,r.x,y,r.x+60,GY);
    sa();tt(r.x,y);X.rotate(sin(T*3+r.p)*.2);
    P([0,-26,18,0,0,26,-18,0],'#103');P([0,-26,18,0,0,0],'#e22');P([0,26,-18,0,0,0],'#e22');ln(WT,1.5,0,-26,18,0,0,26,-18,0,0,-26);
    for(let i=1;i<5;i++)fR(i%2?'#e22':'#222',sin(T*8+i)*3-3,26+i*7,6,5);
    re()
  }
  // muñeco e hilo: el brazo sigue el hilo y el cuerpo se inclina al jalar
  const bx=k.x-sin(tilt)*KR*.9,by=k.y+KR*.9,[hx,hy]=kid(AX,GY+4,1.25,lean+.02*sin(T*2),atan2(by-AY,bx-AX));
  if(st!='custom'&&st!='help'&&st!='scores'){
    const dist=hypot(bx-hx,by-hy),sl=max(0,L-dist),sg=min(1,strain);
    if(!cut){
      X.beginPath();X.moveTo(hx,hy);X.quadraticCurveTo((hx+bx)/2,(hy+by)/2+4+sl*.9,bx,by);
      X.strokeStyle=sg>.05?`rgb(255,${255-sg*200|0},${255-sg*220|0})`:WH+'.85)';X.lineWidth=1.6+sg*1.5;X.stroke();
      if(st=='play'&&rivals.length){ // tramo vulnerable
        const l=min(70+60*D(),dist)/dist;ln(dg?`rgba(255,60,60,${.6+.4*sin(T*16)})`:'rgba(255,225,120,.4)',4,bx,by,bx+(hx-bx)*l,by+(hy-by)*l)
      }
    }else X.beginPath(),X.moveTo(bx,by),X.quadraticCurveTo(bx-k.vx*.1,by-k.vy*.1-20,bx-k.vx*.25,by-k.vy*.25-50),X.strokeStyle=WH+'.7)',X.lineWidth=1.5,X.stroke();
    drawTail(tail);
    const w=windAt(k.x);
    if(!inv||(T*14&1))drawKite(k.x,k.y,tilt+.12*sin(T*3.1)*w/150,1,w)
  }
  if(st=='play'&&hd){const f=(T-pt)/TAP;ar(f<1?Y:'rgba(111,224,138,.75)',3,k.x,k.y,KR+9,-PI/2,-PI/2+2*PI*cl(f,0,1))}
  for(const p of parts)ga(min(1,p.l*2)),fR(p.c,p.x-2,p.y-2,4,4);
  for(const p of pops)ga(min(1,p.t*2)),txt(p.s,p.x,p.y,p.z,p.c);
  ga(1);
  if(strain>.3)fR(`rgba(255,0,0,${(strain-.3)*.25*(.6+.4*sin(T*20))})`,0,0,W,H)
}
const hud=()=>{
  const lf=(s,y,z,c)=>txt(s,16,y,z,c,'left'),rt=(s,y,z,c)=>txt(s,W-16,y,z,c,'right'),dm=WH+'.75)',bw=150,x0=W-bw-16,v=min(1.2,Tf/T0),w=windAt(k.x);
  lf('PUNTOS',24,11,WH+'.65)');lf(score|0,58,36,WT);txt('Mejor '+max(tb[0]?tb[0].s:0,score|0),16,78,13,WH+'.65)','left',400);
  let y=104;
  if(combo>1)lf('COMBO ×'+combo,y,18,Y),fR(WH+'.25)',16,y+6,96,4),fR(Y,16,y+6,96*cl(comboT/5,0,1),4),y+=30;
  lf(lv>=1?'♥ SALVAVIDAS':'♡ salvavidas '+((1-lv)*45+1|0)+' s',y,12,lv>=1?'#6f8':WH+'.55)');y+=16;
  lf('ALTURA ×'+(1+1.5*alt(k.y)).toFixed(1),y,12,'#8df');
  if(Tf>T0*.6)lf('AL FILO ×1.5',y+16,12,'#f95');
  if(ev&&ev.ph)lf('EVENTO ×2',y+32,12,Y);
  // tensión y viento
  rt('TENSIÓN DEL HILO',22,11,dm);fR('rgba(0,0,0,.45)',x0,28,bw,10);
  fR(v<.6?G:v<1?Y:'#f44',x0,28,bw*v/1.2,10);fR(WT,x0+bw/1.2,25,2,16);
  rt('VIENTO',58,11,dm);fR('rgba(0,0,0,.45)',x0,64,bw,8);fR('#bdf',x0,64,bw*min(1,w/450),8);
  let e=9,gs;for(const g of gusts)if(g.x<k.x&&abs(g.s)>40&&(k.x-g.x)/230<e)e=(k.x-g.x)/230,gs=g;
  if(gs&&e<4)rt(`${gs.s>0?'RÁFAGA':'CALMA'} en ${e.toFixed(1)}s`,92,13,gs.s>0?WT:'#8bf');
  if(ev)txt(ev.ph?EV[ev.k][0]:`¡VIENE ${EV[ev.k][0]}!`,cx,H*.13,min(34,W/11),Y,0,800),txt(ev.ph?EV[ev.k][1]:'Prepárate…',cx,H*.13+24,15,WT);
  if(prac)txt('PRÁCTICA · sin rivales',cx,H*.06,13,'#8df');
  if(hs<3&&st=='play'){
    const t=hs0[hs],z=min(20,W/19);
    X.font=`700 ${z}px system-ui,sans-serif`;const tw=X.measureText(t).width+40;
    rrc(cx-tw/2,H*.22-z-6,tw,z*2+4,z,'rgba(8,4,24,.72)');
    txt(t,cx,H*.22,z,[G,'#f88',Y][hs]);
    pbtn(cx,H*.22+z*1.8,hs!=1)
  }
  if(st=='play'&&k.y>GY-95&&(T*4%1)<.6)txt('¡JALA!',k.x,k.y-50,24,'#f44')
}

// ---------- interfaz ----------
const item=(x,y,w,h,act,o)=>{items.push({x,y,w,h,act,...o});return fi==items.length-1}
const btn=(t,y,act,pri,w,x,h)=>{
  w=w||min(cw*.8,320);x=x??cx-w/2;h=h||46;const f=item(x,y,w,h,act);
  rrc(x,y,w,h,14,f?Y:pri?'rgba(255,213,74,.25)':WH+'.13)',f?WT:WH+'.25)');
  txt(t,x+w/2,y+h/2+7,19,f?'#2a1346':WT)
}
const row=(l,v,y,act,sw)=>{
  const x=cx-cw/2,f=item(x,y,cw,36,act,{r:1});
  rrc(x,y,cw,36,10,f?'#4a3a30':'#2e2050',f&&Y);
  txt(l,x+14,y+24,15,WT,'left');
  if(sw)sw.forEach((c,i)=>rrc(x+92+i*17,y+10,14,16,3,c,WH+'.5)'));
  txt('‹',x+cw*.46,y+27,26,Y);txt(v,x+cw*.7,y+24,15,WT);txt('›',x+cw-18,y+27,26,Y)
}
const head=(t,y,s)=>txt(t,cx,oy+y,s||30,Y,0,800);

const menuUI=()=>{
  head('BARRILETE',100+sin(T*1.5)*3,min(64,W/6.2));
  txt('Sumpango · Todos los Santos',cx,oy+132,15,'#fbd',0,500);
  btn('Jugar',oy+175,()=>startGame(0),1);
  btn('Mi barrilete',oy+235,()=>go('custom'));
  btn('Puntuaciones',oy+295,()=>{hl=-1;go('scores')});
  btn('Instrucciones',oy+355,()=>{hp=0;go('help');fi=3});
  txt(tb[0]?`Récord: ${tb[0].n} · ${tb[0].s}`:'Sin récord',cx,oy+436,15,WT,0,500)
}
const startGame=(p)=>{reset();clr();prac=p;hs=prac||!seen?0:3;go('play');click()}
const customUI=()=>{
  head('MI BARRILETE',36,26);
  const bw=min(cw/2-6,170),set=n=>d=>{const l=CT[n].length;cfg[n]=(cfg[n]+d+l)%l;apply();click()};
  [['Barrilete',cx-bw-6],['Muñeco',cx+6]].forEach((a,i)=>btn(a[0],oy+48,()=>{ct=i;fi=2;click()},ct==i,bw,a[1],30));
  let y=oy+232;
  if(!ct){
    const ax=cx+sin(T)*8,ay=oy+135+cos(T*1.3)*5,w=260+60*sin(T*.9),tx=ax-sin(.2)*KR*1.9,ty=ay+KR*1.85;
    tailUp(ptl,tx,ty,w,1/60,K.tl?10:0);
    sa();tt(tx,ty);X.scale(1.6,1.6);tt(-tx,-ty);drawTail(ptl);re();
    drawKite(ax,ay,sin(T*1.3)*.2,1.9,w);
    [['Forma',SH[cfg[0]][0]],['Paleta',PA[cfg[1]][0],pal(cfg[1])],['Patrón',PT[cfg[2]][0]],['Flecos',FR[cfg[3]]],['Cola',TL[cfg[4]]]]
      .forEach((a,i)=>{row(a[0],a[1],y,set(i),a[2]);y+=42});y+=10
  }else{
    const q=cfg.slice(5),ky=oy+110+sin(T*1.2)*5,hand=kid(cx-20,oy+220,3.6,.04*sin(T),-.7+.08*sin(T*1.7));
    drawKite(cx+95,ky,.2,1,120);ln(WH+'.8)',1.5,...hand,cx+90,ky+26);
    [['Piel','Tono '+(q[0]+1),[SK[q[0]]]],['Camisa',SHI[q[1]][0],SHI[q[1]].slice(1)],['Pantalón',PN[q[2]][0],PN[q[2]].slice(1)],['Sombrero',HT[q[3]]],['Pelo',HR[q[4]][0],[HR[q[4]][1]]]]
      .forEach((a,i)=>{row(a[0],a[1],y,set(5+i),a[2]);y+=42});y+=10
  }
  btn('Aleatorio',y,()=>{cfg=cfg.map((v,i)=>i>4==ct?R()*CT[i].length|0:v);apply();click()},0,bw,cx-bw-6);
  btn('Listo',y,()=>go('menu'),1,bw,cx+6)
}
const scoresUI=()=>{
  head('PUNTUACIONES',40,28);
  const x=cx-cw/2;
  rrc(x,oy+62,cw,356,14,'rgba(0,0,0,.35)');
  for(let i=0;i<10;i++){
    const e=tb[i],y=oy+92+i*34,c=i==hl?Y:e?WT:WH+'.3)';
    if(i==hl)fR('rgba(255,213,74,.18)',x+6,y-22,cw-12,32);
    txt(i+1+'.',x+16,y,17,c,'left');
    txt(e?e.n:'---',x+56,y,17,c,'left');
    txt(e?new Date(e.d).toLocaleDateString('es'):'',x+cw*.55,y,14,c,0,400);
    txt(e?e.s:'—',x+cw-16,y,17,c,'right')
  }
  btn('Volver',oy+440,()=>go('menu'),1)
}
// instrucciones animadas: cada diagrama se dibuja en una caja de 122×110
const sm=p=>.5-.5*cos(2*PI*p),ph=n=>(T%n)/n,lp=(a,b,t)=>a+(b-a)*t,near=(a,b,w)=>exp(-(((a-b)/w)**2)),
  arw=(a,b,c,d,col)=>{const t=atan2(d-b,c-a);ln(col,3,a,b,c,d);P([c,d,c-9*cos(t-.5),d-9*sin(t-.5),c-9*cos(t+.5),d-9*sin(t+.5)],col)},
  // niño, hilo y barrilete: (x,y) del barrilete, ángulo, escala y tramo del hilo que se pinta
  sk=(x,y,rot,s,w,ex)=>{kid(18,104,.8,0,-.8);ln(WT,2,26,80,x-4,y+ex);drawKite(x,y,rot,s,w)},
  gu=u=>{const bx=lp(-35,150,ph(4)),q=near(bx,92,28),y=u?lp(50,74,q):50;gb(bx,u?'rgba(122,176,255,':WH,u?[6,8]:[]);sk(96,y,u?0:q*.5,.75,100,16);ga(q);txt(u?'¡JALA!':'¡SUELTA!',60,102,13,u?G:RD);ga(1)},
  pbtn=(x,y,on)=>{ci(on?Y:WH+'.18)',x,y,10);ar(WT,2,x,y,10);if(on)ar('rgba(255,213,74,.6)',2,x,y,16)},
  gb=(bx,c,w)=>{fR(c+(.12+.1*near(bx,92,28))+')',bx-24,6,48,100);X.setLineDash(w);for(const y of[28,55,82])ln(c+'.8)',2.5,bx-24,y,bx+10,y);X.setLineDash([])},
  DG=[
  ()=>{const o=T%1.6<.5;rrc(11,24,22,36,10,o&&Y,WT);pbtn(62,46,o);rrc(86,38,32,16,4,o&&Y,WT);['Clic','Toque','Espacio'].forEach((t,i)=>txt(t,[20,62,102][i],86,10,WT))},
  ()=>{const p=ph(4),s=sm(p),on=p<.5,x=lp(100,66,s),y=lp(70,26,s);
    sk(x,y,lp(.3,-.25,s),.75,100,16);pbtn(18,22,on);txt(on?'JALA':'SUELTA',4,52,12,on?G:RD,'left');arw(110,on?60:30,110,on?30:60,on?G:RD)},
  ()=>{const p=ph(3),u=max(0,p-.25),y=72-40*(u<.2?sin(u/.2*PI/2):exp(-(u-.2)*2.5));
    sk(70,y,0,.75,100,16);pbtn(18,22,p>.18&&p<.25);
    txt('TOQUE',4,52,12,Y,'left');if(u>0&&u<.5)ga(1-u*2),txt('¡Tirón!',92,20,13,WT),ga(1)},
  ()=>gu(0),()=>gu(1),
  ()=>{const p=ph(5),v=p<.8?min(1,p/.7)*1.15:0;fR(WH+'.25)',8,30,104,16);fR(v<.7?G:v<1?Y:RD,8,30,v/1.2*104,16);fR(WT,8+.83*104,24,3,28);
    if(p<.8)ln(v>1?RD:v>.7?Y:WT,1.5+v*2.5,10,84,110,84);else{ln(WT,1.5,10,84,52,84);ln(WT,1.5,70,84,110,84);if(p<.9)txt('¡CRAC!',61,104,14,RD)}},
  ()=>{const p=ph(4),t=p<.45?p/.45:p<.85?1:1-(p-.85)/.15,x=lp(26,84,t),y=lp(84,40,t);
    if(p<.45||p>.9){sa();tt(84+8*sin(T*2),40+4*sin(T*3));paper('#f7b',1);re()}
    drawKite(x,y,0,.6,60);
    if(p>.45&&p<.85)ga(1-(p-.45)/.4),txt('+35',84,36-(p-.45)*60,16,Y),ga(1);
    arw(10,100,10,16,Y);txt('×2,5',16,22,11,Y,'left');txt('×1',16,104,11,WT,'left')},
  ()=>{const p=ph(4),rx=lp(132,-10,p),cut=p>.64&&p<.95;
    ln(WT,2,14,98,56,64);ln(rx<110&&!cut&&p<.64?`rgba(255,60,60,${.6+.4*sin(T*16)})`:'#fe7',4,33,81,56,64);
    if(cut)fR('#0c0618',30,66,14,22),txt('¡Corte!',70,100,13,RD);
    drawKite(56,36,0,.65,80);P([rx,62,rx+10,76,rx,90,rx-10,76],'#e22')},
  ()=>{const i=(T/2.5|0)%3,y=80+(i==1?10:0)+8*sin(T*(i==2?5:2));
    rrc(4,4,114,24,10,'#e85');txt(EV[i][0]+' ×2',61,21,11,WT);
    for(const yy of[48,62]){const x=(T*(i?30:90)+yy*3)%130;ln(i==1?'#7bf':WT,2,x-8,yy,x+12,yy)}
    drawKite(61,y,0,.6,60);if(i==1&&T*4%1<.6)txt('¡JALA!',61,y-22,13,RD)}
  ],
  HELP=[['Cómo se juega',[
    ['UN SOLO BOTÓN','Clic, toque, Espacio, ↑ o W.'],
    ['MANTÉN Y SUELTA','Mantén: sube y acorta la cuerda. Suelta: da cuerda y baja.'],
    ['TIRÓN CORTO','Un toque rápido (<0,2 s) da un empujón arriba.']]],
   ['Viento y tensión',[
    ['RÁFAGA','Franja blanca: viento fuerte. ¡Suelta cuerda!'],
    ['CALMA','Franja azul: viento flojo. ¡Jala o cae!'],
    ['TENSIÓN','Si la barra pasa la marca blanca mucho rato, el hilo se revienta.']]],
   ['Puntos y peligros',[
    ['PAPEL DE CHINA','Flota con el viento. Atrápalo y haz combos hasta ×8.'],
    ['RIVALES','Si cruzan el tramo amarillo del hilo, lo cortan. ♥ Salvavidas: perdona 1 fallo, recarga en 45 s.'],
    ['EVENTOS','Ventarrón, calma y torbellino avisan 3 s antes. Valen ×2.']]]],
  pg=d=>{hp=cl(hp+d,0,2);click()};
const helpUI=()=>{
  const [t,cs]=HELP[hp],x=cx-cw/2,ch=134;
  head(t.toUpperCase(),30,24);
  for(let i=0;i<3;i++)ci(i==hp?Y:WH+'.35)',cx+(i-1)*20,oy+54,5);
  btn('‹',oy+40,()=>pg(-1),0,40,cx-90,28);btn('›',oy+40,()=>pg(1),0,40,cx+50,28);
  cs.forEach((c,i)=>{
    const y=oy+78+i*(ch+8);
    rrc(x,y,cw,ch,14,'rgba(0,0,0,.5)');
    sa();X.beginPath();X.rect(x+4,y+4,122,ch-8);X.clip();tt(x+4,y+(ch-110)/2);DG[hp*3+i]();re();
    txt(c[0],x+134,y+30,16,Y,'left');wrap(c[1],x+134,y+54,cw-148,18,14,WT)
  });
  const y=oy+78+3*(ch+8)+2,bw=(cw-8)/2;
  btn('Volver',y,()=>go('menu'),0,bw,x);btn('Practicar',y,()=>startGame(1),1,bw,x+bw+8)
}
const overUI=()=>{
  head(cause,150,min(40,W/11));
  txt(`Puntos: ${score|0}`,cx,oy+205,32,WT);
  txt(prac?'Práctica: no cuenta para el Top 10':rank?`¡Entraste al Top 10, lugar ${rank}!`:`Récord: ${max(tb[0]?tb[0].s:0,score|0)}`,cx,oy+238,18,rank?Y:'#ddd',0,600);
  let y=oy+275;
  if(over>.6){
    if(rank)btn('Guardar puntaje',y,()=>{go('name');click()},1),y+=58;
    btn('Reintentar',y,()=>startGame(prac),!rank);btn('Menú',y+58,()=>go('menu'))
  }
}
const nameUI=()=>{
  head('TUS INICIALES',100,28);
  txt(`Lugar ${rank} · ${score|0} puntos`,cx,oy+140,18,WT,0,500);
  for(let i=0;i<3;i++){
    const x=cx-100+i*72,y=oy+170,f=item(x,y,64,100,d=>{nm[i]=String.fromCharCode(65+(nm[i].charCodeAt(0)-65+d+26)%26);click()},{v:1,go:()=>fi++});
    rrc(x,y,64,100,12,f?'rgba(255,213,74,.25)':WH+'.12)',f&&Y);
    txt(nm[i],x+32,y+66,52,WT);txt('▲',x+32,y+22,16,Y);txt('▼',x+32,y+94,16,Y)
  }
  btn('Guardar',oy+300,saveScore,1);
  txt('Teclea letras o usa ▲ ▼',cx,oy+372,13,WH+'.7)',0,400)
}
const saveScore=()=>{
  const e={n:nm.join(''),s:score|0,d:Date.now()};
  tb.push(e);tb.sort((a,b)=>b.s-a.s||a.d-b.d);tb=tb.slice(0,10);hl=tb.indexOf(e);
  sv('barrilete_top',tb);sv('barrilete_ini',nm.join(''));click();go('scores')
}
const pauseUI=()=>{head('PAUSA',140,36);btn('Continuar',oy+200,()=>go('play'),1);btn('Menú',oy+260,()=>go('menu'))}

const draw=()=>{
  X.setTransform(1,0,0,1,0,0);X.drawImage(bg,0,0);X.setTransform(F,0,0,F,0,0);
  sa();if(shake>0)tt((R()-.5)*shake*24,(R()-.5)*shake*24);
  scene();re();
  if(st=='play'||st=='pause'||st=='over'||st=='name')hud();
  if(st=='play')return;
  fR(`rgba(8,4,24,${st=='menu'?.35:.82})`,0,0,W,H);
  items=[];sa();ga(1-tr);tt(0,tr*16);
  ({menu:menuUI,custom:customUI,scores:scoresUI,help:helpUI,over:overUI,name:nameUI,pause:pauseUI})[st]();
  re();
  if(fi>=items.length)fi=0
}

// ---------- entrada: un solo botón (clic izquierdo, toque, Espacio, ↑ o W) ----------
const HK=[' ','arrowup','w'],
  hit=(x,y)=>items.findIndex(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h),
  clr=()=>{ptr.clear();keys.clear();hd=0;tapq=0},
  pause=()=>{clr();if(st=='play')go('pause')};
const chg=()=>{ // flanco de subida/bajada; un toque más corto que TAP pide el tirón aunque dure menos que un cuadro
  const h=ptr.size+keys.size>0;
  if(h&&!hd)pt=T,sus=0;
  if(!h&&hd&&st=='play'&&T-pt<TAP)tapq=1;
  hd=h?1:0
}
const act=(i,d)=>{
  if(st=='over'&&over<.6)return;
  const b=items[i];if(b){fi=i;b.act(d);if(!b.r&&!b.v)click()}
}
addEventListener('pointerdown',e=>{
  if(e.pointerType=='mouse'&&e.button)return;
  try{C.setPointerCapture(e.pointerId)}catch{}
  if(st=='play'){ptr.add(e.pointerId);chg();return}
  const x=e.clientX/sc,y=e.clientY/sc;pd={x,y,i:hit(x,y)}
});
const rel=(e)=>{
  wake();
  if(ptr.delete(e.pointerId))chg();
  if(!pd||e.type!='pointerup')return pd=0;
  const x=e.clientX/sc,y=e.clientY/sc,i=pd.i,dx=x-pd.x;pd=0;
  if(st=='help'&&abs(dx)>50)return pg(dx<0?1:-1);
  const b=items[i];
  if(b&&hit(x,y)==i)act(i,b.r?(x<b.x+b.w/2?-1:1):b.v?(y<b.y+b.h/2?1:-1):1)
}
for(const n of['pointerup','pointercancel','lostpointercapture'])addEventListener(n,rel);
addEventListener('pointermove',e=>{
  if(e.pointerType!='mouse'||st=='play')return;
  const i=hit(e.clientX/sc,e.clientY/sc);if(i>=0)fi=i
});
addEventListener('keydown',e=>{
  const q=e.key,l=q.toLowerCase();wake();
  if(st=='play'){
    if(HK.includes(l)){e.preventDefault();if(!e.repeat){keys.add(l);chg()}}
    else if(q=='Escape'||l=='p')pause();
    return
  }
  if(e.repeat&&!q.startsWith('Arrow'))return;
  const n=items.length,b=items[fi];
  if(st=='name'&&/^[a-zA-Z]$/.test(q)){nm[min(fi,2)]=q.toUpperCase();fi=min(fi+1,3);click();return}
  if(st=='name'&&q=='Backspace'){fi=max(0,fi-1);return}
  if(q=='Escape'){e.preventDefault();go(st=='pause'?'play':'menu');return}
  const nx=d=>fi=(fi+d+n)%n,v=q=='ArrowUp'?1:q=='ArrowDown'?-1:0,h=q=='ArrowLeft'?-1:q=='ArrowRight'?1:0;
  if(v||h)e.preventDefault();
  if(v)b&&b.v?b.act(v):nx(-v);
  else if(h)b&&b.r?b.act(h):st=='help'?pg(h):nx(h);
  else if(q=='Enter'||q==' '){e.preventDefault();if(b&&b.go)b.go();else act(fi,1)}
});
addEventListener('keyup',e=>{if(keys.delete(e.key.toLowerCase()))chg()});
addEventListener('blur',pause);
document.addEventListener('visibilitychange',()=>document.hidden&&pause());
for(const n of['touchstart','touchmove','gesturestart','dblclick','auxclick','contextmenu','dragstart'])addEventListener(n,e=>e.preventDefault(),{passive:false});
addEventListener('resize',resize);

// ---------- bucle ----------
let last=0,acc=0;
const loop=(t)=>{
  const dt=min(.05,(t-last)/1000||0);last=t;
  if(st!='pause'){acc+=dt;while(acc>=1/120){step(1/120);acc-=1/120}}
  if(st=='over')over+=dt;
  tr=max(0,tr-dt*4);shake=max(0,shake-dt*1.6);
  draw();requestAnimationFrame(loop)
}
nm=[0,1,2].map(i=>/^[A-Z]$/.test(nm[i])?nm[i]:'A');
resize();apply();reset();requestAnimationFrame(loop);
