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
    secsPassed: 0
}

function onInit() {

    gBoard = buildBoard()
    console.log(gBoard)
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

    placeMines(board)

    setMinesNegsCount(board)

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

//place mines randomly
function placeMines(board) {
    var minesPlaced = 0

    while (minesPlaced < gLevel.MINES) {

        var rndmIdxI = getRandomIntInclusive(0, board.length - 1)
        var rndmIdxJ = getRandomIntInclusive(0, board[0].length - 1)
        if (board[rndmIdxI][rndmIdxJ].isMine) continue

        board[rndmIdxI][rndmIdxJ].isMine = true
        minesPlaced++
        // console.log(`placed mine #${minesPlaced} at ${rndmIdxI},${rndmIdxJ}`)
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
        gGameIntervalID = startTimer('.timer span')
        gGame.isOn = true
    }

    switch (event.which) {
        //left click
        case 1:
            if (elCell.classList.contains('flagged')) break;
            if (!gBoard[i][j].isMine) {
                elCell.querySelector('span').hidden = false
                gBoard[i][j].isShown = true
                gGame.shownCount++
            } else {
                // left click on mine
                for (var i = 0; i < gBoard.length; i++) {
                    for (var j = 0; j < gBoard[0].length; j++) {
                        var currCell = gBoard[i][j]
                        if (currCell.isMine){
                            gBoard[i][j].isShown = true
                            document.querySelector(`.cell-${i}-${j} span`).hidden = false
                        }
                    }
                }
                endGame(false)
            }
            break;

        //right click
        case 3:
            if (gBoard[i][j].isShown) break;

            if (gBoard[i][j].isFlagged) gGame.flaggedCount--
            else gGame.flaggedCount++

            gBoard[i][j].isFlagged = !gBoard[i][j].isFlagged
            elCell.classList.toggle('flagged')
            break;
    }

    if (isWin()) endGame(true)
}


function isWin() {
    // win if all the mines are flagged, and all the other cells are shown
    return ((gGame.shownCount + gGame.flaggedCount === gLevel.SIZE ** 2) && (gGame.flaggedCount === gLevel.MINES))   
}

function endGame(win) {
    clearInterval(gGameIntervalID)
    // gGame.isOn = false
    if (win) console.log('game over! you won!')
    else console.log('game over! you lose!')
}
