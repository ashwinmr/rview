const { app, Menu, dialog, BrowserWindow } = require('electron')
const path = require('path')
const url = require('url')

// Start the program when app is ready
app.on('ready', function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({ width: 800, height: 600 })

    // and load the index.html of the app.
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'src', 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    // Create the menu
    const menu = Menu.buildFromTemplate([{
        label: 'File',
        submenu: [{
            label: 'Open',
            click() {
                dialog.showOpenDialog({
                        title: "Select Image",
                    },
                    (file_paths) => {
                        win.webContents.send("Display_Image", file_paths)
                    }
                )
            }
        }]
    }])

    // Set menu
    Menu.setApplicationMenu(menu)

    // Open the DevTools.
    win.webContents.openDevTools()
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})