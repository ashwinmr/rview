const { app, Menu, dialog, globalShortcut, BrowserWindow } = require('electron')
const fs = require('fs')
const path = require('path')
const url = require('url')

// Start the program when app is ready
app.on('ready', function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        show: false, // Show and mazimize later
        icon: path.join(__dirname, 'assets', 'icons', 'main.ico')
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
                // Exit
                label: 'Exit',
                click() {
                    win.close()
                }
            }
        ]

    }, {
        label: 'Help',
        // Allow opening browser dev tool
        submenu: [{
            label: 'DevTool',
            click() {
                win.webContents.openDevTools()
            }
        }]
    }])

    // Set menu
    Menu.setApplicationMenu(menu)

    // Register key callbacks
    globalShortcut.register('Right', () => {
        win.webContents.send("Key_Right")
    })
    globalShortcut.register('Left', () => {
        win.webContents.send("Key_Left")
    })
    globalShortcut.register('Ctrl+Plus', () => {
        win.webContents.send("Key_Ctrl_Plus")
    })
    globalShortcut.register('Ctrl+=', () => {
        win.webContents.send("Key_Ctrl_Equals")
    })
    globalShortcut.register('Ctrl+-', () => {
        win.webContents.send("Key_Ctrl_Minus")
    })
    globalShortcut.register('Esc', () => {
        win.webContents.send("Key_Esc")
    })
    globalShortcut.register('Ctrl+f', () => {
        win.webContents.send("Key_Ctrl_F")
    })
    globalShortcut.register('Ctrl+v', () => {
        win.webContents.send("Key_Ctrl_V")
    })
    globalShortcut.register('Ctrl+r', () => {
        win.webContents.send("Key_Ctrl_R")
    })

    // Perform actions after window is loaded
    win.webContents.on('did-finish-load', () => {

        // Handle loading of file when opened with electron
        let path_arg = process.argv[1]
        if (path_arg !== '.') {
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