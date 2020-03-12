let split = window.location.href.split("/");
const DEBUG = split[split.length-1] == "test123";

function getGridBtn(x, y, buttonArr) {
    return buttonArr[y * 10 + x];
}

function socketSend(event, data) {
    if (!DEBUG)
        socket.emit(event, data);
}

function getShipCoords() {
    let coords = [];
    let buttons = document.getElementsByClassName("grid-button-self");
    for (let i = 0; i < buttons.length; i++) {
        let btn = buttons.item(i);
        if (btn.classList.contains("placed-ship")) {
            let id = btn.dataset["ship_id"].split("-")[1];
            let size = btn.dataset["ship_size"];
            let shipId = size + "_" + id;
            coords.push({id: shipId, x: btn.dataset["x"], y: btn.dataset["y"]});
        }
    }
    return coords;
}

function markAsReady() {
    let ships = getShipCoords();
    let data = JSON.parse(getCookieVal("battleship"));
    document.getElementById("player-action-btn").disabled = true;
    data["ships"] = ships;
    setPlayerStatus(true, "Ready", true);
    socketSend("player_ready", JSON.stringify(data));
}

function allShipsPlaced() {
    return document.getElementsByClassName("placed-ship").length == 14;
}

function setPlayerStatus(self, status, setup=false) {
    let activeClass = setup ? "player-ready" : "player-turn";
    let elem = null;
    if (self) {
        elem = document.getElementById("status-self");
    }
    else {
        elem = document.getElementById("status-opponent");
    }
    elem.textContent = status;
    elem.className = activeClass;
}

function disableBoard(board, disable) {
    let buttons = board.getElementsByTagName("button");
    if (disable) {
        board.classList.add("board-disabled");
    }
    else {
        board.classList.remove("board-disabled");
    }
    for (let i = 0; i < buttons.length; i++) {
        if (!disable && (buttons.item(i).classList.contains("hit-ship") || buttons.item(i).classList.contains("shot-missed")))
            continue
        buttons.item(i).disabled = disable;
    }
}

function getButton(x, y, ownBoard) {
    let btnName = ownBoard ? "grid-button-self" : "grid-button-opp";
    let buttons = document.getElementsByClassName(btnName);
    for (let i = 0; i < buttons.length; i++) {
        let btnX = Number.parseInt(buttons.item(i).dataset["x"]);
        let btnY = Number.parseInt(buttons.item(i).dataset["y"]);
        if (btnX == x && btnY == y) {
            return buttons.item(i);
        }
    }
    return null;
}

function getAbsoluteCoords(x, y, ownBoard) {
    let btnName = ownBoard ? "grid-button-self" : "grid-button-opp";
    let boardName = ownBoard ? "game-own-board" : "game-enemy-board";
    let board = document.getElementById(boardName);
    let btn = document.getElementsByClassName(btnName).item(0);
    let buttonWidth = btn.getBoundingClientRect().width + 4;
    let buttonHeight = btn.getBoundingClientRect().height + 2;
    let screenX = board.getBoundingClientRect().x + (buttonWidth/2) + (buttonWidth * x);
    let screenY = board.getBoundingClientRect().y + (buttonHeight/2) + (buttonHeight * y);
    return {x: screenX, y: screenY};
}

function swapTurns(turn, owner, coords=null, hit=false, sunkCoords=[]) {
    let affectedBoard = null;
    if (owner == turn) {
        setPlayerStatus(false, "Fire at Will!");
        if (document.getElementById("game-enemy-board").classList.contains("board-disabled"))
            disableBoard(document.getElementById("game-enemy-board"), false)
        affectedBoard = document.getElementById("game-own-board");
    }
    else {
        document.getElementById("player-action-btn").disabled = true;
        disableBoard(document.getElementById("game-enemy-board"), true);
        setPlayerStatus(false, "Waiting for Move");
        affectedBoard = document.getElementById("game-enemy-board");
    }

    let selectedBtn = document.getElementsByClassName("selected-grid");
    if (selectedBtn.length > 0)
        selectedBtn.item(0).classList.remove("selected-grid");

    if (coords != null) {
        animateMove(coords, owner == turn);
        let buttons = affectedBoard.getElementsByTagName("button");
        for (let i = 0; i < buttons.length; i++) {
            let btn = buttons.item(i);
            if (Number.parseInt(btn.dataset["x"]) == coords.x &&
                Number.parseInt(btn.dataset["y"]) == coords.y) {
                if (hit) {
                    btn.classList.add("hit-ship");

                    for (let i = 0; i < sunkCoords.length; i++) {
                        let x = sunkCoords[i][0];
                        let y = sunkCoords[i][1];
                        let sunkBtn = getButton(x, y, owner == turn);
                        sunkBtn.classList.add("sunk-ship");
                        sunkBtn.classList.remove("hit-ship");
                    }
                }
                else
                    btn.classList.add("shot-missed");
                btn.disabled = true;
            }
        }
    }
}

function shuffle(arr) {
    var j, x, i;
    for (i = arr.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = arr[i];
        arr[i] = arr[j];
        arr[j] = x;
    }
}

function getRandomActiveShip() {
    let buttons = Array.prototype.slice.call(document.getElementsByClassName("grid-button-self"));
    shuffle(buttons);
    for (let i = 0; i < buttons.length; i++) {
        let btn = buttons[i];
        if (btn.classList.contains("placed-ship") &&
            !btn.classList.contains("hit-ship") &&
            !btn.classList.contains("sunk-ship")) {
            return btn;
        }
    }
}

function angleBetween(p1, p2) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

function animateMove(destCoords, self) {
    
}

function makeMove() {
    let selected = document.getElementsByClassName("selected-grid").item(0);
    let cookieData = JSON.parse(getCookieVal("battleship"));
    let ship = getRandomActiveShip();
    let targetX = Number.parseInt(selected.dataset["x"]);
    let targetY = Number.parseInt(selected.dataset["y"])
    let sourceX = Number.parseInt(ship.dataset["x"])
    let sourceY = Number.parseInt(ship.dataset["y"])
    let sourceCoords = getAbsoluteCoords(sourceX, sourceY, true);
    let destCoords = getAbsoluteCoords(targetX, targetY, false);
    let angle = angleBetween(sourceCoords, destCoords) + (Math.PI/2);
    let muzHeight = 80;
    let muzWidth = (muzHeight * 0.44).toFixed(0);
    drawMuzzle(sourceCoords.x, sourceCoords.y, muzWidth, muzHeight, angle);
    drawTracer(sourceCoords.x, sourceCoords.y, destCoords.x, destCoords.y, 500);
    let explHeight = 60;
    let explWidth = explHeight;
    setTimeout(function() {
        if (targetX % 2 == 0 && targetY % 2 == 0)
            drawHit(destCoords.x, destCoords.y, explWidth, explHeight, 0);
        else
            drawMiss(destCoords.x, destCoords.y, explWidth, explHeight, 0);
    }, 500);

    if (cookieData != null) {
        cookieData["x"] = targetX;
        cookieData["y"] = targetY;
        socketSend("player_move", JSON.stringify(cookieData));
    }
}

function setButtonImg(shipId, ownBoard) {
    let btnName = ownBoard ? "grid-button-self" : "grid-button-opp";
    let buttons = document.getElementsByClassName(btnName + " placed-ship " + shipId);
    let horizontal = (Number.parseInt(buttons.item(0).dataset["x"]) !=
                      Number.parseInt(buttons.item(1).dataset["x"]))
    let alignStr = horizontal ? "horizontal" : "vertical";
    let url = "/static/img/" + shipId + "_" + alignStr + ".png";
    let offsets = {
        "ship-patrol": 45,
        "ship-cruiser": 45,
        "ship-battleship": 39,
        "ship-submarine": 28,
        "ship-aircraft": 26
    }
    for (let i = 0; i < buttons.length; i++) {
        let btn = buttons.item(i);
        btn.style.backgroundImage = "url(" + url + ")";
        if (horizontal) {
            btn.style.backgroundPositionX = "-" + (i*offsets[shipId]) + "px";
            btn.style.backgroundPositionY = "-1px";
            btn.style.backgroundSize = "cover";
        }
        else {
            btn.style.backgroundPositionY = "-" + (i*offsets[shipId]) + "px";
            btn.style.backgroundPositionX = "-1px";
            btn.style.backgroundSize = "cover";
        }
    }
}

function initSetup() {
    let disabledBoards = document.getElementsByClassName("board-disabled");
    for (let j = 0; j < disabledBoards.length; j++) {
        let disabledBtns = disabledBoards.item(j).getElementsByTagName("button");
        for (let i = 0; i < disabledBtns.length; i++) {
            disabledBtns.item(i).disabled = true;
        }
    }
    
    let shipButtons = document.getElementsByClassName("ship-btn");
    for (let i = 0; i < shipButtons.length; i++) {
        let btn = shipButtons.item(i);
        btn.onclick = function() {
            let selected = document.getElementsByClassName("selected-ship");
            let gridBtn = document.getElementsByClassName("selected-grid");
            if (gridBtn.length > 0)
                gridBtn.item(0).classList.remove("selected-grid");
            if (selected.length > 0)
                selected.item(0).classList.remove("selected-ship");
            btn.classList.add("selected-ship");
        }
    }
    
    let gridButtons = document.getElementsByClassName("grid-button-self");
    let buttonArr = Array(100);
    for (let i = 0; i < gridButtons.length; i++) {
        let btn = gridButtons.item(i);
        let x = Number.parseInt(btn.dataset["x"]);
        let y = Number.parseInt(btn.dataset["y"]);
        buttonArr[y * 10 + x] = btn;
        btn.onclick = function() {
            let startBtn = document.getElementsByClassName("selected-grid");
            let selectedShip = document.getElementsByClassName("selected-ship");
            if (btn.classList.contains("placed-ship")) { // Removed placed ship.
                let shipBtns = document.getElementsByClassName("ship-btn");
                for (let i = 0; i < shipBtns.length; i++) {
                    if (btn.dataset["ship_id"] == shipBtns.item(i).dataset["ship_id"]) {
                        shipBtns.item(i).disabled = false;
                    }
                }
                let buttons = document.getElementsByClassName(btn.dataset["ship_id"]);
                let copyArr = [];
                for (let i = 0; i < buttons.length; i++) {
                    let affectedBtn = buttons.item(i);
                    affectedBtn.classList.remove("placed-ship");
                    affectedBtn.removeAttribute("data-ship_id");
                    affectedBtn.removeAttribute("data-ship_size");
                    affectedBtn.style.backgroundImage = "none";
                    copyArr.push(affectedBtn);
                }
                for (let i = 0; i < copyArr.length; i++) {
                    copyArr[i].classList.remove(btn.dataset["ship_id"]);
                }
            }
            else if (selectedShip.length == 1) {
                selectedShip = selectedShip.item(0);
                let shipSize = Number.parseInt(selectedShip.dataset["ship_size"]);
                if (startBtn.length == 1 || shipSize == 1) { // Place ship.
                    startBtn = startBtn.length == 1 ? startBtn.item(0) : btn;
                    let startX = Number.parseInt(startBtn.dataset["x"]);
                    let startY = Number.parseInt(startBtn.dataset["y"]);
                    let horizontal = startY == y;
                    let vertical = startX == x;
                    if (horizontal || vertical) {
                        let startValue = horizontal ? startX : startY;
                        let currValue = horizontal ? x : y;
                        let staticValue = horizontal ? y : x;
                        let delta = startValue < currValue ? 1 : -1;
                        
                        for (let i = 0; i < shipSize; i++) {
                            let pos = startValue + (i * delta);
                            let affectedBtn = (horizontal ? getGridBtn(pos, staticValue, buttonArr)
                                                          : getGridBtn(staticValue, pos, buttonArr));
                            if (affectedBtn == null)
                                continue;
                            if (affectedBtn.classList.contains("placed-ship")) {
                                startBtn.classList.remove("selected-grid");
                                return;
                            }
                        }
                        if (delta > 0 && startValue + shipSize > 9) {
                            startValue = 10 - shipSize;
                        }
                        else if (delta < 0 && startValue - shipSize < 0) {
                            startValue = shipSize-1;
                        }
                        for (let i = 0; i < shipSize; i++) {
                            let affectedBtn = (horizontal ? getGridBtn(startValue + (i * delta), staticValue, buttonArr)
                                                          : getGridBtn(staticValue, startValue + (i * delta), buttonArr));
                            affectedBtn.classList.add("placed-ship");
                            affectedBtn.classList.add(selectedShip.dataset["ship_id"]);
                            affectedBtn.dataset["ship_id"] = selectedShip.dataset["ship_id"];
                            affectedBtn.dataset["ship_size"] = selectedShip.dataset["ship_size"];
                        }
                        startBtn.classList.remove("selected-grid");
                        selectedShip.disabled = true;
                        selectedShip.classList.remove("selected-ship");
                        
                        setButtonImg(selectedShip.dataset["ship_id"], true);
                        if (allShipsPlaced()) {
                            document.getElementById("player-action-btn").disabled = false;
                        }
                    }
                }
                else { // Mark spot as start of ship.
                    btn.classList.add("selected-grid");
                }
            }
        }
    }
    document.getElementById("player-action-btn").disabled = true;
}

function initGame() {
    let oppGridBtns = document.getElementsByClassName("grid-button-opp");
    let disabledBoards = document.getElementsByClassName("board-disabled");
    for (let i = 0; i < disabledBoards.length; i++) {
        disableBoard(disabledBoards.item(i), true);
    }
    let shipIds = ["ship-patrol", "ship-cruiser", "ship-battleship", "ship-submarine", "ship-aircraft"];
    for (let i = 0; i < shipIds.length; i++) {
        setButtonImg(shipIds[i], true);
    }
    for (let i = 0; i < oppGridBtns.length; i++) {
        let btn = oppGridBtns.item(i);
        if (btn.classList.contains("shot-missed") || btn.classList.contains("hit-ship"))
            btn.disabled = true;
        btn.onclick = function() {
            let gridBtn = document.getElementsByClassName("selected-grid");
            document.getElementById("player-action-btn").disabled = false;
            if (gridBtn.length > 0)
                gridBtn.item(0).classList.remove("selected-grid");
            btn.classList.add("selected-grid");
        }
    }
    let canvas = document.getElementById("canvas");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    setHelperContext(canvas.getContext("2d"));
}

function gameOver(winner, enemyShips) {
    for (let i = 0; i < enemyShips.length; i++) {
        let ship = enemyShips[i];
        let btn = getButton(ship[0], ship[1], false);
        if (!btn.classList.contains("hit-ship") && !btn.classList.contains("sunk-ship")) {
            btn.classList.add("placed-ship");
        }
    }
    disableBoard("game-own-board", true);
    disableBoard("game-enemy-board", true);
    let modal = document.getElementById("game-over-modal");
    let headerName = "game-over-header-" + (winner ? "won" : "lost");
    let header = document.getElementById(headerName);
    let splashName = "splash-"  + (winner ? "won" : "lost");
    let splash = document.getElementById(splashName);
    header.style.display = "block";
    splash.style.display = "block";
    modal.style.display = "block";
    let actionBtn = document.getElementById("player-action-btn");
    actionBtn.textContent = "Exit"
    actionBtn.onclick = function() {
        window.location.href = getBaseURL();
    }
}

function closeGameOverModal() {
    document.getElementById("game-over-modal").style.display = "none";
}

socket.on("chat_loaded", function(jsonData) {
    let data = JSON.parse(jsonData);
    addFromDatabase(data.messages, data.owner);
});
socket.on("move_made", function(jsonData) {
    let data = JSON.parse(jsonData);
    let hitCoords = {x: data["x"], y: data["y"]};
    let owner = JSON.parse(getCookieVal("battleship")).owner;
    swapTurns(data["turn"], owner, hitCoords, data["hit"], data["sunk"]);
    if (data["winner"] != -1) {
        let oppShips = owner == 1 ? data["opp_ships"] : data["owner_ships"];
        if (data["winner"] == owner) {
            gameOver(true, oppShips); // We won!
        }
        else {
            gameOver(false, oppShips);
        }
    }
});
socket.on("start_game", function(turn) {
    document.getElementById("status-self").classList.add("player-hide");
    initGame();
    disableBoard(document.getElementById("game-own-board"), true);
    let actionBtn = document.getElementById("player-action-btn");
    actionBtn.textContent = "Fire!";
    actionBtn.onclick = function() {
        makeMove();
    }

    let owner = JSON.parse(getCookieVal("battleship")).owner;
    swapTurns(turn, owner);
});
socket.on("opponent_ready", function() {
    setPlayerStatus(false, "Ready", true);
    addToLog("Your opponent is ready", "Event");
});
