import webview
import os
import sys

def get_asset_path():
    if getattr(sys, 'frozen', False):
        application_path = os.path.join(sys._MEIPASS, 'dist')
    else:
        application_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist')
    
    return application_path

def main():
    asset_path = get_asset_path()
    webview.create_window(
        "RPG Event Editor",
        url=os.path.join(asset_path, "index.html"), 
        width=1024,
        height=768,
        resizable=True
    )
    webview.start()

if __name__ == '__main__':
    print(f"Running RPG Event Editor...")
    main()