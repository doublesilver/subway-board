from PIL import Image
import numpy as np

source_path = r"C:\Users\korea\.gemini\antigravity\brain\7b281757-386b-4e22-875b-6550c1bb4b1e\uploaded_image_1768291189542.png"
dest_ico_path = r"c:\side\frontend\public\favicon.ico"
dest_png_path = r"c:\side\frontend\public\logo192.png" 
dest_png_512_path = r"c:\side\frontend\public\logo512.png"

def remove_background(img, tolerance=10):
    img = img.convert("RGBA")
    datas = img.getdata()
    
    # Get background color from top-left pixel
    bg_color = datas[0]
    print(f"Detected background color: {bg_color}")
    
    new_data = []
    for item in datas:
        # Check if pixel is within tolerance of background color
        if all(abs(item[i] - bg_color[i]) <= tolerance for i in range(3)):
            new_data.append((0, 0, 0, 0)) # Make transparent
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    return img

try:
    img = Image.open(source_path)
    print(f"Processing image...")
    
    # Remove background
    img = remove_background(img)
    
    # Trim transparency
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        print(f"Cropped to content: {bbox}")
        
    # Make square canvas
    size = max(img.size)
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    x = (size - img.width) // 2
    y = (size - img.height) // 2
    canvas.paste(img, (x, y), img)
    
    # Save
    canvas.save(dest_ico_path, format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    canvas.resize((192, 192), Image.Resampling.LANCZOS).save(dest_png_path)
    canvas.resize((512, 512), Image.Resampling.LANCZOS).save(dest_png_512_path)
    
    print("Successfully generated transparent assets.")

except Exception as e:
    print(f"Error: {e}")
