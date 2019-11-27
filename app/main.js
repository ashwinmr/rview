const { app, Menu, dialog, globalShortcut, BrowserWindow, ipcMain } = require('electron')
const fs = require('fs')
const path = require('path')
const url = require('url')

// Debug options
const Debug = {
    DevTool: true,
}

// Set fullscreen
function Set_Fullscreen(set_val) {
    if (set_val) {
        win.setFullScreen(true)
        win.setMenuBarVisibility(false)
        win.webContents.send('Set_Fullscreen', true)
    } else {
        win.setFullScreen(false)
        win.setMenuBarVisibility(true)
        win.webContents.send('Set_Fullscreen', false)
    }
}

// Check if path is file
function Is_File(path) {
    if (fs.existsSync(path) && fs.lstatSync(path).isFile()) {
        return true;
    } else {
        return false;
    }
}

// Toggle fullscreen
function Toggle_Fullscreen(win) {
    if (win.isFullScreen()) {
        Set_Fullscreen(false)
    } else {
        Set_Fullscreen(true)
    }
}

// Start the program when app is ready
app.on('ready', function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        show: false, // Show and mazimize later
        icon: path.join(__dirname, 'assets', 'icons', 'main_icon.png'),
        webPreferences: {
            nodeIntegration: true
        }
    })

    // Load the index.html of the app.
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'src', 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    // Create the menu
    const menu = Menu.buildFromTemplate([{
            label: 'File',
            submenu: [{
                    // Open dialog
                    label: 'Open',
                    accelerator: 'Ctrl+o',
                    click() {
                        dialog.showOpenDialog({
                            title: "Open",
                        }).then((result) => {
                            file_paths = result.filePaths
                            if (Is_File(file_paths[0])) {
                                win.webContents.send("Open", file_paths[0])
                            }
                        })
                    }
                },
                {
                    // Save dialog
                    label: 'Save',
                    accelerator: 'Ctrl+s',
                    click() {
                        dialog.showSaveDialog({
                            title: "Save",
                            filters: [{ name: 'Image', extensions: ['png', 'jpg'] }]
                        }).then((result) => {
                            save_path = result.filePath
                            if (save_path != undefined) {
                                win.webContents.send("Save", save_path)
                            }
                        })
                    }
                },
                {
                    // Delete
                    label: 'Delete',
                    accelerator: 'delete',
                    click() {
                        win.webContents.send("Delete")
                    }
                },
                {
                    // Exit
                    label: 'Quit',
                    accelerator: 'ctrl+q',
                    click() {
                        win.close()
                    }
                }
            ]

        },
        {
            label: 'Edit',
            // Options to edit the image
            submenu: [{
                    label: 'Copy',
                    click() { win.webContents.send('Copy') },
                    // Ctrl + C accelerator doesn't work. For show. Implement elsewhere
                    accelerator: 'Ctrl+C'
                },
                {
                    label: 'Paste',
                    click() { win.webContents.send('Paste') },
                    // Ctrl + C accelerator doesn't work. For show. Implement elsewhere
                    accelerator: 'Ctrl+V'
                },
                {
                    label: 'Next',
                    click() { win.webContents.send('Next') },
                    accelerator: 'Right'
                },
                {
                    label: 'Previous',
                    click() { win.webContents.send('Previous') },
                    accelerator: 'Left'
                },
                {
                    label: 'Zoom In',
                    click() { win.webContents.send('Zoom_In') },
                    accelerator: 'Ctrl+Plus'
                },
                {
                    label: 'Zoom Out',
                    click() { win.webContents.send('Zoom_Out') },
                    accelerator: 'Ctrl+-'
                },
                {
                    label: 'Reset',
                    click() {
                        Set_Fullscreen(false)
                        win.webContents.send('Reset')
                    },
                    accelerator: 'Esc'
                },
                {
                    label: 'Flip Horizontal',
                    click() { win.webContents.send('Flip_Horizontal') },
                    accelerator: 'Ctrl+F'
                },
                {
                    label: 'Flip Vertical',
                    click() { win.webContents.send('Flip_Vertical') },
                    accelerator: 'Shift+F'
                },
                {
                    label: 'Rotate Clockwise',
                    click() { win.webContents.send('Rotate_CW') },
                    accelerator: 'Ctrl+R'
                },
                {
                    label: 'Toggle Fullscreen',
                    click() { Toggle_Fullscreen(win) },
                    accelerator: 'F11'
                },
            ]
        },
        {
            label: 'Help',
            // Allow opening browser dev tool
            submenu: [{
                label: 'DevTool',
                accelerator: 'Ctrl+D',
                enabled: Debug.DevTool,
                visible: Debug.DevTool,
                click() {
                    win.webContents.toggleDevTools()
                }
            }]
        }
    ])

    // Set menu
    Menu.setApplicationMenu(menu)

    // Perform actions after window is loaded
    win.webContents.on('did-finish-load', () => {

        // Handle loading of file when opened with electron
        let path_arg = process.argv[1]
        if (Is_File(path_arg)) {
            win.webContents.send("Open", path_arg)
        }

        // Show and maximize
        win.maximize()

    })

    // Handle toggle fullscreen
    ipcMain.on('toggle_fullscreen', (e) => {
        Toggle_Fullscreen(win)
    })

})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})