import pyautogui
print(pyautogui.size())
# pyautogui.moveTo(1500, 500, duration = 1)
pyautogui.moveRel(50, 50, duration = 1)
# pyautogui.click(500, 500)
pyautogui.click()
pyautogui.typewrite("hello Geeks !")
im2 = pyautogui.screenshot('my_screenshot.png')