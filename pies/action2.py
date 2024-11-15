import pyautogui
from PIL import Image, ImageDraw, ImageFont

# Capture the screenshot and save it
screenshot = pyautogui.screenshot(region=(0, 0, 800, 1080))
screenshot.save('main_screen_screenshot.png')

# Open the saved screenshot
image = Image.open('main_screen_screenshot.png')

# Get the dimensions of the image
width, height = image.size

# Create a drawing context
draw = ImageDraw.Draw(image)

# Define the number of squares per row and column
grid_size = 10  # For a 10x10 grid

# Calculate the spacing between lines
x_spacing = width / grid_size
y_spacing = height / grid_size

# Draw vertical grid lines
for i in range(grid_size + 1):
    x = i * x_spacing
    draw.line([(x, 0), (x, height)], fill='red', width=2)

# Draw horizontal grid lines
for i in range(grid_size + 1):
    y = i * y_spacing
    draw.line([(0, y), (width, y)], fill='red', width=2)

# Now, draw numbers on each grid cell
# Set the font size relative to the grid cell size
font_size = int(min(x_spacing, y_spacing) / 4)
try:
    # Try to use a TrueType font
    font = ImageFont.truetype("arial.ttf", font_size)
except IOError:
    # Fallback to the default PIL font if the TrueType font is not available
    font = ImageFont.load_default()

# Numbering the cells from 1 to grid_size * grid_size
cell_number = 1

for row in range(grid_size):
    for col in range(grid_size):
        # Calculate the top-left corner of the cell
        x = col * x_spacing
        y = row * y_spacing
        # Calculate the center position of the cell
        center_x = x + x_spacing / 2
        center_y = y + y_spacing / 2
        # Get the size of the text to center it
        text = str(cell_number)
        try:
            # For newer versions of Pillow
            bbox = font.getbbox(text)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
        except AttributeError:
            # For older versions of Pillow
            text_width, text_height = font.getsize(text)
        # Calculate the position to center the text
        text_x = center_x - text_width / 2
        text_y = center_y - text_height / 2
        # Draw the number
        draw.text((text_x, text_y), text, fill="white", font=font, font_size=30)
        cell_number += 1

# Save the edited image
image.save('screenshot_with_grid_numbers.png')
print("Screenshot with grid and numbers saved as 'screenshot_with_grid_numbers.png'")
