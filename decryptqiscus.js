(function () {
  'use strict';

  const KEYWORD = 'tunas toyota batu tulis';
  const AGENT_TEXT = 'amru batu tulis';
  let running = false;
  let counters = {
    checked: 0,
    assigned: 0,
    startTime: null,
  };

  /** ⬛ Tambahkan modal status bergaya material design */
  function createStatusModal() {
    const modal = document.createElement('div');
    modal.id = 'process-status-modal';
    modal.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #ffffff;
      border-radius: 12px;
      padding: 16px 24px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      font-family: "Roboto", sans-serif;
      font-size: 14px;
      z-index: 99999;
      min-width: 280px;
      max-width: 90%;
    `;
    modal.innerHTML = `
      <strong style="font-size: 16px; color: #333;">Status proses</strong>
      <div id="process-status-text" style="margin: 8px 0; color: #444;">Memulai...</div>
      <div id="process-stats" style="font-size: 13px; color: #555;"></div>
      <button id="stop-script-btn" style="
        margin-top: 10px;
        padding: 6px 12px;
        background-color: #e53935;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
      ">Stop</button>
    `;
    document.body.appendChild(modal);

    // Tombol stop
    document.getElementById('stop-script-btn').onclick = () => {
      updateStatus('⛔ Dihentikan pengguna');
      running = false;
    };
  }

  /** 📝 Update isi status */
  function updateStatus(text) {
    const el = document.getElementById('process-status-text');
    if (el) el.textContent = text;
    updateStats();
  }

  /** 📊 Update statistik */
  function updateStats() {
    const stats = document.getElementById('process-stats');
    const dur = ((Date.now() - counters.startTime) / 1000).toFixed(1);
    if (stats) {
      stats.innerHTML = `
        🔄 Dicek: <b>${counters.checked}</b> | 
        ✅ Di-assign: <b>${counters.assigned}</b> | 
        ⏱️ Durasi: <b>${dur}s</b>
      `;
    }
  }

  /** 🚀 Trigger awal dengan tombol "/" */
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !running) {
      running = true;
      counters.checked = 0;
      counters.assigned = 0;
      counters.startTime = Date.now();
      createStatusModal();
      updateStatus('Memulai proses...');
      processCurrentRoom();
    }
  });

  /** ▶️ Proses satu chat */
  function processCurrentRoom() {
    if (!running) return;

    const active = document.querySelector('.room-item.active');
    if (!active) {
      updateStatus('❌ Tidak ada chat aktif');
      running = false;
      return;
    }

    counters.checked++;
    updateStatus('🔎 Mencari teks “TUNAS TOYOTA BATU TULIS”...');
    setTimeout(() => {
      const messages = [
        ...document.querySelectorAll('.qcw-comment__content')
      ].map((el) => el.innerText.toLowerCase());

      if (messages.some((txt) => txt.includes(KEYWORD))) {
        updateStatus('✅ Teks ditemukan, mulai assign ke Amru...');
        counters.assigned++;
        assignAmru(() => {
          updateStatus('✔️ Assign selesai, lanjut ke chat berikutnya...');
          gotoNextRoom(processCurrentRoom);
        });
      } else {
        updateStatus('❌ Teks tidak ditemukan, lanjut ke chat berikutnya...');
        gotoNextRoom(processCurrentRoom);
      }
    }, 1000);
  }

  /** ⏩ Lanjut ke chat berikutnya */
  function gotoNextRoom(cb) {
    const current = document.querySelector('.room-item.active');
    const next = current?.nextElementSibling;
    if (next) {
      next.click();
      setTimeout(() => {
        updateStatus('🔄 Memproses chat berikutnya...');
        cb();
      }, 800);
    } else {
      updateStatus('🏁 Semua chat selesai diproses.');
      running = false;
    }
  }

  /** 👤 Alur assign ke Amru */
  function assignAmru(cb) {
    if (typeof openMenuAssign !== 'function') {
      updateStatus('⚠️ Fungsi openMenuAssign tidak ditemukan!');
      running = false;
      return;
    }

    openMenuAssign();

    setTimeout(() => {
      updateStatus('🔧 Klik Add Agent...');
      const addAgent = [...document.querySelectorAll('#menu-assign li a')]
        .find((a) => a.textContent.trim() === 'Add Agent');
      if (!addAgent) return stop('❌ Tombol Add Agent tidak ditemukan');
      addAgent.click();

      setTimeout(() => {
        updateStatus('👥 Mencari agent Amru...');
        const agentLi = [...document.querySelectorAll('.agent-container ul li')]
          .find((li) => {
            const p = li.querySelector('p[title]');
            return p && p.title.toLowerCase().includes(AGENT_TEXT);
          });
        if (!agentLi) return stop('❌ Agent Amru tidak ditemukan');
        agentLi.click();

        setTimeout(() => {
          updateStatus('✅ Klik tombol Add...');
          const addBtn = [...document.querySelectorAll('.agent-list__footer button')]
            .find((b) => b.textContent.trim() === 'Add' && !b.disabled);
          if (!addBtn) return stop('❌ Tombol Add tidak aktif');
          addBtn.click();

          setTimeout(() => {
            updateStatus('📩 Klik OK setelah assign...');
            const ok = document.querySelector('.swal2-confirm.swal2-styled');
            if (ok) ok.click();
            setTimeout(cb, 2000);
          }, 1000);
        }, 500);
      }, 600);
    }, 600);

    function stop(msg) {
      updateStatus(msg);
      running = false;
    }
  }
})();
