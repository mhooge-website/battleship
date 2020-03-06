function setCookieData(id, hash, owner) {
    let cookieData = JSON.stringify({id: id, hash: hash, owner: owner});
    document.cookie = "battleship=" + cookieData + ";path=/";
}

function updateSetting(setting, value) {
    let lobbyId = JSON.parse(getCookieVal("battleship")).id;
    let cookieData = JSON.parse(getCookieVal("battleship"));
    let obj = { setting: setting, value: value, lobby_id: lobbyId,
                hash: cookieData.hash, owner: cookieData.owner };
    socket.emit("setting_changed", JSON.stringify(obj));
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
    document.getElementById("lobby-url").value = getBaseURL() + "/lobby/pvp/" + data[0];
    document.getElementById("lobby-name").value = data[1];
    if (data[3] == 0)
        document.getElementById("invite-only").setAttribute("checked", "checked");
    else
        document.getElementById("invite-only").removeAttribute("checked");
    let cookieJson = JSON.parse(getCookieVal("battleship"));
    if (data[2] == "ready" && cookieJson.owner == 1) {
        document.getElementById("start-lobby-btn").disabled = false;
    }
}

function copyURL() {
    document.getElementById("lobby-url").focus();
    document.getElementById("lobby-url").select();
    document.execCommand("copy");
}

function redirectToGame(lobbyId) {
    window.location.href = "http://mhooge.com:5000/projects/battleship/game/" + lobbyId;
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

function enableSettings() {
    document.getElementById("lobby-name").disabled = false;
    document.getElementById("invite-only").disabled = false;
}

let lobbyJson = getCookieVal("battleship");

let urlSplit = window.location.pathname.split("/");
let len = urlSplit.length;

if (urlSplit[len-2] == "pvp" || urlSplit[len-1] == "pvp") {
    if (urlSplit[len-1] == "new") {
        window.history.pushState({}, null, urlSplit.slice(0, len-1).join("/"));
        if (socket.connected)
            socket.emit("lobby_pvp", "yes");
        else {
            socket.on("connect", function() {
                socket.emit("lobby_pvp", "yes");
                socket.off("connect");
            });
        }
    }
    else if (lobbyJson != null) {
        socket.emit("lobby_rejoin", lobbyJson);
    }
    else {
        if (socket.connected)
            socket.emit("lobby_full", urlSplit[len-1]);
        else {
            socket.on("connect", function() {
                socket.emit("lobby_full", urlSplit[len-1]);
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
});
socket.on("lobby_ready_owner", function(msg) {
    document.getElementById("start-lobby-btn").disabled = false;
    let eventMsg = "A player has joined the lobby.";
    addToLog(eventMsg, "Event");
});
socket.on("lobby_joined", function(jsonData) {
    let data = JSON.parse(jsonData);
    if (data.settings[2] == "setup" || data.settings[2] == "underway") {
        redirectToGame(data.settings[0]);
    }
    else {
        if (data.owner == 1) {
            enableSettings();
        }
        setLoadedSettings(data.settings);
        addFromDatabase(data.messages, data.owner);
    }
});
socket.on("lobby_created", function(jsonData) {
    let data = JSON.parse(jsonData);
    document.getElementById("lobby-id").textContent = data.id;
    document.getElementById("lobby-url").value = getBaseURL() + "/lobby/pvp/" + data.id;
    setCookieData(data.id, data.hash, 1);
    enableSettings();
});
socket.on("opp_rejoin", function(msg) {
    addToLog("Opponent rejoined the lobby.", "Event")
});
socket.on("opp_disconnect", function(msg) {
    addToLog("Opponent disconnected from the lobby.", "Event")
});
window.onbeforeunload = function() {
    let data = getCookieVal("battleship");
    socket.emit("disconnected", data);
    return null;
}