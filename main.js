const { app, Menu, dialog, globalShortcut, BrowserWindow } = require('electron')
const fs = require('fs')
const path = require('path')
const url = require('url')

// Start the program when app is ready
app.on('ready', function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        show: false, // Show and mazimize later
        icon: path.join(__dirname, 'assets', 'icons', 'main_icon.ico')
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
                            },
                            (file_paths) => {
                                if (file_paths !== undefined) {
                                    win.webContents.send("Open", file_paths[0])
                                }
                            }
                        )
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
                            },
                            (save_path) => {
                                if (save_path != undefined) {
                                    win.webContents.send("Save", save_path)
                                }
                            }
                        )
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
                    click() { win.webContents.send('Reset') },
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
                    label: 'Rotate Counter Clockwise',
                    click() { win.webContents.send('Rotate_CCW') },
                    accelerator: 'Shift+R'
                },
            ]
        },
        {
            label: 'Help',
            // Allow opening browser dev tool
            submenu: [{
                label: 'DevTool',
                accelerator: 'Ctrl+D',
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
        if (path_arg !== '.' && path_arg !== undefined) {
            win.webContents.send("Open", path_arg)
        }

        // Show and maximize
        win.maximize()

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