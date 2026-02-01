(() => {
'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const btn = document.getElementById('startBtn');
const scoreBox = document.getElementById('score');

const W = canvas.width, H = canvas.height;
const ZIEMIA = 80;

const G = 0.08, SKOK = -4.5, MAXV = 3;
const SZ_RURY = 80, PRZERWA = 220, PREDKOSC = 1.2, INTERWAL = 260;

let stan = 'start';
let wynik = 0;
let najlepszy = Number(localStorage.getItem('najlepszy')) || 0;
let klatki = 0;

const samolot = { x:140, y:H/2, w:56, h:42, v:0 };
const rury = [];

const img = {};
const pliki = {
  tlo:'PNG/background.png',
  ziemia:'PNG/groundGrass.png',
  s1:'PNG/Planes/planeBlue1.png',
  s2:'PNG/Planes/planeBlue2.png',
  s3:'PNG/Planes/planeBlue3.png',
  rG:'PNG/rock.png',
  rD:'PNG/rockDown.png'
};
for(const k in pliki){
  const i = new Image();
  i.src = pliki[k];
  i.onload = () => img[k] = i;
}

let audio;
function beep(f, t){
  try{
    audio ||= new (window.AudioContext||window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain();
    o.type='sine'; o.frequency.value=f;
    g.gain.value=0.1; g.gain.exponentialRampToValueAtTime(0.01, audio.currentTime+t);
    o.connect(g); g.connect(audio.destination);
    o.start(); o.stop(audio.currentTime+t);
  }catch(e){}
}

function reset(){
  stan='start'; wynik=0; klatki=0;
  rury.length=0;
  samolot.y = H/2; samolot.v = 0;
  btn.style.display='inline-block';
  btn.textContent='Start';
  pokazWynik();
}

function pokazWynik(){
  scoreBox.textContent = `Wynik: ${wynik} | Najlepszy: ${najlepszy}`;
}

function start(){
  reset();
  stan='gra';
  btn.style.display='none';
}

function skok(){
  if(stan==='gra'){
    samolot.v = SKOK;
    beep(520,0.1);
  }
}

function dodajRure(){
  const g = 100 + Math.random() * (H - PRZERWA - 300);
  rury.push({ x:W+40, gora:g, punkt:false });
}

function aktualizuj(){
  if(stan==='gra'){
    klatki++;

    samolot.v = Math.min(samolot.v + G, MAXV);
    samolot.y += samolot.v;

    if(klatki % INTERWAL === 0) dodajRure();

    for(let i=rury.length-1;i>=0;i--){
      const r = rury[i];
      r.x -= PREDKOSC;

      if(!r.punkt && r.x + SZ_RURY < samolot.x){
        r.punkt = true;
        wynik++;
        if(wynik > najlepszy){
          najlepszy = wynik;
          localStorage.setItem('najlepszy', najlepszy);
        }
        pokazWynik();
        beep(880,0.08);
      }

      const kolizja =
        samolot.x + samolot.w > r.x &&
        samolot.x < r.x + SZ_RURY &&
        (samolot.y < r.gora || samolot.y + samolot.h > r.gora + PRZERWA);

      if(kolizja){
        stan='koniec';
        btn.style.display='inline-block';
        btn.textContent='Restart';
      }

      if(r.x + SZ_RURY < 0) rury.splice(i,1);
    }

    if(samolot.y < 0 || samolot.y + samolot.h > H - ZIEMIA){
      stan='koniec';
      btn.style.display='inline-block';
      btn.textContent='Restart';
    }
  }

  rysuj();
  requestAnimationFrame(aktualizuj);
}

function rysuj(){
  ctx.clearRect(0,0,W,H);

  img.tlo && ctx.drawImage(img.tlo,0,0,W,H);

  for(const r of rury){
    img.rG && ctx.drawImage(img.rG, r.x, 0, SZ_RURY, r.gora);
    img.rD && ctx.drawImage(img.rD, r.x, r.gora+PRZERWA, SZ_RURY, H);
  }

  img.ziemia && ctx.drawImage(img.ziemia,0,H-ZIEMIA,W,ZIEMIA);

  const kl = [img.s1,img.s2,img.s3];
  const sprite = kl[Math.floor(klatki/6)%3];

  ctx.save();
  ctx.translate(samolot.x+samolot.w/2, samolot.y+samolot.h/2);
  ctx.rotate(samolot.v * 0.08);
  sprite && ctx.drawImage(sprite, -samolot.w/2, -samolot.h/2, samolot.w, samolot.h);
  ctx.restore();

  ctx.fillStyle='yellow';
  ctx.font='28px Arial';
  ctx.textAlign='center';
  ctx.fillText(`Wynik: ${wynik}`, W/2, 50);

  if(stan==='start'){
    ctx.fillStyle='black';
    ctx.font='24px Arial';
    ctx.fillText('Kliknij Start lub spację aby zacząć', W/2, H/2 - 40);
  }

  if(stan==='koniec'){
    ctx.fillStyle='red';
    ctx.font='28px Arial';
    ctx.fillText('Koniec gry!', W/2, H/2 - 40);
    ctx.fillText(`Twój wynik: ${wynik}`, W/2, H/2);
    ctx.fillText(`Najlepszy wynik: ${najlepszy}`, W/2, H/2 + 40);
  }
}

document.addEventListener('keydown', e => {
  if(e.code === 'Space'){
    if(stan!=='gra') start();
    skok();
  }
});

canvas.addEventListener('click', () => {
  if(stan!=='gra') start();
  skok();
});

btn.onclick = () => { if(stan!=='gra') start(); };

reset();
aktualizuj();

})();
