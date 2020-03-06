var ships = new Array(10);

socket.on("ai_ready", function(jsonData) {
    let data = JSON.parse(jsonData);
    let ships = data[0];
    let shots = data[1];
    for (let i = 0; i < ships.length; i++)
        ships[i] = new Array(10);
    for (let i = 0; i < shots.length; i++) {
        let shotData = shots[i];
        
    }
    console.log(ships);
    console.log(shots);
});