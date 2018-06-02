const { ipcRenderer, nativeImage, clipboard } = require('electron')
const path = require('path')
const fs = require('fs')
const mousetrap = require('mousetrap') // Can't be used in node. Only in browser

var Image_Elem = document.getElementById('image')
var Image_Scale = 1
var Cur_File
var Cur_Dir
var Cur_Files
var Drag_Start = { x: undefined, y: undefined }
var Click_Flag = false
var Time = new Date()

// Create object to handle file
class File_C {

    constructor() {
        this.Opened = false
    }

    // Get the file path
    get Path() {
        if (this.Opened) {
            return path.join(this.Dir, this.Name)
        }
    }

    // Open file and store data
    Open(file_path) {
        if (file_path === undefined) {
            return
        }
        this.Opened = true
        let dir = path.dirname(file_path)

        this.Dir = dir
        this.Name = path.basename(file_path)

        fs.readdir(dir, (err, files) => {
            this.List = files
        })

        // Display the image
        Image.Display(file_path)
    }

    // Get file path from a list of files at an increment from the current file path
    Get(increment) {
        let name = this.Name
        let dir = this.Dir
        let list = this.List
        let wrap = false // Allow wrapping of index

        // Return if a file has not been opened
        if (name === undefined || dir === undefined || list === undefined) {
            return
        }
        let cur_ind = list.indexOf(name)
        let ind = cur_ind + increment

        if (wrap) {
            // Wrap index for array
            ind = ((ind % list.length) + list.length) % list.length;
        } else {
            // Limit to file list
            ind = ind < 0 ? 0 : ind >= list.length ? list.length - 1 : ind
        }
        return path.join(dir, list[ind])
    }

    // Save file
    Save(save_path) {
        if (!this.Opened) {
            return
        }
        let file_path = this.Path
        let image = nativeImage.createFromPath(file_path).toPNG()
        fs.writeFile(save_path, image, () => {});
    }
}
var File = new File_C

// Create object to handle image
class Image_C {

    constructor() {
        this.Elem = document.getElementById('image')
        this.Offset = { X: 0, Y: 0 }
        this.Translate = { X: 0, Y: 0 }
        this.Scale = { X: 1, Y: 1 }
        this.Width_Old = 0
        this.Height_Old = 0
        this.Clicked = false
        this.Drag_Start = { X: 0, Y: 0 }
        this.Angle = 0
    }

    get Width() {
        return this.Elem.clientWidth
    }

    get Height() {
        return this.Elem.clientHeight
    }

    Load() {
        // Remove offset due to old width
        this.Offset.X -= -this.Width_Old / 2
        this.Offset.Y -= -this.Height_Old / 2

        // Store new width and offsets
        this.Width_Old = this.Width
        this.Height_Old = this.Height
        this.Offset.X += -this.Width / 2
        this.Offset.Y += -this.Height / 2
        this.Transform()
    }

    Display(file_path) {
        this.Elem.src = file_path
    }

    Transform() {
        let transform =
            'translate(' + (this.Offset.X + this.Translate.X) + 'px ,' + (this.Offset.Y + this.Translate.Y) + 'px ) ' +
            'rotate(' + this.Angle + 'deg) ' +
            'scale(' + this.Scale.X + ',' + this.Scale.Y + ')'

        this.Elem.style.transform = transform
    }

    Reset() {
        this.Scale.X = 1
        this.Scale.Y = 1
        this.Angle = 0
        this.Translate.X = 0
        this.Translate.Y = 0
        this.Offset.X = -this.Width / 2
        this.Offset.Y = -this.Height / 2
        this.Transform()
    }

    Move(x, y) {
        this.Translate.X = x
        this.Translate.Y = y
        this.Transform()
    }

    Place(x, y) {
        this.Offset.X += x
        this.Offset.Y += y
        this.Transform()
    }

    Flip_H() {
        this.Scale.X = -this.Scale.X
        this.Transform()
    }

    Flip_V() {
        this.Scale.Y = -this.Scale.Y
        this.Transform()
    }

    Rotate(direction) {
        this.Angle += direction * 90
        this.Transform()
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

        let scale_x = this.Scale.X
        let scale_y = this.Scale.Y
        let x_dir = Math.sign(this.Scale.X)
        let y_dir = Math.sign(this.Scale.Y)
        let min_zoom = 0.1

        // Scale taking care of image flip
        scale_x = scale_x + increment * direction * x_dir
        if (Math.abs(scale_x) > min_zoom && x_dir === Math.sign(scale_x)) {
            this.Scale.X = scale_x
        } else {
            this.Scale.X = min_zoom * x_dir
        }

        scale_y = scale_y + increment * direction * y_dir
        if (Math.abs(scale_y) >= min_zoom && y_dir === Math.sign(scale_y)) {
            this.Scale.Y = scale_y
        } else {
            this.Scale.Y = min_zoom * y_dir
        }

        this.Transform()

    }
}
var Image = new Image_C

// Paste image from clipboard
function Paste() {
    let image = clipboard.readImage()
    if (!image.isEmpty()) {
        Image.Display(image.toDataURL())
    }
}

// Copy image to clipboard
function Copy() {
    if (!File.Opened) {
        return
    }
    let file_path = File.Path
    let image = nativeImage.createFromPath(file_path)
    clipboard.writeImage(image)
}

// Set callback functions

// Handle update image properties after load
Image.Elem.addEventListener('load', (e) => {
    Image.Load()
})

// Handle drag and drop
document.addEventListener('dragover', (e) => {
    e.preventDefault();
})
document.addEventListener('drop', (e) => {
    e.preventDefault();
    let file = e.dataTransfer.files[0]
    if (file !== undefined) {
        File.Open(file.path)
    }
})

// Handle drag move
Image_Elem.addEventListener('mousedown', (e) => {
    Image.Drag_Start.X = e.x
    Image.Drag_Start.Y = e.y
    Image.Clicked = true
})
document.addEventListener('mousemove', (e) => {
    if (Image.Clicked) {
        Image.Move(e.x - Image.Drag_Start.X, e.y - Image.Drag_Start.Y)
    }
})
document.addEventListener('mouseup', (e) => {
    if (Image.Clicked) {
        Image.Clicked = false
        Image.Move(0, 0)
        Image.Place(e.x - Image.Drag_Start.X, e.y - Image.Drag_Start.Y)
    }
})

// Handle scroll zoom
document.addEventListener('mousewheel', (e) => {
    let rate = e.deltaY
    let multiplier = 0.001

    if (rate > 0) {
        Image.Zoom(-1, rate * multiplier)
    } else {
        Image.Zoom(1, rate * multiplier)
    }
})

// Handle resizing the window
window.addEventListener('resize', (e) => {
    Image.Load()
})

// Handle logging main process messages to console
ipcRenderer.on("Log", (event, message) => {
    console.log(message)
})

// Handle main process events
ipcRenderer.on("Open", (event, file_path) => {
    File.Open(file_path)
})
ipcRenderer.on("Save", (event, file_path) => {
    File.Save(file_path)
})
ipcRenderer.on("Next", (event) => {
    File.Open(File.Get(1))
})
ipcRenderer.on("Previous", (event) => {
    File.Open(File.Get(-1))
})
ipcRenderer.on("Zoom_In", (event) => {
    Image.Zoom(1)
})
ipcRenderer.on("Zoom_Out", (event) => {
    Image.Zoom(-1)
})
ipcRenderer.on("Reset", (event) => {
    Image.Reset()
})
ipcRenderer.on("Flip_Horizontal", (event) => {
    Image.Flip_H()
})
ipcRenderer.on("Flip_Vertical", (event) => {
    Image.Flip_V()
})
ipcRenderer.on("Rotate_CW", (event) => {
    Image.Rotate(1)
})
ipcRenderer.on("Rotate_CCW", (event) => {
    Image.Rotate(-1)
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
    Image.Zoom(1)
})