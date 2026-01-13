from PIL import Image

source_path = r"C:\Users\korea\.gemini\antigravity\brain\7b281757-386b-4e22-875b-6550c1bb4b1e\uploaded_image_1768291189542.png"

try:
    img = Image.open(source_path)
    print(f"Mode: {img.mode}")
    print(f"Format: {img.format}")
    
    # Check top left pixel
    pixel = img.getpixel((0, 0))
    print(f"Pixel at (0,0): {pixel}")
    
    # Check if it has transparency
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        print("Image has alpha channel info.")
        if img.mode == 'RGBA':
            # Check a few pixels to see if they are transparent
            print(f"Pixel at (10, 10): {img.getpixel((10, 10))}")
            
    else:
        print("Image does NOT have alpha channel.")

except Exception as e:
    print(f"Error: {e}")
