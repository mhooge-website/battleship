var messageLog = document.getElementById("chat-content");
var messageInput = document.getElementById("chat-input");
var sendButton = document.getElementById("chat-send");

function addToLog(message, author, timestamp=null) {
    let template = document.getElementsByClassName("template-msg").item(0);
    let textElem = template.cloneNode(true);
    textElem.classList.remove("template-msg");

    let formattedTime = null;
    if (timestamp == null) {
        let now = new Date();
        formattedTime = now.getHours() + ":" + now.getMinutes();
    }
    else {
        let split = timestamp.split(" ");
        let timeSplit = split[1].split(":");
        let hours = Number.parseInt(timeSplit[0]) + 1;
        if (hours == 24) hours = 0;
        formattedTime = hours + ":" + timeSplit[1];
    }
    let contentElem = textElem.getElementsByClassName("chat-msg-content").item(0);
    if (author != "Event") {
        let authorElem = textElem.getElementsByClassName("chat-msg-author").item(0);
        authorElem.textContent = author + " (" + formattedTime + "): ";
    }
    else {
        contentElem.classList.add("chat-event");
    }
    contentElem.textContent = message;

    messageLog.appendChild(textElem);
}

function addMsgToDB(message, event=false) {
    let cookieJson = JSON.parse(getCookieVal("battleship"));
    let owner = event ? 2+Number.parseInt(cookieJson.owner) : cookieJson.owner;
    let json = JSON.stringify({id: cookieJson.id, msg: message, is_event: event, owner: owner});
    socket.emit("message_sent", json);
}

function addFromInput() {
    let message = messageInput.value;
    addToLog(message, "You");
    messageInput.value = "";
    addMsgToDB(message);
}

socket.on("message_received", function(msg) {
    addToLog(msg, "Opponent");
});
sendButton.onclick = function() {
    addFromInput();
}
messageInput.addEventListener("keydown", function(key) {
    if (key.key == "Enter") {
        addFromInput();
    }
});