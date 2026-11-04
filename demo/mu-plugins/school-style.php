<?php
/* Plugin Name: School Style (demo) */
add_action('wp_head', function () { ?>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
<style>
:root{--a50:hsl(142 70% 96%);--a100:hsl(142 70% 90%);--a200:hsl(142 70% 80%);--a300:hsl(142 70% 70%);--a500:hsl(142 70% 40%);--a600:hsl(142 70% 33%);--a700:hsl(142 70% 26%);--a800:hsl(142 70% 18%);--ink:#0f1f17;--mut:#5b6b62}
html{scroll-behavior:smooth;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
body{font-family:Inter,system-ui,sans-serif;color:var(--ink);background:#fbfdfb;-webkit-font-smoothing:antialiased}
h1,h2,h3,.wp-block-site-title{font-family:Outfit,Inter,sans-serif!important;font-weight:800;letter-spacing:-.02em;line-height:1.1}
a,button,.wp-element-button{cursor:pointer}
::-webkit-scrollbar{width:10px}::-webkit-scrollbar-thumb{background:var(--a300);border-radius:99px}
/* glass sticky nav */
.wp-site-blocks>header,header.wp-block-template-part{position:sticky;top:0;z-index:50;background:rgba(251,253,251,.78);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid rgba(0,0,0,.05)}
header .wp-block-site-title a{text-decoration:none;color:var(--ink);font-size:1.35rem}
header .wp-block-site-title .hb-a{color:var(--a600)}
header .wp-block-navigation a{padding:.45rem 1rem;border-radius:999px;text-decoration:none;font-weight:500;font-size:.95rem;transition:all .15s}
header .wp-block-navigation a:hover{background:var(--a50);color:var(--a700)}
header .wp-block-navigation .current-menu-item>a{background:var(--a100);color:var(--a800)}
/* buttons */
.wp-element-button,.wp-block-button__link{background:linear-gradient(135deg,var(--a500),var(--a700))!important;color:#fff!important;border:0!important;border-radius:14px!important;padding:.85rem 1.6rem!important;font-weight:600;box-shadow:0 8px 22px -6px hsl(142 70% 33%/.55);transition:all .15s}
.wp-element-button:active{transform:scale(.95)}.wp-element-button:hover{transform:translateY(-2px)}
.is-style-outline .wp-block-button__link{background:rgba(255,255,255,.14)!important;box-shadow:none;border:1.5px solid rgba(255,255,255,.7)!important;backdrop-filter:blur(6px)}
/* eyebrow */
.hb-eyebrow{font-size:.72rem!important;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--a600);margin:0 0 .6rem!important}
.hb-hero .hb-eyebrow{color:var(--a200)}
/* hero */
.hb-hero{position:relative;overflow:hidden;background:radial-gradient(900px 400px at 85% -10%,hsl(142 70% 40%/.55),transparent 60%),radial-gradient(700px 400px at -5% 110%,hsl(165 70% 35%/.5),transparent 60%),linear-gradient(160deg,var(--a800),#0b2a1a);color:#fff;padding:7rem 1.5rem 6rem!important;text-align:center}
.hb-hero h1{font-size:clamp(2.4rem,6vw,4.4rem);max-width:15ch;margin:0 auto 1.2rem!important;color:#fff}
.hb-hero p{max-width:56ch;margin-left:auto;margin-right:auto;color:rgba(255,255,255,.82);font-size:1.15rem}
.hb-hero:before{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.07) 1px,transparent 1px);background-size:26px 26px;pointer-events:none}
.hb-hero>*{position:relative}
.hb-pills{gap:.6rem!important;margin-top:2.2rem}
.hb-pills p{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(8px);padding:.45rem 1rem;border-radius:999px;font-size:.85rem!important;margin:0!important}
/* sections */
.hb-section{padding:5rem 1.5rem!important}
.hb-section>h2,.hb-center{text-align:center}
.hb-section h2{font-size:clamp(1.8rem,4vw,2.6rem);margin-bottom:.5rem}
.hb-section .hb-lead{color:var(--mut);max-width:58ch;margin:0 auto 2.5rem;text-align:center}
.hb-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.4rem;max-width:1100px;margin:0 auto}
.hb-card{background:rgba(255,255,255,.75);backdrop-filter:blur(6px);border:1px solid rgba(0,0,0,.05);border-radius:24px;padding:1.8rem!important;box-shadow:0 10px 40px -18px rgba(15,60,35,.28);transition:all .2s;animation:fadeup .5s ease-out both}
.hb-card:hover{transform:translateY(-5px);box-shadow:0 20px 50px -18px rgba(15,60,35,.35)}
.hb-card h3{font-size:1.3rem;margin:.9rem 0 .4rem}.hb-card p{color:var(--mut);margin:0}
.hb-ico{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-family:Outfit;font-weight:800;background:var(--a100);color:var(--a700)}
.hb-card:nth-child(2) .hb-ico{background:hsl(165 60% 88%);color:hsl(165 70% 22%)}
.hb-card:nth-child(3) .hb-ico{background:hsl(95 60% 86%);color:hsl(95 60% 22%)}
.hb-card:nth-child(4) .hb-ico{background:hsl(190 60% 88%);color:hsl(190 70% 22%)}
/* stats */
.hb-stats{background:linear-gradient(135deg,var(--a700),var(--a800));color:#fff;padding:3.5rem 1.5rem!important}
.hb-stats .hb-grid{grid-template-columns:repeat(auto-fit,minmax(170px,1fr));text-align:center}
.hb-stats .num{font-family:Outfit;font-size:3rem;font-weight:800;line-height:1;margin:0;color:#fff}
.hb-stats .lbl{margin:.4rem 0 0;color:var(--a200);font-size:.8rem;text-transform:uppercase;letter-spacing:.14em;font-weight:600}
/* events */
.hb-date{display:inline-block;background:var(--a100);color:var(--a800);font-weight:700;font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;padding:.3rem .8rem;border-radius:999px}
/* cta */
.hb-cta{margin:0 auto 5rem!important;width:calc(100% - 3rem);max-width:1100px!important;border-radius:32px;background:linear-gradient(135deg,var(--a500),var(--a800));color:#fff;text-align:center;padding:4rem 2rem!important;box-shadow:0 30px 60px -25px hsl(142 70% 25%/.6)}
.hb-cta h2{color:#fff;font-size:clamp(1.8rem,4vw,2.6rem)}.hb-cta p{color:rgba(255,255,255,.85)}
.hb-cta .wp-element-button{background:#fff!important;color:var(--a800)!important}
/* inner pages */
.wp-block-post-title{font-size:clamp(2.2rem,5vw,3.4rem)!important;background:linear-gradient(160deg,var(--a800),#0b2a1a);color:#fff;margin:0!important;width:100%;max-width:100%!important;padding:4rem 1.5rem!important;text-align:center}
.home .wp-block-post-title{display:none}
.wp-site-blocks>main,main.wp-block-group{margin-top:0!important;padding-top:0!important}
main.has-global-padding,.wp-site-blocks>main,main .has-global-padding,.wp-block-post-content{padding-left:0!important;padding-right:0!important;max-width:none!important}
.wp-block-post-content>*{max-width:none!important;margin-left:0!important;margin-right:0!important}
.hb-section>*,.hb-hero>*,.hb-cta>*{max-width:1100px;margin-left:auto!important;margin-right:auto!important}
body{overflow-x:hidden}
main .wp-block-post-content>h2{margin-top:3rem}
/* footer */
footer .wp-block-navigation,footer .wp-block-group:has(>.wp-block-navigation){display:none!important}
footer{background:var(--a800);color:var(--a200)!important}footer a{color:#fff}
.hb-eyebrow{text-align:center!important;margin:0 auto .6rem!important}
.hb-card p{font-size:.95rem!important;line-height:1.6}
.wp-site-blocks{gap:0!important}.wp-site-blocks>*,.wp-block-post-content>*:first-child{margin-block-start:0!important}
main .wp-block-post-content,main .entry-content{padding:0!important;margin:0!important}
.wp-block-post-content>.wp-block-group{margin-block-start:0!important;margin-block-end:0!important}
@keyframes fadeup{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.hb-card:nth-child(2){animation-delay:.08s}.hb-card:nth-child(3){animation-delay:.16s}.hb-card:nth-child(4){animation-delay:.24s}
</style>
<script>document.addEventListener('DOMContentLoaded',function(){var a=document.querySelector('header .wp-block-site-title a');if(a&&!a.querySelector('.hb-a')){var w=a.textContent.trim().split(' ');a.innerHTML='<span class="hb-a">'+w.shift()+'</span> '+w.join(' ');}});</script>
<?php });
