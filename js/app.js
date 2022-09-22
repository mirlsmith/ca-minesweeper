'use strict'

const MINE = '💣'

var gBoard
var gGameIntervalID;

var gLevel = {
    SIZE: 4,
    MINES: 2
}

const gGame = {
    isOn: false,
    shownCount: 0,
    flaggedCount: 0,
    secsPassed: 0, //DO I NEED THIS??
    minesShown: 0,
    lives: 1,
    isHintMode: false
}

function onInit() {
    updateFlagDisplay()
    updateLivesDisplay()
    gBoard = buildBoard()
    renderBoard(gBoard, '.game-board')
}

function buildBoard() {
    var board = []
    for (var i = 0; i < gLevel.SIZE; i++) {
        board[i] = []
        for (var j = 0; j < gLevel.SIZE; j++) {
            board[i][j] = createCell()
        }
    }
    return board
}

function createCell() {
    return {
        minesAroundCount: 0,
        isShown: false,
        isMine: false,
        isFlagged: false
    }
}

//place mines randomly (but not on clicked cell)
function placeMines(board, iIdx, jIdx) {
    var minesPlaced = 0
    while (minesPlaced < gLevel.MINES) {
        var rndmIdxI = getRandomIntInclusive(0, board.length - 1)
        var rndmIdxJ = getRandomIntInclusive(0, board[0].length - 1)
        if (rndmIdxI === iIdx && rndmIdxJ === jIdx) continue
        if (board[rndmIdxI][rndmIdxJ].isMine) continue
        board[rndmIdxI][rndmIdxJ].isMine = true
        minesPlaced++
    }
}

//set the number of mines each cell has as a neigbhor
function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            if (board[i][j].isMine) continue
            board[i][j].minesAroundCount = countMineNegs(board, i, j)
        }
    }
}

//count the number of neigbhors that are mines
function countMineNegs(board, rowIdx, colIdx) {
    var count = 0
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (i === rowIdx && j === colIdx) continue
            if (j < 0 || j >= board[0].length) continue
            var isMine = board[i][j].isMine
            if (isMine) count++
        }
    }
    return count
}

function renderBoard(mat, selector) {
    var strHTML = '<table oncontextmenu="return false;" border="0"><tbody>'
    for (var i = 0; i < mat.length; i++) {

        strHTML += '<tr>\n'
        for (var j = 0; j < mat[0].length; j++) {

            const cell = mat[i][j]
            const className = 'cell cell-' + i + '-' + j
            const cellValue = (cell.isMine) ? MINE : cell.minesAroundCount
            strHTML += `<td onmousedown="onCellClicked(this,${i},${j},event)" class="${className}"><span hidden>${cellValue}</span>
            </td>`
        }
        strHTML += '</tr>\n'
    }
    strHTML += '</tbody></table>'

    const elContainer = document.querySelector(selector)
    elContainer.innerHTML = strHTML
}

function onCellClicked(elCell, i, j, event) {

    if (!gGame.isOn) {
        if (!gGameIntervalID) {
            gGameIntervalID = startTimer('.timer span')
            gGame.isOn = true

            placeMines(gBoard, i, j)

            setMinesNegsCount(gBoard)

            renderBoard(gBoard, '.game-board')
            //give elCell the new element
            elCell = document.querySelector(`.cell-${i}-${j}`)
            elCell.querySelector('span').hidden = false

            showHintBtns()
        }
        //game has ended
        else return
    }

    if (gGame.isHintMode) {
        if (gBoard[i][j].isShown) return

        giveHint(i, j)

        gGame.isHintMode = false
        var elHintBtn = document.querySelector('.clicked')
        elHintBtn.style.opacity = 0
        elHintBtn.disabled = true
        elHintBtn.classList.remove('clicked')
        document.querySelector('.hint-txt').hidden = true
        return
    }

    var eventToCheck = (!event) ? 1 : event.which

    switch (eventToCheck) {
        //left click
        case 1:
            //is flagged
            if (elCell.classList.contains('flagged')) break
            //is already shown
            if (gBoard[i][j].isShown) break
            //is a mine
            if (gBoard[i][j].isMine) {
                if (gGame.lives === 1) {
                    for (var i = 0; i < gBoard.length; i++) {
                        for (var j = 0; j < gBoard[0].length; j++) {
                            var currCell = gBoard[i][j]
                            if (currCell.isMine) {
                                gBoard[i][j].isShown = true
                                document.querySelector(`.cell-${i}-${j} span`).hidden = false
                            }
                        }
                    }
                    endGame(false)
                    break
                } else {
                    elCell.querySelector('span').hidden = false
                    gBoard[i][j].isShown = true
                    gGame.lives--
                    gGame.minesShown++
                    updateFlagDisplay()
                    updateLivesDisplay()
                    break
                }
            }

            //is a number over 0
            if (+elCell.querySelector('span').innerText > 0) {
                elCell.querySelector('span').hidden = false
                gBoard[i][j].isShown = true
                gGame.shownCount++
                break
            }
            //is 0 -> mark as shown and then check neigbhors
            elCell.querySelector('span').hidden = false
            gBoard[i][j].isShown = true
            gGame.shownCount++
            checkNegsToOpen(i, j)
            break;
        //right click
        case 3:
            if (gBoard[i][j].isShown) break

            //if already flagged, remove flag
            if (gBoard[i][j].isFlagged) gGame.flaggedCount--

            //not flagged but no more flags left, do nothing
            else if (gGame.flaggedCount + gGame.minesShown == gLevel.MINES) break
            else gGame.flaggedCount++

            gBoard[i][j].isFlagged = !gBoard[i][j].isFlagged
            elCell.classList.toggle('flagged')
            updateFlagDisplay()

            break

    }
    if (isWin()) endGame(true)
}

function showHintBtns() {
    var elHintBtns = document.querySelectorAll('.hints button')

    for (var i = 0; i < elHintBtns.length; i++) {
        var elHintBtn = elHintBtns[i]
        elHintBtn.style.opacity = 100
        elHintBtn.disabled = false
    }
}

function updateFlagDisplay() {
    document.querySelector('.flags span').innerText = gLevel.MINES - gGame.flaggedCount - gGame.minesShown
}

function updateLivesDisplay() {
    document.querySelector('.lives span').innerText = gGame.lives
}

function isWin() {
    //win if all mines are flagged except for the ones already shown and all other cells are shown
    return ((gGame.shownCount + gGame.flaggedCount + gGame.minesShown === gLevel.SIZE ** 2) && (gGame.flaggedCount + gGame.minesShown === gLevel.MINES))
}

function endGame(win) {
    clearInterval(gGameIntervalID)
    gGame.isOn = false

    var elMsgSpan = document.querySelector('.win-or-lose span')
    elMsgSpan.innerText = (win) ? 'YOU WIN!! 🥳' : 'Sorry! Try again? 😵'
    hideHintBtns()
}

function onChooseLevel(boardSize, numMines) {
    resetGame(boardSize, numMines)
    onInit()
}

function resetGame(boardSize, numMines) {
    gLevel.SIZE = boardSize
    gLevel.MINES = numMines
    gGame.lives = (numMines < 3) ? 1 : 3

    hideHintBtns()
    gGame.isHintMode = false

    if (gGameIntervalID) {
        clearInterval(gGameIntervalID)
        document.querySelector('.timer span').innerText = '0'
        document.querySelector('.win-or-lose span').innerText = '😊'
        gGameIntervalID = null
        gGame.isOn = false
        gGame.flaggedCount = 0
        gGame.shownCount = 0
        gGame.minesShown = 0
        gBoard = []
    }
}

function hideHintBtns() {

    document.querySelector('.hint-txt').hidden = true

    var elHintBtns = document.querySelectorAll('.hints button')

    for (var i = 0; i < elHintBtns.length; i++) {
        var elHintBtn = elHintBtns[i]
        elHintBtn.style.opacity = 0
        elHintBtn.disabled = true
        elHintBtn.classList.remove('clicked')
    }
}

function checkNegsToOpen(cellRowIdx, cellColIdx) {
    for (var i = cellRowIdx - 1; i <= cellRowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = cellColIdx - 1; j <= cellColIdx + 1; j++) {
            if (i === cellRowIdx && j === cellColIdx) continue
            if (j < 0 || j >= gBoard[0].length) continue
            var elNegCell = document.querySelector(`.cell-${i}-${j}`)
            onCellClicked(elNegCell, i, j)
        }
    }
}

function onGetHint(elHintBtn) {

    if (gGame.isHintMode) {
        elHintBtn.classList.remove('clicked')
        document.querySelector('.hint-txt').hidden = true
    } else {
        elHintBtn.classList.add('clicked')
        document.querySelector('.hint-txt').hidden = false
    }

    gGame.isHintMode = !gGame.isHintMode
}

function giveHint(cellRowIdx, cellColIdx) {
    
    //show cell and hidden neighbors
    var elCellsToShow = []
    elCellsToShow.push(document.querySelector(`.cell-${cellRowIdx}-${cellColIdx}`))

    for (var i = cellRowIdx - 1; i <= cellRowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = cellColIdx - 1; j <= cellColIdx + 1; j++) {
            if (i === cellRowIdx && j === cellColIdx) continue
            if (j < 0 || j >= gBoard[0].length) continue
            if (gBoard[i][j].isShown || gBoard[i][j].isFlagged) continue
            elCellsToShow.push(document.querySelector(`.cell-${i}-${j}`))
        }
    }

    showCells(elCellsToShow)

    //time covering of same cells
    setTimeout(hideCells, 1000, elCellsToShow)

}

function showCells(elCells) {
    for (let i = 0; i < elCells.length; i++) {
        var elCell = elCells[i]
        elCell.querySelector('span').hidden = false
    }
}

function hideCells(elCells) {
    for (let i = 0; i < elCells.length; i++) {
        var elCell = elCells[i]
        elCell.querySelector('span').hidden = true
    }

}

