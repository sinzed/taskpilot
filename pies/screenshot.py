import json
import argparse
from PIL import Image, ImageDraw, ImageFont, ImageGrab
import os
import sys


def load_cells(json_path):
    """Load cell data from a JSON file."""
    with open(json_path, 'r') as f:
        return json.load(f)

def save_cells(cells, json_path):
    """Save cell data to a JSON file."""
    with open(json_path, 'w') as f:
        json.dump(cells, f, indent=4)
    print(f"Extracted cells saved to '{json_path}'")

def extract_cells(cells, cell_numbers):
    """Extract specific cells based on cell numbers."""
    extracted = [cell for cell in cells if cell['cell_number'] in cell_numbers]
    if not extracted:
        raise ValueError("No matching cells found for the provided cell numbers.")
    return extracted

def calculate_bounding_box(cells_coordinates):
    """Calculate the bounding box that includes all selected cells."""
    x1_list = [coord[0] for coord in cells_coordinates]
    y1_list = [coord[1] for coord in cells_coordinates]
    x2_list = [coord[2] for coord in cells_coordinates]
    y2_list = [coord[3] for coord in cells_coordinates]

    min_x1 = min(x1_list)
    min_y1 = min(y1_list)
    max_x2 = max(x2_list)
    max_y2 = max(y2_list)
    if(max_x2 > 1920):
        max_x2 = 1920
    return (min_x1, min_y1, max_x2, max_y2)

def crop_image(image, bounding_box):
    """Crop the image to the specified bounding box."""
    return image.crop(bounding_box)

def draw_grid(image, grid_size, output_path):
    """Draw a grid on the image with a semi-transparent gray overlay for each cell and save it."""
    # Ensure the image is in RGBA mode to support transparency
    if image.mode != 'RGBA':
        image = image.convert('RGBA')
    
    # Create an overlay image for the semi-transparent gray rectangles
    overlay = Image.new('RGBA', image.size, (255, 255, 255, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    
    width, height = image.size

    x_spacing = width / grid_size
    y_spacing = height / grid_size

    # Define the semi-transparent gray color
    gray_overlay = (100, 100, 100, 150)  # RGBA: Gray with alpha=100 for transparency

    # Draw semi-transparent gray rectangles for each grid cell
    for row in range(grid_size):
        for col in range(grid_size):
            x1 = col * x_spacing
            y1 = row * y_spacing
            x2 = (col + 1) * x_spacing
            y2 = (row + 1) * y_spacing
            overlay_draw.rectangle([x1, y1, x2, y2], fill=gray_overlay)

    # Composite the overlay with the original image
    image = Image.alpha_composite(image, overlay)

    # Now draw the grid lines on the composited image
    draw = ImageDraw.Draw(image)
    
    # Draw vertical grid lines
    for i in range(grid_size + 1):
        x = i * x_spacing
        draw.line([(x, 0), (x, height)], fill='red', width=2)

    # Draw horizontal grid lines
    for i in range(grid_size + 1):
        y = i * y_spacing
        draw.line([(0, y), (width, y)], fill='red', width=2)

    # Optional: Draw numbers on each grid cell
    cell_number = 1
    font_size = int(min(x_spacing, y_spacing) / 2)

    try:
        # Try to use a TrueType font
        font = ImageFont.truetype("arial.ttf", font_size)
    except IOError:
        # Fallback to the default PIL font if the TrueType font is not available
        font = ImageFont.load_default()

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
            draw.text((text_x, text_y), text, fill="white", font=font)
            cell_number += 1

    # Save the gridded image
    image = image.convert('RGB')  # Convert back to RGB if you don't need transparency in the saved image
    image.save(output_path)
    print(f"Gridded image with transparent overlays saved to '{output_path}'")

def generate_default_cells(image_width, image_height, grid_size=5):
    """Generate default cell data for a grid covering the entire image."""
    cells = []
    cell_width = image_width / grid_size
    cell_height = image_height / grid_size
    cell_number = 1

    for row in range(grid_size):
        for col in range(grid_size):
            x1 = int(col * cell_width)
            y1 = int(row * cell_height)
            x2 = int((col + 1) * cell_width)
            y2 = int((row + 1) * cell_height)
            cells.append({
                "cell_number": cell_number,
                "coordinates": {
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2
                }
            })
            cell_number += 1

    return cells

def main(args):
    # Handle input image
    if args.input_image:
        if not os.path.isfile(args.input_image):
            print(f"Error: The input image file '{args.input_image}' does not exist.")
            sys.exit(1)
        image = Image.open(args.input_image)
        overlay = Image.new('RGBA', image.size, (255, 255, 255, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        print(f"Loaded input image from '{args.input_image}'")
    else:
        # Capture the entire screen
        print("No input image provided. Capturing the entire screen...")
        image = ImageGrab.grab()
        image.save('captured_screen.png')
        print("Screenshot captured and saved as 'captured_screen.png'")

    # Handle input JSON
    if args.input_json:
        if not os.path.isfile(args.input_json):
            print(f"Error: The input JSON file '{args.input_json}' does not exist.")
            sys.exit(1)
        cells = load_cells(args.input_json)
        print(f"Loaded cell data from '{args.input_json}'")
    else:
        # Generate default cell data based on grid size
        print("No input JSON provided. Generating default cell data...")
        grid_size_default = args.grid_size
        image_width, image_height = image.size
        cells = generate_default_cells(image_width, image_height, grid_size=grid_size_default)
        print(f"Default cell data generated with grid size {grid_size_default}x{grid_size_default}")

    # Handle cells to extract
    if args.cells:
        cells_to_extract = args.cells
        print(f"Cells to extract: {cells_to_extract}")
    else:
        # If cells not provided, extract all cells
        cells_to_extract = [cell['cell_number'] for cell in cells]
        print("No specific cells provided. Extracting all cells.")

    # Extract specified cells
    try:
        extracted_cells = extract_cells(cells, cells_to_extract)
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)

    # Save extracted cells to JSON
    if args.output_json:
        save_cells(extracted_cells, args.output_json)
    else:
        # If no output_json provided, save to 'extracted_cells.json'
        default_output_json = 'extracted_cells.json'
        save_cells(extracted_cells, default_output_json)

    # Retrieve coordinates of the cells to extract
    cells_coordinates = []
    for cell in extracted_cells:
        coords = cell['coordinates']
        # Convert coordinates to integers (pixel values)
        x1 = int(coords['x1'])
        y1 = int(coords['y1'])
        x2 = int(coords['x2'])
        y2 = int(coords['y2'])
        cells_coordinates.append((x1, y1, x2, y2))

    # Calculate the bounding box that includes all selected cells
    bounding_box = calculate_bounding_box(cells_coordinates)
    print(f"Bounding box for cropping: {bounding_box}")

    # Crop the image
    cropped_image = crop_image(image, bounding_box)
    if args.output_image:
        cropped_image.save(args.output_image)
        print(f"Cropped image saved to '{args.output_image}'")
    else:
        # If no output_image provided, save to 'cropped.png'
        default_cropped_image = 'cropped.png'
        cropped_image.save(default_cropped_image)
        print(f"Cropped image saved to '{default_cropped_image}'")

    # Create a gridded image
    if args.output_gridded_image:
        gridded_image_path = args.output_gridded_image
    else:
        gridded_image_path = 'cropped_gridded.png'

    gridded_image = cropped_image.copy()
    draw_grid(gridded_image, args.grid_size, gridded_image_path)

def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Extract and process specific cells from an image and JSON data. "
                    "If input image or JSON is not provided, the script captures the screen and generates default cell data."
    )
    parser.add_argument(
        '--cells',
        nargs='+',
        type=int,
        help='List of cell numbers to extract (e.g., --cells 1 2 3 4). If not provided, all cells will be extracted.'
    )
    parser.add_argument(
        '--input_image',
        type=str,
        help='Path to the input screenshot image (e.g., input.png). If not provided, the script captures the entire screen.'
    )
    parser.add_argument(
        '--input_json',
        type=str,
        help='Path to the input JSON cells file (e.g., cells.json). If not provided, the script generates default cell data.'
    )
    parser.add_argument(
        '--output_json',
        type=str,
        help='Path to save the extracted JSON cells (e.g., extracted_cells.json). Defaults to "extracted_cells.json" if not provided.'
    )
    parser.add_argument(
        '--output_image',
        type=str,
        help='Path to save the cropped non-gridded screenshot (e.g., cropped.png). Defaults to "cropped.png" if not provided.'
    )
    parser.add_argument(
        '--output_gridded_image',
        type=str,
        help='Path to save the cropped gridded screenshot (e.g., cropped_gridded.png). Defaults to "cropped_gridded.png" if not provided.'
    )
    parser.add_argument(
        '--grid_size',
        type=int,
        default=5,
        help='Grid size for the gridded image (default: 5). Used for both default cell generation and grid overlay.'
    )
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_arguments()
    main(args)
