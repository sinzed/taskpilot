import pyautogui

# Ensure the screen's resolution matches your screenshot for accurate detection
icon_location = pyautogui.locateOnScreen('firefox_icon.png', confidence=0.9)

if icon_location:
    pyautogui.moveTo(icon_location, duration=1)
    pyautogui.click()
else:
    print("Icon not found on the screen.")
