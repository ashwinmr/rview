const { ipcRenderer } = require('electron')
const path = require('path')
const url = require('url')

// Use the example cpp addon
const example_addon = require('electron').remote.require('./build/Release/example_addon.node')
document.getElementById("hello").innerHTML = example_addon.hello('from cpp');