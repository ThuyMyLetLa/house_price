// forum.js
// - Lưu tên vào localStorage (chỉ hỏi 1 lần).
// - Gửi message -> POST /send_message (kèm name, text, time).
// - Polling GET /get_messages (tự động cập nhật).
// - Hiển thị tối đa 20 message cuối, scroll xuống khi có tin mới.

(() => {
  const nameBox = document.getElementById("nameBox");
  const chatBox = document.getElementById("chatBox");
  const usernameInput = document.getElementById("username");
  const saveNameBtn = document.getElementById("saveName");
  const clearLocalBtn = document.getElementById("clearLocal");

  const messagesEl = document.getElementById("messages");
  const chatText = document.getElementById("chatText");
  const sendBtn = document.getElementById("sendBtn");

  const MSG_LIMIT = 20;
  const POLL_MS = 2500; // 2.5s

  let name = localStorage.getItem("forum_name") || "";
  let lastRenderCount = 0;

  // Helper: format timestamp 'YYYY-MM-DD HH:MM'
  function formatTime(ts) {
    try {
      const d = new Date(ts);
      if (isNaN(d)) return "";
      const pad = n => n.toString().padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch { return ""; }
  }

  // Render messages array (show only last MSG_LIMIT)
  function renderMessages(allMessages) {
    const msgs = Array.isArray(allMessages) ? allMessages.slice(-MSG_LIMIT) : [];
    // If no change in count, still might update content; but to be simple, re-render always
    messagesEl.innerHTML = "";
    for (const m of msgs) {
      const wrapper = document.createElement("div");
      wrapper.className = "message";
      // mark my messages visually
      if (m.name && name && m.name === name) wrapper.classList.add("me");

      const meta = document.createElement("div");
      meta.className = "msg-meta";

      const nameSpan = document.createElement("strong");
      nameSpan.textContent = m.name || "Người dùng";

      const timeSpan = document.createElement("span");
      timeSpan.className = "msg-time";
      // prefer server-sent time field, else use client-side if exists
      timeSpan.textContent = m.time ? formatTime(m.time) : (m._ts ? formatTime(m._ts) : "");

      meta.appendChild(nameSpan);
      meta.appendChild(timeSpan);

      const text = document.createElement("div");
      text.textContent = m.text || "";

      wrapper.appendChild(meta);
      wrapper.appendChild(text);
      messagesEl.appendChild(wrapper);
    }
    // Scroll down to bottom to show newest message
    messagesEl.scrollTop = messagesEl.scrollHeight;
    lastRenderCount = msgs.length;
  }

  // Fetch messages from server
  async function fetchMessages() {
    try {
      const res = await fetch("/get_messages");
      if (!res.ok) return;
      const data = await res.json();
      // If server returns timestamps? ensure they exist, else leave
      renderMessages(data);
    } catch (err) {
      // ignore transient errors
      console.warn("fetchMessages error", err);
    }
  }

  // Send a message
  async function sendMessage(text) {
    if (!text || text.trim() === "") return;
    const payload = {
      name: name || "Khách",
      text: text.trim(),
      time: new Date().toISOString() // include ISO timestamp
    };
    try {
      const res = await fetch("/send_message", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("send failed");
      chatText.value = "";
      // optimistic update: append locally then fetch to sync
      await fetchMessages();
    } catch (err) {
      alert("Không gửi được tin nhắn. Vui lòng thử lại.");
      console.error(err);
    }
  }

  // Save name handler
  saveNameBtn.addEventListener("click", () => {
    const v = usernameInput.value.trim();
    if (!v) {
      usernameInput.focus();
      return;
    }
    name = v;
    localStorage.setItem("forum_name", name);
    nameBox.style.display = "none";
    chatBox.style.display = "flex";
    chatText.focus();
    // initial fetch
    fetchMessages();
  });

  // Clear local stored name (allow rename)
  clearLocalBtn.addEventListener("click", () => {
    localStorage.removeItem("forum_name");
    name = "";
    nameBox.style.display = "block";
    chatBox.style.display = "none";
    usernameInput.value = "";
    usernameInput.focus();
  });

  // Send button
  sendBtn.addEventListener("click", () => {
    if (!name) {
      // For safety, prompt to save name
      alert("Vui lòng lưu tên trước khi gửi tin nhắn.");
      return;
    }
    sendMessage(chatText.value);
  });

  // Enter => send (when focus in input)
  chatText.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });

  // Init: show correct panels
  function initUI() {
    if (name) {
      nameBox.style.display = "none";
      chatBox.style.display = "flex";
    } else {
      nameBox.style.display = "block";
      chatBox.style.display = "none";
    }
  }

  // Start polling loop
  function startPolling() {
    fetchMessages();
    setInterval(fetchMessages, POLL_MS);
  }

  // Kick off
  initUI();
  startPolling();
})();