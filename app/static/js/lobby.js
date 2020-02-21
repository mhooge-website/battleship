function setCookieData(id, hash, owner) {
    let cookieData = JSON.stringify({id: id, hash: hash, owner: owner});
    document.cookie = "battleship=" + cookieData + ";path=/";
}

function removeLobbySession() {
    document.cookie = "battleship=;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}

function updateSetting(setting, value) {
    let lobbyId = JSON.parse(getCookieVal("battleship")).id;
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
    updateSetting("public", private ? 0 : 1);
}

function setLoadedSettings(data) {
    document.getElementById("lobby-id").textContent = data[0];
    document.getElementById("lobby-name").value = data[1];
    document.getElementById("invite-only").checked = data[3] == 0 ? "true" : "false";
    let cookieJson = JSON.parse(getCookieVal("battleship"));
    if (data[2] == "ready" && cookieJson.owner == 1) {
        document.getElementById("start-lobby-btn").disabled = false;
    }
}

function redirectToGame(lobbyId) {
    window.location.href = window.location.host + "/game/" + lobbyId;
}

function startSetup() {
    let data = getCookieVal("battleship");
    socket.emit("start_setup", data);
    redirectToGame(JSON.parse(data).id);
}

function settingUpdated(setting, value) {
    if (setting == "name")
        document.getElementById("lobby-name").value = value;
    else if (setting == "public")
        document.getElementById("invite-only").checked = value == 0;
}

var lobbyIdInput = document.getElementById("lobby-id");
let lobbyJson = getCookieVal("battleship");

let urlSplit = window.location.pathname.split("/");
if (lobbyJson != null) {
    socket.emit("lobby_rejoin", lobbyJson);
}
else if (urlSplit[2] == "pvp") {
    if (urlSplit.length == 3) {
        if (socket.connected)
            socket.emit("lobby_pvp", "yes");
        else {
            socket.on("connect", function() {
                socket.emit("lobby_pvp", "yes");
                socket.off("connect");
            });
        }
    }
    else {
        if (socket.connected)
            socket.emit("lobby_full", urlSplit[3]);
        else {
            socket.on("connect", function() {
                socket.emit("lobby_full", urlSplit[3]);
                socket.off("connect");
            });
        }
    }
}
socket.on("setup_started", function(lobbyId) {
    redirectToGame(lobbyId);
});
socket.on("invalid_lobby", function(error) {
    alert(error);
});
socket.on("lobby_error", function(msg) {
    alert(msg);
});
socket.on("changed_setting", function(jsonData) {
    let data = JSON.parse(jsonData);
    settingUpdated(data["setting"], data["value"]);
});
socket.on("lobby_ready_opp", function(jsonData) {
    let data = JSON.parse(jsonData);
    setCookieData(data.id, data.hash, 0);
    let eventMsg = "You joined the lobby.";
    addToLog(eventMsg, "Event");
    addMsgToDB(eventMsg, true);
});
socket.on("lobby_ready_owner", function(msg) {
    document.getElementById("start-lobby-btn").disabled = false;
    let eventMsg = "A player has joined the lobby.";
    addToLog(eventMsg, "Event");
    addMsgToDB(eventMsg, true);
});
socket.on("lobby_joined", function(jsonData) {
    let data = JSON.parse(jsonData);
    if (data.settings[2] == "setup" || data.settings[2] == "underway") {
        redirectToGame(data.settings[0]);
    }
    else {
        setLoadedSettings(data.settings);
        for (let i = 0; i < data.messages.length; i++) {
            let message = data.messages[i];
    
            let authorFlag = Number.parseInt(message[1]);
            if (authorFlag < 2) {
                let author = message[1] == data.owner ? "You" : "Opponent";
                addToLog(message[0], author, message[2]);
            }
            else {
                if (authorFlag - 2 == data.owner) {
                    addToLog(message[0], "Event", message[2]);
                }
            }
        }
    }
});
socket.on("lobby_created", function(jsonData) {
    let data = JSON.parse(jsonData);
    lobbyIdInput.textContent = data.id;
    setCookieData(data.id, data.hash, 1);
    document.getElementById("lobby-name").disabled = false;
    document.getElementById("invite-only").disabled = false;
});