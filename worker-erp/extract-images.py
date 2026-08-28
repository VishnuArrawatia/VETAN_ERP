import pymupdf
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = 'D:/c drive/Downloads/SVN GROUP OF COMPANY PROFILE.pdf'
out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public', 'images')

pdf = pymupdf.open(pdf_path)

# Key pages to extract with meaningful names
pages = {
    1: ('cover.png', 2.0),           # Cover page (SVN+Sakar logo)
    3: ('md_management.png', 2.5),    # MD photo + Management
    6: ('experience.png', 2.0),       # Manufacturing experience
    13: ('testing_lab.png', 2.0),     # Testing infrastructure
    14: ('factory_svn.png', 2.0),     # SVN factory machinery
    15: ('factory_sakar.png', 2.0),   # Sakar factory SMT
    16: ('tool_room.png', 2.0),       # Tool room infrastructure
    17: ('production_line.png', 2.0), # Production line
    21: ('thank_you.png', 1.5),       # Closing page
}

for page_num, (filename, zoom) in pages.items():
    page = pdf[page_num - 1]  # 0-indexed
    mat = pymupdf.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat)
    
    # Save as PNG
    filepath = os.path.join(out_dir, filename)
    print(f'  Saving to: {filepath}')
    pix.save(filepath)
    size_kb = os.path.getsize(filepath) // 1024
    print(f'Page {page_num} -> {filename} ({size_kb}KB, {pix.width}x{pix.height})')

pdf.close()
print(f'\nDone! {len(pages)} images extracted to {out_dir}')

# List all images
print('\nAll images in public/images/:')
for f in sorted(os.listdir(out_dir)):
    if f.endswith('.png') and f.startswith('brochure'):
        os.remove(os.path.join(out_dir, f))
        print(f'  Removed old: {f}')
    elif f.endswith('.png'):
        sz = os.path.getsize(os.path.join(out_dir, f)) // 1024
        print(f'  {f} ({sz}KB)')
