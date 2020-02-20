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
    socket.emit("player_ready", getCokieVal("battleship"));
}

function swapPlayerStatus(elem) {
    if (elem.classList.contains("player-active")) {
        elem.classList.remove("player-active");
        elem.classList.add("player-inactive");
    }
    else {
        elem.classList.remove("player-inactive");
        elem.classList.add("player-active");
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

let gridButtons = document.getElementsByClassName("grid-button");
let buttonArr = [];
for (let i = 0; i < gridButtons.length; i++) {
    let btn = gridButtons.item(i);
    buttonArr.push(btn);
    btn.onclick = function() {
        let startBtn = document.getElementsByClassName("selected-grid");
        let selectedShip = document.getElementsByClassName("selected-ship");
        if (btn.classList.contains("placed-ships")) { // Removed placed ship.
            let buttons = document.getElementsByClassName(btn.dataset["ship_id"]);
            for (let i = 0; i < buttons.length; i++) {
                buttons.item(i).classList.remove("placed-ship");
                buttons.item(i).classList.remove(btn.dataset["ship_id"]);
            }
        }
        else if (selectedShip.length == 1) { // Place ship.
            if (startBtn.length == 1) {
                startBtn = startBtn.item(0);
                let startX = Number.parseInt(startBtn.dataset["x"]);
                let startY = Number.parseInt(startBtn.dataset["y"]);
                let x = Number.parseInt(btn.dataset["x"]);
                let y = Number.parseInt(btn.dataset["y"]);
                let shipSize = Number.parseInt(selectedShip.item(0).dataset["ship_size"]);
                let horizontal = startY == y;
                let vertical = startX == x;
                if (horizontal || vertical) {
                    if (horizontal) {
                        let delta = startX < x ? 1 : -1;
                        for (let i = startX; i <= shipSize; i++) {
                            let affectedBtn = getGridBtn(startX + (i * delta), y, buttonArr);
                            affectedBtn.classList.add("placed-ship");
                            affectedBtn.classList.add(selectedShip.item(0).dataset["ship_id"]);
                            affectedBtn.dataset["ship_id"] = selectedShip.item(0).dataset["ship_id"];
                        }
                    }
                    else {
                        let delta = startY < y ? 1 : -1;
                        for (let i = startY; i <= shipSize; i++) {
                            let affectedBtn = getGridBtn(x, startY + (i * delta), buttonArr);
                            affectedBtn.classList.add("placed-ship");
                            affectedBtn.classList.add(selectedShip.item(0).dataset["ship_id"]);
                            affectedBtn.dataset["ship_id"] = selectedShip.item(0).dataset["ship_id"];
                        }
                    }
                    startBtn.classList.remove("selected-grid");
                    selectedShip.item(0).classList.remove("selected-ship");
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
    let actionBtn = document.getElementById("player-action-btn").enabled = true;

    if (owner == turn) {
        actionBtn.disabled = false;
    }
    actionBtn.textContent = "Go";
});
socket.on("opponent_ready", function() {
    let oppStatus = document.getElementById("status-opponent");
    oppStatus.textContent = "Ready";
    swapPlayerStatus(oppStatus);
});
