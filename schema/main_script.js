  // ── Simple screen router ──────────────────
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) {
      target.classList.add('active');
      window.scrollTo(0, 0);
    }
    if (id === 'screen-pillars') {
      const card = document.getElementById('pillar-content-card');
      const firstBtn = document.querySelector('.pillar-pill[data-pillar="shahada"]');
      if (firstBtn && card && !card.innerHTML.trim()) {
        showPillarCard('shahada', firstBtn);
      }
    }
  }

  // ── Q&A Data & Accordion ─────────────────
  const qaData = [
    {
      cat: "namaz",
      q: "Namaz ki kitni rakaten hoti hain?",
      a: "Paanch waqt ki namazein hain: Fajr (4), Dhuhr (12), Asr (8), Maghrib (7), Isha (17) — jin mein Fard, Sunnah aur Nafl shamil hain."
    },
    {
      cat: "namaz",
      q: "Wudu toot jane ki kya wajuhaat hain?",
      a: "Wudu in wajuhaat se toot jata hai: (1) Qaza e hajat, (2) Riyah (gas) khaarij hona, (3) Gehri neend aana, (4) Behoshi, (5) Khoon ya pus nikalna jo beh jaye, (6) Qay karna agar munh bhar ho."
    },
    {
      cat: "namaz",
      q: "Kya auraton ki namaz mardoon se alag hoti hai?",
      a: "Haan, auraton ke liye namaz ka andaz thoda alag hai — maslan haath baandhne, ruku aur sajdah mein fark hota hai. Auraten jism ko zyada sameta kar namaz ada karti hain."
    },
    {
      cat: "namaz",
      q: "Qaza namaz kya hoti hai aur kaise ada ki jati hai?",
      a: "Jo namaz apne waqt par ada na ho sake, use Qaza kehte hain. Qaza namaz utni hi rakaton mein ada ki jati hai jitni fard hain — sirf fard rakaten qaza hoti hain, sunnah nahi."
    },
    {
      cat: "quran",
      q: "Quran mein kitne para, surah aur ayat hain?",
      a: "Quran Majeed mein 30 Para, 114 Surah aur 6,236 Ayaat hain. Sabse badi surah Al-Baqarah (286 ayaat) aur sabse chhoti surah Al-Kawthar (3 ayaat) hai."
    },
    {
      cat: "quran",
      q: "Quran ka tarjuma parhna kaisa hai?",
      a: "Quran ka tarjuma (translation) parhna jaiz aur mustahsan hai taake maa'na samjha ja sake. Lekin asli sawab Arabic matan parhne se milta hai. Dono mila kar parhna sabse behtar hai."
    },
    {
      cat: "quran",
      q: "Bila wuzu Quran chu sakte hain?",
      a: "Jumhoor ulama ke mutabiq bila wuzu Quran Majeed ko haath lagana jaiz nahi. Haan, tarjuma ya tafseer ki kitaab bila wuzu chhui ja sakti hai. Mobile ya tablet par bila wuzu parhne mein gunjaaish hai."
    },
    {
      cat: "roza",
      q: "Roza kis par farz hai?",
      a: "Roza har baligh, aaqil (sane), muqeem (muqim) Muslim mard aur aurat par farz hai. Beemar, musafir, haamilah aur haiz/nifas wali auraten roza chhod sakti hain aur baad mein qaza karein."
    },
    {
      cat: "roza",
      q: "Roza torne wali cheezein konsi hain?",
      a: "Jaan bujhkar kuch khana peena, jaan bujhkar qay karna, humbistari karna — ye sab roza tor dete hain. Ghalti se kuch kha lena, khwaab mein ehtelaam hona ya neend mein kuch kha lena roza nahi torta."
    },
    {
      cat: "roza",
      q: "Ramadan mein raat ko kitne baje tak sehri kha sakte hain?",
      a: "Sehri Subah Sadiq (Fajr ka waqt) se pehle pehle khani chahiye. Ihtiyatan Azan se 10-15 minute pehle khaana band kar dena chahiye. Azan ke baad sehri khana jaiz nahi."
    },
    {
      cat: "zakat",
      q: "Zakat kis par farz hoti hai?",
      a: "Zakat us Muslim par farz hai jis ke paas Nisab ke barabar maal ho aur us par poora ek saal (Haul) guzar jaye. Nisab sone ka: 7.5 tola (87.48g), chandi ka: 52.5 tola (612.36g) ya uske barabar raqam."
    },
    {
      cat: "zakat",
      q: "Zakat ka nisab kitna hai aur kitni di jati hai?",
      a: "Nisab ki tafeel: Sona 87.48 gram ya Chandi 612.36 gram ya uske barabar cash. Agar itna maal ek saal ke liye paas rahe to kul maal ka 2.5% zakat deni hogi."
    },
    {
      cat: "aqaid",
      q: "Iman ke kitne arkaan hain?",
      a: "Iman ke 7 arkaan hain: (1) Allah par, (2) Malaika par, (3) Aasmani Kutub par, (4) Anbiya wa Rusul par, (5) Qayamat ke din par, (6) Taqdeer (khair wa shar) par, (7) Marne ke baad dobara uthaye jane par."
    },
    {
      cat: "aqaid",
      q: "Islam ke 5 arkaan konse hain?",
      a: "Islam ke 5 arkaan hain: (1) Shahada — La ilaha illallah Muhammadur Rasulullah, (2) Salah — Paanch waqt ki namaz, (3) Zakat — Maal ka 2.5% ghareebon ko dena, (4) Sawm — Ramadan ke roze, (5) Hajj — Mustati ke liye."
    },
    {
      cat: "aqaid",
      q: "Tawheed ka matlab kya hai?",
      a: "Tawheed ka matlab hai Allah ki Wahdat (Oneness) par yakeen rakhna — ke Allah ek hai, uska koi shareek nahi, na ibaadat mein, na sifaat mein, na hukm mein. Ye Islam ka bunyadi aqeedah hai."
    }
  ];

  let currentQACat = 'all';

  function renderQA(cat) {
    const list = document.getElementById('qa-list');
    if (!list) return;
    const filtered = cat === 'all' ? qaData : qaData.filter(q => q.cat === cat);
    list.innerHTML = filtered.map((item, i) => `
      <div class="bg-white rounded-xl border border-[#E0F2FE] shadow-[0_4px_12px_rgba(14,165,233,0.06)] overflow-hidden">
        <button onclick="toggleQA(this)" class="w-full flex items-center justify-between gap-3 px-lg py-md text-left active:bg-surface-container-low transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-outlined text-primary text-[16px]" style="font-variation-settings:'FILL' 1">help</span>
            </div>
            <p class="font-body-lg text-body-lg font-semibold text-on-background leading-snug">${item.q}</p>
          </div>
          <span class="material-symbols-outlined text-outline flex-shrink-0 qa-chevron transition-transform duration-300">expand_more</span>
        </button>
        <div class="qa-answer max-h-0 overflow-hidden transition-all duration-300 ease-in-out">
          <div class="px-lg pb-md pt-0">
            <div class="h-px bg-surface-container-low mb-md"></div>
            <p class="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">${item.a}</p>
          </div>
        </div>
      </div>`).join('');
  }

  function toggleQA(btn) {
    const card = btn.parentElement;
    const answer = card.querySelector('.qa-answer');
    const chevron = btn.querySelector('.qa-chevron');
    const isOpen = answer.style.maxHeight && answer.style.maxHeight !== '0px';
    // Close all others
    document.querySelectorAll('.qa-answer').forEach(a => { a.style.maxHeight = '0px'; });
    document.querySelectorAll('.qa-chevron').forEach(c => { c.style.transform = 'rotate(0deg)'; });
    // Open this one
    if (!isOpen) {
      answer.style.maxHeight = answer.scrollHeight + 'px';
      chevron.style.transform = 'rotate(180deg)';
    }
  }

  function filterQA(cat, btn) {
    currentQACat = cat;
    document.querySelectorAll('.qa-cat-btn').forEach(b => {
      b.className = 'qa-cat-btn flex-shrink-0 px-4 py-2 rounded-full font-label-sm text-label-sm bg-surface-container text-on-surface transition-all';
    });
    btn.className = 'qa-cat-btn flex-shrink-0 px-4 py-2 rounded-full font-label-sm text-label-sm bg-primary text-white transition-all';
    renderQA(cat);
  }

  // Render Q&A when screen opens
  const _origSS = showScreen;
  showScreen = function(id) {
    _origSS(id);
    if (id === 'screen-qa') renderQA(currentQACat);
  };

  // ── Pillars of Islam ─────────────────────
  const pillarData = {
    shahada: {
      arabic: "لَا إِلٰهَ إِلَّا الله مُحَمَّدٌ رَسُولُ الله",
      title: "Shahada (Faith)",
      description: "The declaration of faith is the foundational pillar of Islam. It is the sincere recitation of the statement that there is no god but Allah and Muhammad is His messenger.",
      details: [
        "The core entry point into the Muslim community.",
        "Requires both verbal testimony and internal belief.",
        "Unifies the concepts of Tawhid (Oneness) and Risalah (Prophethood)."
      ],
      importance: "The declaration of Shahada provides a profound sense of purpose and identity, grounding the believer's life in the worship of the Creator.",
      guide: [
        { title: "Understand the Meaning", desc: "Internalize the profound depth of declaring Allah as the only deity." },
        { title: "Recite with Sincerity", desc: "The testimony should be spoken clearly with full heart and soul." },
        { title: "Live the Testimony", desc: "Ensure daily actions align with the submission expressed in the declaration." }
      ]
    },
    salah: {
      arabic: "الصَّلَاة",
      title: "Salah (Prayer)",
      description: "The five daily prayers are the spiritual backbone of a Muslim's life, performed at specific times from dawn until night.",
      details: [
        "Performed five times daily: Fajr, Dhuhr, Asr, Maghrib, and Isha.",
        "Requires ritual purity (Wudu) before starting.",
        "Direct communication between the worshipper and Allah."
      ],
      importance: "Salah serves as a constant reminder of our connection to the Divine, purifying the heart and soul through regular devotion.",
      guide: [
        { title: "Perform Wudu", desc: "Cleanse yourself physically and spiritually before approaching prayer." },
        { title: "Face the Qibla", desc: "Align your direction towards the Kaaba in Makkah." },
        { title: "Focus and Humility", desc: "Enter prayer with a present heart and complete devotion (Khushu)." }
      ]
    },
    zakat: {
      arabic: "الزَّكَاة",
      title: "Zakat (Charity)",
      description: "Zakat is the obligatory giving of a portion of one's wealth to those in need, serving as a form of social purification.",
      details: [
        "Typically 2.5% of surplus wealth held for a year.",
        "Purifies wealth and heart from greed and selfishness.",
        "Provides social security for the less fortunate in the community."
      ],
      importance: "Zakat bridges the gap between the rich and the poor, ensuring that the wealth of the community circulates fairly.",
      guide: [
        { title: "Calculate Nisab", desc: "Determine if your wealth exceeds the minimum threshold for Zakat." },
        { title: "Identify Recipients", desc: "Ensure your Zakat goes to one of the eight eligible categories defined in the Quran." },
        { title: "Give with Sincerity", desc: "Give with a happy heart, seeking only the pleasure of Allah." }
      ]
    },
    sawm: {
      arabic: "الصَّوْم",
      title: "Sawm (Fasting)",
      description: "Fasting during the holy month of Ramadan involves abstaining from food and drink from dawn until sunset.",
      details: [
        "Required for all healthy adult Muslims during Ramadan.",
        "Includes spiritual fasting from bad speech and negative actions.",
        "Culminates in the celebration of Eid al-Fitr."
      ],
      importance: "Sawm develops self-discipline, empathy for the hungry, and heightens spiritual consciousness (Taqwa).",
      guide: [
        { title: "Intention (Niyyah)", desc: "Make a sincere intention to fast before the break of dawn." },
        { title: "Patience and Prayer", desc: "Spend the day in worship, avoiding arguments and idle talk." },
        { title: "Iftar and Gratitude", desc: "Break your fast at sunset with dates and water, thanking Allah." }
      ]
    },
    hajj: {
      arabic: "الحَجّ",
      title: "Hajj (Pilgrimage)",
      description: "The annual pilgrimage to the holy city of Makkah, which every Muslim must perform once in their lifetime if physically and financially able.",
      details: [
        "Takes place during the month of Dhu al-Hijjah.",
        "Universal gathering of Muslims from all over the world.",
        "Involves specific rituals including Tawaf and standing at Arafat."
      ],
      importance: "Hajj symbolizes human equality and submission to Allah, as millions gather in simple white garments regardless of status.",
      guide: [
        { title: "Preparation", desc: "Ensure all debts are paid and seek forgiveness before traveling." },
        { title: "Enter Ihram", desc: "Adopt the state of ritual sanctity and put on the required garments." },
        { title: "Perform the Rites", desc: "Follow the steps of the Prophet Muhammad (PBUH) with patience." }
      ]
    }
  };

  function showPillarCard(key, btn) {
    const data = pillarData[key];
    const card = document.getElementById('pillar-content-card');
    // Update tabs
    document.querySelectorAll('.pillar-pill').forEach(b => {
      b.className = 'pillar-pill px-6 py-2.5 rounded-xl whitespace-nowrap font-semibold text-label-sm active:scale-95 transition-transform bg-[#e9e5d9] text-on-surface';
    });
    btn.className = 'pillar-pill px-6 py-2.5 rounded-xl whitespace-nowrap font-semibold text-label-sm active:scale-95 transition-transform bg-[#1e7051] text-white shadow-sm';
    btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    // Render content
    card.innerHTML = `
      <div class="bg-[#F0F9FF] rounded-xl p-xl mb-lg border border-[#E0F2FE] flex flex-col items-center justify-center">
        <span class="font-arabic-display text-arabic-display text-primary text-center leading-relaxed">${data.arabic}</span>
        <div class="h-1 w-24 bg-gradient-to-r from-primary to-primary-container rounded-full opacity-30 mt-md"></div>
      </div>
      <section class="mb-lg">
        <div class="flex items-center gap-2 mb-2">
          <span class="material-symbols-outlined text-primary" style="font-variation-settings:'FILL' 1">star</span>
          <h2 class="font-headline-sm text-headline-sm text-on-background">${data.title}</h2>
        </div>
        <p class="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">${data.description}</p>
      </section>
      <section class="mb-lg">
        <h3 class="font-label-sm text-label-sm text-primary uppercase tracking-widest mb-md">Essential Details</h3>
        <ul class="space-y-3">
          ${data.details.map(d => `
            <li class="flex items-start gap-3 p-md bg-surface-container-low rounded-lg border border-[#E0F2FE]">
              <span class="material-symbols-outlined text-primary text-[20px] flex-shrink-0">check_circle</span>
              <span class="font-body-md text-body-md text-on-surface">${d}</span>
            </li>`).join('')}
        </ul>
      </section>
      <section class="mb-lg">
        <div class="bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] p-lg rounded-xl text-white relative overflow-hidden">
          <span class="material-symbols-outlined absolute -right-4 -bottom-4 text-[120px] opacity-10 rotate-12">format_quote</span>
          <h3 class="font-label-sm text-label-sm uppercase tracking-widest mb-sm opacity-80">Importance</h3>
          <p class="font-body-lg text-body-lg italic relative z-10">"${data.importance}"</p>
        </div>
      </section>
      <section>
        <h3 class="font-label-sm text-label-sm text-primary uppercase tracking-widest mb-md">Practical Guide</h3>
        <div class="space-y-4">
          ${data.guide.map((step, i) => `
            <div class="flex gap-4 items-start">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary-container/20 text-primary flex items-center justify-center font-bold font-body-md">${i+1}</div>
              <div>
                <p class="font-bold font-body-md text-on-background">${step.title}</p>
                <p class="font-body-md text-body-md text-on-surface-variant">${step.desc}</p>
              </div>
            </div>`).join('')}
        </div>
      </section>`;
    window.scrollTo(0, 0);
  }

  // Auto-init Pillars when screen opens — called from showScreen below

  // ── Prayers Screen — Modal + Tabs ─────────

  function openPrayerModal(id) {
    const modal = document.getElementById(id);
    modal.classList.remove('hidden');
    document.body.classList.add('modal-active');
    const sheet = modal.querySelector('.prayer-sheet');
    sheet.style.transform = 'translateY(100%)';
    requestAnimationFrame(() => {
      sheet.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      sheet.style.transform = 'translateY(0)';
    });
  }

  function closePrayerModal(id) {
    const modal = document.getElementById(id);
    const sheet = modal.querySelector('.prayer-sheet');
    sheet.style.transform = 'translateY(100%)';
    setTimeout(() => {
      modal.classList.add('hidden');
      document.body.classList.remove('modal-active');
    }, 300);
  }

  function switchNamazTab(tabId, btn) {
    document.querySelectorAll('.namaz-tab-content').forEach(c => c.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
    document.querySelectorAll('.namaz-tab-btn').forEach(b => {
      b.classList.remove('border-primary', 'text-primary');
      b.classList.add('border-transparent', 'text-outline');
    });
    btn.classList.add('border-primary', 'text-primary');
    btn.classList.remove('border-transparent', 'text-outline');
  }

  // ── Build Wudu Steps ───────────────────────
  const wuduSteps = [
    { title: "Niyyah & Bismillah", icon: "favorite", desc: "Make the intention in your heart to perform Wudu purely for the sake of Allah, and say \u201cBismillah\u201d." },
    { title: "Wash Hands", icon: "back_hand", desc: "Wash both hands up to the wrists three times, ensuring water reaches between the fingers." },
    { title: "Rinse Mouth", icon: "air", desc: "Take water into the mouth and rinse thoroughly three times (Madmadah)." },
    { title: "Rinse Nose", icon: "air", desc: "Sniff water gently into the nostrils and blow it out, three times (Istinshaq)." },
    { title: "Wash Face", icon: "face", desc: "Wash the face from forehead to chin and ear to ear, three times." },
    { title: "Wash Arms", icon: "front_hand", desc: "Wash the right arm then the left arm up to and including the elbows, three times each." },
    { title: "Wipe Head & Ears", icon: "touch_app", desc: "Wipe the head once with wet hands, then wipe the inside and outside of both ears." },
    { title: "Wash Feet", icon: "footprint", desc: "Wash the right foot then the left foot up to and including the ankles, three times each." }
  ];

  const wuduContainer = document.getElementById('wudu-steps-container');
  if (wuduContainer) {
    wuduSteps.forEach((step, i) => {
      const div = document.createElement('div');
      div.className = "flex items-start gap-md";
      div.innerHTML = `
        <span class="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">${i + 1}</span>
        <div class="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-md flex items-center gap-md">
          <div class="bg-primary-container/15 text-primary w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-outlined">${step.icon}</span>
          </div>
          <div>
            <h5 class="font-headline-sm text-[15px] font-bold text-on-surface mb-0.5">${step.title}</h5>
            <p class="text-on-surface-variant font-body-md text-[13px]">${step.desc}</p>
          </div>
        </div>`;
      wuduContainer.appendChild(div);
    });
  }

  // ── Para File IDs (Quran 16 Line) ────────
  const paraFileIds = [
    "1VvsBqEPFnjWgKvjVKiFEekAinlhvOeFy",
    "1vyLuVGa0_xPno3Do0KZ0CDiJqvcgqzb8",
    "1Tk0RLF6Naz2jmK9otvDrvCpJX5atoGMi",
    "11PzpIqNkWj8ISzAIiIeHTF_QGrWWmFai",
    "1bljxewqRlT1Ft2YoSpy01QVLFt_WReQP",
    "1ZXL7EwG-EdoakJhgg3jiff6QABlSk_db",
    "1_HDvlbF9CeDFp0QGrEsiPPIh_Sc-D1-G",
    "1yAC64f1qbdvntY1_32b5ykQ0P--Y0XeB",
    "16_-kbWV73GnGDn6TpFRm4udnKzq01T-Y",
    "1YUIUJXXzzINc_mDxNZ0v1dSdRMZL0RQD",
    "1W6E4_X54TuNvta1eu3skQwZC607HRULn",
    "1BmCPZmPcTenWqApLA20v6OFFPzUndqmy",
    "1TjmEYymhW5DRlIkuk5dpbVAXy3qJEdFL",
    "1YMFIY67k3i4HFF2mNNBhuW-5HB47FPxB",
    "1n6ASUvdSDA-gJIQtHR6TDqSk5QMxDqWn",
    "1NgsVQmCYmEp7w4pqz-H48iHTzap0Wi6Q",
    "1ZM2bbe58FgF4NjV3xEPDqTPLrsf7xXaa",
    "1dfSmggwpZTfZV-qSxouPxSJz3xgTlAtO",
    "1R2dwa7T5ESPzUZaELvbMiU6WfzCmomwd",
    "1tTwoO6ybqW4eEHS1k5fHzRKxM90bOb1I",
    "18ZZMEXHi5PeSD93IeEeK2tw_gptN0Mtm",
    "1HsSJZGu5bSbkpuvuT94r_VTbnsO0aeBZ",
    "1acPyOzpIdzDjNYh4NDIa71suIOj3MSNf",
    "1R8lnSzl7wrACA23kslaGhxo9t0uTB_8m",
    "19xsSLDhl8GWm22Vxp3PwpmhXBtrzdhZp",
    "1dIkJUakCO4pMExgXv9jhzK84uVPRmGus",
    "1mbcIUUOElolg6x9TmAP9omzd3YCuFw5R",
    "1P-xHjtvJwXT2mJQcPLqmbJ4O8emSDYav",
    "1s1Q5JBfpLdotN6e4uocdu7KOgB1YhuHw",
    "1dhpPnZE4Dox6NopOoU7c6r89q8sha3DF"
  ];

  function openPara(paraNum, paraName) {
    const fileId = paraFileIds[paraNum - 1];
    document.getElementById('para-viewer-title').textContent = 'Para ' + paraNum + ' — ' + paraName;
    document.getElementById('para-viewer-iframe').src = 'https://drive.google.com/file/d/' + fileId + '/preview';
    showScreen('screen-para-viewer');
  }

  // ── Build Para List ───────────────────────
  const paraNames = [
    "الم", "سيقول", "تلك الرسل", "لن تنالوا", "والمحصنات",
    "لا يحب الله", "وإذا سمعوا", "ولو أننا", "قال الملأ", "واعلموا",
    "يعتذرون", "وما من دابة", "وما أبرئ", "ربما", "سبحان الذي",
    "قال ألم", "اقترب", "قد أفلح", "وقال الذين", "أمن خلق",
    "اتل ما أوحي", "ومن يقنت", "وما لي", "فمن أظلم", "إليه يرد",
    "حم", "قال فما خطبكم", "قد سمع الله", "تبارك الذي", "عم يتساءلون"
  ];

  const container = document.getElementById('para-list-container');
  paraNames.forEach((name, i) => {
    const n = i + 1;
    const card = document.createElement('div');
    card.className = "flex items-center justify-between p-4 bg-surface-container-lowest border border-surface-variant/30 rounded-xl shadow-sm hover:shadow-[0_4px_12px_rgba(14,165,233,0.12)] transition-all cursor-pointer group active:scale-[0.98]";
    card.onclick = () => openPara(n, name);
    card.innerHTML = `
      <div class="flex items-center gap-md">
        <div class="w-10 h-10 flex items-center justify-center bg-surface-container text-primary rounded-lg font-bold text-sm flex-shrink-0">${n}</div>
        <div>
          <p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Para ${n}</p>
          <h3 class="font-arabic-body text-arabic-body text-on-surface mt-1 group-hover:text-primary transition-colors">${name}</h3>
        </div>
      </div>
      <div class="flex items-center gap-sm text-primary flex-shrink-0">
        <span class="font-label-sm text-label-sm font-semibold hidden sm:inline">READ</span>
        <span class="material-symbols-outlined">chevron_right</span>
      </div>`;
    container.appendChild(card);
  });

  // ── Build Hadith List ─────────────────────
  const hadithList = [
    "Actions are but by intentions and every man shall have only that which he intended.",
    "Islam has been built on five pillars: testifying that there is no deity worthy of worship except Allah and that Muhammad is the Messenger of Allah, establishing the prayer, paying the Zakat, making the pilgrimage to the House, and fasting in Ramadan.",
    "Part of the perfection of one's Islam is his leaving that which does not concern him.",
    "None of you truly believes until he loves for his brother that which he loves for himself.",
    "A person who calls others to right guidance will have a reward as that of those who follow him.",
    "Be in this world as though you were a stranger or a traveler.",
    "Do not become angry.",
    "Allah has prescribed proficiency in all things. So if you kill, kill well; and if you slaughter, slaughter well.",
    "Fear Allah wherever you are, and follow up a bad deed with a good deed and it will wipe it out, and behave well towards people.",
    "Know that if the nation were to gather together to benefit you with anything, they would not benefit you except with something that Allah had already prescribed for you.",
    "If you feel no shame, then do as you wish.",
    "Say: I believe in Allah, and then stand firm.",
    "The doors of goodness are many: glorifying Allah, praising Allah, fasting, giving charity, enjoining what is good and forbidding what is evil.",
    "Righteousness is good character, and sin is that which wavers in your heart and which you do not want people to know about.",
    "Allah the Almighty is Good and accepts only that which is good.",
    "Let him who believes in Allah and the Last Day either speak good or keep silent; and let him who believes in Allah and the Last Day be generous to his neighbour.",
    "Do not envy one another, and do not inflate prices for one another, and do not hate one another, and do not turn away from one another.",
    "Whoever relieves a believer's distress of the distressful aspects of this world, Allah will rescue him from a difficulty of the difficulties of the Hereafter.",
    "Whoever shows the way to something good shall have a reward similar to that of its doer.",
    "Allah is helpful to a servant as long as the servant is helpful to his brother.",
    "If you guarantee me six things on your part I shall guarantee you Paradise: speak the truth when you talk, keep a promise when you make it, when you are trusted with something fulfil your trust, avoid sexual immorality, lower your gaze, and restrain your hands from injustice.",
    "Allah has prescribed proficiency in all things. Verily Allah has prescribed proficiency in killing. If you kill then do it well.",
    "Purity is half of faith. Al-Hamdu Lillah fills the scale. SubhanAllah and Al-Hamdu Lillah fill what is between heaven and earth.",
    "On the authority of Abu Hurayrah: The Messenger of Allah said, Allah said: I am as My servant thinks I am.",
    "Whoever believes in Allah and the Last Day should speak a good word or remain silent.",
    "Make things easy and do not make them difficult, cheer the people up by conveying glad tidings to them and do not repulse them.",
    "The best of you are those who learn the Quran and teach it.",
    "Seeking knowledge is an obligation upon every Muslim.",
    "The strong man is not the one who can overpower others, but the strong man is the one who controls himself while in anger.",
    "No one of you truly believes until he desires for his brother that which he desires for himself.",
    "Whoever of you sees an evil, let him change it with his hand; and if he is not able to do so, then with his tongue; and if he is not able to do so, then with his heart.",
    "The world is a prison for the believer and a paradise for the disbeliever.",
    "Speak the truth even if it is bitter.",
    "The best of deeds is the prayer performed on time, then kindness to parents, then Jihad in the way of Allah.",
    "Take advantage of five before five: your youth before your old age, your health before your illness, your wealth before your poverty, your free time before your preoccupation, and your life before your death.",
    "Smiling at your brother is an act of charity.",
    "A good word is a charity.",
    "Whoever removes a worldly grief from a believer, Allah will remove from him one of the griefs of the Day of Resurrection.",
    "The merciful will be shown mercy by the Most Merciful. Be merciful to those on the earth and the One in the heavens will have mercy upon you.",
    "Feed the hungry, visit the sick, and free the captives."
  ];

  const hadithContainer = document.getElementById('hadith-container');
  hadithList.forEach((text, i) => {
    const card = document.createElement('div');
    card.className = "hadith-card bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-lg shadow-[0_4px_12px_rgba(14,165,233,0.06)] hover:shadow-[0_4px_12px_rgba(14,165,233,0.12)] cursor-pointer group transition-all duration-300";
    card.innerHTML = `
      <div class="flex items-center mb-sm">
        <span class="font-label-sm text-label-sm text-primary uppercase tracking-wider">Hadith ${i+1}</span>
      </div>
      <p class="font-body-lg text-body-lg text-on-surface leading-relaxed mb-md">"${text}"</p>
      <div class="flex justify-end">
        <span class="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
      </div>`;
    hadithContainer.appendChild(card);
  });

  // ── Daily Duas submenu toggle ─────────────
  function toggleDuasSubmenu() {
    const menu = document.getElementById('duas-submenu');
    const icon = document.getElementById('duas-expand-icon');
    menu.classList.toggle('hidden');
    icon.style.transform = menu.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(90deg)';
  }

  // ── Build Para List (15 Line) ─────────────
  const container15 = document.getElementById('para-list-15-container');
  paraNames.forEach((name, i) => {
    const n = i + 1;
    const card = document.createElement('div');
    card.className = "flex items-center justify-between p-4 bg-surface-container-lowest border border-surface-variant/30 rounded-xl shadow-sm hover:shadow-[0_4px_12px_rgba(14,165,233,0.12)] transition-all cursor-pointer group active:scale-[0.98]";
    card.innerHTML = `
      <div class="flex items-center gap-md">
        <div class="w-10 h-10 flex items-center justify-center bg-surface-container text-primary rounded-lg font-bold text-sm flex-shrink-0">${n}</div>
        <div>
          <p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Para ${n}</p>
          <h3 class="font-arabic-body text-arabic-body text-on-surface mt-1 group-hover:text-primary transition-colors">${name}</h3>
        </div>
      </div>
      <div class="flex items-center gap-sm text-primary flex-shrink-0">
        <span class="font-label-sm text-label-sm font-semibold hidden sm:inline">READ</span>
        <span class="material-symbols-outlined">chevron_right</span>
      </div>`;
    container15.appendChild(card);
  });

  // ── Build Allah's 99 Names ────────────────
  const allahNames = [
    { ar: "الرَّحْمٰن",   en: "Ar-Rahman",    ur: "نہایت رحم والا",     meaning: "The Most Gracious" },
    { ar: "الرَّحِيم",    en: "Ar-Rahim",     ur: "بہت مہربان",          meaning: "The Most Merciful" },
    { ar: "الْمَلِك",     en: "Al-Malik",     ur: "بادشاہ",              meaning: "The King" },
    { ar: "الْقُدُّوس",   en: "Al-Quddus",    ur: "نہایت پاک",           meaning: "The Most Pure" },
    { ar: "السَّلَام",    en: "As-Salam",     ur: "سلامتی والا",         meaning: "The Source of Peace" },
    { ar: "الْمُؤْمِن",   en: "Al-Mu'min",    ur: "امن دینے والا",       meaning: "The Giver of Faith" },
    { ar: "الْمُهَيْمِن", en: "Al-Muhaymin",  ur: "نگہبان",              meaning: "The Guardian" },
    { ar: "الْعَزِيز",    en: "Al-Aziz",      ur: "غالب",                meaning: "The All-Mighty" },
    { ar: "الْجَبَّار",   en: "Al-Jabbar",    ur: "زبردست",              meaning: "The Compeller" },
    { ar: "الْمُتَكَبِّر",en: "Al-Mutakabbir",ur: "بزرگ",                meaning: "The Supreme" },
    { ar: "الْخَالِق",    en: "Al-Khaliq",    ur: "پیدا کرنے والا",      meaning: "The Creator" },
    { ar: "الْبَارِئ",    en: "Al-Bari",      ur: "بنانے والا",          meaning: "The Originator" },
    { ar: "الْمُصَوِّر",  en: "Al-Musawwir",  ur: "صورت دینے والا",      meaning: "The Fashioner" },
    { ar: "الْغَفَّار",   en: "Al-Ghaffar",   ur: "بخشنے والا",          meaning: "The Forgiving" },
    { ar: "الْقَهَّار",   en: "Al-Qahhar",    ur: "سب پر غالب",          meaning: "The Subduer" },
    { ar: "الْوَهَّاب",   en: "Al-Wahhab",    ur: "بہت عطا کرنے والا",   meaning: "The Giver of All" },
    { ar: "الرَّزَّاق",   en: "Ar-Razzaq",    ur: "رزق دینے والا",       meaning: "The Provider" },
    { ar: "الْفَتَّاح",   en: "Al-Fattah",    ur: "کھولنے والا",         meaning: "The Opener" },
    { ar: "الْعَلِيم",    en: "Al-Alim",      ur: "سب جاننے والا",       meaning: "The All-Knowing" },
    { ar: "الْقَابِض",    en: "Al-Qabid",     ur: "روکنے والا",          meaning: "The Withholder" },
    { ar: "الْبَاسِط",    en: "Al-Basit",     ur: "کشادہ کرنے والا",     meaning: "The Extender" },
    { ar: "الْخَافِض",    en: "Al-Khafid",    ur: "پست کرنے والا",       meaning: "The Abaser" },
    { ar: "الرَّافِع",    en: "Ar-Rafi",      ur: "بلند کرنے والا",      meaning: "The Exalter" },
    { ar: "الْمُعِز",     en: "Al-Muizz",     ur: "عزت دینے والا",       meaning: "The Honourer" },
    { ar: "الْمُذِل",     en: "Al-Muzil",     ur: "ذلت دینے والا",       meaning: "The Dishonourer" },
    { ar: "السَّمِيع",    en: "As-Sami",      ur: "سننے والا",           meaning: "The All-Hearing" },
    { ar: "الْبَصِير",    en: "Al-Basir",     ur: "دیکھنے والا",         meaning: "The All-Seeing" },
    { ar: "الْحَكَم",     en: "Al-Hakam",     ur: "فیصلہ کرنے والا",    meaning: "The Judge" },
    { ar: "الْعَدْل",     en: "Al-Adl",       ur: "انصاف والا",          meaning: "The Just" },
    { ar: "اللَّطِيف",    en: "Al-Latif",     ur: "مہربان",              meaning: "The Subtle One" },
    { ar: "الْخَبِير",    en: "Al-Khabir",    ur: "باخبر",               meaning: "The All-Aware" },
    { ar: "الْحَلِيم",    en: "Al-Halim",     ur: "بردبار",              meaning: "The Forbearing" },
    { ar: "الْعَظِيم",    en: "Al-Azim",      ur: "بزرگ",                meaning: "The Magnificent" },
    { ar: "الْغَفُور",    en: "Al-Ghafur",    ur: "بخشنے والا",          meaning: "The Forgiving" },
    { ar: "الشَّكُور",    en: "Ash-Shakur",   ur: "قدردان",              meaning: "The Appreciative" },
    { ar: "الْعَلِي",     en: "Al-Ali",       ur: "بلند",                meaning: "The Most High" },
    { ar: "الْكَبِير",    en: "Al-Kabir",     ur: "بڑا",                 meaning: "The Greatest" },
    { ar: "الْحَفِيظ",    en: "Al-Hafiz",     ur: "محافظ",               meaning: "The Preserver" },
    { ar: "الْمُقِيت",    en: "Al-Muqit",     ur: "خوراک دینے والا",     meaning: "The Nourisher" },
    { ar: "الْحَسِيب",    en: "Al-Hasib",     ur: "حساب کرنے والا",      meaning: "The Reckoner" },
    { ar: "الْجَلِيل",    en: "Al-Jalil",     ur: "جلیل",                meaning: "The Majestic" },
    { ar: "الْكَرِيم",    en: "Al-Karim",     ur: "کریم",                meaning: "The Generous" },
    { ar: "الرَّقِيب",    en: "Ar-Raqib",     ur: "نگران",               meaning: "The Watchful" },
    { ar: "الْمُجِيب",    en: "Al-Mujib",     ur: "قبول کرنے والا",      meaning: "The Responsive" },
    { ar: "الْوَاسِع",    en: "Al-Wasi",      ur: "وسیع",                meaning: "The All-Encompassing" },
    { ar: "الْحَكِيم",    en: "Al-Hakim",     ur: "حکمت والا",           meaning: "The Wise" },
    { ar: "الْوَدُود",    en: "Al-Wadud",     ur: "محبت کرنے والا",      meaning: "The Loving" },
    { ar: "الْمَجِيد",    en: "Al-Majid",     ur: "بزرگ",                meaning: "The Glorious" },
    { ar: "الْبَاعِث",    en: "Al-Baith",     ur: "اٹھانے والا",         meaning: "The Resurrector" },
    { ar: "الشَّهِيد",    en: "Ash-Shahid",   ur: "گواہ",                meaning: "The Witness" },
    { ar: "الْحَق",       en: "Al-Haqq",      ur: "سچا",                 meaning: "The Truth" },
    { ar: "الْوَكِيل",    en: "Al-Wakil",     ur: "کارساز",              meaning: "The Trustee" },
    { ar: "الْقَوِي",     en: "Al-Qawi",      ur: "طاقتور",              meaning: "The Strong" },
    { ar: "الْمَتِين",    en: "Al-Matin",     ur: "مضبوط",               meaning: "The Firm" },
    { ar: "الْوَلِي",     en: "Al-Wali",      ur: "دوست",                meaning: "The Protecting Friend" },
    { ar: "الْحَمِيد",    en: "Al-Hamid",     ur: "تعریف کے لائق",       meaning: "The Praiseworthy" },
    { ar: "الْمُحْصِي",   en: "Al-Muhsi",     ur: "شمار کرنے والا",      meaning: "The Counter" },
    { ar: "الْمُبْدِئ",   en: "Al-Mubdi",     ur: "شروع کرنے والا",      meaning: "The Originator" },
    { ar: "الْمُعِيد",    en: "Al-Muid",      ur: "لوٹانے والا",         meaning: "The Restorer" },
    { ar: "الْمُحْيِي",   en: "Al-Muhyi",     ur: "زندگی دینے والا",     meaning: "The Giver of Life" },
    { ar: "الْمُمِيت",    en: "Al-Mumit",     ur: "موت دینے والا",       meaning: "The Taker of Life" },
    { ar: "الْحَي",       en: "Al-Hayy",      ur: "زندہ",                meaning: "The Ever-Living" },
    { ar: "الْقَيُّوم",   en: "Al-Qayyum",    ur: "قائم رہنے والا",      meaning: "The Self-Subsisting" },
    { ar: "الْوَاجِد",    en: "Al-Wajid",     ur: "پانے والا",           meaning: "The Finder" },
    { ar: "الْمَاجِد",    en: "Al-Majid",     ur: "بزرگ",                meaning: "The Noble" },
    { ar: "الْوَاحِد",    en: "Al-Wahid",     ur: "اکیلا",               meaning: "The One" },
    { ar: "الْأَحَد",     en: "Al-Ahad",      ur: "یکتا",                meaning: "The Unique" },
    { ar: "الصَّمَد",     en: "As-Samad",     ur: "بے نیاز",             meaning: "The Eternal" },
    { ar: "الْقَادِر",    en: "Al-Qadir",     ur: "قادر",                meaning: "The Able" },
    { ar: "الْمُقْتَدِر", en: "Al-Muqtadir",  ur: "قدرت والا",           meaning: "The Powerful" },
    { ar: "الْمُقَدِّم",  en: "Al-Muqaddim",  ur: "آگے کرنے والا",       meaning: "The Expediter" },
    { ar: "الْمُؤَخِّر",  en: "Al-Muakhkhir", ur: "پیچھے کرنے والا",     meaning: "The Delayer" },
    { ar: "الْأَوَّل",    en: "Al-Awwal",     ur: "پہلا",                meaning: "The First" },
    { ar: "الْآخِر",      en: "Al-Akhir",     ur: "آخری",                meaning: "The Last" },
    { ar: "الظَّاهِر",    en: "Az-Zahir",     ur: "ظاہر",                meaning: "The Manifest" },
    { ar: "الْبَاطِن",    en: "Al-Batin",     ur: "پوشیدہ",              meaning: "The Hidden" },
    { ar: "الْوَالِي",    en: "Al-Wali",      ur: "والی",                meaning: "The Governor" },
    { ar: "الْمُتَعَالِ", en: "Al-Mutaali",   ur: "بلند",                meaning: "The Self Exalted" },
    { ar: "الْبَر",       en: "Al-Barr",      ur: "نیکی کرنے والا",      meaning: "The Good" },
    { ar: "التَّوَّاب",   en: "At-Tawwab",    ur: "توبہ قبول کرنے والا", meaning: "The Acceptor of Repentance" },
    { ar: "الْمُنْتَقِم", en: "Al-Muntaqim",  ur: "انتقام لینے والا",    meaning: "The Avenger" },
    { ar: "الْعَفُو",     en: "Al-Afuw",      ur: "معاف کرنے والا",      meaning: "The Pardoner" },
    { ar: "الرَّؤُوف",    en: "Ar-Rauf",      ur: "شفیق",                meaning: "The Compassionate" },
    { ar: "مَالِكُ الْمُلْك",en:"Malikul Mulk",ur: "بادشاہوں کا بادشاہ", meaning: "Owner of Sovereignty" },
    { ar: "ذُو الْجَلَال", en: "Zul-Jalal",   ur: "جلال و اکرام والا",   meaning: "Lord of Majesty" },
    { ar: "الْمُقْسِط",   en: "Al-Muqsit",    ur: "انصاف والا",          meaning: "The Equitable" },
    { ar: "الْجَامِع",    en: "Al-Jami",      ur: "جمع کرنے والا",       meaning: "The Gatherer" },
    { ar: "الْغَنِي",     en: "Al-Ghani",     ur: "بے نیاز",             meaning: "The Self-Sufficient" },
    { ar: "الْمُغْنِي",   en: "Al-Mughni",    ur: "غنی کرنے والا",       meaning: "The Enricher" },
    { ar: "الْمَانِع",    en: "Al-Mani",      ur: "روکنے والا",          meaning: "The Preventer" },
    { ar: "الضَّار",      en: "Ad-Darr",      ur: "نقصان پہنچانے والا",  meaning: "The Distresser" },
    { ar: "النَّافِع",    en: "An-Nafi",      ur: "فائدہ دینے والا",     meaning: "The Propitious" },
    { ar: "النُّور",      en: "An-Nur",       ur: "نور",                 meaning: "The Light" },
    { ar: "الْهَادِي",    en: "Al-Hadi",      ur: "ہدایت دینے والا",     meaning: "The Guide" },
    { ar: "الْبَدِيع",    en: "Al-Badi",      ur: "بے مثال بنانے والا",  meaning: "The Incomparable" },
    { ar: "الْبَاقِي",    en: "Al-Baqi",      ur: "ہمیشہ رہنے والا",     meaning: "The Everlasting" },
    { ar: "الْوَارِث",    en: "Al-Warith",    ur: "وارث",                meaning: "The Inheritor" },
    { ar: "الرَّشِيد",    en: "Ar-Rashid",    ur: "راہ دکھانے والا",     meaning: "The Righteous Teacher" },
    { ar: "الصَّبُور",    en: "As-Sabur",     ur: "صبر کرنے والا",       meaning: "The Patient" }
  ];

  const namesContainer = document.getElementById('allah-names-container');
  allahNames.forEach((name, i) => {
    const card = document.createElement('div');
    card.className = "name-card relative bg-surface-container-lowest p-xs rounded-lg border border-outline-variant shadow-sm flex flex-col items-center justify-center aspect-square text-center";
    card.innerHTML = `
      <span class="absolute top-1 left-1 text-[8px] font-bold text-primary opacity-60">${i+1}</span>
      <span class="font-arabic-display text-[16px] leading-tight text-on-surface mb-1" dir="rtl">${name.ar}</span>
      <h3 class="text-[10px] font-bold text-primary leading-none mb-1">${name.en}</h3>
      <p class="text-[8px] text-on-surface-variant leading-none w-full px-0.5 overflow-hidden" style="display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical">${name.meaning}</p>
      <p class="font-urdu-body text-[8px] leading-none text-secondary mt-1" dir="rtl">${name.ur}</p>
    `;
    namesContainer.appendChild(card);
  });

  // ── Build Prophet's 99 Names ──────────────
  const prophetNames = [
    { ar: "محمد",              en: "Muhammad",           meaning: "The Praised One",            ur: "تعریف کیا گیا" },
    { ar: "أحمد",              en: "Ahmad",              meaning: "Most Praised",                ur: "بہت زیادہ تعریف" },
    { ar: "حامد",              en: "Hamid",              meaning: "The Praiser",                 ur: "تعریف کرنے والا" },
    { ar: "محمود",             en: "Mahmood",            meaning: "Praised One",                 ur: "قابلِ تعریف" },
    { ar: "قاسم",              en: "Qasim",              meaning: "The Distributor",             ur: "بانٹنے والا" },
    { ar: "عاقب",              en: "Aqib",               meaning: "The Successor",               ur: "پیچھے آنے والا" },
    { ar: "فاتح",              en: "Fatih",              meaning: "The Conqueror",               ur: "کھولنے والا" },
    { ar: "شاہد",              en: "Shahid",             meaning: "The Witness",                 ur: "گواہ" },
    { ar: "مشہود",             en: "Mashhud",            meaning: "The Witnessed",               ur: "جس کی گواہی دی جائے" },
    { ar: "بشیر",              en: "Bashir",             meaning: "Bringer of Glad Tidings",     ur: "خوشخبری دینے والا" },
    { ar: "نذیر",              en: "Nadhir",             meaning: "The Warner",                  ur: "ڈرانے والا" },
    { ar: "داعی",              en: "Da'i",               meaning: "The Caller",                  ur: "بلانے والا" },
    { ar: "ہادی",              en: "Hadi",               meaning: "The Guide",                   ur: "ہدایت دینے والا" },
    { ar: "مہدی",              en: "Mahdi",              meaning: "The Guided One",              ur: "ہدایت یافتہ" },
    { ar: "ماحی",              en: "Mahi",               meaning: "The Eraser",                  ur: "مٹانے والا" },
    { ar: "منجی",              en: "Munji",              meaning: "The Savior",                  ur: "نجات دینے والا" },
    { ar: "حبیب",              en: "Habib",              meaning: "The Beloved",                 ur: "دوست" },
    { ar: "خلیل",              en: "Khalil",             meaning: "The Close Friend",            ur: "سچا دوست" },
    { ar: "صفی",               en: "Safi",               meaning: "The Chosen",                  ur: "منتخب" },
    { ar: "نجی",               en: "Naji",               meaning: "The Confidant",               ur: "سرگوشی کرنے والا" },
    { ar: "رسول",              en: "Rasul",              meaning: "The Messenger",               ur: "پیغام پہنچانے والا" },
    { ar: "نبی",               en: "Nabi",               meaning: "The Prophet",                 ur: "غیب کی خبریں دینے والا" },
    { ar: "امی",               en: "Ummi",               meaning: "The Unlettered",              ur: "امی" },
    { ar: "تہامی",             en: "Tahami",             meaning: "From Tihamah",                ur: "تہامہ والا" },
    { ar: "ہاشمی",             en: "Hashimi",            meaning: "The Hashemite",               ur: "ہاشم کی اولاد" },
    { ar: "قریشی",             en: "Quraishi",           meaning: "From Quraish",                ur: "قریش والا" },
    { ar: "عربی",              en: "Arabi",              meaning: "The Arabian",                 ur: "عرب والا" },
    { ar: "مدنی",              en: "Madani",             meaning: "From Medina",                 ur: "مدینہ والا" },
    { ar: "مکی",               en: "Makki",              meaning: "From Mecca",                  ur: "مکہ والا" },
    { ar: "مصطفیٰ",            en: "Mustafa",            meaning: "The Chosen One",              ur: "برگزیدہ" },
    { ar: "مجتبیٰ",            en: "Mujtaba",            meaning: "The Selected One",            ur: "پسندیدہ" },
    { ar: "مرتضیٰ",            en: "Murtaza",            meaning: "The Accepted One",            ur: "جس سے راضی ہوا جائے" },
    { ar: "سید",               en: "Sayyid",             meaning: "The Master",                  ur: "سردار" },
    { ar: "سراج",              en: "Siraj",              meaning: "The Lamp",                    ur: "چراغ" },
    { ar: "منیر",              en: "Munir",              meaning: "The Radiant",                 ur: "روشن" },
    { ar: "بشریٰ",             en: "Bushra",             meaning: "Glad Tidings",                ur: "خوشخبری" },
    { ar: "کریم",              en: "Karim",              meaning: "Noble/Generous",              ur: "کرم والا" },
    { ar: "رؤوف",              en: "Ra'uf",              meaning: "The Compassionate",           ur: "شفقت والا" },
    { ar: "رحیم",              en: "Rahim",              meaning: "The Merciful",                ur: "رحم کرنے والا" },
    { ar: "طٰہٰ",              en: "Taha",               meaning: "Taha",                        ur: "طہ" },
    { ar: "یٰسین",             en: "Yasin",              meaning: "Yasin",                       ur: "یسین" },
    { ar: "مزمل",              en: "Muzzammil",          meaning: "The Enwrapped",               ur: "چادر اوڑھنے والا" },
    { ar: "مدثر",              en: "Mudathir",           meaning: "The Shrouded",                ur: "کمبلی والا" },
    { ar: "عبد اللہ",          en: "Abdullah",           meaning: "Servant of Allah",            ur: "اللہ کا بندہ" },
    { ar: "حبیب اللہ",         en: "Habibullah",         meaning: "Beloved of Allah",            ur: "اللہ کا محبوب" },
    { ar: "خلیل اللہ",         en: "Khalilullah",        meaning: "Friend of Allah",             ur: "اللہ کا دوست" },
    { ar: "کلیم اللہ",         en: "Kalimullah",         meaning: "Spoken to by Allah",          ur: "اللہ سے کلام کرنے والا" },
    { ar: "نجی اللہ",          en: "Naji-ullah",         meaning: "Allah's Intimate",            ur: "اللہ کا رازدار" },
    { ar: "صفی اللہ",          en: "Safi-ullah",         meaning: "Allah's Choice",              ur: "اللہ کا منتخب" },
    { ar: "رسول الرحمۃ",       en: "Rasul ar-Rahmah",    meaning: "Messenger of Mercy",          ur: "رحمت کا رسول" },
    { ar: "خاتم النبیین",      en: "Khatam an-Nabiyyin", meaning: "Seal of Prophets",            ur: "نبیوں کی مہر" },
    { ar: "طیب",               en: "Tayyib",             meaning: "The Pure",                    ur: "پاکیزہ" },
    { ar: "طاہر",              en: "Tahir",              meaning: "The Pure One",                ur: "پاک" },
    { ar: "صادق",              en: "Sadiq",              meaning: "The Truthful",                ur: "سچا" },
    { ar: "امین",              en: "Amin",               meaning: "The Trustworthy",             ur: "امانت دار" },
    { ar: "برہان",             en: "Burhan",             meaning: "The Proof",                   ur: "دلیل" },
    { ar: "نور",               en: "Nur",                meaning: "The Light",                   ur: "روشنی" },
    { ar: "نعمت",              en: "Ni'mat",             meaning: "The Blessing",                ur: "بخشش" },
    { ar: "ہدیٰ",              en: "Huda",               meaning: "The Guidance",                ur: "ہدایت" },
    { ar: "عادل",              en: "Adil",               meaning: "The Just",                    ur: "انصاف والا" },
    { ar: "عالم",              en: "Alim",               meaning: "The Scholar",                 ur: "جاننے والا" },
    { ar: "معلم",              en: "Mu'allim",           meaning: "The Teacher",                 ur: "سکھانے والا" },
    { ar: "حکیم",              en: "Hakim",              meaning: "The Wise",                    ur: "حکمت والا" },
    { ar: "وکیل",              en: "Wakil",              meaning: "The Advocate",                ur: "کارساز" },
    { ar: "کفیل",              en: "Kafil",              meaning: "The Guarantor",               ur: "ذمہ لینے والا" },
    { ar: "شافع",              en: "Shafi'",             meaning: "The Intercessor",             ur: "سفارش کرنے والا" },
    { ar: "شفیق",              en: "Shafiq",             meaning: "The Sympathetic",             ur: "مہربان" },
    { ar: "زاہد",              en: "Zahid",              meaning: "The Ascetic",                 ur: "پرہیزگار" },
    { ar: "عابد",              en: "Abid",               meaning: "The Worshiper",               ur: "عبادت کرنے والا" },
    { ar: "صادق",              en: "Musaddiq",           meaning: "Confirming Truth",            ur: "تصدیق کرنے والا" },
    { ar: "شاکر",              en: "Shakir",             meaning: "The Grateful",                ur: "شکر کرنے والا" },
    { ar: "قوی",               en: "Qawi",               meaning: "The Strong",                  ur: "طاقتور" },
    { ar: "عزیز",              en: "Aziz",               meaning: "The Mighty",                  ur: "غالب" },
    { ar: "صابر",              en: "Sabir",              meaning: "The Patient",                 ur: "صبر کرنے والا" },
    { ar: "فضل",               en: "Fadl",               meaning: "The Excellence",              ur: "بزرگی" },
    { ar: "برکت",              en: "Barakah",            meaning: "The Blessing",                ur: "برکت" },
    { ar: "غیاث",              en: "Ghiyath",            meaning: "The Succor",                  ur: "فریاد رس" },
    { ar: "رحمت",              en: "Rahmah",             meaning: "The Mercy",                   ur: "رحمت" },
    { ar: "شفاء",              en: "Shifa'",             meaning: "The Healing",                 ur: "شفا" },
    { ar: "امان",              en: "Aman",               meaning: "The Safety",                  ur: "امن" },
    { ar: "عصمت",              en: "Ismat",              meaning: "The Preservation",            ur: "بچاؤ" },
    { ar: "بشارت",             en: "Basharat",           meaning: "Good News",                   ur: "خوشخبری" },
    { ar: "حافظ",              en: "Hafiz",              meaning: "The Preserver",               ur: "یاد رکھنے والا" },
    { ar: "قانت",              en: "Qanit",              meaning: "The Obedient",                ur: "فرمانبردار" },
    { ar: "میزان",             en: "Mizan",              meaning: "The Balance",                 ur: "ترازو" },
    { ar: "رسول اللہ",         en: "Rasulullah",         meaning: "Messenger of Allah",          ur: "اللہ کا رسول" },
    { ar: "نبی الرحمۃ",        en: "Nabi ar-Rahmah",     meaning: "Prophet of Mercy",            ur: "رحمت کا نبی" },
    { ar: "رحمت للعالمین",     en: "Rahmatullil-Alamin", meaning: "Mercy to All Worlds",         ur: "تمام جہانوں کیلئے رحمت" },
    { ar: "سید المرسلین",      en: "Sayyidul-Mursalin",  meaning: "Master of Messengers",        ur: "رسولوں کا سردار" },
    { ar: "امام الانبیاء",     en: "Imamul-Anbiya",      meaning: "Leader of Prophets",          ur: "نبیوں کا امام" },
    { ar: "صاحب المقام",       en: "Sahibul-Maqam",      meaning: "Owner of Praised Station",    ur: "مقام محمود والے" },
    { ar: "خاتم الرسل",        en: "Khatam ur-Rusul",    meaning: "Seal of Messengers",          ur: "رسولوں کی مہر" },
    { ar: "نور الہدیٰ",        en: "Nur al-Huda",        meaning: "Light of Guidance",           ur: "ہدایت کا نور" },
    { ar: "سراج منیر",         en: "Siraj Munir",        meaning: "Glowing Lamp",                ur: "روشن چراغ" },
    { ar: "مبشر",              en: "Mubashshir",         meaning: "The Announcer",               ur: "خوشخبری سنانے والا" },
    { ar: "منذر",              en: "Mundhir",            meaning: "The Admonisher",              ur: "ڈرانے والا" },
    { ar: "ذکر للعالمین",      en: "Dhikr lil-Alamin",   meaning: "Reminder for All Worlds",     ur: "جہانوں کیلئے یاددہانی" }
  ];

  const prophetNamesContainer = document.getElementById('prophet-names-container');
  prophetNames.forEach((name, i) => {
    const card = document.createElement('div');
    card.className = "name-card relative bg-surface-container-lowest p-xs rounded-lg border border-outline-variant shadow-sm flex flex-col items-center justify-center aspect-square text-center overflow-hidden";
    card.innerHTML = `
      <span class="absolute top-1 left-1 text-[8px] font-bold text-primary opacity-60">${i+1}</span>
      <span class="font-arabic-display text-[14px] leading-tight text-on-surface mb-1" dir="rtl">${name.ar}</span>
      <h3 class="text-[9px] font-bold text-primary leading-none mb-0.5 truncate w-full px-1">${name.en}</h3>
      <p class="text-[7px] text-on-surface-variant leading-none w-full px-0.5 overflow-hidden" style="display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical">${name.meaning}</p>
      <p class="font-urdu-body text-[7px] leading-none text-secondary mt-1 truncate w-full px-1" dir="rtl">${name.ur}</p>
    `;
    prophetNamesContainer.appendChild(card);
  });

  // ── Service Worker ────────────────────────
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
