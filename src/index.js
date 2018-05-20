const { ipcRenderer } = require('electron')
const path = require('path')
const fs = require('fs')

var Image_Elem = document.getElementById('image')

// Display image from path
function Display_Image(file_path) {
    Image_Elem.src = file_path
}

// Set callback functions
ipcRenderer.on("Display_Image", (event, message) => { Display_Image(message) })

Display_Image('../test/1.jpg')