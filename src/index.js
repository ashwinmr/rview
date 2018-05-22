const { ipcRenderer } = require('electron')
const path = require('path')
const fs = require('fs')

var Image_Elem = document.getElementById('image')
var Image_Scale = 1
var Cur_File
var Cur_Dir
var Cur_Files

// Create a class to handle transformation
class Transformation {
    constructor(image_elem) {
        this.Scale_X = 1
        this.Scale_Y = 1
        this.Image_Elem = image_elem
    }

    get Result() {
        return 'scale(' + this.Scale_X + ',' + this.Scale_Y + ')'
    }

    Apply() {
        this.Image_Elem.style.transform = this.Result
    }

    Reset() {
        this.Scale_X = 1
        this.Scale_Y = 1

        this.Apply()
    }

    Zoom(direction) {
        // Zoom, but don't allow sign change
        let scale_x = this.Scale_X
        if (scale_x * (scale_x + 0.1 * direction) > 0) {
            this.Scale_X += 0.1 * direction
        }
        let scale_y = this.Scale_Y
        if (scale_y * (scale_y + 0.1 * direction) > 0) {
            this.Scale_Y += 0.1 * direction
        }
        this.Apply()
    }

    Flip_H() {
        this.Scale_X = -this.Scale_X
        this.Apply()
    }

    Flip_V() {
        this.Scale_Y = -this.Scale_Y
        this.Apply()
    }
}

Transform = new Transformation(Image_Elem)

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

// Handle drag and drop

document.addEventListener('dragover', (e) => {
    e.preventDefault();
})
document.addEventListener('drop', (e) => {
    e.preventDefault();
    file_path = e.dataTransfer.files[0].path
    Open_File(file_path)
})

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
        Transform.Zoom(1)
    }
})
ipcRenderer.on("Key_Ctrl_Equals", (event) => {
    if (document.hasFocus()) {
        Transform.Zoom(1)
    }
})
ipcRenderer.on("Key_Ctrl_R", (event) => {
    if (document.hasFocus()) {
        Transform.Reset()
    }
})
ipcRenderer.on("Key_Ctrl_Minus", (event) => {
    if (document.hasFocus()) {
        Transform.Zoom(-1)
    }
})
ipcRenderer.on("Key_Ctrl_F", (event) => {
    if (document.hasFocus()) {
        Transform.Flip_H()
    }
})
ipcRenderer.on("Key_Ctrl_V", (event) => {
    if (document.hasFocus()) {
        Transform.Flip_V()
    }
})

// Open the starting image
Open_File(path.join(__dirname, '../test/1.jpg'))