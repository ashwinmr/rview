const { app, Menu, dialog, globalShortcut, BrowserWindow } = require('electron')
const path = require('path')
const url = require('url')

// Start the program when app is ready
app.on('ready', function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({ width: 800, height: 600 })

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
            click() {
                dialog.showOpenDialog({
                        title: "Open",
                    },
                    (file_paths) => {
                        win.webContents.send("Open", file_paths[0])
                    }
                )
            }
        }]

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
    globalShortcut.register('Ctrl+r', () => {
        win.webContents.send("Key_Ctrl_R")
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