import json
from PIL import Image, ImageDraw, ImageFont

# Load the cell data from the JSON file
with open('cells.json', 'r') as f:
    cells = json.load(f)

# Open the original image
image = Image.open('main_screen_screenshot.png')

# Grid size of the original image
grid_size = 10  # 10x10 grid

# Example: Extract the area of a specific cell and its neighbors
cell_number_to_extract = 51  # Replace with your target cell number

# Calculate the row and column of the target cell
row = (cell_number_to_extract - 1) // grid_size
col = (cell_number_to_extract - 1) % grid_size

# Initialize a list to hold the cell numbers to extract
cells_to_extract = []

# Iterate over neighboring positions (including the target cell)
for delta_row in [-1, 0, 1]:
    for delta_col in [-1, 0, 1]:
        new_row = row + delta_row
        new_col = col + delta_col
        # Check if the new position is within grid boundaries
        if 0 <= new_row < grid_size and 0 <= new_col < grid_size:
            new_cell_number = new_row * grid_size + new_col + 1
            cells_to_extract.append(new_cell_number)

# Retrieve coordinates of the cells to extract
cells_coordinates = []

for cell in cells:
    if cell['cell_number'] in cells_to_extract:
        coords = cell['coordinates']
        # Convert coordinates to integers (pixel values)
        x1 = int(coords['x1'])
        y1 = int(coords['y1'])
        x2 = int(coords['x2'])
        y2 = int(coords['y2'])
        cells_coordinates.append((x1, y1, x2, y2))

# Calculate the bounding box that includes all selected cells
x1_list = [coord[0] for coord in cells_coordinates]
y1_list = [coord[1] for coord in cells_coordinates]
x2_list = [coord[2] for coord in cells_coordinates]
y2_list = [coord[3] for coord in cells_coordinates]

min_x1 = min(x1_list)
min_y1 = min(y1_list)
max_x2 = max(x2_list)
max_y2 = max(y2_list)

# Crop the area from the original image
cropped_image = image.crop((min_x1, min_y1, max_x2, max_y2))

# Save the cropped image (optional)
cropped_image.save(f'cell_{cell_number_to_extract}_with_neighbors.png')
print(f"Extracted cell {cell_number_to_extract} and its neighbors, saved as 'cell_{cell_number_to_extract}_with_neighbors.png'")

# Now, create a new grid on the cropped image
# Get the dimensions of the cropped image
cropped_width, cropped_height = cropped_image.size

# Create a drawing context on the cropped image
draw = ImageDraw.Draw(cropped_image)

# Define the new grid size (e.g., 5x5)
new_grid_size = 5  # For a 5x5 grid

# Calculate the spacing between lines
x_spacing = cropped_width / new_grid_size
y_spacing = cropped_height / new_grid_size

# Initialize a list to hold new cell data
new_cells = []

# Draw vertical grid lines
for i in range(new_grid_size + 1):
    x = i * x_spacing
    draw.line([(x, 0), (x, cropped_height)], fill='blue', width=2)

# Draw horizontal grid lines
for i in range(new_grid_size + 1):
    y = i * y_spacing
    draw.line([(0, y), (cropped_width, y)], fill='blue', width=2)

# Optional: Draw numbers on each grid cell in the cropped image
# Numbering can start from 1 to new_grid_size * new_grid_size
cell_number = 1
font_size = int(min(x_spacing, y_spacing) / 4)

try:
    # Try to use a TrueType font
    font = ImageFont.truetype("arial.ttf", font_size)
except IOError:
    # Fallback to the default PIL font if the TrueType font is not available
    font = ImageFont.load_default()

for row in range(new_grid_size):
    for col in range(new_grid_size):
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
        draw.text((text_x, text_y), text, fill="white", font=font)

        # Save new cell info
        cell_info = {
            'cell_number': cell_number,
            'coordinates': {
                'x1': x,
                'y1': y,
                'x2': x + x_spacing,
                'y2': y + y_spacing
            }
        }
        new_cells.append(cell_info)

        cell_number += 1

# Save the cropped image with the new grid
cropped_image.save(f'cell_{cell_number_to_extract}_with_neighbors_grid.png')
print(f"Added a {new_grid_size}x{new_grid_size} grid to the extracted image, saved as 'cell_{cell_number_to_extract}_with_neighbors_grid.png'")

# Save the new cell data to a JSON file
with open(f'cells_new_{cell_number_to_extract}.json', 'w') as f:
    json.dump(new_cells, f, indent=4)  # Use indent for pretty formatting
print(f"New cell data saved as 'cells_new_{cell_number_to_extract}.json'")
