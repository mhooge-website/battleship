var ship_spots = {}
var player_spots = {}
var attack_spots = null;
var shipsHitAI = 0;
var shipsHitPlayer = 0;
var currentHitShip = [];

function shotFired(x, y, atPlayer) {
    let hitShip = null;
    let sunk = false;
    let ships = atPlayer ? player_spots : ship_spots;
    Object.keys(ships).some(function(key) {
        let ship = ships[key];
        let thisShip = false;
        for (let j = 0; j < ship.length; j++) {
            let shipPart = ship[j];
            if (shipPart[0] == x && shipPart[1] == y) {
                thisShip = true;
                shipPart[4] = true;
            }
            else if (!shipPart[4]) {
                sunk = false;
            }
        }
        if (thisShip) {
            hitShip = ship;
            return true;
        }
        return false;
    });
    if (hitShip != null) {
        if (sunk)
            return 2;
        return 1;
    }
    return 0;
}

function findEntireShip() {
    let prevHit = currentHitShip[currentHitShip.length-1];
    if (currentHitShip.length == 1) {
        let possibleDirections = [-1, 1, -1, 1];
        if (prevHit.x == 0 || isHit(prevHit.x - 1, prevHit.y, true))
            possibleDirections[0] = 0;
        else if (prevHit.x == 9  || isHit(prevHit.x + 1, prevHit.y, true))
            possibleDirections[1] = 0;
        if (prevHit.y == 0 || isHit(prevHit.x, prevHit.y - 1, true))
            possibleDirections[2] = 0;
        else if (prevHit.y == 9 || isHit(prevHit.x, prevHit.y + 1, true))
            possibleDirections[3] = 0;
        vertical = Math.random
    }
}

function makeAIMove() {
    let move = attack_spots.pop();
    let hitCoords = {x: move[0], y: move[1]};
    let hit = shotFired(hitCoords.x, hitCoords.y, true);
    swapTurns(1, 1, hitCoords, hit == 1, hit == 2);
    if (hit) {
        shipsHitAI++;
        currentHitShip = [hitCoords];
    }
    let winner = shipsHitAI == player_spots.length ? 0 : -1;
    let data = {"winner": winner, "owner_ships": ship_spots, "opp_ships": player_spots};
    checkForGameOver(data, 0);
}

function makeMove() {
    let selected = document.getElementsByClassName("selected-grid").item(0);
    let hitCoords = {x: Number.parseInt(selected.dataset["x"]), y: Number.parseInt(selected.dataset["y"])};
    let hit = shotFired(hitCoords.x, hitCoords.y, false);
    if (hit)
        shipsHitPlayer++;
    swapTurns(0, 1, hitCoords, hit == 1, hit == 2);
    let winner = shipsHitPlayer == ship_spots.length ? 1 : -1;
    let data = {"winner": winner, "owner_ships": player_spots, "opp_ships": ship_spots};
    if (!checkForGameOver(data, 1)) {
        setTimeout(function() {
            makeAIMove();
        }, 1000);
    }
}

function markAsReady() {
    document.getElementById("player-action-btn").disabled = true;
    setPlayerStatus(true, "Ready", true);
    let gridBtns = document.getElementsByClassName("grid-button-self placed-ship");
    for (let i = 0; i < gridBtns.length; i++) {
        let btn = gridBtns.item(i);
        let id = btn.dataset["ship_id"];
        let size = Number.parseInt(btn.dataset["ship_size"]);
        if (!(id in player_spots)) {
            player_spots[id] = [];
        }
        player_spots[id].push([btn.dataset["x"], btn.dataset["y"], size, id, false]);
    }
    let turn = Math.random() > 0.5 ? 1 : 0;
    document.getElementById("status-self").classList.add("player-hide");
    initGame();
    disableBoard(document.getElementById("game-own-board"), true);
    let actionBtn = document.getElementById("player-action-btn");
    actionBtn.textContent = "Fire!";
    actionBtn.onclick = function() {
        makeMove();
    }

    let owner = 1;
    swapTurns(turn, owner);
    if (turn != owner) {
        makeAIMove();
    }
}

socket.on("ai_ready", function(jsonData) {
    let data = JSON.parse(jsonData);
    let ships = data[0];
    let shots = data[1];
    let placedShips = {};
    let currentId = null;
    for (let i = 0; i < ships.length; i++) {
        let name = ships[i][3];
        let split = name.split("_");
        let id = "ship_"+split[1];
        if (split[1] in placedShips)
            continue;
        let size = Number.parseInt(split[0]);
        if (id != currentId) {
            ship_spots[id] = [];
            currentId = id;
        }
        ship_spots[currentId].push([ships[i][0], ships[i][1], size, id, false]);
        if (ship_spots[currentId].length == size)
            placedShips[split[1]] = true;
    }
    attack_spots = shots.reverse();
    if (DEBUG)
        markAsReady();
});