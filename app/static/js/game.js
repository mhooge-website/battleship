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
}

function markAsReady() {
    let ships = getShipCoords(buttonArr);
    let data = JSON.parse(getCookieVal("battleship"));
    data["ships"] = ships;
    socket.emit("player_ready", JSON.stringify(data));
}

function setPlayerStatus(self, status, setup=false) {
    let activeClass = setup ? "player-ready" : "player-turn";
    let inactiveClass = setup ? "player-waiting" : "player-hide";
    let elem = null;
    let otherElem = null;
    if (self) {
        elem = document.getElementById("status-self");
        otherElem = document.getElementById("status-opponent");
    }
    else {
        elem = document.getElementById("status-opponent");
        otherElem = document.getElementById("status-self");
    }
    elem.textContent = status;
    elem.className = activeClass;
    if (!setup) {
        if (self)
            document.getElementById("player-action-btn").disabled = false;
        otherElem.className = inactiveClass;
    }
}

function addButtonListeners(selfButtons, oppButtons) {
    for (let i = 0; i < selfButtons.length; i++) {
        let self = selfButtons.item(i);
        let opp = oppButtons.item(i);
        self.onclick = null;
        opp.onclick = function() {
            // Mark stuff.
        }
    }
}

let shipButtons = document.getElementsByClassName("ship-btn");
for (let i = 0; i < shipButtons.length; i++) {
    let btn = shipButtons.item(i);
    btn.onclick = function() {
        let selected = document.getElementsByClassName("selected-ship");
        if (selected.length > 0)
            selected.item(0).classList.remove("selected-ship");
        btn.classList.add("selected-ship");
    }
}

var oppStatus = document.getElementById("status-opponent");
var yourStats = document.getElementById("status-opponent");

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
                    
                    for (let i = startX; i < shipSize; i++) {
                        let pos = startValue + (i * delta);
                        let affectedBtn = (horizontal ? getGridBtn(pos, staticValue, buttonArr)
                                                      : getGridBtn(staticValue, pos, buttonArr));
                        if (affectedBtn.classList.contains("placed-ship"))
                            return;
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

socket.on("start_game", function(turn) {
    let owner = JSON.parse(getCookieVal("battleship")).owner;

    if (owner == turn) {
        setPlayerStatus(true, "Your Turn");
    }
    else {
        setPlayerStatus(false, "Opponent's Turn");
    }
    addButtonListeners(
        document.getElementsByClassName("grid-button-self"),
        document.getElementsByClassName("grid-button-opp")
    );
    document.getElementById("player-action-btn").textContent = "Go";
});
socket.on("opponent_ready", function() {
    setPlayerStatus(false, "Ready", true);
});
