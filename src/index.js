const { ipcRenderer, nativeImage, clipboard } = require('electron')
const path = require('path')
const fs = require('fs')
const mousetrap = require('mousetrap') // Can't be used in node. Only in browser

var Image_Elem = document.getElementById('image')
var Image_Scale = 1
var Cur_File
var Cur_Dir
var Cur_Files
var Time = new Date()

// Create a class to handle transformation
class Transformation {
    constructor(image_elem) {
        this.Image_Elem = image_elem
        this.Reset()
    }

    get Result() {
        // Translation is needed to absolute center image
        return 'translate(-50%,-50%) ' +
            'rotate(' + this.Angle + 'deg) ' +
            'scale(' + this.Scale_X + ',' + this.Scale_Y + ')'
    }

    Apply() {
        this.Image_Elem.style.transform = this.Result
    }

    Reset() {
        this.Scale_X = 1
        this.Scale_Y = 1
        this.Angle = 0
        this.Apply()
    }

    Zoom(direction, increment) {

        // Get the direction as + or - 1
        direction = Math.sign(direction)

        // Get increment as an absolute value
        if (increment === undefined) {
            increment = 0.1
        } else {
            increment = Math.abs(increment)
        }

        let scale_x = this.Scale_X
        let scale_y = this.Scale_Y
        let min_zoom = 0.1

        // Scale taking care of image flip
        scale_x = scale_x + increment * direction * Math.sign(this.Scale_X)
        if (Math.abs(scale_x) > min_zoom && Math.sign(this.Scale_X) === Math.sign(scale_x)) {
            this.Scale_X = scale_x
        } else {
            this.Scale_X = min_zoom * Math.sign(this.Scale_X)
        }

        scale_y = scale_y + increment * direction * Math.sign(this.Scale_Y)
        if (Math.abs(scale_y) >= min_zoom && Math.sign(this.Scale_Y) === Math.sign(scale_y)) {
            this.Scale_Y = scale_y
        } else {
            this.Scale_Y = min_zoom * Math.sign(this.Scale_Y)
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

    Rotate(direction) {
        this.Angle += direction * 90
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
function Get_File(increment) {
    let cur_file = Cur_File
    let cur_dir = Cur_Dir
    let file_list = Cur_Files

    if (cur_file !== undefined && cur_dir !== undefined && file_list !== undefined) {
        cur_ind = file_list.indexOf(cur_file)
        ind = cur_ind + increment
            // Limit to file list
        ind = ind < 0 ? 0 : ind >= file_list.length ? file_list.length - 1 : ind
        return path.join(cur_dir, file_list[ind])
    }
}

// Open file and store globals
function Open_File(file_path) {
    if (file_path !== undefined) {
        Cur_Dir = path.dirname(file_path)
        Cur_File = path.basename(file_path)
        fs.readdir(Cur_Dir, (err, files) => {
            Cur_Files = files
        })
        Display_Image(file_path)
    }
}

// Open image from data url
function Open_Image(data_url) {
    Display_Image(data_url)
}

// Save file
function Save_File(save_path) {
    if (Cur_Dir !== undefined && Cur_File !== undefined) {
        let file_path = path.join(Cur_Dir, Cur_File)
        let image = nativeImage.createFromPath(file_path).toPNG()
        fs.writeFile(save_path, image, () => {});
    }
}

// Copy image to clipboard
function Copy() {
    if (Cur_Dir !== undefined && Cur_File !== undefined) {
        let file_path = path.join(Cur_Dir, Cur_File)
        let image = nativeImage.createFromPath(file_path)
        clipboard.writeImage(image)
    }
}

// Paste image from clipboard
function Paste() {
    let image = clipboard.readImage()
    if (!image.isEmpty()) {
        Open_Image(image.toDataURL())
    }
}

// Set callback functions

// Handle drag and drop

document.addEventListener('dragover', (e) => {
    e.preventDefault();
})
document.addEventListener('drop', (e) => {
    e.preventDefault();
    let file = e.dataTransfer.files[0]
    if (file !== undefined) {
        Open_File(file.path)
    }
})

// Handle scroll zoom
document.addEventListener('mousewheel', (e) => {
    let rate = e.deltaY
    let multiplier = 0.001

    if (rate > 0) {
        Transform.Zoom(-1, rate * multiplier)
    } else {
        Transform.Zoom(1, rate * multiplier)
    }
})

// Handle logging main process messages to console
ipcRenderer.on("Log", (event, message) => {
    console.log(message)
})

// Handle main process events
ipcRenderer.on("Open", (event, file_path) => {
    Open_File(file_path)
})
ipcRenderer.on("Save", (event, file_path) => {
    Save_File(file_path)
})
ipcRenderer.on("Next", (event) => {
    Open_File(Get_File(1))
})
ipcRenderer.on("Previous", (event) => {
    Open_File(Get_File(-1))
})
ipcRenderer.on("Zoom_In", (event) => {
    Transform.Zoom(1)
})
ipcRenderer.on("Zoom_Out", (event) => {
    Transform.Zoom(-1)
})
ipcRenderer.on("Reset", (event) => {
    Transform.Reset()
})
ipcRenderer.on("Flip_Horizontal", (event) => {
    Transform.Flip_H()
})
ipcRenderer.on("Flip_Vertical", (event) => {
    Transform.Flip_V()
})
ipcRenderer.on("Rotate_CW", (event) => {
    Transform.Rotate(1)
})
ipcRenderer.on("Rotate_CCW", (event) => {
    Transform.Rotate(-1)
})
ipcRenderer.on("Copy", (event) => {
    Copy()
})
ipcRenderer.on("Paste", (event) => {
    Paste()
})

// Add keyboard shortcuts 
mousetrap.bind('ctrl+c', () => {
    Copy()
})
mousetrap.bind('ctrl+v', () => {
    Paste()
})
mousetrap.bind('ctrl+=', () => {
    Transform.Zoom(1)
})