    const style = document.createElement('style');
    style.textContent = `
      .qauto-modal {
        position: fixed;
        top: 100px;
        left: 100px;
        width: 300px;
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        z-index: 9999;
        font-family: sans-serif;
      }
      .qauto-header {
        background: #e9f3fe;
        padding: 8px;
        cursor: move;
        border-radius: 10px 10px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .qauto-header span {
        cursor: pointer;
        margin-left: 8px;
      }
      .qauto-body {
        padding: 10px;
      }
      .qauto-actions button {
        margin: 5px 5px 0 0;
        padding: 5px 10px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        background-color: #03a9f4;
        color: #fff;
      }
      .qauto-status {
        margin-top: 10px;
        font-size: 12px;
        color: #555;
      }
      .qauto-settings {
        display: none;
        margin-top: 10px;
      }
      .qauto-log {
        position: fixed;
        top: 100px;
        left: 410px;
        width: 300px;
        height: 300px;
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        z-index: 9998;
        display: none;
        overflow-y: auto;
        font-size: 12px;
        padding: 10px;
        white-space: pre-wrap;
      }
    `;
    document.head.appendChild(style);

    const modal = document.createElement('div');
    modal.className = 'qauto-modal';
    modal.innerHTML = `
      <div class="qauto-header">
        <div>
          <span id="qauto-gear">⚙️</span>
        </div>
        <div>
          <button id="qauto-log-btn">📄</button>
          <span id="qauto-close">❌</span>
        </div>
      </div>
      <div class="qauto-body">
        <div class="qauto-actions">
          <button id="qauto-pause">Pause</button>
          <button id="qauto-continue">Continue</button>
          <button id="qauto-stop">Stop</button>
        </div>
        <div class="qauto-status">
          Status: <span id="qauto-status-text">Idle</span>
        </div>
        <div class="qauto-settings" id="qauto-settings">
          <label>Kata Kunci: <input type="text" id="qauto-keyword" /></label><br/>
          <label>Interval (ms): <input type="number" id="qauto-interval" value="3000" /></label>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const logModal = document.createElement('div');
    logModal.className = 'qauto-log';
    logModal.id = 'qauto-log-modal';
    document.body.appendChild(logModal);

    // Event buttons
    document.getElementById('qauto-close').onclick = () => modal.style.display = 'none';
    document.getElementById('qauto-gear').onclick = () => {
        const setting = document.getElementById('qauto-settings');
        setting.style.display = setting.style.display === 'none' ? 'block' : 'none';
    };
    document.getElementById('qauto-log-btn').onclick = () => {
        const logBox = document.getElementById('qauto-log-modal');
        logBox.style.display = logBox.style.display === 'none' ? 'block' : 'none';
    };

    // Drag both modals together
    let offsetX, offsetY;
    let isDragging = false;

    const header = modal.querySelector('.qauto-header');
    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = modal.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
    });
    document.addEventListener('mouseup', () => isDragging = false);
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        modal.style.left = `${x}px`;
        modal.style.top = `${y}px`;
        logModal.style.left = `${x + 310}px`;
        logModal.style.top = `${y}px`;
    });

    // Placeholder logic for log
    function log(msg) {
        const el = document.getElementById('qauto-log-modal');
        el.textContent += `\n${new Date().toLocaleTimeString()}: ${msg}`;
    }

    // Example usage (you can hook your real logic)
    document.getElementById('qauto-pause').onclick = () => log('Paused');
    document.getElementById('qauto-continue').onclick = () => log('Continued');
    document.getElementById('qauto-stop').onclick = () => log('Stopped');
