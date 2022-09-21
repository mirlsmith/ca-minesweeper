'use strict'

// location such as: {i: 0, j: 1}
function renderCell(location, value) {
    // Select the elCell and set the value
    const elCell = document.querySelector(`.cell-${location.i}-${location.j}`)
    elCell.innerHTML = value
}

function getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function startTimer(selector) {
    var startTime = Date.now()
    return setInterval(updateTimer, 100, startTime, selector)
}

function updateTimer(startTime, selector) {
    var timeDiff = Date.now() - startTime
    var timeSecs = (timeDiff / 1000).toFixed(3)
    var elSelector = document.querySelector(selector)
    elSelector.innerText = timeSecs
}
