function getGridBtn(x, y, buttonArr) {
    return buttonArr[y * 10 + x];
}

function getShipCoords(buttonArr) {
    let coords = [];
    for (let i = 0; i < buttonArr.length; i++) {
        if (buttonArr[i].classList.contains("placed-ship")) {
            coords.push({x: buttonArr[i].dataset["x"], y: buttonArr[i].dataset["y"]});
        }
    }
    return coords;
}

function markAsReady() {
    let ships = getShipCoords(buttonArr);
    let data = JSON.parse(getCookieVal("battleship"));
    document.getElementById("player-action-btn").disabled = true;
    data["ships"] = ships;
    setPlayerStatus(true, "Ready", true);
    socket.emit("player_ready", JSON.stringify(data));
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

function swapTurns(turn, owner, coords=null, hit=false) {
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
        let buttons = affectedBoard.getElementsByTagName("button");
        for (let i = 0; i < buttons.length; i++) {
            let btn = buttons.item(i);
            if (Number.parseInt(btn.dataset["x"]) == coords.x &&
                Number.parseInt(btn.dataset["y"]) == coords.y) {
                if (hit)
                    btn.classList.add("hit-ship");
                else
                    btn.classList.add("shot-missed");
                btn.disabled = true;
            }
        }
    }
}

function makeMove() {
    let selected = document.getElementsByClassName("selected-grid").item(0);
    let cookieData = JSON.parse(getCookieVal("battleship"));
    cookieData["x"] = Number.parseInt(selected.dataset["x"]);
    cookieData["y"] = Number.parseInt(selected.dataset["y"]);
    socket.emit("player_move", JSON.stringify(cookieData));
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
            if (btn.classList.contains("placed-ships")) { // Removed placed ship.
                let buttons = document.getElementsByClassName("ship-btn");
                for (let i = 0; i < buttons.length; i++) {
                    buttons.item(i).classList.remove("placed-ship");
                    buttons.item(i).classList.remove(selectedShip.dataset["ship_id"]);
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
                            if (affectedBtn.classList.contains("placed-ship")) {
                                startBtn.classList.remove("selected-grid");
                                return;
                            }
                        }
                        if (delta > 0 && startValue + shipSize > 9) {
                            startValue = 10 - shipSize;
                        }
                        else if (delta < 0 && currValue - shipSize < 0) {
                            startValue = shipSize-1;
                        }
                        for (let i = 0; i < shipSize; i++) {
                            let affectedBtn = (horizontal ? getGridBtn(startValue + (i * delta), staticValue, buttonArr)
                                                          : getGridBtn(staticValue, startValue + (i * delta), buttonArr));
                            affectedBtn.classList.add("placed-ship");
                            affectedBtn.classList.add(selectedShip.dataset["ship_id"]);
                            affectedBtn.dataset["ship_id"] = selectedShip.dataset["ship_id"];
                        }
                        startBtn.classList.remove("selected-grid");
                        selectedShip.disabled = true;
                        selectedShip.classList.remove("selected-ship");
    
                        if (document.getElementsByClassName("placed-ship").length == 13) { // All ships placed.
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
}

function initGame() {
    let oppGridBtns = document.getElementsByClassName("grid-button-opp");
    let disabledBoards = document.getElementsByClassName("board-disabled");
    for (let i = 0; i < disabledBoards.length; i++) {
        disableBoard(disabledBoards.item(i), true);
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
}

socket.emit("player_joined", getCookieVal("battleship"));

socket.on("chat_loaded", function(jsonData) {
    let data = JSON.parse(jsonData);
    addFromDatabase(data.messages, data.owner);
});
socket.on("move_made", function(jsonData) {
    let data = JSON.parse(jsonData);
    let hitCoords = {x: data["x"], y: data["y"]};
    let owner = JSON.parse(getCookieVal("battleship")).owner;
    if (data["winner"] != -1) {
        if (data["winner"] == owner) {
            alert("YOU WON!");
        }
        else {
            alert("YOU LOST!");
        }
    }
    else
        swapTurns(data["turn"], owner, hitCoords, data["hit"]);
});
socket.on("start_game", function(turn) {
    document.getElementById("header-title").textContent = "Battleship";
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
