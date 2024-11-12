import pyautogui
import tkinter as tk
from time import sleep
import subprocess

def visualize_click(x, y, duration=1):
    """
    Creates a visual indicator at the click location
    """
    window = tk.Tk()
    window.attributes('-alpha', 0.7)
    window.attributes('-topmost', True)
    window.overrideredirect(True)
    
    size = 20
    window.geometry(f'{size}x{size}+{x-size//2}+{y-size//2}')
    
    canvas = tk.Canvas(window, width=size, height=size, highlightthickness=0, bg='red')
    canvas.create_oval(2, 2, size-2, size-2, fill='red')
    canvas.pack()
    
    window.update()
    window.after(int(duration * 3000), window.destroy)
    window.mainloop()

def click_with_visualization(x, y, duration=1):
    """
    Performs a click using xdotool and shows where it happened
    """
    try:
        # Move mouse using xdotool
        subprocess.run(['xdotool', 'mousemove', str(x), str(y)], check=True)
        sleep(0.5)  # Small delay to ensure mouse has moved
        subprocess.run(['xdotool', 'click', '1'], check=True)  # Left click
        
        print(f"Clicked at coordinates: x={x}, y={y}")
        
        # Show the visualization
        visualize_click(x, y, duration)
    except Exception as e:
        print(f"Error during click operation: {e}")
        print("Make sure xdotool is installed: sudo apt install xdotool")

# Get screen information
screen_width = pyautogui.size()[0]
screen_height = pyautogui.size()[1]

# Calculate position (7% from left, 87% from top)
x_pos = int(screen_width * 0.49)
y_pos = int(screen_height * 0.98)

print(f"Screen size: {screen_width}x{screen_height}")
print(f"Attempting to click at: {x_pos}, {y_pos}")

# Add small delay at start to give time to switch to correct window
print("Starting in 3 seconds...")
sleep(3)

click_with_visualization(x_pos, y_pos)