from PIL import Image
import os

# New source path from user upload
source_path = r"C:\Users\korea\.gemini\antigravity\brain\7b281757-386b-4e22-875b-6550c1bb4b1e\uploaded_image_1768291189542.png"
dest_ico_path = r"c:\side\frontend\public\favicon.ico"
dest_png_path = r"c:\side\frontend\public\logo192.png" 
dest_png_512_path = r"c:\side\frontend\public\logo512.png"

try:
    img = Image.open(source_path)
    print(f"Original Mode: {img.mode}")
    print(f"Original Size: {img.size}")
    
    # Ensure RGBA
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
        
    # Create the square canvas
    # Use max dimension to contain the image
    size = max(img.size)
    
    # Transparent background
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    
    # Paste centered
    x = (size - img.width) // 2
    y = (size - img.height) // 2
    canvas.paste(img, (x, y), img) # Use img as mask for transparency if needed
    
    print("Generated canvas with transparent background.")
    
    # Save ICO
    # Important: older PIL versions might have issues, but let's try standard save
    # Explicitly check for 0 alpha
    
    canvas.save(dest_ico_path, format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print(f"Saved favicon.ico to {dest_ico_path}")
    
    # Save PNGs
    canvas.resize((192, 192), Image.Resampling.LANCZOS).save(dest_png_path)
    print(f"Saved logo192.png to {dest_png_path}")
    
    canvas.resize((512, 512), Image.Resampling.LANCZOS).save(dest_png_512_path)
    print(f"Saved logo512.png to {dest_png_512_path}")

except Exception as e:
    print(f"Error: {e}")
