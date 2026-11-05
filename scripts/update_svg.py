import base64

with open(r'client/public/career-sync-icon.png', 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('utf-8')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 415 415" width="100%" height="100%">
  <image href="data:image/png;base64,{b64}" width="415" height="415" />
</svg>'''

for path in ['client/public/favicon.svg', 'client/dist/favicon.svg', 'client/public/jobmatch-symbol.svg', 'client/dist/jobmatch-symbol.svg']:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(svg_content)

print('SVG icons updated successfully!')
