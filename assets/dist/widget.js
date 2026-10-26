"use strict";(()=>{var P="ai_woo_sa_session_id",B="ai_woo_sa_history",A="ai_woo_sa_last_seen_product_id";var St="ai-woo-sa-widget-root",_t=["TRIGGER_HUMAN_FALLBACK","TRIGGER_HUMAN"],Tt="Mohon tunggu, saya sedang menyambungkan Anda dengan Customer Service kami...";var lt=null,Ct=t=>{lt=t},f=()=>{if(!lt)throw new Error("AI Sales Assistant: configuration accessed before init.");return lt};var D="aiWooSaRemoveQuickReplies",k="aiWooSaShowInitialQuickReplies",At="aiWooSaAddToCart",v=t=>{document.dispatchEvent(new Event(t))},ct=(t,e)=>{document.addEventListener(t,e)},vt=t=>{document.dispatchEvent(new CustomEvent(At,{detail:t}))},Rt=t=>{document.addEventListener(At,e=>{e instanceof CustomEvent&&t(e.detail)})};var d=t=>typeof t=="object"&&t!==null&&!Array.isArray(t),s=(t,e="")=>typeof t=="string"?t:typeof t=="number"&&Number.isFinite(t)?String(t):e,xt=t=>typeof t=="number"&&Number.isFinite(t)?t:parseFloat(s(t))||0;var qe=t=>d(t)?[{name:s(t.name),qty:s(t.qty,"1"),total:s(t.total)}]:[],je=t=>d(t)?{courier:s(t.courier),tracking_number:s(t.tracking_number),status_label:s(t.status_label)}:null,dt=t=>{if(!d(t))return null;let e=Array.isArray(t.items)?t.items.flatMap(qe):[];return{order_number:s(t.order_number)||s(t.order_id),status:s(t.status),status_raw:s(t.status_raw),date:s(t.date,"-"),items:e,tracking:je(t.tracking),total:s(t.total)}},$=t=>{if(!d(t))return null;let e=Array.isArray(t.orders)?t.orders.flatMap(o=>{let r=dt(o);return r?[r]:[]}):[];return{guest_redirect:s(t.guest_redirect)||null,orders:e}};var Fe="Produk",Ve="#",pt=t=>{if(!d(t))return null;let e=parseInt(s(t.product_id),10);return Number.isNaN(e)?null:{product_id:e,title:s(t.title)||Fe,price:xt(t.price),permalink:s(t.permalink)||Ve,image_url:s(t.image_url)}},U=t=>Array.isArray(t)?t.flatMap(e=>{let o=pt(e);return o?[o]:[]}):[];var Ye=t=>{let{text:e,sender:o,isRawHtml:r}=t;return typeof e!="string"||o!=="bot"&&o!=="user"?null:{type:"msg",text:e,sender:o,isRawHtml:!!r}},Lt=t=>{if(!d(t))return null;switch(t.type){case"msg":return Ye(t);case"product":{let e=pt(t.data);return e?{type:"product",data:e}:null}case"order":{let e=dt(t.data);return e?{type:"order",data:e}:null}case"wa":return typeof t.link=="string"?{type:"wa",link:t.link}:null;case"tracking_redirect":return typeof t.url=="string"?{type:"tracking_redirect",url:t.url}:null;default:return null}};var x=t=>{try{return window.localStorage.getItem(t)}catch{return null}},S=(t,e)=>{try{window.localStorage.setItem(t,e)}catch{}},L=t=>{try{window.localStorage.removeItem(t)}catch{}};var Qe=/^sess_[a-zA-Z0-9_-]{16,64}$/,It=16,ze=()=>{if(window.crypto&&window.crypto.getRandomValues){let e=new Uint8Array(It);return window.crypto.getRandomValues(e),"sess_"+Array.from(e,o=>o.toString(16).padStart(2,"0")).join("")}return"sess_"+(Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)).padEnd(It,"0").slice(0,32)},Nt=()=>{let t=x(P);if(t&&Qe.test(t))return t;let e=ze();return S(P,e),e},Ht=Nt(),O=()=>Ht,Ot=()=>{L(P),Ht=Nt()};var K=[],g=t=>{K.push(t)},y=()=>{S(B,JSON.stringify({session_id:O(),items:K,timestamp:Date.now()}))},Mt=()=>{K=[],L(B)},Xe=t=>{let e=JSON.parse(t);return!d(e)||e.session_id!==O()||typeof e.timestamp!="number"||Date.now()-e.timestamp>=864e5?null:Array.isArray(e.items)?e.items.flatMap(o=>{let r=Lt(o);return r?[r]:[]}):[]},Pt=()=>{let t=x(B);if(!t)return null;try{let e=Xe(t);return e&&(K=e),e}catch{return null}};var Bt=()=>{L(A),Ot(),Mt()};var W=null,w=(t,e)=>{let o=document.getElementById(t);if(!(o instanceof e))throw new Error(`AI Sales Assistant: element #${t} is missing or has an unexpected type.`);return o},Dt=()=>(W={chatBody:w("ai-woo-sa-body",HTMLDivElement),inputField:w("ai-woo-sa-input",HTMLInputElement),sendBtn:w("ai-woo-sa-send-btn",HTMLButtonElement),fabBtn:w("ai-woo-sa-fab",HTMLButtonElement),badge:w("ai-woo-sa-badge",HTMLElement),closeBtn:w("ai-woo-sa-close-btn",HTMLButtonElement),resetBtn:w("ai-woo-sa-reset-btn",HTMLButtonElement),chatWindow:w("ai-woo-sa-window",HTMLElement),confirmOverlay:w("ai-woo-sa-confirm-overlay",HTMLElement),confirmText:w("ai-woo-sa-confirm-text",HTMLElement),confirmCancel:w("ai-woo-sa-confirm-cancel",HTMLButtonElement),confirmOk:w("ai-woo-sa-confirm-ok",HTMLButtonElement),jumpBtn:w("ai-woo-sa-jump-btn",HTMLButtonElement)},W),c=()=>{if(!W)throw new Error("AI Sales Assistant: UI accessed before mount.");return W};var $t=()=>{try{let t=window.AudioContext,e=new t;if(e.state==="suspended")return;let o=e.createOscillator(),r=e.createGain(),n=e.currentTime;o.type="sine",o.frequency.setValueAtTime(600,n),o.frequency.exponentialRampToValueAtTime(1200,n+.1),r.gain.setValueAtTime(0,n),r.gain.linearRampToValueAtTime(.1,n+.05),r.gain.exponentialRampToValueAtTime(.01,n+.3),o.connect(r),r.connect(e.destination),o.start(),o.stop(n+.3)}catch{}};var mt=0,G=()=>{let{chatWindow:t,badge:e}=c();t.classList.contains("open")||(mt+=1,e.textContent=String(mt),e.style.display="flex",$t())},Ut=()=>{let{badge:t}=c();mt=0,t.style.display="none",t.textContent="0"};var Ze=480,ut=()=>window.innerWidth<=Ze,to=()=>{if(!window.visualViewport||!ut())return;let{chatWindow:t}=c();t.classList.contains("open")&&(t.style.height=`${window.visualViewport.height}px`)},Kt=()=>{window.visualViewport&&window.visualViewport.addEventListener("resize",to)},q=()=>{let{chatWindow:t,fabBtn:e}=c();t.classList.contains("open")&&(t.classList.remove("open"),e.classList.remove("open"),document.body.style.overflow="",t.removeAttribute("aria-modal"),ut()&&(t.style.height=""),e.focus())},eo=()=>{let{chatWindow:t,fabBtn:e,inputField:o}=c();t.classList.add("open"),e.classList.add("open"),ut()&&(document.body.style.overflow="hidden",t.setAttribute("aria-modal","true"),window.visualViewport&&(t.style.height=`${window.visualViewport.height}px`)),o.focus(),Ut()},Wt=()=>{let{chatWindow:t}=c();t.classList.contains("open")?q():eo()};var Gt=(t,e)=>{let{confirmOverlay:o,confirmText:r,confirmOk:n,confirmCancel:l}=c();r.textContent=t,o.classList.add("show");let a=()=>{o.classList.remove("show"),n.removeEventListener("click",u),l.removeEventListener("click",a)},u=()=>{a(),e()};n.addEventListener("click",u),l.addEventListener("click",a)};var oo=80,qt=()=>{let{chatBody:t}=c();return t.scrollHeight-t.scrollTop-t.clientHeight>oo},ro=()=>{let{jumpBtn:t}=c();t.style.display=qt()?"inline-flex":"none"},_=(t=!1)=>{let{chatBody:e,jumpBtn:o}=c();t||!qt()?(e.scrollTop=e.scrollHeight,o.style.display="none"):o.style.display="inline-flex"},m=t=>{c().chatBody.appendChild(t),_()},jt=()=>{let{chatBody:t,jumpBtn:e}=c();t.innerHTML="",e.style.display="none"},Ft=()=>{let{chatBody:t,jumpBtn:e}=c();t.addEventListener("scroll",ro),e.addEventListener("click",()=>{t.scrollTo({top:t.scrollHeight,behavior:"smooth"}),e.style.display="none"})};var no={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},i=t=>t.replace(/[&<>"']/g,e=>{var o;return(o=no[e])!=null?o:e});var Vt=t=>t.toLocaleString("id-ID"),Yt=t=>`${t.getHours().toString().padStart(2,"0")}:${t.getMinutes().toString().padStart(2,"0")}`;var ao=/\p{Extended_Pictographic}|\p{Emoji_Presentation}/gu,Qt=t=>t.replace(ao,"").trim();var so=/^(https?:\/\/|\/)/i,io=/^https?:\/\//i,lo=/^https:\/\/wa\.me\//i,co="#",I=t=>so.test(t)?t:co,zt=t=>io.test(t)?t:"",Jt=t=>lo.test(t);var po=/\*\*(.*?)\*\*/g,mo=/(?<!\*)\*([^*]+)\*(?!\*)/g,uo=/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,ft=t=>{let r=t.replace(uo,(a,u,C)=>`<a href="${i(I(C))}" target="_blank" rel="noopener noreferrer" class="ai-woo-sa-text-link">${u}</a>`).replace(po,"<strong>$1</strong>").replace(mo,"<em>$1</em>").split(`
`),n=[],l=!1;for(let a of r){let u=a.trim(),C=u.match(/^[-*•]\s+(.+)$/);C&&C[1]?(l||(n.push('<ul class="ai-woo-sa-list">'),l=!0),n.push(`<li>${C[1]}</li>`)):(l&&(n.push("</ul>"),l=!1),u&&n.push(u))}return l&&n.push("</ul>"),n.join("<br>")},j=t=>ft(i(Qt(t)));var p=(t,e,o=!0,r=!1)=>{let n=document.createElement("div");n.className=`ai-woo-sa-msg ${e}`;let l=r?t:`<p>${j(t)}</p>`;return n.innerHTML=`${l}<span class="ai-woo-sa-time">${Yt(new Date)}</span>`,m(n),e==="bot"&&G(),o&&(g({type:"msg",text:t,sender:e,isRawHtml:r}),y()),n};var fo="https://wa.me/",go="62",yo=t=>{let e=t.replace(/\D/g,"");return e.startsWith("0")?go+e.slice(1):e},N=(t,e)=>{let o=fo+yo(t);return e?`${o}?text=${encodeURIComponent(e)}`:o};var F="Tambah ke Keranjang",Xt="Menambahkan...",Zt="Gagal, coba lagi",te="Ditambahkan";var ee="Maaf, terjadi kesalahan pada server. Silakan coba lagi nanti.",oe="Gagal terhubung ke asisten. Periksa koneksi internet Anda.",re="Akses obrolan dinonaktifkan.",V="Mohon maaf, nomor Customer Service belum dikonfigurasi. Silakan coba lagi nanti.",Y="Halo CS Shinyoung, saya butuh bantuan.";var ne=(t,e)=>{let o=f();return fetch(o.restUrl,{method:"POST",headers:{"Content-Type":"application/json","X-WP-Nonce":o.nonce},body:JSON.stringify({message:t,session_id:O(),current_product:o.currentProduct,cart_items:o.cartItems,stream:e})})},ae=async t=>{let e=await ne(t,!0);return e.ok?e:(console.warn(`AI Chat: SSE stream failed (${e.status}), retrying without streaming...`),ne(t,!1))};var se=!1,ie=()=>se,gt=t=>{se=t};var ho=3,Eo=6,bo=1e3,le=t=>`
    <div class="ai-woo-sa-typing-text">${t}</div>
    <div class="ai-woo-sa-thinking-bar" aria-hidden="true">
        <div class="ai-woo-sa-thinking-shimmer"></div>
    </div>`,T=null,Q=null,z=null,ko=t=>t===ho?"Memilih formulasi terbaik...":t===Eo?"Menyusun rekomendasi...":null,yt=()=>{if(T)return;let t=document.createElement("div");t.className="ai-woo-sa-msg bot ai-woo-sa-typing-container",t.id="ai-woo-sa-typing",t.setAttribute("role","status"),t.setAttribute("aria-live","polite"),t.innerHTML=le("Memahami kebutuhan Anda..."),T=t,m(t);let e=0;Q=window.setInterval(()=>{e+=1;let o=ko(e);o&&T&&(T.innerHTML=le(o)),_()},bo)},ce=()=>{z=window.setTimeout(yt,300)},wt=()=>{z!==null&&window.clearTimeout(z),Q!==null&&window.clearInterval(Q),z=null,Q=null,T==null||T.remove(),T=null};var de=`
<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
</svg>`.trim(),pe=`
<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
</svg>`.trim(),J=`
<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
    <path d="M21 3v5h-5"></path>
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
    <path d="M3 21v-5h5"></path>
</svg>`.trim(),me=`
<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <line x1="12" y1="19" x2="12" y2="5"></line>
    <polyline points="5 12 12 5 19 12"></polyline>
</svg>`.trim(),ue=`
<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"></path>
</svg>`.trim(),fe=`
<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2.5 1 5-1.1 10.6A7 7 0 0 1 11 20z"></path>
    <path d="M2 21c0-3 1.5-6.5 4-8"></path>
</svg>`.trim(),X=`
<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="m16.5 9.4-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.29 7 12 12 20.71 7"></polyline>
    <line x1="12" y1="22" x2="12" y2="12"></line>
</svg>`.trim(),Z=`
<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
</svg>`.trim(),M=`
<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6"></polyline>
</svg>`.trim(),tt=`
<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"></polyline>
</svg>`.trim(),ht=`
<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
</svg>`.trim(),ge=`
<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <polyline points="19 12 12 19 5 12"></polyline>
</svg>`.trim();var Et=(t,e)=>{var n;let o=document.createElement("div");o.className="ai-woo-sa-error-banner",o.setAttribute("role","alert");let r=e?`<button class="ai-woo-sa-btn-retry" type="button">${J}<span>Coba lagi</span></button>`:"";return o.innerHTML=`
        <div class="ai-woo-sa-error-text">${i(t)}</div>
        ${r}`,e&&((n=o.querySelector(".ai-woo-sa-btn-retry"))==null||n.addEventListener("click",()=>{o.remove(),e()})),m(o),o};var ye=t=>{let e=d(t)?t:{};return{text:s(e.text),products:U(e.products),orders:$(e.orders),fallback:!!e.fallback,waLink:s(e.wa_link)||null,blocked:!!e.blocked}};var we=/\[RECOMMEND:\s*([\d,\s]+)\]/g,So=/\[RECOMMEND:.*?(\]|$)/g,et=t=>{var n;let e=[],o=t.matchAll(we);for(let l of o){let a=((n=l[1])!=null?n:"").split(",").map(u=>parseInt(u.trim(),10)).filter(u=>!Number.isNaN(u));e.push(...a)}return{cleanText:t.replace(we,""),productIds:e}},he=t=>t.replace(So,"");var _o=(t,e)=>{let o=zt(t.image_url);return o?`<img src="${i(o)}" alt="${e}" class="ai-woo-sa-product-image" loading="lazy" />`:""},bt=t=>{let e=document.createElement("div");e.className="ai-woo-sa-product-card";let o=i(t.title),r=i(I(t.permalink));e.innerHTML=`
        ${_o(t,o)}
        <div class="ai-woo-sa-product-title">${o}</div>
        <div class="ai-woo-sa-product-price">Rp ${Vt(t.price)}</div>
        <div class="ai-woo-sa-product-actions">
            <div class="ai-woo-sa-product-buttons">
                <button class="ai-woo-sa-btn-cart" data-product-id="${t.product_id}">${F}</button>
                <a href="${r}" target="_blank" rel="noopener noreferrer" class="ai-woo-sa-btn-link">Lihat</a>
            </div>
            <div class="ai-woo-sa-post-cart" style="display:none;"></div>
        </div>`;let n=e.querySelector(".ai-woo-sa-btn-cart");return n&&n.addEventListener("click",()=>vt({productId:t.product_id,button:n,productTitle:t.title})),e},H=(t,e=!0)=>{let o=bt(t);m(o),e&&(g({type:"product",data:t}),y())};var Ee=t=>{let e=document.createElement("div");return e.className="ai-woo-sa-product-card",e.innerHTML=t,e},R=(t,e=!0)=>{!t||!Jt(t)||(m(Ee(`<a href="${i(t)}" target="_blank" rel="noopener noreferrer" class="ai-woo-sa-btn-wa">
                ${Z}<span>Lanjutkan bersama CS di WhatsApp</span>
            </a>`)),e&&(g({type:"wa",link:t}),y()))},ot=(t,e=!0)=>{m(Ee(`<a href="${i(I(t))}" target="_blank" rel="noopener noreferrer" class="ai-woo-sa-btn-tracking">
                ${X}<span>Lacak Pesanan di Website</span>
            </a>`)),e&&(g({type:"tracking_redirect",url:t}),y())};var be=(t,e=!0)=>{if(t.length===0)return;let o=document.createElement("div");o.className="ai-woo-sa-carousel",o.setAttribute("role","region"),o.setAttribute("aria-label","Rekomendasi Produk"),t.forEach(r=>{o.appendChild(bt(r)),e&&g({type:"product",data:r})}),m(o),e&&y()};var To=[{key:"ordered",label:"Dipesan"},{key:"processing",label:"Diproses"},{key:"shipped",label:"Dikirim"},{key:"completed",label:"Selesai"}],Co=t=>{switch(t){case"completed":return 3;case"shipped":return 2;case"processing":return 1;default:return 0}},ke=t=>{let e=Co(t),o=To.map((r,n)=>`
            <div class="ai-woo-sa-timeline-step ${n<e?"completed":n===e?"active":""}">
                <div class="ai-woo-sa-timeline-dot" aria-hidden="true"></div>
                <span class="ai-woo-sa-timeline-label">${r.label}</span>
            </div>`).join("");return`
        <div class="ai-woo-sa-timeline" role="progressbar" aria-label="Status Pesanan" aria-valuenow="${e+1}" aria-valuemin="1" aria-valuemax="4">
            ${o}
        </div>`};var Ao={completed:"status-completed",processing:"status-processing","on-hold":"status-on-hold",pending:"status-pending",cancelled:"status-cancelled",refunded:"status-refunded",shipped:"status-shipped"},vo="status-default",Ro="-",xo=2e3,Lo=t=>t.items.map(e=>`
                <div class="ai-woo-sa-order-item">
                    <span class="ai-woo-sa-item-name">${i(e.name)} x${i(e.qty)}</span>
                    <span class="ai-woo-sa-item-dots" aria-hidden="true"></span>
                    <span class="ai-woo-sa-order-item-price">Rp ${i(e.total)}</span>
                </div>`).join(""),Io=t=>{let{tracking:e}=t;if(!e||!e.tracking_number||e.tracking_number===Ro)return"";let o=i(e.courier),r=i(e.tracking_number);return`
        <div class="ai-woo-sa-order-tracking">
            <div class="ai-woo-sa-tracking-info">
                <span class="ai-woo-sa-tracking-label">${o}</span>
                <span class="ai-woo-sa-tracking-number">${r}</span>
            </div>
            <button class="ai-woo-sa-btn-copy" data-copy="${r}" type="button" aria-label="Salin nomor resi">
                ${ht}<span>Salin</span>
            </button>
        </div>
        <div class="ai-woo-sa-order-shipping-status">Status Kirim: ${i(e.status_label)}</div>`},No=t=>{let e=t.querySelector(".ai-woo-sa-btn-copy");e&&e.addEventListener("click",async()=>{var r;let o=(r=e.getAttribute("data-copy"))!=null?r:"";try{await navigator.clipboard.writeText(o),e.innerHTML=`${tt}<span>Tersalin</span>`,window.setTimeout(()=>{e.innerHTML=`${ht}<span>Salin</span>`},xo)}catch{}})},rt=(t,e=!0)=>{var n;let o=document.createElement("div");o.className="ai-woo-sa-order-card";let r=(n=Ao[t.status_raw])!=null?n:vo;o.innerHTML=`
        <div class="ai-woo-sa-order-header">
            <span class="ai-woo-sa-order-number">Pesanan #${i(t.order_number)}</span>
            <span class="ai-woo-sa-order-status ${r}">${i(t.status)}</span>
        </div>
        <div class="ai-woo-sa-order-date">${i(t.date)}</div>
        ${ke(t.status_raw)}
        <div class="ai-woo-sa-order-items">${Lo(t)}</div>
        ${Io(t)}
        <div class="ai-woo-sa-order-total">Total: <strong>Rp ${i(t.total)}</strong></div>`,No(o),m(o),e&&(g({type:"order",data:t}),y())};var nt=t=>{if(t){if(t.guest_redirect){ot(t.guest_redirect);return}t.orders.forEach(e=>rt(e))}},at=(t,e)=>{let o=t.filter(n=>e.includes(n.product_id));if(o.length===0)return;if(o.length>1){be(o);return}let[r]=o;r&&H(r)};var Ho=()=>{let{inputField:t,sendBtn:e}=c();t.disabled=!0,t.placeholder=re,e.disabled=!0},Se=async t=>{let e=ye(await t.json());if(e.text){let{cleanText:o,productIds:r}=et(e.text);p(o,"bot"),at(e.products,r)}else e.products.forEach(o=>H(o));if(nt(e.orders),e.fallback&&e.waLink&&R(e.waLink),e.blocked){Ho();return}v(k)};var Oo=t=>{let e=t.choices;if(!Array.isArray(e))return"";let o=e[0];if(!d(o)||!d(o.delta))return"";let r=o.delta.content;return typeof r=="string"?r:""},_e=t=>{if(!d(t))return null;if(t.products||t.orders)return{kind:"meta",products:U(t.products),orders:$(t.orders),fallback:!!t.fallback,waLink:s(t.wa_link)||null};let e=Oo(t);return e?{kind:"token",content:e}:null};var Te="data: ",Mo=["[DONE]","{}"],Po=t=>{let e=t.trim();if(!e.startsWith(Te))return null;let o=e.slice(Te.length);if(Mo.includes(o))return null;try{return _e(JSON.parse(o))}catch{return null}},Ce=()=>{let t=new TextDecoder("utf-8"),e="";return{push(o){var n;e+=t.decode(o,{stream:!0});let r=e.split(`
`);return e=(n=r.pop())!=null?n:"",r.flatMap(l=>{let a=Po(l);return a?[a]:[]})}}};var Ae=async(t,e)=>{if(!t.body)return;let o=t.body.getReader(),r=Ce();for(;;){let{done:n,value:l}=await o.read();if(n)return;for(let a of r.push(l))if(e(a)==="abort"){await o.cancel();return}}};var Bo=t=>_t.some(e=>t.includes(e)),ve=t=>{let e="",o=[],r=a=>{a.products.length>0&&(o=a.products),nt(a.orders),a.fallback&&a.waLink&&R(a.waLink)},n=a=>(e+=a,Bo(e)?(e=Tt,t.textContent=e,_(),R(N(f().waNumber),!0),"abort"):(t.innerHTML=ft(he(i(e))),_(),"continue"));return{handleEvent:a=>a.kind==="meta"?(r(a),"continue"):n(a.content),finalize:()=>{if(!e)return;let{cleanText:a,productIds:u}=et(e);t.innerHTML=j(a),g({type:"msg",text:a,sender:"bot",isRawHtml:!1}),y(),at(o,u)}}};var Re=async t=>{let e=document.createElement("div");e.className="ai-woo-sa-msg bot";let o=document.createElement("p");e.appendChild(o),m(e),_(),G();let r=ve(o);await Ae(t,r.handleEvent),r.finalize()};var $o=async(t,e)=>{var r;if(!t.ok){console.error("AI Chat Error:",t.status,t.statusText),Et(ee,e?()=>void h(e):void 0),v(k);return}if(((r=t.headers.get("content-type"))!=null?r:"").includes("text/event-stream")){await Re(t),v(k);return}await Se(t)},Uo=()=>{window.setTimeout(()=>{let{sendBtn:t,inputField:e}=c();gt(!1),t.disabled=!1,e.focus()},1500)},h=async(t=null,e=!1)=>{let{inputField:o,sendBtn:r}=c(),n=t||o.value.trim();if(!(!n||ie())){v(D),!t&&!e&&p(n,"user"),o.value="",gt(!0),r.disabled=!0,e?ce():yt();try{let l=await ae(n);wt(),await $o(l,n)}catch(l){wt(),Et(oe,()=>void h(n,e)),console.error("AI Sales Assistant Error:",l),v(k)}finally{Uo()}}};var E=(t,e="")=>`Berikan info lengkap produk Shinyoung ${t}${e}`,Ko={label:"Kembali",type:"submenu",target:"initial"},kt={label:"Kembali",type:"submenu",target:"categories"},Wo=`Pesanan dikirim langsung dari fasilitas kami di **Sleman, Yogyakarta**.

Semua produk Shinyoung diformulasikan **Bebas SLS, Bebas Paraben, dan Non-Alkohol** \u2014 dirancang lembut untuk kulit sensitif.

Pembelian melalui Official Store dijamin **100% orisinal** dengan jaminan kepuasan dan layanan *after-sales support*.

Slogan kami: *Happy Shine on You* \u2014 #ShineBrighterFeelYounger`,xe={initial:[{label:"Produk Kami",type:"submenu",target:"categories"},{label:"Konsultasi Kulit",type:"query",query:"Saya ingin konsultasi tentang kondisi kulit saya, bisa bantu rekomendasikan produk Shinyoung yang cocok?"},{label:"Lacak Pesanan",type:"query",query:"Saya ingin cek status pesanan saya"},{label:"Pesanan Saya",type:"query",query:"Tampilkan pesanan terakhir saya"},{label:"Info Toko",type:"static",response:Wo},{label:"Hubungi CS",type:"action",action:"whatsapp"}],categories:[{label:"Perawatan Wajah",type:"submenu",target:"face"},{label:"Perawatan Rambut",type:"submenu",target:"hair"},{label:"Perawatan Tubuh",type:"submenu",target:"body"},Ko],face:[{label:"Binahong Cream 15g",type:"query",query:E("Binahong Cream 15g"," beserta manfaat dan cara pakainya")},{label:"Binahong Oil 10ml",type:"query",query:E("Binahong Oil 10ml"," beserta manfaat dan cara pakainya")},kt],hair:[{label:"Shampoo Anti Ketombe",type:"query",query:E("Shampoo Anti Ketombe 138ml")},{label:"Hair Serum Anti Ketombe",type:"query",query:E("Hair Serum Anti Ketombe 100ml")},{label:"Hair Tonic Anti Ketombe",type:"query",query:E("Hair Tonic Anti Ketombe")},{label:"Hair Powder Coffee",type:"query",query:E("Hair Powder Coffee 10gr")},kt],body:[{label:"Yunso Soap",type:"query",query:E("Yunso Soap"," beserta manfaat dan cara pakainya")},{label:"Peeling Spray",type:"query",query:E("Peeling Spray"," beserta manfaat dan cara pakainya")},{label:"Hwasa Body Serum",type:"query",query:E("Hwasa Brightening Body Serum 100ml"," beserta kandungan Hexylresorcinol dan manfaatnya")},{label:"Deodorant Spray",type:"query",query:E("Deodorant Spray 60ml")},kt]};var Le="ai-woo-sa-qr",st=()=>{var t;(t=document.getElementById(Le))==null||t.remove()},Go=()=>{let{waNumber:t}=f();if(t){window.open(N(t,Y),"_blank");return}p(V,"bot"),b("initial")},qo=t=>{switch(st(),t.type){case"static":p(t.label,"user"),p(t.response,"bot"),b("initial");return;case"query":p(t.label,"user"),h(t.query);return;case"submenu":b(t.target);return;case"action":Go();return}},b=t=>{st();let e=document.createElement("div");e.className="ai-woo-sa-quick-replies",e.id=Le,xe[t].forEach(o=>{let r=document.createElement("button");r.className="ai-woo-sa-qr-btn",r.textContent=o.label,r.addEventListener("click",()=>qo(o)),e.appendChild(r)}),m(e)};var Ie=()=>`
    <div class="ai-woo-sa-welcome-badge">
        <span>Konsultan Belanja Virtual AI</span>
    </div>
    <h2 class="ai-woo-sa-welcome-title">Selamat datang.</h2>
    <p class="ai-woo-sa-welcome-subtitle">
        Kami siap membantu menemukan perawatan yang tepat dan menjawab pesanan Anda.
    </p>
    <div class="ai-woo-sa-starter-actions" role="group" aria-label="Aksi Cepat">
        <button class="ai-woo-sa-starter-row" data-starter="products" type="button">
            <span class="ai-woo-sa-starter-icon" aria-hidden="true">${ue}</span>
            <span class="ai-woo-sa-starter-label">Temukan produk</span>
            <span class="ai-woo-sa-starter-arrow" aria-hidden="true">${M}</span>
        </button>
        <button class="ai-woo-sa-starter-row" data-starter="consultation" type="button">
            <span class="ai-woo-sa-starter-icon" aria-hidden="true">${fe}</span>
            <span class="ai-woo-sa-starter-label">Konsultasi kulit dan rambut</span>
            <span class="ai-woo-sa-starter-arrow" aria-hidden="true">${M}</span>
        </button>
        <button class="ai-woo-sa-starter-row" data-starter="track" type="button">
            <span class="ai-woo-sa-starter-icon" aria-hidden="true">${X}</span>
            <span class="ai-woo-sa-starter-label">Lacak pesanan</span>
            <span class="ai-woo-sa-starter-arrow" aria-hidden="true">${M}</span>
        </button>
        <button class="ai-woo-sa-starter-row" data-starter="cs" type="button">
            <span class="ai-woo-sa-starter-icon" aria-hidden="true">${Z}</span>
            <span class="ai-woo-sa-starter-label">Hubungi CS</span>
            <span class="ai-woo-sa-starter-arrow" aria-hidden="true">${M}</span>
        </button>
    </div>`;var jo=t=>{switch(t){case"products":b("categories");return;case"consultation":p("Konsultasi kulit dan rambut","user"),h("Saya ingin konsultasi tentang kondisi kulit saya, bisa bantu rekomendasikan produk Shinyoung yang cocok?");return;case"track":p("Lacak pesanan","user"),h("Saya ingin cek status pesanan saya");return;case"cs":{let{waNumber:e}=f();e?window.open(N(e,Y),"_blank"):p(V,"bot");return}}},Ne=t=>{t.addEventListener("click",e=>{let o=e.target.closest("[data-starter]");if(!o)return;let r=o.getAttribute("data-starter");r&&jo(r)})},He=(t=!0)=>{let e=`<div class="ai-woo-sa-welcome" id="ai-woo-sa-welcome">${Ie()}</div>`;p(e,"bot",t,!0)};var Fo=(t,e)=>{let o=`<p>Halo Kak! Sedang melihat <strong>${i(t)}</strong> ya?</p>`;return e&&(o+=`<p style="font-size: 13px; color: var(--text-light); margin-top: 4px;"><em>${i(e)}</em></p>`),`${o}<p style="margin-top: 4px;">Ada yang ingin ditanyakan tentang produk ini?</p>`},it=(t=!0)=>{let{currentProduct:e}=f();if(e){p(Fo(e.name,e.desc),"bot",t,!0),S(A,String(e.id));return}He(t)};var Oe=async t=>{let e=new FormData;e.append("product_id",String(t)),e.append("quantity","1");let r=await(await fetch(f().wcAjaxUrl,{method:"POST",body:e,credentials:"same-origin"})).json();return!d(r)||r.error?{ok:!1,fragments:null,cartHash:null}:{ok:!0,fragments:r.fragments,cartHash:r.cart_hash}};var Yo=t=>`[CROSS-SELL] "${t}" ditambahkan ke keranjang. Ucapkan terima kasih 1 kalimat, lalu rekomendasikan 1 produk pelengkap.`,Me=t=>{t.textContent=Zt,t.disabled=!1,window.setTimeout(()=>{t.textContent=F},3e3)},Qo=(t,e,o)=>{let{jQuery:r}=window;r&&(r(document.body).trigger("added_to_cart",[e,o,r(t)]),r(document.body).trigger("wc_fragment_refresh"))},Pe=async(t,e,o)=>{e.disabled=!0,e.innerHTML=`<span class="ai-woo-sa-btn-spinner"></span> ${Xt}`;try{let r=await Oe(t);if(!r.ok){Me(e);return}e.innerHTML=`${tt} <span>${te}</span>`,e.classList.add("added");let n=e.closest(".ai-woo-sa-product-card"),l=n==null?void 0:n.querySelector(".ai-woo-sa-post-cart"),{checkoutUrl:a}=f();l&&a&&(l.innerHTML=`<a href="${i(a)}" class="ai-woo-sa-post-link">Selesaikan Pesanan &rarr;</a>`,l.style.display="block"),f().cartItems.push({id:t,name:o,qty:1}),Qo(e,r.fragments,r.cartHash),h(Yo(o),!0)}catch(r){Me(e),console.error("AI Woo SA Add-to-Cart Error:",r)}};var zo="Mulai obrolan baru dan hapus riwayat?",Jo=()=>{Bt(),jt(),it(!0),b("initial")},Xo=t=>t.key==="Enter"&&!t.shiftKey&&!t.isComposing,Be=()=>{let{fabBtn:t,closeBtn:e,resetBtn:o,sendBtn:r,inputField:n,chatBody:l}=c();t.addEventListener("click",Wt),e.addEventListener("click",q),o.addEventListener("click",()=>Gt(zo,Jo)),r.addEventListener("click",()=>void h()),n.addEventListener("keydown",a=>{Xo(a)&&(a.preventDefault(),h())}),window.addEventListener("keydown",a=>{a.key==="Escape"&&q()}),Ne(l),Ft(),Kt(),ct(D,st),ct(k,()=>b("initial")),Rt(({productId:a,button:u,productTitle:C})=>{Pe(a,u,C)})};var De=()=>{let{currentProduct:t}=f();if(!t)return;let e=String(t.id);if(x(A)===e)return;let o=`<p>Btw Kak, saya lihat Kakak sedang melihat <strong>${i(t.name)}</strong> ya? Ada yang bisa saya bantu jelaskan tentang produk ini?</p>`;p(o,"bot",!0,!0).classList.add("ai-woo-sa-nudge"),S(A,e)};var tr=t=>{switch(t.type){case"msg":p(t.text,t.sender,!1,t.isRawHtml);return;case"product":H(t.data,!1);return;case"wa":R(t.link,!1);return;case"order":rt(t.data,!1);return;case"tracking_redirect":ot(t.url,!1);return}},$e=()=>{let t=Pt();if(!t||t.length===0){it(!0);return}t.forEach(tr),window.setTimeout(De,500)};var er="AI Sales Assistant",or=t=>{if(!d(t))return null;let e=parseInt(s(t.id),10),o=s(t.name);return Number.isNaN(e)||!o?null:{id:e,name:o,desc:s(t.desc)}},rr=t=>Array.isArray(t)?t.flatMap(e=>{if(!d(e))return[];let o=parseInt(s(e.id),10),r=parseInt(s(e.qty),10);return Number.isNaN(o)?[]:[{id:o,name:s(e.name),qty:r||1}]}):[],Ue=t=>{if(!d(t))return null;let e=s(t.restUrl),o=s(t.wcAjaxUrl);return!e||!o?null:{restUrl:e,wcAjaxUrl:o,nonce:s(t.nonce),botName:s(t.botName)||er,waNumber:s(t.waNumber),checkoutUrl:s(t.checkoutUrl),currentProduct:or(t.currentProduct),cartItems:rr(t.cartItems)}};var nr=t=>`
    <header class="ai-woo-sa-header">
        <div class="ai-woo-sa-header-brand">
            <div class="ai-woo-sa-avatar" aria-hidden="true">
                <span class="ai-woo-sa-avatar-text">SA</span>
            </div>
            <div class="ai-woo-sa-header-info">
                <h3 class="ai-woo-sa-header-title">${i(t)}</h3>
                <div class="ai-woo-sa-header-status">
                    <span class="ai-woo-sa-status-dot" aria-hidden="true"></span>
                    <span class="ai-woo-sa-status-label">Beauty Advisor</span>
                </div>
            </div>
        </div>
        <div class="ai-woo-sa-header-actions">
            <button class="ai-woo-sa-header-btn" id="ai-woo-sa-reset-btn" aria-label="Mulai obrolan baru" title="Mulai obrolan baru">
                ${J}
            </button>
            <button class="ai-woo-sa-header-btn" id="ai-woo-sa-close-btn" aria-label="Tutup obrolan" title="Tutup">
                ${pe}
            </button>
        </div>
    </header>`,ar=()=>`
    <footer class="ai-woo-sa-footer">
        <div class="ai-woo-sa-composer">
            <input type="text" id="ai-woo-sa-input" class="ai-woo-sa-input" placeholder="Tulis pertanyaan Anda..." autocomplete="off" aria-label="Pesan Anda" />
            <button class="ai-woo-sa-send" id="ai-woo-sa-send-btn" aria-label="Kirim pesan" title="Kirim">
                ${me}
            </button>
        </div>
        <div class="ai-woo-sa-disclaimer">
            <span>Dijawab oleh AI. Untuk kepastian, hubungi CS.</span>
        </div>
    </footer>`,sr=()=>`
    <button class="ai-woo-sa-fab" id="ai-woo-sa-fab" aria-label="Buka layanan konsultasi">
        <span class="ai-woo-sa-badge" id="ai-woo-sa-badge" style="display:none;" aria-label="Pesan baru">0</span>
        <span class="ai-woo-sa-fab-icon">${de}</span>
    </button>`,ir=()=>`
    <div class="ai-woo-sa-confirm-overlay" id="ai-woo-sa-confirm-overlay" role="alertdialog" aria-modal="true" aria-labelledby="ai-woo-sa-confirm-title" aria-describedby="ai-woo-sa-confirm-text">
        <div class="ai-woo-sa-confirm-box">
            <h4 id="ai-woo-sa-confirm-title">Mulai Obrolan Baru?</h4>
            <p id="ai-woo-sa-confirm-text"></p>
            <div class="ai-woo-sa-confirm-actions">
                <button class="ai-woo-sa-confirm-btn cancel" id="ai-woo-sa-confirm-cancel">Batal</button>
                <button class="ai-woo-sa-confirm-btn confirm" id="ai-woo-sa-confirm-ok">Mulai Baru</button>
            </div>
        </div>
    </div>`,Ke=t=>`
    <div class="ai-woo-sa-chat-window" id="ai-woo-sa-window" role="dialog" aria-label="Konsultasi Kecantikan Shinyoung">
        ${nr(t)}
        <div class="ai-woo-sa-body" id="ai-woo-sa-body" role="log" aria-live="polite" aria-atomic="false"></div>
        <button class="ai-woo-sa-jump-btn" id="ai-woo-sa-jump-btn" type="button" aria-label="Lompat ke pesan terbaru" style="display:none;">
            ${ge}<span>Pesan baru</span>
        </button>
        ${ar()}
    </div>
    ${sr()}
    ${ir()}`;var We=(t,e)=>(t.innerHTML=Ke(e),Dt());var Ge=()=>{let t=document.getElementById(St);if(!t)return;let e=Ue(window.aiWooSaConfig);if(!e){console.warn("AI Sales Assistant: Configuration not found. Widget disabled.");return}Ct(e),We(t,e.botName),Be(),$e(),b("initial")};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Ge):Ge();})();
