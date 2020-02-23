var messageLog = document.getElementById("chat-content");
var messageInput = document.getElementById("chat-input");
var sendButton = document.getElementById("chat-send");

function insertLeadingZero(number) {
    str = "" + number;
    if (number < 10)
        str = "0" + str
    return str;
}

function addToLog(message, author, timestamp=null) {
    let template = document.getElementsByClassName("template-msg").item(0);
    let textElem = template.cloneNode(true);
    textElem.classList.remove("template-msg");

    let formattedTime = null;
    if (timestamp == null) {
        let now = new Date();
        formattedTime = insertLeadingZero(now.getHours()) + ":" + insertLeadingZero(now.getMinutes());
    }
    else {
        let split = timestamp.split(" ");
        let timeSplit = split[1].split(":");
        let hours = Number.parseInt(timeSplit[0]) + 1;
        let minutes = Number.parseInt(timeSplit[1]);
        if (hours == 24) hours = 0;
        formattedTime = insertLeadingZero(hours) + ":" + insertLeadingZero(minutes);
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

function addMsgToDB(message) {
    let cookieJson = JSON.parse(getCookieVal("battleship"));
    let owner = cookieJson.owner;
    let json = JSON.stringify({id: cookieJson.id, msg: message, is_event: event, owner: owner});
    socket.emit("message_sent", json);
}

function addFromInput() {
    let message = messageInput.value;
    addToLog(message, "You");
    messageInput.value = "";
    addMsgToDB(message);
}

function addFromDatabase(messages, owner) {
    for (let i = 0; i < messages.length; i++) {
        let message = messages[i];

        let authorFlag = Number.parseInt(message[1]);
        if (authorFlag < 2) {
            let author = message[1] == owner ? "You" : "Opponent";
            addToLog(message[0], author, message[2]);
        }
        else {
            if (authorFlag - 2 == owner) {
                addToLog(message[0], "Event", message[2]);
            }
        }
    }
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