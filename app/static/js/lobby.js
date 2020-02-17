function setCookieData(id, hash, owner) {
    let cookieData = JSON.stringify({id: id, hash: hash, owner: owner});
    document.cookie = "battleship=" + cookieData;
}

function removeLobbySession() {
    document.cookie = "battleship=;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}

function updateSetting(setting, value) {
    let lobbyId = getActiveLobby();
    let cookieData = JSON.parse(getCookieVal("battleship"));
    let obj = { setting: setting, value: value, lobby_id: lobbyId,
                hash: cookieData.hash, owner: cookieData.owner };
    socket.emit("setting_changed", JSON.stringify(obj));
}

function removeLobbySession() {
    socket.emit("delete_session", "delete")
}

function lobbyNameChanged() {
    let name = document.getElementById("lobby-name").value;
    updateSetting("name", name);
}

function checkPublicChanged() {
    let private = document.getElementById("invite-only").checked;
    updateSetting("public", !private);
}

function setLoadedSettings(data) {
    document.getElementById("lobby-id").textContent = data[0];
    document.getElementById("lobby-name").value = data[1];
    document.getElementById("invite-only").checked = data[3] == 0 ? "true" : "false";
}

function startGame() {
    updateSetting("status", "ready");
    window.location.href = "/projects/battleship/game/" + lobbyId;
}

var lobbyIdInput = document.getElementById("lobby-id");
let lobbyJson = getCookieVal("battleship");

let urlSplit = window.location.pathname.split("/");
if (lobbyJson != null) {
    socket.emit("lobby_rejoin", lobbyJson);
}
else if (urlSplit[2] == "pvp") {
    if (urlSplit.length == 3) {
        socket.emit("lobby_pvp", "yes");
    }
    else {
        socket.emit("lobby_full", urlSplit[3]);
    }
}

socket.on("setup_started", function(lobbyId) {
    startGame();
});
socket.on("invalid_lobby", function(error) {
    alert(error);
});
socket.on("lobby_error", function(msg) {
    alert(msg);
});
socket.on("lobby_ready_opp", function(jsonData) {
    let data = JSON.parse(jsonData);
    setCookieData(data.id, data.hash, false);
});
socket.on("lobby_ready_owner", function(msg) {
    document.getElementById("start-btn").disabled = false;
});
socket.on("lobby_joined", function(jsonData) {
    let data = JSON.parse(jsonData);
    setLoadedSettings(data.settings);
    for (let i = 0; i < data.messages.length; i++) {
        let message = data.messages[i];
        let author = message[1] == data.owner ? "You" : "Opponent";
        addToLog(message[0], author, message[2]);
    }
});
socket.on("lobby_created", function(jsonData) {
    let data = JSON.parse(jsonData);
    lobbyIdInput.textContent = data.id;
    setCookieData(data.id, data.hash, true);
    document.getElementById("lobby-name").disabled = false;
    document.getElementById("invite-only").disabled = false;
});