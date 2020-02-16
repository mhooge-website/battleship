var messageLog = document.getElementById("chat-content");
var messageInput = document.getElementById("chat-input");
var sendButton = document.getElementById("chat-send");

function getCookieVal(key) {
    let cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
        let kv = cookies[i].split("=");
        if (kv[0].trim() == key) {
            return kv[1].trim();
        }
    }
    return null;
}

function addToLog(message, author, timestamp=null) {
    let template = document.getElementsByClassName("chat-msg").item(0);
    let textElem = template.cloneNode(true);
    textElem.classList.remove("template-msg");

    if (timestamp == null) {
        let now = new Date();
        timestamp = now.getHours() + ":" + now.getMinutes();
    }
    console.log(timestamp);
    timestamp = "test"
    let contentElem = textElem.getElementsByClassName("chat-msg-content").item(0);
    let authorElem = textElem.getElementsByClassName("chat-msg-author").item(0);
    authorElem.textContent = author + " (" + timestamp + ")";
    contentElem.textContent = message;

    messageLog.appendChild(textElem);
}

function addFromInput() {
    let message = messageInput.value;
    addToLog(message, "You");
    messageInput.value = "";
    let cookieJson = JSON.parse(getCookieVal("battleship"));
    let json = JSON.stringify({id: cookieJson.id, msg: message, owner: cookieJson.owner});
    socket.emit("message_sent", json);
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