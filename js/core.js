/* ===================================================
   NihalZone - Core Data Layer (core.js)
   LocalStorage data management, helpers, theme
   =================================================== */

const NZ = {

  /* ---- Keys ---- */
  KEYS: {
    USERS: 'nz_users',
    SESSION: 'nz_session',
    PRODUCTS: 'nz_products',
    MESSAGES: 'nz_messages',
    REPORTS: 'nz_reports',
    TICKETS: 'nz_tickets',
    THEME: 'nz_theme',
    BLOCKED: 'nz_blocked',
  },

  /* ---- Admin Credentials ---- */
  ADMIN: {
    email: 'nihalvagdoda@gmail.com',
    password: 'NEW PASSWORD NIHAL',
    username: 'NIHAL ADMIN',
    id: 'admin_001',
  },

  /* ---- UPI ---- */
  UPI_ID: '8128196133@fam',

  /* ============================================================
     THEME
  ============================================================ */
  getTheme() {
    return localStorage.getItem(this.KEYS.THEME) || 'gamer';
  },

  setTheme(theme) {
    localStorage.setItem(this.KEYS.THEME, theme);
    document.body.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    // Update toggle buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
    // Matrix canvas
    const canvas = document.getElementById('matrixCanvas');
    if (canvas) {
      if (theme === 'hacker') startMatrix(canvas);
      else stopMatrix();
    }
  },

  initTheme() {
    const theme = this.getTheme();
    document.body.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  },

  /* ============================================================
     SESSION
  ============================================================ */
  getSession() {
    try {
      const s = sessionStorage.getItem(this.KEYS.SESSION);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  },

  setSession(user) {
    sessionStorage.setItem(this.KEYS.SESSION, JSON.stringify(user));
  },

  clearSession() {
    sessionStorage.removeItem(this.KEYS.SESSION);
  },

  isLoggedIn() {
    return this.getSession() !== null;
  },

  isAdmin() {
    const s = this.getSession();
    return s && s.isAdmin === true;
  },

  requireAuth(redirectTo = 'login.html') {
    if (!this.isLoggedIn()) {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  },

  requireAdmin() {
    if (!this.isAdmin()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  },

  /* ============================================================
     USERS
  ============================================================ */
  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.USERS) || '[]');
    } catch { return []; }
  },

  saveUsers(users) {
    localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
  },

  getUserById(id) {
    if (id === this.ADMIN.id) return { ...this.ADMIN, isAdmin: true };
    return this.getUsers().find(u => u.id === id) || null;
  },

  getUserByEmail(email) {
    if (email === this.ADMIN.email) return { ...this.ADMIN, isAdmin: true };
    return this.getUsers().find(u => u.email === email) || null;
  },

  createUser(data) {
    const users = this.getUsers();
    const exists = users.find(u => u.email === data.email);
    if (exists) return { error: 'Email already registered!' };

    const user = {
      id: 'user_' + Date.now(),
      username: data.username,
      email: data.email,
      password: data.password,
      avatar: data.username[0].toUpperCase(),
      joinDate: new Date().toISOString(),
      isBlocked: false,
      purchases: [],
      balance: 0,
      bio: '',
    };
    users.push(user);
    this.saveUsers(users);
    return { user };
  },

  loginUser(email, password) {
    // Admin check
    if (email === this.ADMIN.email && password === this.ADMIN.password) {
      const adminUser = { ...this.ADMIN, isAdmin: true };
      this.setSession(adminUser);
      return { user: adminUser };
    }
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return { error: 'Invalid email or password!' };
    if (user.isBlocked) return { error: 'Your account has been blocked. Contact support.' };
    this.setSession(user);
    return { user };
  },

  updateUser(id, updates) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return false;
    users[idx] = { ...users[idx], ...updates };
    this.saveUsers(users);
    // Update session if own account
    const session = this.getSession();
    if (session && session.id === id) {
      this.setSession(users[idx]);
    }
    return true;
  },

  deleteUser(id) {
    const users = this.getUsers().filter(u => u.id !== id);
    this.saveUsers(users);
  },

  addPurchase(userId, productId) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return;
    if (!users[idx].purchases.includes(productId)) {
      users[idx].purchases.push(productId);
      this.saveUsers(users);
    }
  },

  hasPurchased(userId, productId) {
    if (this.isAdmin()) return true;
    const user = this.getUserById(userId);
    if (!user) return false;
    return (user.purchases || []).includes(productId);
  },

  blockUser(userId, block = true) {
    this.updateUser(userId, { isBlocked: block });
  },

  /* ============================================================
     PRODUCTS
  ============================================================ */
  getProducts(type = null) {
    try {
      const all = JSON.parse(localStorage.getItem(this.KEYS.PRODUCTS) || '[]');
      if (type) return all.filter(p => p.type === type);
      return all;
    } catch { return []; }
  },

  saveProducts(products) {
    localStorage.setItem(this.KEYS.PRODUCTS, JSON.stringify(products));
  },

  getProductById(id) {
    return this.getProducts().find(p => p.id === id) || null;
  },

  addProduct(data) {
    const products = this.getProducts();
    const product = {
      id: 'prod_' + Date.now(),
      type: data.type,
      name: data.name || 'Untitled',
      description: data.description || '',
      price: parseFloat(data.price) || 0,
      imageUrl: data.imageUrl || '',
      fileUrl: data.fileUrl || '',
      fileData: data.fileData || '',
      addedDate: new Date().toISOString(),
      downloads: 0,
      tags: data.tags || [],
    };
    products.push(product);
    this.saveProducts(products);
    return product;
  },

  updateProduct(id, updates) {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return false;
    products[idx] = { ...products[idx], ...updates };
    this.saveProducts(products);
    return true;
  },

  deleteProduct(id) {
    const products = this.getProducts().filter(p => p.id !== id);
    this.saveProducts(products);
  },

  incrementDownload(id) {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx !== -1) {
      products[idx].downloads = (products[idx].downloads || 0) + 1;
      this.saveProducts(products);
    }
  },

  /* ============================================================
     CHAT MESSAGES
  ============================================================ */
  getMessages() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.MESSAGES) || '[]');
    } catch { return []; }
  },

  saveMessages(messages) {
    // Keep last 500 messages
    if (messages.length > 500) messages = messages.slice(-500);
    localStorage.setItem(this.KEYS.MESSAGES, JSON.stringify(messages));
  },

  addMessage(senderId, senderName, text, avatar) {
    const messages = this.getMessages();
    const session = this.getSession();
    if (session && NZ.isUserBlocked(senderId)) return null;
    const msg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      senderId,
      senderName,
      avatar: avatar || senderName[0].toUpperCase(),
      text,
      timestamp: new Date().toISOString(),
      isDeleted: false,
    };
    messages.push(msg);
    this.saveMessages(messages);
    return msg;
  },

  deleteMessage(id) {
    const messages = this.getMessages();
    const idx = messages.findIndex(m => m.id === id);
    if (idx !== -1) {
      messages[idx].isDeleted = true;
      messages[idx].text = '[Message deleted]';
      this.saveMessages(messages);
    }
  },

  isUserBlocked(userId) {
    const user = this.getUserById(userId);
    return user && user.isBlocked;
  },

  /* ============================================================
     REPORTS
  ============================================================ */
  getReports() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.REPORTS) || '[]');
    } catch { return []; }
  },

  addReport(data) {
    const reports = this.getReports();
    const report = {
      id: 'rep_' + Date.now(),
      reporterId: data.reporterId,
      reporterName: data.reporterName,
      reportedId: data.reportedId,
      reportedName: data.reportedName,
      reason: data.reason,
      description: data.description || '',
      timestamp: new Date().toISOString(),
      status: 'pending',
    };
    reports.push(report);
    localStorage.setItem(this.KEYS.REPORTS, JSON.stringify(reports));
    return report;
  },

  updateReportStatus(id, status) {
    const reports = this.getReports();
    const idx = reports.findIndex(r => r.id === id);
    if (idx !== -1) {
      reports[idx].status = status;
      localStorage.setItem(this.KEYS.REPORTS, JSON.stringify(reports));
    }
  },

  /* ============================================================
     SUPPORT TICKETS
  ============================================================ */
  getTickets() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.TICKETS) || '[]');
    } catch { return []; }
  },

  addTicket(data) {
    const tickets = this.getTickets();
    const ticket = {
      id: 'tick_' + Date.now(),
      userId: data.userId,
      username: data.username,
      email: data.email,
      subject: data.subject,
      message: data.message,
      timestamp: new Date().toISOString(),
      status: 'open',
      reply: '',
    };
    tickets.push(ticket);
    localStorage.setItem(this.KEYS.TICKETS, JSON.stringify(tickets));
    return ticket;
  },

  replyTicket(id, reply) {
    const tickets = this.getTickets();
    const idx = tickets.findIndex(t => t.id === id);
    if (idx !== -1) {
      tickets[idx].reply = reply;
      tickets[idx].status = 'closed';
      localStorage.setItem(this.KEYS.TICKETS, JSON.stringify(tickets));
    }
  },

  /* ============================================================
     HELPERS
  ============================================================ */
  formatDate(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  formatTime(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  },

  formatPrice(price) {
    if (!price || price == 0) return 'FREE';
    return '₹' + parseFloat(price).toFixed(0);
  },

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },

  sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  getStats() {
    return {
      users: this.getUsers().length,
      products: this.getProducts().length,
      games: this.getProducts('game').length,
      tools: this.getProducts('tool').length,
      videos: this.getProducts('video').length,
      photos: this.getProducts('photo').length,
      songs: this.getProducts('song').length,
      messages: this.getMessages().length,
      reports: this.getReports().filter(r => r.status === 'pending').length,
      tickets: this.getTickets().filter(t => t.status === 'open').length,
    };
  },

  /* ---- OTP Logic ---- */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  /* ---- File to DataURL ---- */
  fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  /* ============================================================
     SEED DATA (Demo content on first load)
  ============================================================ */
  seedIfEmpty() {
    if (this.getProducts().length > 0) return;
    const sampleProducts = [
      {
        id: 'prod_sample1', type: 'game', name: 'Cyber Assault 2077',
        description: 'A futuristic action RPG set in a cyberpunk world. Epic battles await!',
        price: 0, imageUrl: '', fileUrl: '#', addedDate: new Date().toISOString(), downloads: 142,
      },
      {
        id: 'prod_sample2', type: 'game', name: 'Shadow Protocol',
        description: 'Stealth action game with deep hacking mechanics. Enter the shadows.',
        price: 49, imageUrl: '', fileUrl: '#', addedDate: new Date().toISOString(), downloads: 87,
      },
      {
        id: 'prod_sample3', type: 'tool', name: 'NetScan Pro',
        description: 'Advanced network scanner for ethical penetration testing. Scan open ports, detect vulnerabilities.',
        price: 0, imageUrl: '', fileUrl: '#', addedDate: new Date().toISOString(), downloads: 321,
      },
      {
        id: 'prod_sample4', type: 'tool', name: 'WiFi Analyzer X',
        description: 'Analyze WiFi networks, signal strength, and security protocols.',
        price: 29, imageUrl: '', fileUrl: '#', addedDate: new Date().toISOString(), downloads: 198,
      },
      {
        id: 'prod_sample5', type: 'video', name: 'Ethical Hacking 101',
        description: 'Complete beginner guide to ethical hacking and cybersecurity.',
        price: 0, imageUrl: '', fileUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', addedDate: new Date().toISOString(), downloads: 567,
      },
      {
        id: 'prod_sample6', type: 'song', name: 'Cyber Pulse',
        description: 'Electronic cyberpunk music to boost your hacking sessions.',
        price: 0, imageUrl: '', fileUrl: '', addedDate: new Date().toISOString(), downloads: 234,
      },
    ];
    this.saveProducts(sampleProducts);
  },
};

/* ============================================================
   TOAST NOTIFICATIONS
============================================================ */
function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration + 300);
}

/* ============================================================
   MATRIX RAIN EFFECT (Hacker Theme)
============================================================ */
let matrixInterval = null;

function startMatrix(canvas) {
  if (!canvas) return;
  stopMatrix();
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
  const fontSize = 14;
  const cols = Math.floor(canvas.width / fontSize);
  const drops = Array(cols).fill(1);

  matrixInterval = setInterval(() => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00ff41';
    ctx.font = `${fontSize}px monospace`;
    drops.forEach((y, i) => {
      const char = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(char, i * fontSize, y * fontSize);
      if (y * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    });
  }, 50);
}

function stopMatrix() {
  if (matrixInterval) { clearInterval(matrixInterval); matrixInterval = null; }
}

/* ============================================================
   PARTICLES (Gamer Theme)
============================================================ */
function initParticles(containerId = 'particles') {
  const container = document.getElementById(containerId);
  if (!container) return;
  for (let i = 0; i < 25; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      animation-duration: ${5 + Math.random() * 10}s;
      animation-delay: ${Math.random() * 10}s;
      width: ${1 + Math.random() * 3}px;
      height: ${1 + Math.random() * 3}px;
    `;
    container.appendChild(p);
  }
}

/* ============================================================
   NAVBAR UTILITIES
============================================================ */
function initNavbar() {
  const session = NZ.getSession();
  const authLinks = document.querySelectorAll('[data-auth="true"]');
  const guestLinks = document.querySelectorAll('[data-auth="false"]');
  const adminLinks = document.querySelectorAll('[data-admin="true"]');
  const userNameEl = document.getElementById('navUserName');
  const userAvatarEl = document.getElementById('navUserAvatar');

  if (session) {
    authLinks.forEach(el => el.classList.remove('hidden'));
    guestLinks.forEach(el => el.classList.add('hidden'));
    if (session.isAdmin) adminLinks.forEach(el => el.classList.remove('hidden'));
    
    if (userNameEl) userNameEl.textContent = session.username;
    if (userAvatarEl) {
      if (session.avatarUrl) {
        userAvatarEl.innerHTML = `<img src="${session.avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`;
      } else {
        userAvatarEl.textContent = session.username[0].toUpperCase();
      }
    }
  } else {
    authLinks.forEach(el => el.classList.add('hidden'));
    guestLinks.forEach(el => el.classList.remove('hidden'));
    adminLinks.forEach(el => el.classList.add('hidden'));
  }

  // Mark active nav link
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href === path) link.classList.add('active');
  });

  // Hamburger
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => mobileNav.classList.toggle('open'));
  }

  // Profile Dropdown
  const dropdownToggle = document.getElementById('profileDropdownToggle');
  const dropdownContainer = document.getElementById('profileDropdownContainer');
  if (dropdownToggle && dropdownContainer) {
    dropdownToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownContainer.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!dropdownContainer.contains(e.target)) {
        dropdownContainer.classList.remove('open');
      }
    });
  }
}

/* ============================================================
   PROFILE MANAGEMENT
============================================================ */
function openProfileModal() {
  const session = NZ.getSession();
  if (!session) return;
  
  const existing = document.getElementById('profileModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'profileModal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal" style="max-width:400px;">
      <div class="modal-header">
        <h3 class="modal-title">⚙️ Edit Profile</h3>
        <button class="modal-close" onclick="document.getElementById('profileModal').remove()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" id="profName" class="form-control" value="${session.name || ''}" placeholder="John Doe">
        </div>
        <div class="form-group">
          <label class="form-label">Username</label>
          <input type="text" id="profUsername" class="form-control" value="${session.username}">
        </div>
        <div class="form-group">
          <label class="form-label">Date of Birth</label>
          <input type="date" id="profDob" class="form-control" value="${session.dob || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Avatar URL / Logo</label>
          <input type="url" id="profAvatar" class="form-control" value="${session.avatarUrl || ''}" placeholder="https://example.com/avatar.jpg">
        </div>
        <div class="form-group">
          <label class="form-label">New Password (leave blank to keep)</label>
          <input type="password" id="profPass" class="form-control" placeholder="New Password">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="document.getElementById('profileModal').remove()">Cancel</button>
        <button class="btn btn-primary" onclick="saveProfile()">💾 Save Profile</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function saveProfile() {
  const session = NZ.getSession();
  if (!session) return;
  
  const name = document.getElementById('profName').value.trim();
  const username = document.getElementById('profUsername').value.trim();
  const dob = document.getElementById('profDob').value;
  const avatarUrl = document.getElementById('profAvatar').value.trim();
  const pass = document.getElementById('profPass').value;

  if (!username) { showToast('Username required!', 'error'); return; }

  const updateData = { name, username, dob, avatarUrl };
  if (pass) updateData.password = pass;

  const result = NZ.updateUser(session.id, updateData);
  if (result.error) {
    showToast(result.error, 'error');
  } else {
    NZ.setSession(result.user);
    showToast('Profile updated!', 'success');
    document.getElementById('profileModal').remove();
    initNavbar(); // refresh UI
  }
}

/* ============================================================
   ADMIN SECURITY LOCK
============================================================ */
function checkAdminLock() {
  const session = NZ.getSession();
  if (session && session.isAdmin) return; // Already logged in as admin

  // Not admin? Show strict prompt lock
  document.body.innerHTML = '';
  document.body.style.background = '#000';
  document.body.style.display = 'flex';
  document.body.style.alignItems = 'center';
  document.body.style.justifyContent = 'center';
  document.body.style.height = '100vh';
  
  const lockBox = document.createElement('div');
  lockBox.style.cssText = 'background:#111;padding:40px;border-radius:12px;border:1px solid #ff0040;text-align:center;box-shadow:0 0 30px rgba(255,0,64,0.4);font-family:monospace;width:300px;';
  lockBox.innerHTML = `
    <h2 style="color:#ff0040;margin-bottom:20px;">ACCESS DENIED</h2>
    <p style="color:#aaa;margin-bottom:20px;font-size:0.8rem;">Admin clearance required.</p>
    <input type="email" id="adminLockEmail" placeholder="Email" style="width:100%;padding:10px;margin-bottom:10px;background:#222;border:1px solid #444;color:#fff;border-radius:4px;">
    <input type="password" id="adminLockPass" placeholder="Password" style="width:100%;padding:10px;margin-bottom:20px;background:#222;border:1px solid #444;color:#fff;border-radius:4px;">
    <button id="adminLockBtn" style="width:100%;padding:10px;background:#ff0040;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">AUTHORIZE</button>
    <button id="adminLockBack" style="width:100%;padding:10px;background:transparent;color:#888;border:none;margin-top:10px;cursor:pointer;">Return to Home</button>
  `;
  document.body.appendChild(lockBox);

  document.getElementById('adminLockBtn').addEventListener('click', () => {
    const e = document.getElementById('adminLockEmail').value;
    const p = document.getElementById('adminLockPass').value;
    const res = NZ.loginUser(e, p);
    if (!res.error && res.user.isAdmin) {
      window.location.reload(); // Reloads normal admin page
    } else {
      alert('INVALID CREDENTIALS');
    }
  });

  document.getElementById('adminLockBack').addEventListener('click', () => {
    window.location.href = 'index.html';
  });
}

/* ============================================================
   DONATE MODAL
============================================================ */
function openDonateModal() {
  const existing = document.getElementById('donateModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'donateModal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">💛 Support NihalZone</h3>
        <button class="modal-close" onclick="document.getElementById('donateModal').remove()">✕</button>
      </div>
      <div class="modal-body">
        <div class="text-center mb-20">
          <div style="font-size:3rem;margin-bottom:10px;">🙏</div>
          <p class="text-muted">Your support keeps NihalZone alive & free!</p>
        </div>
        <div class="form-group">
          <label class="form-label">UPI ID</label>
          <div style="background:var(--bg-secondary);border:1px solid var(--color-border);border-radius:8px;padding:12px 16px;font-family:var(--font-mono);color:var(--color-primary);font-size:1rem;">${NZ.UPI_ID}</div>
        </div>
        <div class="form-group">
          <label class="form-label">Enter Amount (₹)</label>
          <input type="number" id="donateAmount" class="form-control" placeholder="Enter amount..." min="1" value="50">
        </div>
        <div class="alert alert-info">
          <span>ℹ️</span>
          Clicking PAY will open your UPI payment app automatically.
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="document.getElementById('donateModal').remove()">Cancel</button>
        <button class="btn btn-primary" onclick="processDonate()">💛 PAY NOW</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

function processDonate() {
  const amount = document.getElementById('donateAmount').value;
  if (!amount || amount < 1) { showToast('Please enter a valid amount!', 'error'); return; }
  const upiUrl = `upi://pay?pa=${NZ.UPI_ID}&pn=NihalZone&am=${amount}&cu=INR&tn=NihalZone+Donation`;
  window.location.href = upiUrl;
  document.getElementById('donateModal').remove();
  showToast('Redirecting to your payment app...', 'success');
}

/* ============================================================
   REPORT USER MODAL
============================================================ */
function openReportModal(reportedId, reportedName) {
  const session = NZ.getSession();
  if (!session) { showToast('Please login to report users', 'error'); return; }

  const existing = document.getElementById('reportModal');
  if (existing) existing.remove();

  const reasons = ['Spam', 'Harassment', 'Hate Speech', 'Inappropriate Content', 'Scam/Fraud', 'Other'];
  const modal = document.createElement('div');
  modal.id = 'reportModal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">🚨 Report User</h3>
        <button class="modal-close" onclick="document.getElementById('reportModal').remove()">✕</button>
      </div>
      <div class="modal-body">
        <p class="text-muted mb-20">Reporting: <strong style="color:var(--color-primary)">${NZ.sanitize(reportedName)}</strong></p>
        <div class="form-group">
          <label class="form-label">Reason</label>
          <select id="reportReason" class="form-control">
            ${reasons.map(r => `<option value="${r}">${r}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea id="reportDesc" class="form-control" rows="4" placeholder="Describe what happened..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="document.getElementById('reportModal').remove()">Cancel</button>
        <button class="btn btn-danger" onclick="submitReport('${reportedId}','${NZ.sanitize(reportedName)}')">🚨 Submit Report</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

function submitReport(reportedId, reportedName) {
  const session = NZ.getSession();
  const reason = document.getElementById('reportReason').value;
  const description = document.getElementById('reportDesc').value;
  NZ.addReport({
    reporterId: session.id,
    reporterName: session.username,
    reportedId,
    reportedName,
    reason,
    description,
  });
  document.getElementById('reportModal').remove();
  showToast('Report submitted successfully!', 'success');
}

/* ============================================================
   CONTEXT MENU
============================================================ */
let activeContextMenu = null;

function showContextMenu(e, userId, username) {
  e.preventDefault();
  e.stopPropagation();
  const session = NZ.getSession();
  if (!session) return;

  if (activeContextMenu) activeContextMenu.remove();

  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.left = e.pageX + 'px';
  menu.style.top = e.pageY + 'px';
  activeContextMenu = menu;

  menu.innerHTML = `
    <div class="context-item" onclick="viewProfile('${userId}','${NZ.sanitize(username)}')">👤 View Profile</div>
    <div class="context-item" onclick="openReportModal('${userId}','${NZ.sanitize(username)}')">🚨 Report User</div>
    ${session.isAdmin ? `
    <div class="context-item danger" onclick="adminBlockUser('${userId}','${NZ.sanitize(username)}')">🚫 Block User</div>
    <div class="context-item danger" onclick="adminLoginAs('${userId}')">👁 Login As User</div>
    ` : ''}
  `;

  document.body.appendChild(menu);
  setTimeout(() => {
    document.addEventListener('click', () => { menu.remove(); activeContextMenu = null; }, { once: true });
  }, 0);
}

function viewProfile(userId, username) {
  showToast(`Viewing ${username}'s profile`, 'info');
}

function adminBlockUser(userId, username) {
  const user = NZ.getUserById(userId);
  const block = !user?.isBlocked;
  NZ.blockUser(userId, block);
  showToast(`${username} has been ${block ? 'blocked' : 'unblocked'}!`, block ? 'error' : 'success');
  if (activeContextMenu) { activeContextMenu.remove(); activeContextMenu = null; }
  setTimeout(() => location.reload(), 800);
}

function adminLoginAs(userId) {
  const user = NZ.getUserById(userId);
  if (!user) return;
  NZ.setSession(user);
  showToast(`Now logged in as ${user.username}`, 'info');
  setTimeout(() => window.location.href = 'index.html', 1000);
}

/* ============================================================
   SUPPORT MODAL
============================================================ */
function openSupportModal() {
  const session = NZ.getSession();
  if (!session) { window.location.href = 'login.html'; return; }

  const existing = document.getElementById('supportModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'supportModal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">🎧 Support</h3>
        <button class="modal-close" onclick="document.getElementById('supportModal').remove()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Subject</label>
          <input type="text" id="ticketSubject" class="form-control" placeholder="What's your issue?">
        </div>
        <div class="form-group">
          <label class="form-label">Message</label>
          <textarea id="ticketMessage" class="form-control" rows="5" placeholder="Describe your problem in detail..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="document.getElementById('supportModal').remove()">Cancel</button>
        <button class="btn btn-primary" onclick="submitTicket()">📨 Submit Ticket</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

function submitTicket() {
  const session = NZ.getSession();
  const subject = document.getElementById('ticketSubject').value.trim();
  const message = document.getElementById('ticketMessage').value.trim();
  if (!subject || !message) { showToast('Please fill all fields!', 'error'); return; }
  NZ.addTicket({ userId: session.id, username: session.username, email: session.email, subject, message });
  document.getElementById('supportModal').remove();
  showToast('Support ticket submitted!', 'success');
}

/* ============================================================
   PRODUCT ACTION (Download / Buy)
============================================================ */
function handleProductAction(productId) {
  const session = NZ.getSession();
  if (!session) { window.location.href = 'login.html'; return; }

  const product = NZ.getProductById(productId);
  if (!product) return;

  if (product.price > 0 && !NZ.hasPurchased(session.id, productId)) {
    openPaymentModal(product);
    return;
  }

  // Free or already purchased
  NZ.incrementDownload(productId);
  if (product.fileData) {
    const a = document.createElement('a');
    a.href = product.fileData;
    a.download = product.name;
    a.click();
    showToast('Download started!', 'success');
  } else if (product.fileUrl && product.fileUrl !== '#') {
    window.open(product.fileUrl, '_blank');
    showToast('Opening resource...', 'success');
  } else {
    showToast('File not available yet.', 'info');
  }
}

function openPaymentModal(product) {
  const existing = document.getElementById('paymentModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'paymentModal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">💳 Purchase</h3>
        <button class="modal-close" onclick="document.getElementById('paymentModal').remove()">✕</button>
      </div>
      <div class="modal-body">
        <div class="d-flex align-center gap-16 mb-20" style="padding:16px;background:var(--bg-card);border-radius:10px;border:1px solid var(--color-border)">
          <div style="font-size:2rem">📦</div>
          <div>
            <div style="font-family:var(--font-heading);font-weight:700;color:var(--color-text)">${NZ.sanitize(product.name)}</div>
            <div class="price-tag price-paid" style="font-size:1.2rem">₹${product.price}</div>
          </div>
        </div>
        <div class="alert alert-info">
          <span>ℹ️</span>
          Pay via UPI to unlock this content instantly.
        </div>
        <div class="form-group">
          <label class="form-label">UPI ID</label>
          <div style="background:var(--bg-secondary);border:1px solid var(--color-border);border-radius:8px;padding:12px 16px;font-family:var(--font-mono);color:var(--color-primary);">${NZ.UPI_ID}</div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="document.getElementById('paymentModal').remove()">Cancel</button>
        <button class="btn btn-primary" onclick="processPayment('${product.id}',${product.price})">💳 Pay ₹${product.price}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

function processPayment(productId, amount) {
  const upiUrl = `upi://pay?pa=${NZ.UPI_ID}&pn=NihalZone&am=${amount}&cu=INR&tn=NihalZone+Purchase`;
  window.location.href = upiUrl;

  // Simulate payment success after redirect back (auto-unlock)
  const session = NZ.getSession();
  if (session) NZ.addPurchase(session.id, productId);
  document.getElementById('paymentModal')?.remove();
  showToast('Payment initiated! Content unlocked.', 'success');
  setTimeout(() => location.reload(), 1500);
}

/* ============================================================
   INITIALIZE
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  NZ.initTheme();
  NZ.seedIfEmpty();

  // Theme buttons
  document.querySelectorAll('.theme-btn').forEach(btn => {
    const theme = btn.dataset.theme;
    if (theme === NZ.getTheme()) btn.classList.add('active');
    btn.addEventListener('click', () => NZ.setTheme(theme));
  });

  // Init matrix if hacker
  const canvas = document.getElementById('matrixCanvas');
  if (canvas && NZ.getTheme() === 'hacker') startMatrix(canvas);

  // Particles
  initParticles('particles');

  // Init navbar
  initNavbar();

  // Donate button
  const donateBtn = document.getElementById('donateBtn');
  if (donateBtn) donateBtn.addEventListener('click', openDonateModal);

  // Support button
  const supportBtn = document.getElementById('supportBtn');
  if (supportBtn) supportBtn.addEventListener('click', openSupportModal);

  // Logout
  document.querySelectorAll('[data-action="logout"]').forEach(btn => {
    btn.addEventListener('click', () => {
      NZ.clearSession();
      window.location.href = 'login.html';
    });
  });
});
