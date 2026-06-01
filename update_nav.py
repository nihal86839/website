import os
import glob

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip files that already have the light theme toggle or are newly created
    if 'data-theme="light"' in content and filepath.endswith(('online_games.html', 'play_puzzle.html', 'play_rps.html', 'play_car.html', 'signup.html')):
        return

    # Add light theme toggle
    if 'data-theme="light"' not in content:
        content = content.replace(
            '<button class="theme-btn" data-theme="hacker">💻</button>',
            '<button class="theme-btn" data-theme="hacker">💻</button>\n        <button class="theme-btn" data-theme="light">☀️</button>'
        )
        content = content.replace(
            '<button class="theme-btn" data-theme="hacker">💻 HACKER</button>',
            '<button class="theme-btn" data-theme="hacker">💻 HACKER</button>\n        <button class="theme-btn" data-theme="light">☀️ LIGHT</button>'
        )

    # Add "Play Online" to navbar-nav
    if 'online_games.html' not in content:
        content = content.replace(
            '<li><a href="games.html" class="nav-link',
            '<li><a href="games.html" class="nav-link'
        )
        # Find exact insertion point for desktop nav
        search_desktop = '<li><a href="games.html" class="nav-link">🎮 Games</a></li>'
        search_desktop2 = '<li><a href="games.html" class="nav-link active">🎮 Games</a></li>'
        
        replace_desktop = search_desktop + '\n      <li><a href="online_games.html" class="nav-link">🕹 Play Online</a></li>'
        replace_desktop2 = search_desktop2 + '\n      <li><a href="online_games.html" class="nav-link">🕹 Play Online</a></li>'
        
        content = content.replace(search_desktop, replace_desktop)
        content = content.replace(search_desktop2, replace_desktop2)

        # Find exact insertion point for mobile nav
        search_mobile = '<a href="games.html" class="nav-link">🎮 Games</a>'
        search_mobile2 = '<a href="games.html" class="nav-link active">🎮 Games</a>'
        
        replace_mobile = search_mobile + '\n    <a href="online_games.html" class="nav-link">🕹 Play Online</a>'
        replace_mobile2 = search_mobile2 + '\n    <a href="online_games.html" class="nav-link">🕹 Play Online</a>'
        
        content = content.replace(search_mobile, replace_mobile)
        content = content.replace(search_mobile2, replace_mobile2)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

html_files = glob.glob('*.html')
for file in html_files:
    if file not in ['play_puzzle.html', 'play_rps.html', 'play_car.html', 'online_games.html', 'signup.html']:
        update_file(file)
        print(f"Updated {file}")
