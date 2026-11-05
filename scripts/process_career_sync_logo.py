from PIL import Image
import numpy as np
import base64

src_path = r'C:\Users\vu241\.gemini\antigravity\brain\f1e927a5-cc8a-42a2-8235-88eeedc3e295\.user_uploaded\media_1793881460179_64780ee0.png'
src_img = Image.open(src_path).convert('RGBA')
arr = np.array(src_img).astype(float)

r = arr[:, :, 0]
g = arr[:, :, 1]
b = arr[:, :, 2]

# Compute greenness vs grey/white watermark
greenness = np.maximum(0.0, (g - r) * 0.4 + (g - b) * 0.6)
alpha_raw = np.clip((greenness - 6.0) / (65.0 - 6.0), 0.0, 1.0)

# Build clean transparent RGBA array with exact lime-green color (#8DC21F)
out_rgba = np.zeros_like(arr, dtype=np.uint8)
out_rgba[:, :, 0] = 141
out_rgba[:, :, 1] = 194
out_rgba[:, :, 2] = 31
out_rgba[:, :, 3] = (alpha_raw * 255.0).astype(np.uint8)

clean_full = Image.fromarray(out_rgba, mode='RGBA')

# 1. Icon Crop (tight)
# Icon bounds: Y 78 to 210, X 247 to 380
icon_crop = clean_full.crop((245, 76, 382, 212))
icon_bbox = icon_crop.getbbox()
icon_tight = icon_crop.crop(icon_bbox)

# 2. Text Crop (tight)
# Text bounds: Y 227 to 325, X 115 to 512
text_crop = clean_full.crop((113, 225, 514, 327))
text_bbox = text_crop.getbbox()
text_tight = text_crop.crop(text_bbox)

# 3. Build Horizontal Lockup (tight, prominent, high-res)
# Text height 64px, Icon height 76px
target_icon_h = 80
target_icon_w = int(icon_tight.width * (target_icon_h / icon_tight.height))
icon_scaled = icon_tight.resize((target_icon_w, target_icon_h), Image.Resampling.LANCZOS)

target_text_h = 60
target_text_w = int(text_tight.width * (target_text_h / text_tight.height))
text_scaled = text_tight.resize((target_text_w, target_text_h), Image.Resampling.LANCZOS)

gap = 18
lockup_w = target_icon_w + gap + target_text_w
lockup_h = max(target_icon_h, target_text_h)

logo_horizontal = Image.new('RGBA', (lockup_w, lockup_h), (0, 0, 0, 0))
logo_horizontal.paste(icon_scaled, (0, (lockup_h - target_icon_h) // 2), icon_scaled)
logo_horizontal.paste(text_scaled, (target_icon_w + gap, (lockup_h - target_text_h) // 2), text_scaled)

# Crop tight with 2px margin
logo_horizontal.save('client/public/career-sync-logo.png')
logo_horizontal.save('client/public/jobmatch-symbol.png')

# 4. Favicon & Tab Icons: Maximize the leaf icon fill (minimal 5% padding)
fav_size = 256
pad = int(fav_size * 0.05)
icon_draw_size = fav_size - (pad * 2)
icon_fav = icon_tight.resize((icon_draw_size, icon_draw_size), Image.Resampling.LANCZOS)

fav_canvas = Image.new('RGBA', (fav_size, fav_size), (0, 0, 0, 0))
fav_canvas.paste(icon_fav, (pad, pad), icon_fav)

fav_canvas.save('client/public/career-sync-icon.png')
fav_canvas.resize((192, 192), Image.Resampling.LANCZOS).save('client/public/favicon.png')
fav_canvas.resize((48, 48), Image.Resampling.LANCZOS).save('client/public/favicon.ico')

# 5. Favicon SVG
with open('client/public/career-sync-icon.png', 'rb') as f:
    b64_icon = base64.b64encode(f.read()).decode('utf-8')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="100%" height="100%">
  <image href="data:image/png;base64,{b64_icon}" width="256" height="256" />
</svg>'''

with open('client/public/favicon.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

with open('client/public/jobmatch-symbol.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

print("Generated optimized tight-crop assets:")
print(f"- career-sync-logo.png: {logo_horizontal.size}")
print(f"- favicon.png, favicon.ico, favicon.svg: {fav_canvas.size} with max fill")
