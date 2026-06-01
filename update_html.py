import os
import glob
import re

def update_navbar(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add terminal link
    if 'terminal.html' not in content:
        content = content.replace(
            '<li><a href="tools.html" class="nav-link">🔧 Tools</a></li>',
            '<li><a href="tools.html" class="nav-link">🔧 Tools</a></li>\n      <li><a href="terminal.html" class="nav-link">💻 Terminal</a></li>'
        )
        content = content.replace(
            '<a href="tools.html" class="nav-link active">🔧 Tools</a>',
            '<a href="tools.html" class="nav-link active">🔧 Tools</a>\n    <a href="terminal.html" class="nav-link">💻 Terminal</a>'
        )
        # For mobile nav
        content = content.replace(
            '<a href="games.html" class="nav-link">🎮 Downloads</a>',
            '<a href="games.html" class="nav-link">🎮 Downloads</a>\n    <a href="terminal.html" class="nav-link">💻 Terminal</a>'
        )

    # Update User Avatar dropdown in Desktop Nav
    old_user_auth = '''<div data-auth="true" class="hidden" style="display:flex;align-items:center;gap:8px;">
        <div class="user-avatar" id="navUserAvatar" style="width:32px;height:32px;font-size:0.8rem;border-radius:8px;background:var(--gradient-primary);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;">U</div>
        <span id="navUserName" style="font-family:var(--font-heading);font-size:0.75rem;"></span>
        <button class="btn btn-outline btn-sm" data-action="logout">Logout</button>
      </div>'''
      
    new_user_auth = '''<div data-auth="true" class="hidden" style="display:flex;align-items:center;gap:8px;">
        <div class="user-dropdown-container" id="profileDropdownContainer">
          <div style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:4px;" id="profileDropdownToggle">
            <div class="user-avatar" id="navUserAvatar" style="width:32px;height:32px;font-size:0.8rem;border-radius:8px;background:var(--gradient-primary);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;overflow:hidden;">U</div>
            <span id="navUserName" style="font-family:var(--font-heading);font-size:0.75rem;"></span>
            <span>▼</span>
          </div>
          <div class="user-dropdown-menu">
            <button class="dropdown-item" onclick="openProfileModal()">⚙️ Edit Profile</button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" data-action="logout" style="color:var(--color-secondary);">🚪 Logout</button>
          </div>
        </div>
      </div>'''
      
    if old_user_auth in content:
        content = content.replace(old_user_auth, new_user_auth)
    else:
        # Try a more resilient replace if indentation changed
        import re
        content = re.sub(
            r'<div data-auth="true" class="hidden"[^>]*>.*?<button[^>]*data-action="logout"[^>]*>Logout</button>\s*</div>',
            new_user_auth,
            content,
            flags=re.DOTALL
        )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for f in glob.glob('*.html'):
    update_navbar(f)
