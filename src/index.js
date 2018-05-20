const { ipcRenderer } = require('electron')
const path = require('path')
const fs = require('fs')

var Image_Elem = document.getElementById('image')
var Cur_File_Name
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

// Set callback functions
ipcRenderer.on("Open", (event, file_path) => {
    Open_File(file_path)
})
document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowRight':
            Open_File(Get_File(Cur_File, Cur_Dir, Cur_Files, 1))
            break
        case 'ArrowLeft':
            Open_File(Get_File(Cur_File, Cur_Dir, Cur_Files, -1))
            break
        default:
    }
})

// Open the starting image
Open_File(path.join(__dirname, '../test/1.jpg'))