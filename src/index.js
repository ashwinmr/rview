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
        this.Width_Cont = 0 // Width as seen by document flow
        this.Height_Cont = 0 // Width as seen by document flow
        this.Clicked = false
        this.Drag_Start = { X: 0, Y: 0 }
        this.Angle = 0
    }

    get Origin() {
        let origin = { X: 0, Y: 0 }
        origin.X = this.Elem.getBoundingClientRect().x + this.Elem.getBoundingClientRect().width / 2
        origin.Y = this.Elem.getBoundingClientRect().y + this.Elem.getBoundingClientRect().height / 2
        return origin
    }

    Update() {
        // Remove offset due to previous image width
        this.Offset.X -= -this.Width_Cont / 2
        this.Offset.Y -= -this.Height_Cont / 2

        // Store new image container width
        this.Width_Cont = this.Elem.clientWidth
        this.Height_Cont = this.Elem.clientHeight

        // Store new offset due to container
        this.Offset.X += -this.Width_Cont / 2
        this.Offset.Y += -this.Height_Cont / 2

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
        this.Offset.X = -this.Width_Cont / 2
        this.Offset.Y = -this.Height_Cont / 2
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

    Zoom(direction, increment, pos) {

        // Get the direction as + or - 1
        direction = Math.sign(direction)

        // Get increment as an absolute value
        if (increment === undefined) {
            increment = 0.1
        } else {
            increment = Math.abs(increment)
        }

        // Store original scale and direction
        let scale = { x: this.Scale.X, y: this.Scale.Y }
        let dir = { x: Math.sign(this.Scale.X), y: Math.sign(this.Scale.Y) }
        let min_zoom = 0.1

        // Scale while taking care of image flip
        scale.x = scale.x + increment * direction * dir.x
        if (Math.abs(scale.x) < min_zoom || dir.x !== Math.sign(scale.x)) {
            scale.x = min_zoom * dir.x
        }

        // Scale while taking care of image flip
        scale.y = scale.y + increment * direction * dir.y
        if (Math.abs(scale.y) < min_zoom || dir.y !== Math.sign(scale.y)) {
            scale.y = min_zoom * dir.y
        }

        // Translate the image to keep same mouse position

        // Get distance to translate
        let dist = { x: 0, y: 0 }
        if (pos !== undefined) {
            dist.x = -(pos.x - this.Origin.X) * (scale.x / this.Scale.X - 1)
            dist.y = -(pos.y - this.Origin.Y) * (scale.y / this.Scale.Y - 1)
        }

        // Store the new scale
        this.Scale.X = scale.x
        this.Scale.Y = scale.y

        // Place the image at the distance, and automatically transform
        this.Place(dist.x, dist.y)
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
    Image.Update()
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
    let pos = { x: e.x, y: e.y }
    if (rate > 0) {
        Image.Zoom(-1, rate * multiplier, pos)
    } else {
        Image.Zoom(1, rate * multiplier, pos)
    }
})

document.addEventListener('mousemove', (e) => {
    var x = e.pageX;
    var y = e.pageY;
    e.target.title = "X is " + x + " and Y is " + y;
})

// Handle resizing the window
window.addEventListener('resize', (e) => {
    Image.Update()
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