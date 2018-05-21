const { ipcRenderer } = require('electron')
const path = require('path')
const fs = require('fs')

var Image_Elem = document.getElementById('image')
var Image_Scale = 1
var Cur_File
var Cur_Dir
var Cur_Files

// Display image from path
function Display_Image(file_path) {
    Image_Elem.src = file_path
}

// Wrap index for array
function Wrap_Index(ind, length) {
    return ((ind % length) + length) % length;
}

// Get file path from a list of files at an increment from the current file path
function Get_File(cur_file, cur_dir, file_list, increment) {

    cur_ind = file_list.indexOf(cur_file)
    ind = Wrap_Index(cur_ind + increment, file_list.length)

    return path.join(cur_dir, file_list[ind])
}

// Open file and store globals
function Open_File(file_path) {
    Cur_Dir = path.dirname(file_path)
    Cur_File = path.basename(file_path)
    fs.readdir(Cur_Dir, (err, files) => {
        Cur_Files = files
    })
    Display_Image(file_path)
}

// Zoom image
function Zoom(direction) {
    Image_Scale += 0.1 * direction
    if (Image_Scale < 0) {
        Image_Scale = 0
    }
    Image_Elem.style.transform = 'scale(' + Image_Scale + ')'
}

// Set callback functions

ipcRenderer.on("Open", (event, file_path) => {
    Open_File(file_path)
})
ipcRenderer.on("Key_Right", (event) => {
    if (document.hasFocus()) {
        Open_File(Get_File(Cur_File, Cur_Dir, Cur_Files, 1))
    }
})
ipcRenderer.on("Key_Left", (event) => {
    if (document.hasFocus()) {
        Open_File(Get_File(Cur_File, Cur_Dir, Cur_Files, -1))
    }
})
ipcRenderer.on("Key_Ctrl_Plus", (event) => {
    if (document.hasFocus()) {
        Zoom(1)
    }
})
ipcRenderer.on("Key_Ctrl_Equals", (event) => {
    if (document.hasFocus()) {
        Zoom(1)
    }
})
ipcRenderer.on("Key_Ctrl_Minus", (event) => {
    if (document.hasFocus()) {
        Zoom(-1)
    }
})

// Open the starting image
Open_File(path.join(__dirname, '../test/1.jpg'))