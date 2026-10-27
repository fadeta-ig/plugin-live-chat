"use strict";(()=>{var K="ai_woo_sa_session_id",W="ai_woo_sa_history",v="ai_woo_sa_last_seen_product_id";var Ht="ai-woo-sa-widget-root",Ot=["TRIGGER_HUMAN_FALLBACK","TRIGGER_HUMAN"],Mt="Mohon tunggu, saya sedang menyambungkan Anda dengan Customer Service kami...";var ut=null,Pt=t=>{ut=t},g=()=>{if(!ut)throw new Error("AI Sales Assistant: configuration accessed before init.");return ut};var q="aiWooSaRemoveQuickReplies",T="aiWooSaShowInitialQuickReplies",Bt="aiWooSaAddToCart",A=t=>{document.dispatchEvent(new Event(t))},ft=(t,e)=>{document.addEventListener(t,e)},Dt=t=>{document.dispatchEvent(new CustomEvent(Bt,{detail:t}))},$t=t=>{document.addEventListener(Bt,e=>{e instanceof CustomEvent&&t(e.detail)})};var d=t=>typeof t=="object"&&t!==null&&!Array.isArray(t),s=(t,e="")=>typeof t=="string"?t:typeof t=="number"&&Number.isFinite(t)?String(t):e,Ut=t=>typeof t=="number"&&Number.isFinite(t)?t:parseFloat(s(t))||0;var eo=t=>d(t)?[{name:s(t.name),qty:s(t.qty,"1"),total:s(t.total)}]:[],oo=t=>d(t)?{courier:s(t.courier),tracking_number:s(t.tracking_number),status_label:s(t.status_label)}:null,gt=t=>{if(!d(t))return null;let e=Array.isArray(t.items)?t.items.flatMap(eo):[];return{order_number:s(t.order_number)||s(t.order_id),status:s(t.status),status_raw:s(t.status_raw),date:s(t.date,"-"),items:e,tracking:oo(t.tracking),total:s(t.total)}},G=t=>{if(!d(t))return null;let e=Array.isArray(t.orders)?t.orders.flatMap(o=>{let r=gt(o);return r?[r]:[]}):[];return{guest_redirect:s(t.guest_redirect)||null,orders:e}};var ro="Produk",no="#",yt=t=>{if(!d(t))return null;let e=parseInt(s(t.product_id),10);return Number.isNaN(e)?null:{product_id:e,title:s(t.title)||ro,price:Ut(t.price),permalink:s(t.permalink)||no,image_url:s(t.image_url)}},j=t=>Array.isArray(t)?t.flatMap(e=>{let o=yt(e);return o?[o]:[]}):[];var ao=t=>{let{text:e,sender:o,isRawHtml:r}=t;return typeof e!="string"||o!=="bot"&&o!=="user"?null:{type:"msg",text:e,sender:o,isRawHtml:!!r}},Kt=t=>{if(!d(t))return null;switch(t.type){case"msg":return ao(t);case"product":{let e=yt(t.data);return e?{type:"product",data:e}:null}case"order":{let e=gt(t.data);return e?{type:"order",data:e}:null}case"wa":return typeof t.link=="string"?{type:"wa",link:t.link}:null;case"tracking_redirect":return typeof t.url=="string"?{type:"tracking_redirect",url:t.url}:null;default:return null}};var I=t=>{try{return window.localStorage.getItem(t)}catch{return null}},_=(t,e)=>{try{window.localStorage.setItem(t,e)}catch{}},N=t=>{try{window.localStorage.removeItem(t)}catch{}};var so=/^sess_[a-zA-Z0-9_-]{16,64}$/,Wt=16,io=()=>{if(window.crypto&&window.crypto.getRandomValues){let e=new Uint8Array(Wt);return window.crypto.getRandomValues(e),"sess_"+Array.from(e,o=>o.toString(16).padStart(2,"0")).join("")}return"sess_"+(Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)).padEnd(Wt,"0").slice(0,32)},qt=()=>{let t=I(K);if(t&&so.test(t))return t;let e=io();return _(K,e),e},Gt=qt(),P=()=>Gt,jt=()=>{N(K),Gt=qt()};var F=[],y=t=>{F.push(t)},w=()=>{_(W,JSON.stringify({session_id:P(),items:F,timestamp:Date.now()}))},Ft=()=>{F=[],N(W)},co=t=>{let e=JSON.parse(t);return!d(e)||e.session_id!==P()||typeof e.timestamp!="number"||Date.now()-e.timestamp>=864e5?null:Array.isArray(e.items)?e.items.flatMap(o=>{let r=Kt(o);return r?[r]:[]}):[]},Yt=()=>{let t=I(W);if(!t)return null;try{let e=co(t);return e&&(F=e),e}catch{return null}};var Qt=()=>{N(v),jt(),Ft()};var Y=null,h=(t,e)=>{let o=document.getElementById(t);if(!(o instanceof e))throw new Error(`AI Sales Assistant: element #${t} is missing or has an unexpected type.`);return o},Vt=()=>(Y={chatBody:h("ai-woo-sa-body",HTMLDivElement),inputField:h("ai-woo-sa-input",HTMLInputElement),sendBtn:h("ai-woo-sa-send-btn",HTMLButtonElement),fabBtn:h("ai-woo-sa-fab",HTMLButtonElement),badge:h("ai-woo-sa-badge",HTMLElement),closeBtn:h("ai-woo-sa-close-btn",HTMLButtonElement),resetBtn:h("ai-woo-sa-reset-btn",HTMLButtonElement),chatWindow:h("ai-woo-sa-window",HTMLElement),confirmOverlay:h("ai-woo-sa-confirm-overlay",HTMLElement),confirmText:h("ai-woo-sa-confirm-text",HTMLElement),confirmCancel:h("ai-woo-sa-confirm-cancel",HTMLButtonElement),confirmOk:h("ai-woo-sa-confirm-ok",HTMLButtonElement),jumpBtn:h("ai-woo-sa-jump-btn",HTMLButtonElement)},Y),c=()=>{if(!Y)throw new Error("AI Sales Assistant: UI accessed before mount.");return Y};var zt=()=>{try{let t=window.AudioContext,e=new t;if(e.state==="suspended")return;let o=e.createOscillator(),r=e.createGain(),n=e.currentTime;o.type="sine",o.frequency.setValueAtTime(600,n),o.frequency.exponentialRampToValueAtTime(1200,n+.1),r.gain.setValueAtTime(0,n),r.gain.linearRampToValueAtTime(.1,n+.05),r.gain.exponentialRampToValueAtTime(.01,n+.3),o.connect(r),r.connect(e.destination),o.start(),o.stop(n+.3)}catch{}};var wt=0,Q=()=>{let{chatWindow:t,badge:e}=c();t.classList.contains("open")||(wt+=1,e.textContent=String(wt),e.style.display="flex",zt())},Jt=()=>{let{badge:t}=c();wt=0,t.style.display="none",t.textContent="0"};var po=640,mo=()=>window.innerWidth<=po,B=null,V=()=>{let{chatWindow:t}=c();mo()&&t.classList.contains("open")?(B===null&&(B=document.body.style.overflow),document.body.style.overflow="hidden",t.setAttribute("aria-modal","true"),window.visualViewport&&t.style.setProperty("--ai-woo-sa-viewport-height",window.visualViewport.height+"px")):(B!==null&&(document.body.style.overflow=B),B=null,t.removeAttribute("aria-modal"),t.style.removeProperty("--ai-woo-sa-viewport-height"))},Xt=()=>{var t;window.addEventListener("resize",V),(t=window.visualViewport)==null||t.addEventListener("resize",V)},z=()=>{let{chatWindow:t,fabBtn:e}=c();t.classList.contains("open")&&(t.classList.remove("open"),e.classList.remove("open"),e.setAttribute("aria-expanded","false"),e.focus({preventScroll:!0}),t.setAttribute("inert",""),t.setAttribute("aria-hidden","true"),V())},uo=()=>{let{chatWindow:t,fabBtn:e}=c();t.removeAttribute("inert"),t.setAttribute("aria-hidden","false"),t.classList.add("open"),e.classList.add("open"),e.setAttribute("aria-expanded","true"),V(),t.focus({preventScroll:!0}),Jt()},Zt=()=>{let{chatWindow:t}=c();t.classList.contains("open")?z():uo()};var D=null,te=(t,e)=>{D==null||D();let{confirmOverlay:o,confirmText:r,confirmOk:n,confirmCancel:i,chatWindow:a}=c(),m=document.activeElement instanceof HTMLElement?document.activeElement:null,b=[...a.children].filter(f=>f!==o),Lt=b.map(f=>f.hasAttribute("inert"));b.forEach(f=>f.setAttribute("inert","")),r.textContent=t,o.removeAttribute("inert"),o.setAttribute("aria-hidden","false"),o.classList.add("show");let x=()=>{o.classList.remove("show"),o.setAttribute("inert",""),o.setAttribute("aria-hidden","true"),b.forEach((f,to)=>f.toggleAttribute("inert",Lt[to])),n.removeEventListener("click",Rt),i.removeEventListener("click",x),o.removeEventListener("click",xt),o.removeEventListener("keydown",Nt),document.removeEventListener("focusin",It),D=null,m==null||m.focus({preventScroll:!0})},Rt=()=>{x(),e()},xt=f=>{f.target===o&&x()},It=f=>{o.contains(f.target)||i.focus({preventScroll:!0})},Nt=f=>{f.key==="Escape"?(f.preventDefault(),f.stopPropagation(),x()):f.key==="Tab"&&(f.preventDefault(),(document.activeElement===i?n:i).focus())};D=x,n.addEventListener("click",Rt),i.addEventListener("click",x),o.addEventListener("click",xt),o.addEventListener("keydown",Nt),document.addEventListener("focusin",It),i.focus({preventScroll:!0})};var fo=80,ht=()=>{let{chatBody:t}=c();return t.scrollHeight-t.scrollTop-t.clientHeight>fo},Et=()=>{let{jumpBtn:t}=c();t.style.display=!c().chatBody.querySelector(".ai-woo-sa-welcome")&&ht()?"inline-flex":"none"},L=(t=!0)=>{let{chatBody:e}=c();(t||!ht())&&(e.scrollTop=e.scrollHeight),Et()},u=(t,e=!0)=>{var n;let{chatBody:o}=c(),r=!ht();t.matches(".ai-woo-sa-msg.user")&&((n=o.querySelector(".ai-woo-sa-msg-welcome"))==null||n.remove()),o.appendChild(t),(e||r)&&(o.scrollTop=o.scrollHeight),Et()},ee=()=>{let{chatBody:t,jumpBtn:e}=c();t.innerHTML="",e.style.display="none"},oe=()=>{let{chatBody:t,jumpBtn:e}=c();t.addEventListener("scroll",Et),e.addEventListener("click",()=>{t.scrollTo({top:t.scrollHeight,behavior:"smooth"}),e.style.display="none"})};var go={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},l=t=>t.replace(/[&<>"']/g,e=>{var o;return(o=go[e])!=null?o:e});var re=t=>t.toLocaleString("id-ID"),ne=t=>`${t.getHours().toString().padStart(2,"0")}:${t.getMinutes().toString().padStart(2,"0")}`;var yo=/\p{Extended_Pictographic}|\p{Emoji_Presentation}/gu,ae=t=>t.replace(yo,"").trim();var wo=/^(https?:\/\/|\/)/i,ho=/^https?:\/\//i,Eo=/^https:\/\/wa\.me\//i,bo="#",H=t=>wo.test(t)?t:bo,se=t=>ho.test(t)?t:"",ie=t=>Eo.test(t);var ko=/\*\*(.*?)\*\*/g,So=/(?<!\*)\*([^*]+)\*(?!\*)/g,To=/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,bt=t=>{let r=t.replace(To,(a,m,b)=>`<a href="${l(H(b))}" target="_blank" rel="noopener noreferrer" class="ai-woo-sa-text-link">${m}</a>`).replace(ko,"<strong>$1</strong>").replace(So,"<em>$1</em>").split(`
`),n=[],i=!1;for(let a of r){let m=a.trim(),b=m.match(/^[-*•]\s+(.+)$/);b&&b[1]?(i||(n.push('<ul class="ai-woo-sa-list">'),i=!0),n.push(`<li>${b[1]}</li>`)):(i&&(n.push("</ul>"),i=!1),m&&n.push(m))}return i&&n.push("</ul>"),n.join("<br>")},J=t=>bt(l(ae(t)));var p=(t,e,o=!0,r=!1)=>{let n=t.includes("ai-woo-sa-welcome"),i=document.createElement("div");i.className=`ai-woo-sa-msg ${e}${n?" ai-woo-sa-msg-welcome":""}`;let a=r?t:`<p>${J(t)}</p>`,m=n?"":`<span class="ai-woo-sa-time">${ne(new Date)}</span>`;return i.innerHTML=`${a}${m}`,u(i),e==="bot"&&!n&&Q(),o&&(y({type:"msg",text:t,sender:e,isRawHtml:r}),w()),i};var _o="https://wa.me/",Co="62",vo=t=>{let e=t.replace(/\D/g,"");return e.startsWith("0")?Co+e.slice(1):e},O=(t,e)=>{let o=_o+vo(t);return e?`${o}?text=${encodeURIComponent(e)}`:o};var X="Tambah ke Keranjang",le="Menambahkan...",ce="Gagal, coba lagi",de="Ditambahkan";var pe="Maaf, terjadi kesalahan pada server. Silakan coba lagi nanti.",me="Gagal terhubung ke asisten. Periksa koneksi internet Anda.",ue="Akses obrolan dinonaktifkan.",Z="Mohon maaf, nomor Customer Service belum dikonfigurasi. Silakan coba lagi nanti.",tt="Halo CS Shinyoung, saya butuh bantuan.";var fe=(t,e)=>{let o=g();return fetch(o.restUrl,{method:"POST",headers:{"Content-Type":"application/json","X-WP-Nonce":o.nonce},body:JSON.stringify({message:t,session_id:P(),current_product:o.currentProduct,cart_items:o.cartItems,stream:e})})},ge=async t=>{let e=await fe(t,!0);return e.ok?e:(console.warn(`AI Chat: SSE stream failed (${e.status}), retrying without streaming...`),fe(t,!1))};var ye=!1,we=()=>ye,kt=t=>{ye=t};var Lo=3,Ro=6,xo=1e3,he=t=>`
    <div class="ai-woo-sa-typing-text">${t}</div>
    <div class="ai-woo-sa-thinking-bar" aria-hidden="true">
        <div class="ai-woo-sa-thinking-shimmer"></div>
    </div>`,C=null,et=null,ot=null,Io=t=>t===Lo?"Memilih formulasi terbaik...":t===Ro?"Menyusun rekomendasi...":null,St=()=>{if(C)return;let t=document.createElement("div");t.className="ai-woo-sa-msg bot ai-woo-sa-typing-container",t.id="ai-woo-sa-typing",t.setAttribute("role","status"),t.setAttribute("aria-live","polite"),t.innerHTML=he("Memahami kebutuhan Anda..."),C=t,u(t);let e=0;et=window.setInterval(()=>{e+=1;let o=Io(e);o&&C&&(C.innerHTML=he(o)),L()},xo)},Ee=()=>{ot=window.setTimeout(St,300)},Tt=()=>{ot!==null&&window.clearTimeout(ot),et!==null&&window.clearInterval(et),ot=null,et=null,C==null||C.remove(),C=null};var be=`
<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
</svg>`.trim(),ke=`
<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
</svg>`.trim(),rt=`
<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
    <path d="M21 3v5h-5"></path>
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
    <path d="M3 21v-5h5"></path>
</svg>`.trim(),Se=`
<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <line x1="12" y1="19" x2="12" y2="5"></line>
    <polyline points="5 12 12 5 19 12"></polyline>
</svg>`.trim(),Te=`
<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"></path>
</svg>`.trim(),_e=`
<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2.5 1 5-1.1 10.6A7 7 0 0 1 11 20z"></path>
    <path d="M2 21c0-3 1.5-6.5 4-8"></path>
</svg>`.trim(),nt=`
<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="m16.5 9.4-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.29 7 12 12 20.71 7"></polyline>
    <line x1="12" y1="22" x2="12" y2="12"></line>
</svg>`.trim(),at=`
<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
</svg>`.trim(),$=`
<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6"></polyline>
</svg>`.trim(),st=`
<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"></polyline>
</svg>`.trim(),_t=`
<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
</svg>`.trim(),Ce=`
<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <polyline points="19 12 12 19 5 12"></polyline>
</svg>`.trim();var Ct=(t,e)=>{var n;let o=document.createElement("div");o.className="ai-woo-sa-error-banner",o.setAttribute("role","alert");let r=e?`<button class="ai-woo-sa-btn-retry" type="button">${rt}<span>Coba lagi</span></button>`:"";return o.innerHTML=`
        <div class="ai-woo-sa-error-text">${l(t)}</div>
        ${r}`,e&&((n=o.querySelector(".ai-woo-sa-btn-retry"))==null||n.addEventListener("click",()=>{o.remove(),e()})),u(o),o};var ve=t=>{let e=d(t)?t:{};return{text:s(e.text),products:j(e.products),orders:G(e.orders),fallback:!!e.fallback,waLink:s(e.wa_link)||null,blocked:!!e.blocked}};var Ae=/\[RECOMMEND:\s*([\d,\s]+)\]/g,No=/\[RECOMMEND:.*?(\]|$)/g,it=t=>{var n;let e=[],o=t.matchAll(Ae);for(let i of o){let a=((n=i[1])!=null?n:"").split(",").map(m=>parseInt(m.trim(),10)).filter(m=>!Number.isNaN(m));e.push(...a)}return{cleanText:t.replace(Ae,""),productIds:e}},Le=t=>t.replace(No,"");var Ho=(t,e)=>{let o=se(t.image_url);return o?`<img src="${l(o)}" alt="${e}" class="ai-woo-sa-product-image" loading="lazy" />`:""},vt=t=>{let e=document.createElement("div");e.className="ai-woo-sa-product-card";let o=l(t.title),r=l(H(t.permalink));e.innerHTML=`
        ${Ho(t,o)}
        <div class="ai-woo-sa-product-title">${o}</div>
        <div class="ai-woo-sa-product-price">Rp ${re(t.price)}</div>
        <div class="ai-woo-sa-product-actions">
            <div class="ai-woo-sa-product-buttons">
                <button class="ai-woo-sa-btn-cart" data-product-id="${t.product_id}">${X}</button>
                <a href="${r}" target="_blank" rel="noopener noreferrer" class="ai-woo-sa-btn-link">Lihat</a>
            </div>
            <div class="ai-woo-sa-post-cart" style="display:none;"></div>
        </div>`;let n=e.querySelector(".ai-woo-sa-btn-cart");return n&&n.addEventListener("click",()=>Dt({productId:t.product_id,button:n,productTitle:t.title})),e},M=(t,e=!0)=>{let o=vt(t);u(o),e&&(y({type:"product",data:t}),w())};var Re=t=>{let e=document.createElement("div");return e.className="ai-woo-sa-product-card",e.innerHTML=t,e},R=(t,e=!0)=>{!t||!ie(t)||(u(Re(`<a href="${l(t)}" target="_blank" rel="noopener noreferrer" class="ai-woo-sa-btn-wa">
                ${at}<span>Lanjutkan bersama CS di WhatsApp</span>
            </a>`)),e&&(y({type:"wa",link:t}),w()))},lt=(t,e=!0)=>{u(Re(`<a href="${l(H(t))}" target="_blank" rel="noopener noreferrer" class="ai-woo-sa-btn-tracking">
                ${nt}<span>Lacak Pesanan di Website</span>
            </a>`)),e&&(y({type:"tracking_redirect",url:t}),w())};var xe=(t,e=!0)=>{if(t.length===0)return;let o=document.createElement("div");o.className="ai-woo-sa-carousel",o.setAttribute("role","region"),o.setAttribute("aria-label","Rekomendasi Produk"),t.forEach(r=>{o.appendChild(vt(r)),e&&y({type:"product",data:r})}),u(o),e&&w()};var Oo=[{key:"ordered",label:"Dipesan"},{key:"processing",label:"Diproses"},{key:"shipped",label:"Dikirim"},{key:"completed",label:"Selesai"}],Mo=t=>{switch(t){case"completed":return 3;case"shipped":return 2;case"processing":return 1;default:return 0}},Ie=t=>{let e=Mo(t),o=Oo.map((r,n)=>`
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
                ${_t}<span>Salin</span>
            </button>
        </div>
        <div class="ai-woo-sa-order-shipping-status">Status Kirim: ${l(e.status_label)}</div>`},Wo=t=>{let e=t.querySelector(".ai-woo-sa-btn-copy");e&&e.addEventListener("click",async()=>{var r;let o=(r=e.getAttribute("data-copy"))!=null?r:"";try{await navigator.clipboard.writeText(o),e.innerHTML=`${st}<span>Tersalin</span>`,window.setTimeout(()=>{e.innerHTML=`${_t}<span>Salin</span>`},$o)}catch{}})},ct=(t,e=!0)=>{var n;let o=document.createElement("div");o.className="ai-woo-sa-order-card";let r=(n=Po[t.status_raw])!=null?n:Bo;o.innerHTML=`
        <div class="ai-woo-sa-order-header">
            <span class="ai-woo-sa-order-number">Pesanan #${l(t.order_number)}</span>
            <span class="ai-woo-sa-order-status ${r}">${l(t.status)}</span>
        </div>
        <div class="ai-woo-sa-order-date">${l(t.date)}</div>
        ${Ie(t.status_raw)}
        <div class="ai-woo-sa-order-items">${Uo(t)}</div>
        ${Ko(t)}
        <div class="ai-woo-sa-order-total">Total: <strong>Rp ${l(t.total)}</strong></div>`,Wo(o),u(o),e&&(y({type:"order",data:t}),w())};var dt=t=>{if(t){if(t.guest_redirect){lt(t.guest_redirect);return}t.orders.forEach(e=>ct(e))}},pt=(t,e)=>{let o=t.filter(n=>e.includes(n.product_id));if(o.length===0)return;if(o.length>1){xe(o);return}let[r]=o;r&&M(r)};var qo=()=>{let{inputField:t,sendBtn:e}=c();t.disabled=!0,t.placeholder=ue,e.disabled=!0},Ne=async t=>{let e=ve(await t.json());if(e.text){let{cleanText:o,productIds:r}=it(e.text);p(o,"bot"),pt(e.products,r)}else e.products.forEach(o=>M(o));if(dt(e.orders),e.fallback&&e.waLink&&R(e.waLink),e.blocked){qo();return}A(T)};var Go=t=>{let e=t.choices;if(!Array.isArray(e))return"";let o=e[0];if(!d(o)||!d(o.delta))return"";let r=o.delta.content;return typeof r=="string"?r:""},He=t=>{if(!d(t))return null;if(t.products||t.orders)return{kind:"meta",products:j(t.products),orders:G(t.orders),fallback:!!t.fallback,waLink:s(t.wa_link)||null};let e=Go(t);return e?{kind:"token",content:e}:null};var Oe="data: ",jo=["[DONE]","{}"],Fo=t=>{let e=t.trim();if(!e.startsWith(Oe))return null;let o=e.slice(Oe.length);if(jo.includes(o))return null;try{return He(JSON.parse(o))}catch{return null}},Me=()=>{let t=new TextDecoder("utf-8"),e="";return{push(o){var n;e+=t.decode(o,{stream:!0});let r=e.split(`
`);return e=(n=r.pop())!=null?n:"",r.flatMap(i=>{let a=Fo(i);return a?[a]:[]})}}};var Pe=async(t,e)=>{if(!t.body)return;let o=t.body.getReader(),r=Me();for(;;){let{done:n,value:i}=await o.read();if(n)return;for(let a of r.push(i))if(e(a)==="abort"){await o.cancel();return}}};var Yo=t=>Ot.some(e=>t.includes(e)),Be=t=>{let e="",o=[],r=a=>{a.products.length>0&&(o=a.products),dt(a.orders),a.fallback&&a.waLink&&R(a.waLink)},n=a=>(e+=a,Yo(e)?(e=Mt,t.textContent=e,L(),R(O(g().waNumber),!0),"abort"):(t.innerHTML=bt(Le(l(e))),L(),"continue"));return{handleEvent:a=>a.kind==="meta"?(r(a),"continue"):n(a.content),finalize:()=>{if(!e)return;let{cleanText:a,productIds:m}=it(e);t.innerHTML=J(a),y({type:"msg",text:a,sender:"bot",isRawHtml:!1}),w(),pt(o,m)}}};var De=async t=>{let e=document.createElement("div");e.className="ai-woo-sa-msg bot";let o=document.createElement("p");e.appendChild(o),u(e),L(),Q();let r=Be(o);await Pe(t,r.handleEvent),r.finalize()};var Vo=async(t,e)=>{var r;if(!t.ok){console.error("AI Chat Error:",t.status,t.statusText),Ct(pe,e?()=>void E(e):void 0),A(T);return}if(((r=t.headers.get("content-type"))!=null?r:"").includes("text/event-stream")){await De(t),A(T);return}await Ne(t)},zo=()=>{window.setTimeout(()=>{let{sendBtn:t,inputField:e}=c();kt(!1),t.disabled=!1,e.focus()},1500)},E=async(t=null,e=!1)=>{let{inputField:o,sendBtn:r}=c(),n=t||o.value.trim();if(!(!n||we())){A(q),!t&&!e&&p(n,"user"),o.value="",kt(!0),r.disabled=!0,e?Ee():St();try{let i=await ge(n);Tt(),await Vo(i,n)}catch(i){Tt(),Ct(me,()=>void E(n,e)),console.error("AI Sales Assistant Error:",i),A(T)}finally{zo()}}};var k=(t,e="")=>`Berikan info lengkap produk Shinyoung ${t}${e}`,Jo={label:"Kembali",type:"submenu",target:"initial"},At={label:"Kembali",type:"submenu",target:"categories"},Xo=`Pesanan dikirim langsung dari fasilitas kami di **Sleman, Yogyakarta**.

Semua produk Shinyoung diformulasikan **Bebas SLS, Bebas Paraben, dan Non-Alkohol** \u2014 dirancang lembut untuk kulit sensitif.

Pembelian melalui Official Store dijamin **100% orisinal** dengan jaminan kepuasan dan layanan *after-sales support*.

Slogan kami: *Happy Shine on You* \u2014 #ShineBrighterFeelYounger`,$e={initial:[{label:"Produk Kami",type:"submenu",target:"categories"},{label:"Konsultasi Kulit",type:"query",query:"Saya ingin konsultasi tentang kondisi kulit saya, bisa bantu rekomendasikan produk Shinyoung yang cocok?"},{label:"Lacak Pesanan",type:"query",query:"Saya ingin cek status pesanan saya"},{label:"Pesanan Saya",type:"query",query:"Tampilkan pesanan terakhir saya"},{label:"Info Toko",type:"static",response:Xo},{label:"Hubungi CS",type:"action",action:"whatsapp"}],categories:[{label:"Perawatan Wajah",type:"submenu",target:"face"},{label:"Perawatan Rambut",type:"submenu",target:"hair"},{label:"Perawatan Tubuh",type:"submenu",target:"body"},Jo],face:[{label:"Binahong Cream 15g",type:"query",query:k("Binahong Cream 15g"," beserta manfaat dan cara pakainya")},{label:"Binahong Oil 10ml",type:"query",query:k("Binahong Oil 10ml"," beserta manfaat dan cara pakainya")},At],hair:[{label:"Shampoo Anti Ketombe",type:"query",query:k("Shampoo Anti Ketombe 138ml")},{label:"Hair Serum Anti Ketombe",type:"query",query:k("Hair Serum Anti Ketombe 100ml")},{label:"Hair Tonic Anti Ketombe",type:"query",query:k("Hair Tonic Anti Ketombe")},{label:"Hair Powder Coffee",type:"query",query:k("Hair Powder Coffee 10gr")},At],body:[{label:"Yunso Soap",type:"query",query:k("Yunso Soap"," beserta manfaat dan cara pakainya")},{label:"Peeling Spray",type:"query",query:k("Peeling Spray"," beserta manfaat dan cara pakainya")},{label:"Hwasa Body Serum",type:"query",query:k("Hwasa Brightening Body Serum 100ml"," beserta kandungan Hexylresorcinol dan manfaatnya")},{label:"Deodorant Spray",type:"query",query:k("Deodorant Spray 60ml")},At]};var Ue="ai-woo-sa-qr",mt=()=>{var t;(t=document.getElementById(Ue))==null||t.remove()},Zo=()=>{let{waNumber:t}=g();if(t){window.open(O(t,tt),"_blank");return}p(Z,"bot"),S("initial")},tr=t=>{switch(mt(),t.type){case"static":p(t.label,"user"),p(t.response,"bot"),S("initial");return;case"query":p(t.label,"user"),E(t.query);return;case"submenu":S(t.target);return;case"action":Zo();return}},S=t=>{if(mt(),t==="initial"&&c().chatBody.querySelector(".ai-woo-sa-welcome"))return;let e=document.createElement("div");e.className="ai-woo-sa-quick-replies",e.id=Ue,e.setAttribute("role","group"),e.setAttribute("aria-label","Pilih langkah berikutnya"),$e[t].forEach(o=>{let r=document.createElement("button");r.className="ai-woo-sa-qr-btn",r.type="button",r.textContent=o.label,r.addEventListener("click",()=>tr(o)),e.appendChild(r)}),u(e)};var Ke=()=>`
    <div class="ai-woo-sa-welcome-badge">
        <span>Personal Beauty Concierge</span>
    </div>
    <h2 class="ai-woo-sa-welcome-title">Selamat datang.</h2>
    <p class="ai-woo-sa-welcome-subtitle">
        Temukan perawatan yang tepat untuk Anda.<br>Pilih bantuan di bawah untuk memulai.
    </p>
    <div class="ai-woo-sa-starter-actions" role="group" aria-label="Aksi Cepat">
        <button class="ai-woo-sa-starter-row primary" data-starter="products" type="button">
            <span class="ai-woo-sa-starter-icon" aria-hidden="true">${Te}</span>
            <span class="ai-woo-sa-starter-copy"><span class="ai-woo-sa-starter-label">Temukan produk</span><span class="ai-woo-sa-starter-description">Jelajahi perawatan pilihan Shinyoung</span></span>
            <span class="ai-woo-sa-starter-arrow" aria-hidden="true">${$}</span>
        </button>
        <button class="ai-woo-sa-starter-row" data-starter="consultation" type="button">
            <span class="ai-woo-sa-starter-icon" aria-hidden="true">${_e}</span>
            <span class="ai-woo-sa-starter-copy"><span class="ai-woo-sa-starter-label">Konsultasi perawatan</span><span class="ai-woo-sa-starter-description">Ceritakan kebutuhan kulit atau rambut Anda</span></span>
            <span class="ai-woo-sa-starter-arrow" aria-hidden="true">${$}</span>
        </button>
        <button class="ai-woo-sa-starter-row" data-starter="track" type="button">
            <span class="ai-woo-sa-starter-icon" aria-hidden="true">${nt}</span>
            <span class="ai-woo-sa-starter-copy"><span class="ai-woo-sa-starter-label">Lacak pesanan</span><span class="ai-woo-sa-starter-description">Periksa status dan pengiriman pesanan</span></span>
            <span class="ai-woo-sa-starter-arrow" aria-hidden="true">${$}</span>
        </button>
        <button class="ai-woo-sa-starter-row" data-starter="cs" type="button">
            <span class="ai-woo-sa-starter-icon" aria-hidden="true">${at}</span>
            <span class="ai-woo-sa-starter-copy"><span class="ai-woo-sa-starter-label">Hubungi tim Shinyoung</span><span class="ai-woo-sa-starter-description">Lanjutkan bantuan melalui WhatsApp</span></span>
            <span class="ai-woo-sa-starter-arrow" aria-hidden="true">${$}</span>
        </button>
    </div>`;var er=t=>{switch(t){case"products":p("Temukan produk","user"),p("Perawatan apa yang Anda cari? Pilih kategori di bawah, atau tulis kebutuhan Anda.","bot"),S("categories");return;case"consultation":p("Konsultasi kulit dan rambut","user"),E("Saya ingin konsultasi tentang kondisi kulit saya, bisa bantu rekomendasikan produk Shinyoung yang cocok?");return;case"track":p("Lacak pesanan","user"),E("Saya ingin cek status pesanan saya");return;case"cs":{let{waNumber:e}=g();e?window.open(O(e,tt),"_blank","noopener,noreferrer"):p(Z,"bot");return}}},We=t=>{t.addEventListener("click",e=>{let o=e.target.closest("[data-starter]");if(!o)return;let r=o.getAttribute("data-starter");r&&er(r)})},qe=(t=!0)=>{let e=`<div class="ai-woo-sa-welcome" id="ai-woo-sa-welcome">${Ke()}</div>`;p(e,"bot",t,!0),c().chatBody.scrollTop=0};var or=(t,e)=>{let o=`<p>Halo Kak! Sedang melihat <strong>${l(t)}</strong> ya?</p>`;return e&&(o+=`<p style="font-size: 13px; color: var(--ink-soft); margin-top: 4px;"><em>${l(e)}</em></p>`),`${o}<p style="margin-top: 4px;">Ada yang ingin ditanyakan tentang produk ini?</p>`},U=(t=!0)=>{let{currentProduct:e}=g();if(e){p(or(e.name,e.desc),"bot",t,!0),_(v,String(e.id));return}qe(t)};var Ge=async t=>{let e=new FormData;e.append("product_id",String(t)),e.append("quantity","1");let r=await(await fetch(g().wcAjaxUrl,{method:"POST",body:e,credentials:"same-origin"})).json();return!d(r)||r.error?{ok:!1,fragments:null,cartHash:null}:{ok:!0,fragments:r.fragments,cartHash:r.cart_hash}};var nr=t=>`[CROSS-SELL] "${t}" ditambahkan ke keranjang. Ucapkan terima kasih 1 kalimat, lalu rekomendasikan 1 produk pelengkap.`,je=t=>{t.textContent=ce,t.disabled=!1,window.setTimeout(()=>{t.textContent=X},3e3)},ar=(t,e,o)=>{let{jQuery:r}=window;r&&(r(document.body).trigger("added_to_cart",[e,o,r(t)]),r(document.body).trigger("wc_fragment_refresh"))},Fe=async(t,e,o)=>{e.disabled=!0,e.innerHTML=`<span class="ai-woo-sa-btn-spinner"></span> ${le}`;try{let r=await Ge(t);if(!r.ok){je(e);return}e.innerHTML=`${st} <span>${de}</span>`,e.classList.add("added");let n=e.closest(".ai-woo-sa-product-card"),i=n==null?void 0:n.querySelector(".ai-woo-sa-post-cart"),{checkoutUrl:a}=g();i&&a&&(i.innerHTML=`<a href="${l(a)}" class="ai-woo-sa-post-link">Selesaikan Pesanan &rarr;</a>`,i.style.display="block"),g().cartItems.push({id:t,name:o,qty:1}),ar(e,r.fragments,r.cartHash),E(nr(o),!0)}catch(r){je(e),console.error("AI Woo SA Add-to-Cart Error:",r)}};var sr="Riwayat percakapan di perangkat ini akan dihapus. Anda bisa memulai kembali dengan pertanyaan baru.",ir=()=>{Qt(),ee(),U(!0),S("initial")},lr=t=>t.key==="Enter"&&!t.shiftKey&&!t.isComposing,Ye=()=>{let{fabBtn:t,closeBtn:e,resetBtn:o,sendBtn:r,inputField:n,chatBody:i}=c();t.addEventListener("click",Zt),e.addEventListener("click",z),o.addEventListener("click",()=>te(sr,ir)),r.addEventListener("click",()=>void E()),n.addEventListener("keydown",a=>{lr(a)&&(a.preventDefault(),E())}),window.addEventListener("keydown",a=>{a.key==="Escape"&&z()}),We(i),oe(),Xt(),ft(q,mt),ft(T,()=>S("initial")),$t(({productId:a,button:m,productTitle:b})=>{Fe(a,m,b)})};var Qe=()=>{let{currentProduct:t}=g();if(!t)return;let e=String(t.id);if(I(v)===e)return;let o=`<p>Btw Kak, saya lihat Kakak sedang melihat <strong>${l(t.name)}</strong> ya? Ada yang bisa saya bantu jelaskan tentang produk ini?</p>`;p(o,"bot",!0,!0).classList.add("ai-woo-sa-nudge"),_(v,e)};var dr=t=>{switch(t.type){case"msg":p(t.text,t.sender,!1,t.isRawHtml);return;case"product":M(t.data,!1);return;case"wa":R(t.link,!1);return;case"order":ct(t.data,!1);return;case"tracking_redirect":lt(t.url,!1);return}},Ve=()=>{let t=Yt();if(!t||t.length===0){U(!0);return}if(!t.some(o=>o.type==="msg"&&o.sender==="user")){U(!0);return}t.forEach(dr),window.setTimeout(Qe,500)};var pr="AI Sales Assistant",mr=t=>{if(!d(t))return null;let e=parseInt(s(t.id),10),o=s(t.name);return Number.isNaN(e)||!o?null:{id:e,name:o,desc:s(t.desc)}},ur=t=>Array.isArray(t)?t.flatMap(e=>{if(!d(e))return[];let o=parseInt(s(e.id),10),r=parseInt(s(e.qty),10);return Number.isNaN(o)?[]:[{id:o,name:s(e.name),qty:r||1}]}):[],ze=t=>{if(!d(t))return null;let e=s(t.restUrl),o=s(t.wcAjaxUrl);return!e||!o?null:{restUrl:e,wcAjaxUrl:o,nonce:s(t.nonce),botName:s(t.botName)||pr,waNumber:s(t.waNumber),checkoutUrl:s(t.checkoutUrl),currentProduct:mr(t.currentProduct),cartItems:ur(t.cartItems)}};var fr=t=>`
    <header class="ai-woo-sa-header">
        <div class="ai-woo-sa-header-brand">
            <div class="ai-woo-sa-avatar" aria-hidden="true">
                <span class="ai-woo-sa-avatar-text">SA</span>
            </div>
            <div class="ai-woo-sa-header-info">
                <h3 class="ai-woo-sa-header-title">${l(t)}</h3>
                <div class="ai-woo-sa-header-status">
                    <span class="ai-woo-sa-status-label">Asisten belanja AI</span>
                </div>
            </div>
        </div>
        <div class="ai-woo-sa-header-actions">
            <button type="button" class="ai-woo-sa-header-btn" id="ai-woo-sa-reset-btn" aria-label="Mulai obrolan baru" title="Mulai obrolan baru">
                ${rt}
            </button>
            <button type="button" class="ai-woo-sa-header-btn" id="ai-woo-sa-close-btn" aria-label="Tutup obrolan" title="Tutup">
                ${ke}
            </button>
        </div>
    </header>`,gr=()=>`
    <footer class="ai-woo-sa-footer">
        <label class="ai-woo-sa-composer-label" for="ai-woo-sa-input">Atau tulis pertanyaan Anda</label>
        <div class="ai-woo-sa-composer">
            <input type="text" id="ai-woo-sa-input" class="ai-woo-sa-input" placeholder="Tulis pesan di sini..." autocomplete="off" aria-label="Pesan Anda" />
            <button type="button" class="ai-woo-sa-send" id="ai-woo-sa-send-btn" aria-label="Kirim pesan" title="Kirim">
                ${Se}
            </button>
        </div>
        <div class="ai-woo-sa-disclaimer">
            <span>Asisten AI Shinyoung. Butuh bantuan langsung? Hubungi CS.</span>
        </div>
    </footer>`,yr=()=>`
    <button type="button" class="ai-woo-sa-fab" id="ai-woo-sa-fab" aria-label="Buka layanan konsultasi" aria-controls="ai-woo-sa-window" aria-expanded="false">
        <span class="ai-woo-sa-badge" id="ai-woo-sa-badge" style="display:none;" aria-label="Pesan baru">0</span>
        <span class="ai-woo-sa-fab-icon">${be}</span>
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
    ${yr()}`;var Xe=(t,e)=>(t.innerHTML=Je(e),Vt());var Ze=()=>{let t=document.getElementById(Ht);if(!t)return;let e=ze(window.aiWooSaConfig);if(!e){console.warn("AI Sales Assistant: Configuration not found. Widget disabled.");return}Pt(e),Xe(t,e.botName),Ye(),Ve(),S("initial")};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Ze):Ze();})();
