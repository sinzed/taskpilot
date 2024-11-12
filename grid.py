from PIL import Image

def grid_screenshot(filename='screenshot.png', grid_size=10):
  """
  Captures a screenshot, grids it into a specified number of boxes,
  and optionally saves each box as a separate image.

  Args:
    filename (str): The filename for the captured screenshot.
    grid_size (int): The number of rows/columns in the grid.
  """

  # Capture the screenshot
  im = ImageGrab.grab()

  # Get image dimensions
  width, height = im.size

  # Calculate box dimensions
  box_width = width // grid_size
  box_height = height // grid_size

  # Iterate over the grid and crop boxes
  for i in range(grid_size):
    for j in range(grid_size):
      box = (i * box_width, j * box_height, (i + 1) * box_width, (j + 1) * box_height)
      cropped_image = im.crop(box)

      # Optionally save each box as a separate image
      # cropped_image.save(f"box_{i}_{j}.png")

      # Display the cropped image (for debugging)
      cropped_image.show()

if __name__ == "__main__":
  grid_screenshot()