const express = require('express')
const http = require('http')
// const { use } = require('react')
const {Server} = require('socket.io')
const app = express()
const server = http.createServer(app)
const io = new Server(server)
const port = process.env.PORT||3000

const {join} = require('node:path')
const { error, table } = require('node:console')
const rooms = {}

app.use(express.static('public'))
app.get('/',(req,res)=>{res.sendFile(join(__dirname,'index.html'))})
io.on('connection',(socket)=>{console.log('a user connected')
    socket.on('disconnect',()=>console.log('user disconnected'))
})



io.on('connection',(socket)=>{
    // io.broadcast.emit('index',rooms)
    socket.on('chat message',(msg)=>socket.broadcast.emit('chat message',msg))
    socket.on('joinRoom', ({ roomId, name },cb) => {
    roomId = String(roomId || 'room1');
    makeRoomIfMissing(roomId);
    const room = rooms[roomId];
    if (room.players.length >= 4){ return cb({ ok: false, err: 'Room full' })
    }else{
        room.players.push({ id: socket.id, name: name  || 'Player' + (room.players.length + 1),card :[], bot: false });
        room.scores[socket.id] = 0;
        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.name = name || ('Player' + room.players.length);
        if (room.players.length < 2) {
            socket.emit('waiting','tunggu pemain lain');
        }else{
            const deck = shuffle(buildCard())
            for (let i = 0; i < 7; i++) {
                for (let j = 0; j < room.players.length; j++) {
                    room.players[j].card.push(deck.shift())             
                }
            }
            room.cards = deck
            for(const p of room.players){
                io.to(p.id).emit('welcome',p.card,room.players.map(p=>p.name))
            }
        cb({ ok: true, room: getPublicRoomState(roomId) });
        io.to(roomId).emit('turn_changed', { currentId: room.players[room.turnIndex].id });
        }
}
});
  
  // game loop==========
  
  socket.on('ambil',(card,cb)=>{
    let room = rooms[socket.data.roomId]
    let cards = room.cards
    room.turnIndex = (room.turnIndex + 1) % room.players.length;
    currentTurnId = room.players[room.turnIndex].id
      if(cards.length < 1){return cb({ok:false,err:'kartu habis'})}
        card.push(cards.shift())
        socket.emit('ambil',card,currentTurnId)
    })
    
    socket.on('buang',(card)=>{
        let roomId = socket.data.roomId
        let room = rooms[roomId]
        const table = rooms[roomId].table
        table.push(card)
        io.to(roomId).emit('buang',table,currentTurnId)
   })
})



// functions========================
function makeRoomIfMissing(roomId) {
  if (!rooms[roomId]) {
    console.log('buatkan rooom')
    rooms[roomId] = { players: [],cards:{},table:[], scores: {}, turnIndex: 0, started: false, hasBot: false };
  }
}


function buildCard(){
    const suits = ['S','H','D','C'];
    const ranks = ['1','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const deck = [];
    for (const s of suits) for (const r of ranks) deck.push({ id: `${r}-${s}`, rank: r, suit: s });
    return deck;
}
const shuffle = (deck) =>{
    for (let index = 0; index < deck.length; index++) {
        let element = Math.floor(Math.random() * deck.length);
        let temp = deck[index]
        deck[index] = deck[element]
        deck[element] = temp
    }
    return deck
}

const bagi=(players,card)=>{
    for (let i = 0; i < 7; i++) {
        
        for (let j = 0; j < players.length; j++) {
            players[j].card.push(card.shift())             
        }
    }
    return {players,card}      
}

function getPublicRoomState(roomId) {
  const room = rooms[roomId];
  if (!room) return null;
  return {
    players: room.players.map(p => ({ id: p.id, name: p.name, score: room.scores[p.id] || 0 })),
    started: room.started,
    turnSocketId: room.players[room.turnIndex]?.id || null,
    target: room.target,
  };
}














server.listen(port,()=>console.log('port 3000'))