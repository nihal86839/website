import os

filepath = 'admin.html'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace the auth check with checkAdminLock()
content = content.replace(
    "if (!NZ.isAdmin()) { showToast && showToast('Access denied!', 'error'); window.location.href = 'login.html'; }",
    "checkAdminLock();"
)

# 2. Add 'Online Games' to sidebar
sidebar_search = '<button class="s-link" onclick="showPanel(\'games\')">🎮 Games</button>'
sidebar_replace = sidebar_search + '\n        <button class="s-link" onclick="showPanel(\'online_games\')">🕹 Online Games</button>'
if 'showPanel(\'online_games\')' not in content:
    content = content.replace(sidebar_search, sidebar_replace)

# 3. Add Online Games Panel
online_games_panel = '''
      <!-- ===== ONLINE GAMES ===== -->
      <div class="section-panel" id="panel-online_games">
        <div class="panel-title">🕹 Manage Online Games</div>
        <div class="panel-subtitle">Add HTML5 games to the Play Online hub.</div>
        <div class="form-section">
          <div class="form-section-title">➕ Add Online Game</div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Game Name *</label>
              <input type="text" id="ogName" class="form-control" placeholder="e.g. Snake Game">
            </div>
            <div class="form-group">
              <label class="form-label">HTML File URL *</label>
              <input type="text" id="ogFileUrl" class="form-control" placeholder="play_snake.html">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea id="ogDesc" class="form-control" rows="2" placeholder="Describe the game..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Game Emoji / Image URL</label>
            <input type="text" id="ogImgUrl" class="form-control" placeholder="🐍 or https://...">
          </div>
          <button class="btn btn-primary" onclick="addOnlineGame()">🕹 Add Online Game</button>
        </div>
        <div class="section-title">📋 Online Games</div>
        <div class="table-wrapper">
          <table class="admin-table"><thead><tr><th>Icon</th><th>Name</th><th>URL</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody id="online_gamesTbody"></tbody></table>
        </div>
      </div>
'''
if 'id="panel-online_games"' not in content:
    content = content.replace(
        '      <!-- ===== TOOLS ===== -->',
        online_games_panel + '\n      <!-- ===== TOOLS ===== -->'
    )

# 4. Add DOB to Users Table Header
content = content.replace(
    '<th>Avatar</th><th>Username</th><th>Email</th><th>Password</th><th>Joined</th>',
    '<th>Avatar</th><th>Username</th><th>Email</th><th>Password</th><th>DOB</th><th>Joined</th>'
)

# 5. Add DOB to Users rendering in JS
user_row_search = "<td><span class=\"user-pwd\" onclick=\"copyToClip('${u.password}')\" title=\"Click to copy\">${NZ.sanitize(u.password)}</span></td>"
user_row_replace = user_row_search + "\\n            <td style=\\"font-size:0.8rem;color:var(--color-text-muted);\\">${u.dob ? NZ.sanitize(u.dob) : 'N/A'}</td>"
user_row_replace = user_row_replace.replace('\\"', '"') # Fix the string literal issue in python script

if '${u.dob' not in content:
    content = content.replace(user_row_search, user_row_replace)

# 6. Add addOnlineGame function
js_funcs = '''
    /* ---- Add Online Game ---- */
    function addOnlineGame() {
      const name = document.getElementById('ogName').value.trim();
      const fileUrl = document.getElementById('ogFileUrl').value.trim();
      if (!name || !fileUrl) { showToast('Name and URL required!', 'error'); return; }
      
      NZ.addProduct({
        type: 'online_game', name,
        description: document.getElementById('ogDesc').value.trim(),
        price: 0,
        imageUrl: document.getElementById('ogImgUrl').value.trim(),
        fileUrl: fileUrl,
      });
      showToast('Online Game added!', 'success');
      ['ogName','ogFileUrl','ogDesc','ogImgUrl'].forEach(id => document.getElementById(id).value = '');
      loadProducts();
    }
'''
if 'addOnlineGame()' not in content:
    content = content.replace(
        '/* ---- Add Game ---- */',
        js_funcs + '\n    /* ---- Add Game ---- */'
    )

# 7. Add 'online_game' to loadProducts types array
content = content.replace(
    "const types = ['game','tool','video','photo','song'];",
    "const types = ['game','online_game','tool','video','photo','song'];"
)

# 8. Add loadProducts types handling for online_game
online_game_loader = """if (type === 'online_game') {
          tbody.innerHTML = products.length ? products.map(p => `<tr><td><div style="font-size:1.5rem;">${p.imageUrl || '🕹'}</div></td><td><strong>${NZ.sanitize(p.name)}</strong></td><td><a href="${p.fileUrl}" target="_blank">${p.fileUrl}</a></td><td>${NZ.formatDate(p.addedDate)}</td><td><button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}','${p.type}')">🗑 Delete</button></td></tr>`).join('') : '<tr><td colspan="5" style="text-align:center;">No online games</td></tr>';
          return;
        }

        if (type === 'photo') {"""
content = content.replace("if (type === 'photo') {", online_game_loader)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("admin.html updated successfully!")
