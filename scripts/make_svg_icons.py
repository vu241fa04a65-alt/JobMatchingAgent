import base64

with open('client/public/career-sync-icon.png', 'rb') as f:
    b64_icon = base64.b64encode(f.read()).decode('utf-8')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/png;base64,{b64_icon}" width="512" height="512" />
</svg>'''

with open('client/public/favicon.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

with open('client/public/jobmatch-symbol.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

print("Updated favicon.svg and jobmatch-symbol.svg successfully.")

