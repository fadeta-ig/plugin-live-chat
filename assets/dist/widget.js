"use strict";(()=>{var F="ai_woo_sa_session_id",Y="ai_woo_sa_history",R="ai_woo_sa_last_seen_product_id";var Mt="ai-woo-sa-widget-root",Pt=["TRIGGER_HUMAN_FALLBACK","TRIGGER_HUMAN"],Bt="Mohon tunggu, saya sedang menyambungkan Anda dengan Customer Service kami...";var ht=null,Dt=t=>{ht=t},g=()=>{if(!ht)throw new Error("AI Sales Assistant: configuration accessed before init.");return ht};var Q="aiWooSaRemoveQuickReplies",v="aiWooSaShowInitialQuickReplies",$t="aiWooSaAddToCart",I=t=>{document.dispatchEvent(new Event(t))},Et=(t,e)=>{document.addEventListener(t,e)},Ut=t=>{document.dispatchEvent(new CustomEvent($t,{detail:t}))},Kt=t=>{document.addEventListener($t,e=>{e instanceof CustomEvent&&t(e.detail)})};var d=t=>typeof t=="object"&&t!==null&&!Array.isArray(t),s=(t,e="")=>typeof t=="string"?t:typeof t=="number"&&Number.isFinite(t)?String(t):e,Wt=t=>typeof t=="number"&&Number.isFinite(t)?t:parseFloat(s(t))||0;var eo=t=>d(t)?[{name:s(t.name),qty:s(t.qty,"1"),total:s(t.total)}]:[],oo=t=>d(t)?{courier:s(t.courier),tracking_number:s(t.tracking_number),status_label:s(t.status_label)}:null,bt=t=>{if(!d(t))return null;let e=Array.isArray(t.items)?t.items.flatMap(eo):[];return{order_number:s(t.order_number)||s(t.order_id),status:s(t.status),status_raw:s(t.status_raw),date:s(t.date,"-"),items:e,tracking:oo(t.tracking),total:s(t.total)}},V=t=>{if(!d(t))return null;let e=Array.isArray(t.orders)?t.orders.flatMap(o=>{let r=bt(o);return r?[r]:[]}):[];return{guest_redirect:s(t.guest_redirect)||null,orders:e}};var ro="Produk",no="#",kt=t=>{if(!d(t))return null;let e=parseInt(s(t.product_id),10);return Number.isNaN(e)?null:{product_id:e,title:s(t.title)||ro,price:Wt(t.price),permalink:s(t.permalink)||no,image_url:s(t.image_url)}},z=t=>Array.isArray(t)?t.flatMap(e=>{let o=kt(e);return o?[o]:[]}):[];var ao=t=>{let{text:e,sender:o,isRawHtml:r}=t;return typeof e!="string"||o!=="bot"&&o!=="user"?null:{type:"msg",text:e,sender:o,isRawHtml:!!r}},qt=t=>{if(!d(t))return null;switch(t.type){case"msg":return ao(t);case"product":{let e=kt(t.data);return e?{type:"product",data:e}:null}case"order":{let e=bt(t.data);return e?{type:"order",data:e}:null}case"wa":return typeof t.link=="string"?{type:"wa",link:t.link}:null;case"tracking_redirect":return typeof t.url=="string"?{type:"tracking_redirect",url:t.url}:null;default:return null}};var H=t=>{try{return window.localStorage.getItem(t)}catch{return null}},A=(t,e)=>{try{window.localStorage.setItem(t,e)}catch{}},O=t=>{try{window.localStorage.removeItem(t)}catch{}};var so=/^sess_[a-zA-Z0-9_-]{16,64}$/,Gt=16,io=()=>{if(window.crypto&&window.crypto.getRandomValues){let e=new Uint8Array(Gt);return window.crypto.getRandomValues(e),"sess_"+Array.from(e,o=>o.toString(16).padStart(2,"0")).join("")}return"sess_"+(Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)).padEnd(Gt,"0").slice(0,32)},jt=()=>{let t=H(F);if(t&&so.test(t))return t;let e=io();return A(F,e),e},Ft=jt(),$=()=>Ft,Yt=()=>{O(F),Ft=jt()};var J=[],y=t=>{J.push(t)},w=()=>{A(Y,JSON.stringify({session_id:$(),items:J,timestamp:Date.now()}))},Qt=()=>{J=[],O(Y)},co=t=>{let e=JSON.parse(t);return!d(e)||e.session_id!==$()||typeof e.timestamp!="number"||Date.now()-e.timestamp>=864e5?null:Array.isArray(e.items)?e.items.flatMap(o=>{let r=qt(o);return r?[r]:[]}):[]},Vt=()=>{let t=H(Y);if(!t)return null;try{let e=co(t);return e&&(J=e),e}catch{return null}};var zt=()=>{O(R),Yt(),Qt()};var X=null,h=(t,e)=>{let o=document.getElementById(t);if(!(o instanceof e))throw new Error(`AI Sales Assistant: element #${t} is missing or has an unexpected type.`);return o},Jt=()=>(X={chatBody:h("ai-woo-sa-body",HTMLDivElement),inputField:h("ai-woo-sa-input",HTMLInputElement),sendBtn:h("ai-woo-sa-send-btn",HTMLButtonElement),fabBtn:h("ai-woo-sa-fab",HTMLButtonElement),badge:h("ai-woo-sa-badge",HTMLElement),closeBtn:h("ai-woo-sa-close-btn",HTMLButtonElement),resetBtn:h("ai-woo-sa-reset-btn",HTMLButtonElement),chatWindow:h("ai-woo-sa-window",HTMLElement),confirmOverlay:h("ai-woo-sa-confirm-overlay",HTMLElement),confirmText:h("ai-woo-sa-confirm-text",HTMLElement),confirmCancel:h("ai-woo-sa-confirm-cancel",HTMLButtonElement),confirmOk:h("ai-woo-sa-confirm-ok",HTMLButtonElement),jumpBtn:h("ai-woo-sa-jump-btn",HTMLButtonElement)},X),c=()=>{if(!X)throw new Error("AI Sales Assistant: UI accessed before mount.");return X};var Xt=()=>{try{let t=window.AudioContext,e=new t;if(e.state==="suspended")return;let o=e.createOscillator(),r=e.createGain(),n=e.currentTime;o.type="sine",o.frequency.setValueAtTime(600,n),o.frequency.exponentialRampToValueAtTime(1200,n+.1),r.gain.setValueAtTime(0,n),r.gain.linearRampToValueAtTime(.1,n+.05),r.gain.exponentialRampToValueAtTime(.01,n+.3),o.connect(r),r.connect(e.destination),o.start(),o.stop(n+.3)}catch{}};var St=0,Z=()=>{let{chatWindow:t,badge:e}=c();t.classList.contains("open")||(St+=1,e.textContent=String(St),e.style.display="flex",Xt())},Zt=()=>{let{badge:t}=c();St=0,t.style.display="none",t.textContent="0"};var po=640,mo=()=>window.innerWidth<=po,U=null,tt=()=>{let{chatWindow:t}=c();mo()&&t.classList.contains("open")?(U===null&&(U=document.body.style.overflow),document.body.style.overflow="hidden",t.setAttribute("aria-modal","true"),window.visualViewport&&t.style.setProperty("--ai-woo-sa-viewport-height",window.visualViewport.height+"px")):(U!==null&&(document.body.style.overflow=U),U=null,t.removeAttribute("aria-modal"),t.style.removeProperty("--ai-woo-sa-viewport-height"))},te=()=>{var t;window.addEventListener("resize",tt),(t=window.visualViewport)==null||t.addEventListener("resize",tt)},et=()=>{let{chatWindow:t,fabBtn:e}=c();t.classList.contains("open")&&(t.classList.remove("open"),e.classList.remove("open"),e.setAttribute("aria-expanded","false"),e.focus({preventScroll:!0}),t.setAttribute("inert",""),t.setAttribute("aria-hidden","true"),tt())},uo=()=>{let{chatWindow:t,fabBtn:e,chatBody:o}=c();t.removeAttribute("inert"),t.setAttribute("aria-hidden","false"),t.classList.add("open"),e.classList.add("open"),e.setAttribute("aria-expanded","true"),tt(),o.querySelector(".ai-woo-sa-welcome")&&(o.scrollTop=0),t.focus({preventScroll:!0}),Zt()},ee=()=>{let{chatWindow:t}=c();t.classList.contains("open")?et():uo()};var K=null,oe=(t,e)=>{K==null||K();let{confirmOverlay:o,confirmText:r,confirmOk:n,confirmCancel:i,chatWindow:a}=c(),u=document.activeElement instanceof HTMLElement?document.activeElement:null,T=[...a.children].filter(f=>f!==o),j=T.map(f=>f.hasAttribute("inert"));T.forEach(f=>f.setAttribute("inert","")),r.textContent=t,o.removeAttribute("inert"),o.setAttribute("aria-hidden","false"),o.classList.add("show");let b=()=>{o.classList.remove("show"),o.setAttribute("inert",""),o.setAttribute("aria-hidden","true"),T.forEach((f,to)=>f.toggleAttribute("inert",j[to])),n.removeEventListener("click",_),i.removeEventListener("click",b),o.removeEventListener("click",C),o.removeEventListener("keydown",Ot),document.removeEventListener("focusin",D),K=null,u==null||u.focus({preventScroll:!0})},_=()=>{b(),e()},C=f=>{f.target===o&&b()},D=f=>{o.contains(f.target)||i.focus({preventScroll:!0})},Ot=f=>{f.key==="Escape"?(f.preventDefault(),f.stopPropagation(),b()):f.key==="Tab"&&(f.preventDefault(),(document.activeElement===i?n:i).focus())};K=b,n.addEventListener("click",_),i.addEventListener("click",b),o.addEventListener("click",C),o.addEventListener("keydown",Ot),document.addEventListener("focusin",D),i.focus({preventScroll:!0})};var fo=80,Tt=()=>{let{chatBody:t}=c();return t.scrollHeight-t.scrollTop-t.clientHeight>fo},_t=()=>{let{jumpBtn:t}=c();t.style.display=!c().chatBody.querySelector(".ai-woo-sa-welcome")&&Tt()?"inline-flex":"none"},L=(t=!0)=>{let{chatBody:e}=c();(t||!Tt())&&(e.scrollTop=e.scrollHeight),_t()},m=(t,e=!0)=>{var n;let{chatBody:o}=c(),r=!Tt();t.matches(".ai-woo-sa-msg.user")&&((n=o.querySelector(".ai-woo-sa-msg-welcome"))==null||n.remove()),o.appendChild(t),(e||r)&&(o.scrollTop=o.scrollHeight),_t()},re=()=>{let{chatBody:t,jumpBtn:e}=c();t.innerHTML="",e.style.display="none"},ne=()=>{let{chatBody:t,jumpBtn:e}=c();t.addEventListener("scroll",_t),e.addEventListener("click",()=>{t.scrollTo({top:t.scrollHeight,behavior:"smooth"}),e.style.display="none"})};var go={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},l=t=>t.replace(/[&<>"']/g,e=>{var o;return(o=go[e])!=null?o:e});var ae=t=>t.toLocaleString("id-ID"),ot=t=>`${t.getHours().toString().padStart(2,"0")}:${t.getMinutes().toString().padStart(2,"0")}`;var yo=/\p{Extended_Pictographic}|\p{Emoji_Presentation}/gu,se=t=>t.replace(yo,"").trim();var wo=/^(https?:\/\/|\/)/i,ho=/^https?:\/\//i,Eo=/^https:\/\/wa\.me\//i,bo="#",M=t=>wo.test(t)?t:bo,ie=t=>ho.test(t)?t:"",le=t=>Eo.test(t);var ko=/\*\*(.*?)\*\*/g,So=/(?<!\*)\*([^*]+)\*(?!\*)/g,To=/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,Ct=t=>t.replace(To,(o,r,n)=>`<a href="${l(M(n))}" target="_blank" rel="noopener noreferrer" class="ai-woo-sa-text-link">${r}</a>`).replace(ko,"<strong>$1</strong>").replace(So,"<em>$1</em>"),vt=t=>{var j;let e=t.replace(/\r\n?/g,`
`).split(`
`),o=[],r=[],n=[],i="ul",a=1,u=()=>{r.length&&o.push(`<p>${r.join("<br>")}</p>`),r=[]},T=()=>{if(n.length){let b=i==="ol"&&a!==1?` start="${a}"`:"";o.push(`<${i} class="ai-woo-sa-list"${b}>${n.map(_=>`<li>${_}</li>`).join("")}</${i}>`)}n=[]};for(let b of e){let _=b.trim();if(!_){u();continue}let C=_.match(/^(?:[-*•]|(\d+)[.)])\s+(.+)$/);if(C){u();let D=C[1]?"ol":"ul";n.length&&i!==D&&T(),n.length||(a=C[1]?Number(C[1]):1),i=D,n.push(Ct((j=C[2])!=null?j:""));continue}if(n.length&&/^\s+/.test(b)){n[n.length-1]+=` ${Ct(_)}`;continue}T(),r.push(Ct(_))}return u(),T(),o.join("")},rt=t=>vt(l(se(t)));var p=(t,e,o=!0,r=!1)=>{let n=t.includes("ai-woo-sa-welcome"),i=document.createElement("div");i.className=`ai-woo-sa-msg ${e}${n?" ai-woo-sa-msg-welcome":""}`;let a=r?t:`<div class="ai-woo-sa-message-content">${rt(t)}</div>`,u=n?"":`<span class="ai-woo-sa-time">${ot(new Date)}</span>`;return i.innerHTML=`${a}${u}`,m(i),e==="bot"&&!n&&Z(),o&&(y({type:"msg",text:t,sender:e,isRawHtml:r}),w()),i};var _o="https://wa.me/",Co="62",vo=t=>{let e=t.replace(/\D/g,"");return e.startsWith("0")?Co+e.slice(1):e},P=(t,e)=>{let o=_o+vo(t);return e?`${o}?text=${encodeURIComponent(e)}`:o};var nt="Tambah ke Keranjang",ce="Menambahkan...",de="Gagal, coba lagi",pe="Ditambahkan";var me="Maaf, terjadi kesalahan pada server. Silakan coba lagi nanti.",ue="Gagal terhubung ke asisten. Periksa koneksi internet Anda.",fe="Akses obrolan dinonaktifkan.",at="Mohon maaf, nomor Customer Service belum dikonfigurasi. Silakan coba lagi nanti.",st="Halo CS Shinyoung, saya butuh bantuan.";var ge=(t,e)=>{let o=g();return fetch(o.restUrl,{method:"POST",headers:{"Content-Type":"application/json","X-WP-Nonce":o.nonce},body:JSON.stringify({message:t,session_id:$(),current_product:o.currentProduct,cart_items:o.cartItems,stream:e})})},ye=async t=>{let e=await ge(t,!0);return e.ok?e:(console.warn(`AI Chat: SSE stream failed (${e.status}), retrying without streaming...`),ge(t,!1))};var we=!1,he=()=>we,At=t=>{we=t};var Lo=3,xo=6,Ro=1e3,Ee=t=>`
    <div class="ai-woo-sa-typing-text">${t}</div>
    <div class="ai-woo-sa-thinking-bar" aria-hidden="true">
        <div class="ai-woo-sa-thinking-shimmer"></div>
    </div>`,x=null,it=null,lt=null,Io=t=>t===Lo?"Memilih formulasi terbaik...":t===xo?"Menyusun rekomendasi...":null,Lt=()=>{if(x)return;let t=document.createElement("div");t.className="ai-woo-sa-msg bot ai-woo-sa-typing-container",t.id="ai-woo-sa-typing",t.setAttribute("role","status"),t.setAttribute("aria-live","polite"),t.innerHTML=Ee("Memahami kebutuhan Anda..."),x=t,m(t);let e=0;it=window.setInterval(()=>{e+=1;let o=Io(e);o&&x&&(x.innerHTML=Ee(o)),L()},Ro)},be=()=>{lt=window.setTimeout(Lt,300)},xt=()=>{lt!==null&&window.clearTimeout(lt),it!==null&&window.clearInterval(it),lt=null,it=null,x==null||x.remove(),x=null};var ke=`
<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
</svg>`.trim(),Se=`
<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
</svg>`.trim(),ct=`
<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
    <path d="M21 3v5h-5"></path>
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
    <path d="M3 21v-5h5"></path>
</svg>`.trim(),Te=`
<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <line x1="12" y1="19" x2="12" y2="5"></line>
    <polyline points="5 12 12 5 19 12"></polyline>
</svg>`.trim(),An=`
<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"></path>
</svg>`.trim(),_e=`
<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2.5 1 5-1.1 10.6A7 7 0 0 1 11 20z"></path>
    <path d="M2 21c0-3 1.5-6.5 4-8"></path>
</svg>`.trim(),dt=`
<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="m16.5 9.4-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.29 7 12 12 20.71 7"></polyline>
    <line x1="12" y1="22" x2="12" y2="12"></line>
</svg>`.trim(),W=`
<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
</svg>`.trim(),q=`
<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6"></polyline>
</svg>`.trim(),pt=`
<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"></polyline>
</svg>`.trim(),Rt=`
<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
</svg>`.trim(),Ce=`
<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <polyline points="19 12 12 19 5 12"></polyline>
</svg>`.trim();var It=(t,e)=>{var n;let o=document.createElement("div");o.className="ai-woo-sa-error-banner",o.setAttribute("role","alert");let r=e?`<button class="ai-woo-sa-btn-retry" type="button">${ct}<span>Coba lagi</span></button>`:"";return o.innerHTML=`
        <div class="ai-woo-sa-error-text">${l(t)}</div>
        ${r}`,e&&((n=o.querySelector(".ai-woo-sa-btn-retry"))==null||n.addEventListener("click",()=>{o.remove(),e()})),m(o),o};var ve=t=>{let e=d(t)?t:{};return{text:s(e.text),products:z(e.products),orders:V(e.orders),fallback:!!e.fallback,waLink:s(e.wa_link)||null,blocked:!!e.blocked}};var Ae=/\[RECOMMEND:\s*([\d,\s]+)\]/g,No=/\[RECOMMEND:.*?(\]|$)/g,mt=t=>{var n;let e=[],o=t.matchAll(Ae);for(let i of o){let a=((n=i[1])!=null?n:"").split(",").map(u=>parseInt(u.trim(),10)).filter(u=>!Number.isNaN(u));e.push(...a)}return{cleanText:t.replace(Ae,""),productIds:e}},Le=t=>t.replace(No,"");var Ho=(t,e)=>{let o=ie(t.image_url);return o?`<img src="${l(o)}" alt="${e}" class="ai-woo-sa-product-image" loading="lazy" />`:""},Nt=t=>{let e=document.createElement("div");e.className="ai-woo-sa-product-card";let o=l(t.title),r=l(M(t.permalink));e.innerHTML=`
        ${Ho(t,o)}
        <div class="ai-woo-sa-product-title">${o}</div>
        <div class="ai-woo-sa-product-price">Rp ${ae(t.price)}</div>
        <div class="ai-woo-sa-product-actions">
            <div class="ai-woo-sa-product-buttons">
                <button class="ai-woo-sa-btn-cart" data-product-id="${t.product_id}">${nt}</button>
                <a href="${r}" target="_blank" rel="noopener noreferrer" class="ai-woo-sa-btn-link">Lihat</a>
            </div>
            <div class="ai-woo-sa-post-cart" style="display:none;"></div>
        </div>`;let n=e.querySelector(".ai-woo-sa-btn-cart");return n&&n.addEventListener("click",()=>Ut({productId:t.product_id,button:n,productTitle:t.title})),e},B=(t,e=!0)=>{let o=Nt(t);m(o),e&&(y({type:"product",data:t}),w())};var xe=t=>{let e=document.createElement("div");return e.className="ai-woo-sa-product-card",e.innerHTML=t,e},N=(t,e=!0)=>{!t||!le(t)||(m(xe(`<a href="${l(t)}" target="_blank" rel="noopener noreferrer" class="ai-woo-sa-btn-wa">
                ${W}<span>Lanjutkan bersama CS di WhatsApp</span>
            </a>`)),e&&(y({type:"wa",link:t}),w()))},ut=(t,e=!0)=>{m(xe(`<a href="${l(M(t))}" target="_blank" rel="noopener noreferrer" class="ai-woo-sa-btn-tracking">
                ${dt}<span>Lacak Pesanan di Website</span>
            </a>`)),e&&(y({type:"tracking_redirect",url:t}),w())};var Re=(t,e=!0)=>{if(t.length===0)return;let o=document.createElement("div");o.className="ai-woo-sa-carousel",o.setAttribute("role","region"),o.setAttribute("aria-label","Rekomendasi Produk"),t.forEach(r=>{o.appendChild(Nt(r)),e&&y({type:"product",data:r})}),m(o),e&&w()};var Oo=[{key:"ordered",label:"Dipesan"},{key:"processing",label:"Diproses"},{key:"shipped",label:"Dikirim"},{key:"completed",label:"Selesai"}],Mo=t=>{switch(t){case"completed":return 3;case"shipped":return 2;case"processing":return 1;default:return 0}},Ie=t=>{let e=Mo(t),o=Oo.map((r,n)=>`
            <div class="ai-woo-sa-timeline-step ${n<e?"completed":n===e?"active":""}">
                <div class="ai-woo-sa-timeline-dot" aria-hidden="true"></div>
                <span class="ai-woo-sa-timeline-label">${r.label}</span>
            </div>`).join("");return`
        <div class="ai-woo-sa-timeline" role="progressbar" aria-label="Status Pesanan" aria-valuenow="${e+1}" aria-valuemin="1" aria-valuemax="4">
            ${o}
        </div>`};var Po={completed:"status-completed",processing:"status-processing","on-hold":"status-on-hold",pending:"status-pending",cancelled:"status-cancelled",refunded:"status-refunded",shipped:"status-shipped"},Bo="status-default",Do="-",$o=2e3,Uo=t=>t.items.map(e=>`
                <div class="ai-woo-sa-order-item">
                    <span class="ai-woo-sa-item-name">${l(e.name)} x${l(e.qty)}</span>
                    <span class="ai-woo-sa-item-dots" aria-hidden="true"></span>
                    <span class="ai-woo-sa-order-item-price">Rp ${l(e.total)}</span>
                </div>`).join(""),Ko=t=>{let{tracking:e}=t;if(!e||!e.tracking_number||e.tracking_number===Do)return"";let o=l(e.courier),r=l(e.tracking_number);return`
        <div class="ai-woo-sa-order-tracking">
            <div class="ai-woo-sa-tracking-info">
                <span class="ai-woo-sa-tracking-label">${o}</span>
                <span class="ai-woo-sa-tracking-number">${r}</span>
            </div>
            <button class="ai-woo-sa-btn-copy" data-copy="${r}" type="button" aria-label="Salin nomor resi">
                ${Rt}<span>Salin</span>
            </button>
        </div>
        <div class="ai-woo-sa-order-shipping-status">Status Kirim: ${l(e.status_label)}</div>`},Wo=t=>{let e=t.querySelector(".ai-woo-sa-btn-copy");e&&e.addEventListener("click",async()=>{var r;let o=(r=e.getAttribute("data-copy"))!=null?r:"";try{await navigator.clipboard.writeText(o),e.innerHTML=`${pt}<span>Tersalin</span>`,window.setTimeout(()=>{e.innerHTML=`${Rt}<span>Salin</span>`},$o)}catch{}})},ft=(t,e=!0)=>{var n;let o=document.createElement("div");o.className="ai-woo-sa-order-card";let r=(n=Po[t.status_raw])!=null?n:Bo;o.innerHTML=`
        <div class="ai-woo-sa-order-header">
            <span class="ai-woo-sa-order-number">Pesanan #${l(t.order_number)}</span>
            <span class="ai-woo-sa-order-status ${r}">${l(t.status)}</span>
        </div>
        <div class="ai-woo-sa-order-date">${l(t.date)}</div>
        ${Ie(t.status_raw)}
        <div class="ai-woo-sa-order-items">${Uo(t)}</div>
        ${Ko(t)}
        <div class="ai-woo-sa-order-total">Total: <strong>Rp ${l(t.total)}</strong></div>`,Wo(o),m(o),e&&(y({type:"order",data:t}),w())};var gt=t=>{if(t){if(t.guest_redirect){ut(t.guest_redirect);return}t.orders.forEach(e=>ft(e))}},yt=(t,e)=>{let o=t.filter(n=>e.includes(n.product_id));if(o.length===0)return;if(o.length>1){Re(o);return}let[r]=o;r&&B(r)};var qo=()=>{let{inputField:t,sendBtn:e}=c();t.disabled=!0,t.placeholder=fe,e.disabled=!0},Ne=async t=>{let e=ve(await t.json());if(e.text){let{cleanText:o,productIds:r}=mt(e.text);p(o,"bot"),yt(e.products,r)}else e.products.forEach(o=>B(o));if(gt(e.orders),e.fallback&&e.waLink&&N(e.waLink),e.blocked){qo();return}I(v)};var Go=t=>{let e=t.choices;if(!Array.isArray(e))return"";let o=e[0];if(!d(o)||!d(o.delta))return"";let r=o.delta.content;return typeof r=="string"?r:""},He=t=>{if(!d(t))return null;if(t.products||t.orders)return{kind:"meta",products:z(t.products),orders:V(t.orders),fallback:!!t.fallback,waLink:s(t.wa_link)||null};let e=Go(t);return e?{kind:"token",content:e}:null};var Oe="data: ",jo=["[DONE]","{}"],Fo=t=>{let e=t.trim();if(!e.startsWith(Oe))return null;let o=e.slice(Oe.length);if(jo.includes(o))return null;try{return He(JSON.parse(o))}catch{return null}},Me=()=>{let t=new TextDecoder("utf-8"),e="";return{push(o){var n;e+=t.decode(o,{stream:!0});let r=e.split(`
`);return e=(n=r.pop())!=null?n:"",r.flatMap(i=>{let a=Fo(i);return a?[a]:[]})}}};var Pe=async(t,e)=>{if(!t.body)return;let o=t.body.getReader(),r=Me();for(;;){let{done:n,value:i}=await o.read();if(n)return;for(let a of r.push(i))if(e(a)==="abort"){await o.cancel();return}}};var Yo=t=>Pt.some(e=>t.includes(e)),Be=t=>{let e="",o=[],r=a=>{a.products.length>0&&(o=a.products),gt(a.orders),a.fallback&&a.waLink&&N(a.waLink)},n=a=>(e+=a,Yo(e)?(e=Bt,t.textContent=e,L(),N(P(g().waNumber),!0),"abort"):(t.innerHTML=vt(Le(l(e))),L(),"continue"));return{handleEvent:a=>a.kind==="meta"?(r(a),"continue"):n(a.content),finalize:()=>{if(!e)return;let{cleanText:a,productIds:u}=mt(e);t.innerHTML=rt(a),y({type:"msg",text:a,sender:"bot",isRawHtml:!1}),w(),yt(o,u)}}};var De=async t=>{let e=document.createElement("div");e.className="ai-woo-sa-msg bot";let o=document.createElement("div");o.className="ai-woo-sa-message-content",e.appendChild(o),m(e),L(),Z();let r=Be(o);await Pe(t,r.handleEvent),r.finalize();let n=document.createElement("span");n.className="ai-woo-sa-time",n.textContent=ot(new Date),e.appendChild(n),L()};var Vo=async(t,e)=>{var r;if(!t.ok){console.error("AI Chat Error:",t.status,t.statusText),It(me,e?()=>void E(e):void 0),I(v);return}if(((r=t.headers.get("content-type"))!=null?r:"").includes("text/event-stream")){await De(t),I(v);return}await Ne(t)},zo=()=>{window.setTimeout(()=>{let{sendBtn:t,inputField:e}=c();At(!1),t.disabled=!1,e.focus()},1500)},E=async(t=null,e=!1)=>{let{inputField:o,sendBtn:r}=c(),n=t||o.value.trim();if(!(!n||he())){I(Q),!t&&!e&&p(n,"user"),o.value="",At(!0),r.disabled=!0,e?be():Lt();try{let i=await ye(n);xt(),await Vo(i,n)}catch(i){xt(),It(ue,()=>void E(n,e)),console.error("AI Sales Assistant Error:",i),I(v)}finally{zo()}}};var k=(t,e="")=>`Berikan info lengkap produk Shinyoung ${t}${e}`,Jo={label:"Kembali",type:"submenu",target:"initial"},Ht={label:"Kembali",type:"submenu",target:"categories"},Xo=`Pesanan dikirim langsung dari fasilitas kami di **Sleman, Yogyakarta**.

Semua produk Shinyoung diformulasikan **Bebas SLS, Bebas Paraben, dan Non-Alkohol** \u2014 dirancang lembut untuk kulit sensitif.

Pembelian melalui Official Store dijamin **100% orisinal** dengan jaminan kepuasan dan layanan *after-sales support*.

Slogan kami: *Happy Shine on You* \u2014 #ShineBrighterFeelYounger`,$e={initial:[{label:"Produk Kami",type:"submenu",target:"categories"},{label:"Konsultasi Kulit",type:"query",query:"Saya ingin konsultasi tentang kondisi kulit saya, bisa bantu rekomendasikan produk Shinyoung yang cocok?"},{label:"Lacak Pesanan",type:"query",query:"Saya ingin cek status pesanan saya"},{label:"Pesanan Saya",type:"query",query:"Tampilkan pesanan terakhir saya"},{label:"Info Toko",type:"static",response:Xo},{label:"Hubungi CS",type:"action",action:"whatsapp"}],categories:[{label:"Perawatan Wajah",type:"submenu",target:"face"},{label:"Perawatan Rambut",type:"submenu",target:"hair"},{label:"Perawatan Tubuh",type:"submenu",target:"body"},Jo],face:[{label:"Binahong Cream 15g",type:"query",query:k("Binahong Cream 15g"," beserta manfaat dan cara pakainya")},{label:"Binahong Oil 10ml",type:"query",query:k("Binahong Oil 10ml"," beserta manfaat dan cara pakainya")},Ht],hair:[{label:"Shampoo Anti Ketombe",type:"query",query:k("Shampoo Anti Ketombe 138ml")},{label:"Hair Serum Anti Ketombe",type:"query",query:k("Hair Serum Anti Ketombe 100ml")},{label:"Hair Tonic Anti Ketombe",type:"query",query:k("Hair Tonic Anti Ketombe")},{label:"Hair Powder Coffee",type:"query",query:k("Hair Powder Coffee 10gr")},Ht],body:[{label:"Yunso Soap",type:"query",query:k("Yunso Soap"," beserta manfaat dan cara pakainya")},{label:"Peeling Spray",type:"query",query:k("Peeling Spray"," beserta manfaat dan cara pakainya")},{label:"Hwasa Body Serum",type:"query",query:k("Hwasa Brightening Body Serum 100ml"," beserta kandungan Hexylresorcinol dan manfaatnya")},{label:"Deodorant Spray",type:"query",query:k("Deodorant Spray 60ml")},Ht]};var Ue="ai-woo-sa-qr",wt=()=>{var t;(t=document.getElementById(Ue))==null||t.remove()},Zo=()=>{let{waNumber:t}=g();if(t){window.open(P(t,st),"_blank");return}p(at,"bot"),S("initial")},tr=t=>{switch(wt(),t.type){case"static":p(t.label,"user"),p(t.response,"bot"),S("initial");return;case"query":p(t.label,"user"),E(t.query);return;case"submenu":S(t.target);return;case"action":Zo();return}},S=t=>{if(wt(),t==="initial"&&c().chatBody.querySelector(".ai-woo-sa-welcome"))return;let e=document.createElement("div");e.className="ai-woo-sa-quick-replies",e.id=Ue,e.setAttribute("role","group"),e.setAttribute("aria-label","Pilih langkah berikutnya"),$e[t].forEach(o=>{let r=document.createElement("button");r.className="ai-woo-sa-qr-btn",r.type="button",r.textContent=o.label,r.addEventListener("click",()=>tr(o)),e.appendChild(r)}),m(e)};var Ke=()=>`
    <div class="ai-woo-sa-welcome-intro">
        <span class="ai-woo-sa-welcome-wordmark">SHINYOUNG</span>
        <h2 class="ai-woo-sa-welcome-title">Selamat datang.<br>Mulai dari perawatan Anda.</h2>
        <p class="ai-woo-sa-welcome-subtitle">Kenali kebutuhan kulit dan rambut Anda.<br>Kami bantu temukan perawatan yang sesuai.</p>
    </div>
    <div class="ai-woo-sa-starter-actions" role="group" aria-label="Aksi Cepat">
        <button class="ai-woo-sa-starter-row primary" data-starter="products" type="button">
            <span class="ai-woo-sa-starter-icon" aria-hidden="true">${_e}</span>
            <span class="ai-woo-sa-starter-copy"><span class="ai-woo-sa-starter-label">Temukan produk</span><span class="ai-woo-sa-starter-description">Jelajahi perawatan pilihan Shinyoung</span></span>
            <span class="ai-woo-sa-starter-arrow" aria-hidden="true">${q}</span>
        </button>
        <button class="ai-woo-sa-starter-row" data-starter="consultation" type="button">
            <span class="ai-woo-sa-starter-icon" aria-hidden="true">${W}</span>
            <span class="ai-woo-sa-starter-copy"><span class="ai-woo-sa-starter-label">Konsultasi perawatan</span><span class="ai-woo-sa-starter-description">Ceritakan kebutuhan kulit atau rambut Anda</span></span>
            <span class="ai-woo-sa-starter-arrow" aria-hidden="true">${q}</span>
        </button>
        <button class="ai-woo-sa-starter-row" data-starter="track" type="button">
            <span class="ai-woo-sa-starter-icon" aria-hidden="true">${dt}</span>
            <span class="ai-woo-sa-starter-copy"><span class="ai-woo-sa-starter-label">Lacak pesanan</span><span class="ai-woo-sa-starter-description">Periksa status dan pengiriman pesanan</span></span>
            <span class="ai-woo-sa-starter-arrow" aria-hidden="true">${q}</span>
        </button>
        <button class="ai-woo-sa-starter-row" data-starter="cs" type="button">
            <span class="ai-woo-sa-starter-icon" aria-hidden="true">${W}</span>
            <span class="ai-woo-sa-starter-copy"><span class="ai-woo-sa-starter-label">Hubungi tim Shinyoung</span><span class="ai-woo-sa-starter-description">Lanjutkan bantuan melalui WhatsApp</span></span>
            <span class="ai-woo-sa-starter-arrow" aria-hidden="true">${q}</span>
        </button>
    </div>`;var er=t=>{switch(t){case"products":p("Temukan produk","user"),p("Perawatan apa yang Anda cari? Pilih kategori di bawah, atau tulis kebutuhan Anda.","bot"),S("categories");return;case"consultation":p("Konsultasi kulit dan rambut","user"),E("Saya ingin konsultasi tentang kondisi kulit saya, bisa bantu rekomendasikan produk Shinyoung yang cocok?");return;case"track":p("Lacak pesanan","user"),E("Saya ingin cek status pesanan saya");return;case"cs":{let{waNumber:e}=g();e?window.open(P(e,st),"_blank","noopener,noreferrer"):p(at,"bot");return}}},We=t=>{t.addEventListener("click",e=>{let o=e.target.closest("[data-starter]");if(!o)return;let r=o.getAttribute("data-starter");r&&er(r)})},qe=(t=!0)=>{let e=`<div class="ai-woo-sa-welcome" id="ai-woo-sa-welcome">${Ke()}</div>`;p(e,"bot",t,!0),c().chatBody.scrollTop=0};var or=(t,e)=>{let o=`<p>Halo Kak! Sedang melihat <strong>${l(t)}</strong> ya?</p>`;return e&&(o+=`<p style="font-size: 13px; color: var(--ink-soft); margin-top: 4px;"><em>${l(e)}</em></p>`),`${o}<p style="margin-top: 4px;">Ada yang ingin ditanyakan tentang produk ini?</p>`},G=(t=!0)=>{let{currentProduct:e}=g();if(e){p(or(e.name,e.desc),"bot",t,!0),A(R,String(e.id));return}qe(t)};var Ge=async t=>{let e=new FormData;e.append("product_id",String(t)),e.append("quantity","1");let r=await(await fetch(g().wcAjaxUrl,{method:"POST",body:e,credentials:"same-origin"})).json();return!d(r)||r.error?{ok:!1,fragments:null,cartHash:null}:{ok:!0,fragments:r.fragments,cartHash:r.cart_hash}};var nr=t=>`[CROSS-SELL] "${t}" ditambahkan ke keranjang. Ucapkan terima kasih 1 kalimat, lalu rekomendasikan 1 produk pelengkap.`,je=t=>{t.textContent=de,t.disabled=!1,window.setTimeout(()=>{t.textContent=nt},3e3)},ar=(t,e,o)=>{let{jQuery:r}=window;r&&(r(document.body).trigger("added_to_cart",[e,o,r(t)]),r(document.body).trigger("wc_fragment_refresh"))},Fe=async(t,e,o)=>{e.disabled=!0,e.innerHTML=`<span class="ai-woo-sa-btn-spinner"></span> ${ce}`;try{let r=await Ge(t);if(!r.ok){je(e);return}e.innerHTML=`${pt} <span>${pe}</span>`,e.classList.add("added");let n=e.closest(".ai-woo-sa-product-card"),i=n==null?void 0:n.querySelector(".ai-woo-sa-post-cart"),{checkoutUrl:a}=g();i&&a&&(i.innerHTML=`<a href="${l(a)}" class="ai-woo-sa-post-link">Selesaikan Pesanan &rarr;</a>`,i.style.display="block"),g().cartItems.push({id:t,name:o,qty:1}),ar(e,r.fragments,r.cartHash),E(nr(o),!0)}catch(r){je(e),console.error("AI Woo SA Add-to-Cart Error:",r)}};var sr="Riwayat percakapan di perangkat ini akan dihapus. Anda bisa memulai kembali dengan pertanyaan baru.",ir=()=>{zt(),re(),G(!0),S("initial")},lr=t=>t.key==="Enter"&&!t.shiftKey&&!t.isComposing,Ye=()=>{let{fabBtn:t,closeBtn:e,resetBtn:o,sendBtn:r,inputField:n,chatBody:i}=c();t.addEventListener("click",ee),e.addEventListener("click",et),o.addEventListener("click",()=>oe(sr,ir)),r.addEventListener("click",()=>void E()),n.addEventListener("keydown",a=>{lr(a)&&(a.preventDefault(),E())}),window.addEventListener("keydown",a=>{a.key==="Escape"&&et()}),We(i),ne(),te(),Et(Q,wt),Et(v,()=>S("initial")),Kt(({productId:a,button:u,productTitle:T})=>{Fe(a,u,T)})};var Qe=()=>{let{currentProduct:t}=g();if(!t)return;let e=String(t.id);if(H(R)===e)return;let o=`<p>Btw Kak, saya lihat Kakak sedang melihat <strong>${l(t.name)}</strong> ya? Ada yang bisa saya bantu jelaskan tentang produk ini?</p>`;p(o,"bot",!0,!0).classList.add("ai-woo-sa-nudge"),A(R,e)};var dr=t=>{switch(t.type){case"msg":p(t.text,t.sender,!1,t.isRawHtml);return;case"product":B(t.data,!1);return;case"wa":N(t.link,!1);return;case"order":ft(t.data,!1);return;case"tracking_redirect":ut(t.url,!1);return}},Ve=()=>{let t=Vt();if(!t||t.length===0){G(!0);return}if(!t.some(o=>o.type==="msg"&&o.sender==="user")){G(!0);return}t.forEach(dr),window.setTimeout(Qe,500)};var pr="AI Sales Assistant",mr=t=>{if(!d(t))return null;let e=parseInt(s(t.id),10),o=s(t.name);return Number.isNaN(e)||!o?null:{id:e,name:o,desc:s(t.desc)}},ur=t=>Array.isArray(t)?t.flatMap(e=>{if(!d(e))return[];let o=parseInt(s(e.id),10),r=parseInt(s(e.qty),10);return Number.isNaN(o)?[]:[{id:o,name:s(e.name),qty:r||1}]}):[],ze=t=>{if(!d(t))return null;let e=s(t.restUrl),o=s(t.wcAjaxUrl);return!e||!o?null:{restUrl:e,wcAjaxUrl:o,nonce:s(t.nonce),botName:s(t.botName)||pr,waNumber:s(t.waNumber),checkoutUrl:s(t.checkoutUrl),currentProduct:mr(t.currentProduct),cartItems:ur(t.cartItems)}};var fr=t=>`
    <header class="ai-woo-sa-header">
        <div class="ai-woo-sa-header-brand">
            <div class="ai-woo-sa-avatar" aria-hidden="true">
                <span class="ai-woo-sa-avatar-text">S</span>
            </div>
            <div class="ai-woo-sa-header-info">
                <h3 class="ai-woo-sa-header-title">${l(t)}</h3>
                <div class="ai-woo-sa-header-status">
                    <span class="ai-woo-sa-status-label">Perawatan kulit &amp; rambut</span>
                </div>
            </div>
        </div>
        <div class="ai-woo-sa-header-actions">
            <button type="button" class="ai-woo-sa-header-btn" id="ai-woo-sa-reset-btn" aria-label="Mulai obrolan baru" title="Mulai obrolan baru">
                ${ct}
            </button>
            <button type="button" class="ai-woo-sa-header-btn" id="ai-woo-sa-close-btn" aria-label="Tutup obrolan" title="Tutup">
                ${Se}
            </button>
        </div>
    </header>`,gr=()=>`
    <footer class="ai-woo-sa-footer">
        <label class="ai-woo-sa-composer-label" for="ai-woo-sa-input">Pesan Anda</label>
        <div class="ai-woo-sa-composer">
            <input type="text" id="ai-woo-sa-input" class="ai-woo-sa-input" placeholder="Tulis pesan di sini..." autocomplete="off" aria-label="Pesan Anda" />
            <button type="button" class="ai-woo-sa-send" id="ai-woo-sa-send-btn" aria-label="Kirim pesan" title="Kirim">
                ${Te}
            </button>
        </div>
        <div class="ai-woo-sa-disclaimer">
            <span>Asisten AI Shinyoung \xB7 Perawatan dimulai dari percakapan.</span>
        </div>
    </footer>`,yr=()=>`
    <button type="button" class="ai-woo-sa-fab" id="ai-woo-sa-fab" aria-label="Buka layanan konsultasi" aria-controls="ai-woo-sa-window" aria-expanded="false">
        <span class="ai-woo-sa-badge" id="ai-woo-sa-badge" style="display:none;" aria-label="Pesan baru">0</span>
        <span class="ai-woo-sa-fab-icon">${ke}</span>
        <span class="ai-woo-sa-fab-label">Tanya Shinyoung</span>
    </button>`,wr=()=>`
    <div class="ai-woo-sa-confirm-overlay" id="ai-woo-sa-confirm-overlay" role="alertdialog" aria-modal="true" aria-hidden="true" inert aria-labelledby="ai-woo-sa-confirm-title" aria-describedby="ai-woo-sa-confirm-text">
        <div class="ai-woo-sa-confirm-box">
            <span class="ai-woo-sa-confirm-eyebrow">Percakapan Anda</span>
            <h4 id="ai-woo-sa-confirm-title">Mulai obrolan baru?</h4>
            <p id="ai-woo-sa-confirm-text"></p>
            <div class="ai-woo-sa-confirm-actions">
                <button type="button" class="ai-woo-sa-confirm-btn cancel" id="ai-woo-sa-confirm-cancel">Kembali</button>
                <button type="button" class="ai-woo-sa-confirm-btn confirm" id="ai-woo-sa-confirm-ok">Mulai baru</button>
            </div>
        </div>
    </div>`,Je=t=>`
    <div class="ai-woo-sa-chat-window" id="ai-woo-sa-window" role="dialog" tabindex="-1" aria-hidden="true" inert aria-label="Konsultasi Kecantikan Shinyoung">
        ${fr(t)}
        <div class="ai-woo-sa-body" id="ai-woo-sa-body" role="log" aria-live="polite" aria-atomic="false"></div>
        <button class="ai-woo-sa-jump-btn" id="ai-woo-sa-jump-btn" type="button" aria-label="Lompat ke pesan terbaru" style="display:none;">
            ${Ce}<span>Pesan baru</span>
        </button>
        ${gr()}
        ${wr()}
    </div>
    ${yr()}`;var Xe=(t,e)=>(t.innerHTML=Je(e),Jt());var Ze=()=>{let t=document.getElementById(Mt);if(!t)return;let e=ze(window.aiWooSaConfig);if(!e){console.warn("AI Sales Assistant: Configuration not found. Widget disabled.");return}Dt(e),Xe(t,e.botName),Ye(),Ve(),S("initial")};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Ze):Ze();})();
