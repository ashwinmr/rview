const { ipcRenderer, nativeImage, clipboard } = require('electron')
const path = require('path')
const fs = require('fs')
const mousetrap = require('mousetrap') // Can't be used in node. Only in browser
const trash = require('trash')

// Debug options
const Debug = {
    Cursor: false,
}

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

    get List() {
        if (this.Opened) {
            let file_list = fs.readdirSync(this.Dir).filter((file) => {
                return Image.Format_List.includes(path.extname(file.toLowerCase()))
            })
            return file_list
        }
    }

    // Open file and store data
    Open(file_path) {
        if (file_path === undefined) {
            Image.Display('')
            Image.Elem.title = ''
            return
        }
        this.Opened = true
        this.Dir = path.dirname(file_path)
        this.Name = path.basename(file_path)
        this.Index = this.List.indexOf(this.Name)
        document.title = this.Name

        // Display the image
        Image.Display(file_path)
    }

    Delete() {
        if (!this.Opened) {
            return
        }
        let cur_file = path.basename(Image.Elem.src)
        if (cur_file === this.Name) {
            trash(File.Path).then(() => {
                this.Open(this.Get(0, false))
            })
        }
    }

    // Get file path from a list of files at an increment from the current file path
    Get(increment, wrap) {
        // Return if a file has not been opened
        if (!this.Opened) {
            return
        }
        let list = this.List
        if (list.length < 1) {
            return
        }
        let dir = this.Dir
        let ind = this.Index + increment

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
        let image = undefined
        if (path.extname(save_path) === '.jpg') {
            image = nativeImage.createFromPath(file_path).toJPEG(100)
        } else {
            image = nativeImage.createFromPath(file_path).toPNG()
        }
        fs.writeFile(save_path, image, () => {});
    }
}
var File = new File_C

// Create object to handle image
class Image_C {

    constructor() {
        this.Elem = document.getElementById('image')
        this.Offset = { X: 0, Y: 0 }
        this.Scale = { X: 1, Y: 1 }
        this.Width_Cont = 0 // Width as seen by document flow
        this.Height_Cont = 0 // Width as seen by document flow
        this.Clicked = false
        this.Drag_Start = { X: 0, Y: 0 }
        this.Pinch_Start = { Scale: 1, X1: 0, Y1: 0, X2: 0, Y2: 0 }
        this.Angle = 0
        this.Format_List = [
            '.jpg',
            '.jpeg',
            '.gif',
            '.png',
            '.apng',
            '.svg',
            '.bmp',
            '.ico',
        ]
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

        // Store new offset due to container. 
        // This moves the image center to top left corner
        this.Offset.X += -this.Width_Cont / 2
        this.Offset.Y += -this.Height_Cont / 2

        this.Transform()
    }

    Display(file_path) {
        this.Elem.src = file_path
    }

    Transform() {
        let transform =
            'translate(' + this.Offset.X + 'px ,' + this.Offset.Y + 'px ) ' +
            'rotate(' + this.Angle + 'deg) ' +
            'scale(' + this.Scale.X + ',' + this.Scale.Y + ')'

        this.Elem.style.transform = transform
    }

    Reset() {
        this.Scale.X = 1
        this.Scale.Y = 1
        this.Angle = 0
        this.Offset.X = -this.Width_Cont / 2
        this.Offset.Y = -this.Height_Cont / 2
        this.Transform()
    }

    Move(x, y) {
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

        // Move the image to keep same mouse position

        // Get distance to move
        let dist = { x: 0, y: 0 }
        if (pos !== undefined) {
            dist.x = -(pos.x - this.Origin.X) * (scale.x / this.Scale.X - 1)
            dist.y = -(pos.y - this.Origin.Y) * (scale.y / this.Scale.Y - 1)
        }

        // Store the new scale
        this.Scale.X = scale.x
        this.Scale.Y = scale.y

        // Move the image by the distance and automatically transform
        this.Move(dist.x, dist.y)
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

// Set Fullscreen
function Set_Fullscreen(set_val) {
    if (set_val) {
        document.getElementById('btn_bar').classList.add('hover_show')
    } else {
        document.getElementById('btn_bar').classList.remove('hover_show')
    }
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

// Handle drag move using mouse
document.addEventListener('mousedown', (e) => {
    Image.Drag_Start.X = e.x
    Image.Drag_Start.Y = e.y
    Image.Clicked = true
})
document.addEventListener('mousemove', (e) => {
    if (Image.Clicked) {
        Image.Move(e.x - Image.Drag_Start.X, e.y - Image.Drag_Start.Y)
        Image.Drag_Start.X = e.x
        Image.Drag_Start.Y = e.y
    }
})
document.addEventListener('mouseup', (e) => {
    Image.Clicked = false
})

// Handle drag move using touch
document.addEventListener('touchstart', (e) => {
    if (e.touches.length == 1) {
        Image.Drag_Start.X = e.touches[0].clientX
        Image.Drag_Start.Y = e.touches[0].clientY
    } else {
        Image.Drag_Start.X = (e.touches[0].clientX + e.touches[1].clientX) / 2
        Image.Drag_Start.Y = (e.touches[0].clientY + e.touches[1].clientY) / 2
    }
})
document.addEventListener('touchend', (e) => {
    // If there is still a touch left, it is the new dragstart
    // This prevents move due to multitouch
    if (e.touches.length > 0) {
        Image.Drag_Start.X = e.touches[0].clientX
        Image.Drag_Start.Y = e.touches[0].clientY
    }
})
document.addEventListener('touchmove', (e) => {
    let offset_x
    let offset_y
    if (e.touches.length == 1) {
        offset_x = e.touches[0].clientX - Image.Drag_Start.X
        offset_y = e.touches[0].clientY - Image.Drag_Start.Y
    } else {
        offset_x = (e.touches[0].clientX + e.touches[1].clientX) / 2 - Image.Drag_Start.X
        offset_y = (e.touches[0].clientY + e.touches[1].clientY) / 2 - Image.Drag_Start.Y
    }
    Image.Move(offset_x, offset_y)
    if (e.touches.length == 1) {
        Image.Drag_Start.X = e.touches[0].clientX
        Image.Drag_Start.Y = e.touches[0].clientY
    } else {
        Image.Drag_Start.X = (e.touches[0].clientX + e.touches[1].clientX) / 2
        Image.Drag_Start.Y = (e.touches[0].clientY + e.touches[1].clientY) / 2
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

// Handle pinch zoom
document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {
        Image.Pinch_Start.X1 = e.touches[0].clientX
        Image.Pinch_Start.Y1 = e.touches[0].clientY
        Image.Pinch_Start.X2 = e.touches[1].clientX
        Image.Pinch_Start.Y2 = e.touches[1].clientY
        Image.Pinch_Start.Scale = Math.abs(Image.Scale.X)
    }
})
document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) {
        let l_start = Math.sqrt(Math.pow(Image.Pinch_Start.X2 - Image.Pinch_Start.X1, 2) + Math.pow(Image.Pinch_Start.Y2 - Image.Pinch_Start.Y1, 2))
        let l_end = Math.sqrt(Math.pow(e.touches[1].clientX - e.touches[0].clientX, 2) + Math.pow(e.touches[1].clientY - e.touches[0].clientY, 2))
        let factor = l_end / l_start

        let increment = factor * Image.Pinch_Start.Scale - Math.abs(Image.Scale.X)

        let center = { x: (e.touches[0].clientX + e.touches[1].clientX) / 2, y: (e.touches[0].clientY + e.touches[1].clientY) / 2 }

        if (increment > 0) {
            Image.Zoom(1, increment, center)
        } else {
            Image.Zoom(-1, increment, center)
        }
    }
})

// Show cursor coordiantes when debug is enabled
if (Debug.Cursor) {
    document.addEventListener('mousemove', (e) => {
        var x = e.pageX;
        var y = e.pageY;
        e.target.title = "X is " + x + " and Y is " + y;
    })
}

// Handle resizing the window
window.addEventListener('resize', (e) => {
    Image.Update()
})

// Handle logging main process messages to console
ipcRenderer.on("Log", (e, message) => {
    console.log(message)
})

// Handle main process events
ipcRenderer.on("Open", (e, file_path) => {
    File.Open(file_path)
})
ipcRenderer.on("Save", (e, file_path) => {
    File.Save(file_path)
})
ipcRenderer.on("Next", (e) => {
    File.Open(File.Get(1, false))
})
ipcRenderer.on("Previous", (e) => {
    File.Open(File.Get(-1, false))
})
ipcRenderer.on("Zoom_In", (e) => {
    Image.Zoom(1)
})
ipcRenderer.on("Zoom_Out", (e) => {
    Image.Zoom(-1)
})
ipcRenderer.on("Reset", (e) => {
    Image.Reset()
})
ipcRenderer.on("Flip_Horizontal", (e) => {
    Image.Flip_H()
})
ipcRenderer.on("Flip_Vertical", (e) => {
    Image.Flip_V()
})
ipcRenderer.on("Rotate_CW", (e) => {
    Image.Rotate(1)
})
ipcRenderer.on("Rotate_CCW", (e) => {
    Image.Rotate(-1)
})
ipcRenderer.on("Copy", (e) => {
    Copy()
})
ipcRenderer.on("Paste", (e) => {
    Paste()
})
ipcRenderer.on("Delete", (e) => {
    File.Delete()
})
ipcRenderer.on('Set_Fullscreen', (e, set_val) => {
    Set_Fullscreen(set_val)
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

// Add button shortcuts
document.getElementById('next').addEventListener('click', (e) => {
    File.Open(File.Get(1))
})
document.getElementById('previous').addEventListener('click', (e) => {
    File.Open(File.Get(-1))
})
document.getElementById('flip_h').addEventListener('click', (e) => {
    Image.Flip_H()
})
document.getElementById('flip_v').addEventListener('click', (e) => {
    Image.Flip_V()
})
document.getElementById('reset').addEventListener('click', (e) => {
    Image.Reset()
})
document.getElementById('rotate_cw').addEventListener('click', (e) => {
    Image.Rotate(+1)
})
document.getElementById('zoom_in').addEventListener('click', (e) => {
    Image.Zoom(+1)
})
document.getElementById('zoom_out').addEventListener('click', (e) => {
    Image.Zoom(-1)
})
document.getElementById('delete').addEventListener('click', (e) => {
    File.Delete()
})
document.getElementById('fullscreen').addEventListener('click', (e) => {
    ipcRenderer.send('toggle_fullscreen')
})
document.getElementById('image').addEventListener('dblclick', (e) => {
    Image.Reset()
})