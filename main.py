import webview
import os
import sys

def get_asset_path():
    # Handle paths for both development and bundled exe
    if getattr(sys, 'frozen', False):
        # If the application is run as a bundle
        application_path = sys._MEIPASS
    else:
        # If the application is run from a Python interpreter
        application_path = os.path.dirname(os.path.abspath(__file__))
    
    return application_path

def main():
    asset_path = get_asset_path()
    # Create a window loading your index.html
    webview.create_window(
        "RPG Event Editor",
        url=os.path.join(asset_path, "editor.html"),
        width=1024,
        height=768,
        resizable=True
    )
    webview.start()

if __name__ == '__main__':
    print(f"Running RPG Event Editor...")
    main()