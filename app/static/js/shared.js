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

function getBaseURL() {
    return "http://mhooge.com:5000/projects/battleship";
}