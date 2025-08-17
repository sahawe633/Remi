const socket = io()
socket.on('connect', () => myId = socket.id);


const form = document.getElementById('form')
const input = document.getElementById('input')
const message = document.getElementById('message')
const room = document.getElementById('room')
const player = document.getElementById('player')
const join = document.getElementById('join')
const game_play = document.getElementById('game_play')
const el=document.getElementById('card_view')
const ambil = document.getElementById('ambil')
const waitlist = document.querySelector('.waitlist')
const listplayers = document.querySelector('.listplayers')
const playersview = document.querySelector('.playersview')
let myCards = []
let playerName;
form.addEventListener('submit',(e)=>{
    e.preventDefault()
    if (input.value) {
        socket.emit('chat message',input.value)
        
        const item = document.createElement('li');
        item.textContent = input.value;
        item.style.float = 'right'
        item.style.margin = '20px'
        message.appendChild(item);
        input.value='';
    }
})

socket.on('chat message',(msg)=>{
    console.log(msg)
    const item = document.createElement('li');
    item.textContent = msg;
    message.appendChild(item);
    window.scrollTo(0,document.body.scrollHeight);
})

// io.on('index',(rooms)=>{
//     for(r of rooms){
//         r.players.map(p=>p.name)
//     }
// })
join.addEventListener('submit',(e)=>{
    e.preventDefault()
    let roomId
    roomId= room.value
    playerName = player.value
    let cards =[]
    socket.emit('joinRoom',{roomId:roomId,name:playerName,cards:cards},res=>{if(!res.ok)alert(res.err)})
})

socket.on('waiting',(message)=>{
    const item = document.createElement('li')
    item.textContent = message
    waitlist.appendChild(item)
    join.style.display = 'none'
})

socket.on('welcome',(cards,players)=>{
    myCards = cards
    join.style.display = 'none'
    waitlist.style.display = 'none'
    handCardViews()
    gameView(players)
    ambil.style.display = 'inline'
})

socket.on('turn_changed', ({ currentId }) => {
  const currentTurnId = currentId;
  updateTurnUI(currentTurnId);
});

function updateTurnUI(currentTurnId) {
  // enable clicking only if it's my turn
  const isMyTurn = currentTurnId === myId;
  console.log(isMyTurn)
  const buang = document.querySelectorAll('.buang')
  if(isMyTurn){ambil.classList.remove('disabled')}else{ambil.classList.add('disabled')}

}


ambil.addEventListener('click',(e)=>{
    e.preventDefault()  
    socket.emit('ambil',[],res=>{if(!res.ok)alert(res.err)})
})
socket.on('ambil',(card,turnId)=>{
    updateTurnUI(turnId)
    myCards.push(card[0])
    card.shift()
    handCardViews()
})

const gameStart=(currentRoom)=>{
    socket.emit('start game',currentRoom,playerName)
    console.log(playerName)
}

const handCardViews=()=>{
    shortCard(myCards)
    // role()
    el.innerHTML=''
    myCards.map((v,i)=>{
        const a = document.createElement('div')
        const btnOpsi = document.createElement('div')
        a.setAttribute('class','opsi'+i)
        btnOpsi.setAttribute('class','btnopsi'+i)
        const img = document.createElement('img')
        const buang = document.createElement('button')
        const seri = document.createElement('button')
        const kind = document.createElement('button')
        buang.setAttribute('class','buang')
        img.src = `/cards/${v.id}.png`
        img.style.width = 'auto'
        img.style.height = '100px'
        buang.setAttribute('onclick','buang('+i+')')
        img.setAttribute('onclick','cek('+i+')')
        seri.setAttribute('onclick','seri('+i+')')
        kind.setAttribute('onclick','kind('+i+')')
        buang.textContent = 'buang'
        seri.textContent = 'strike'
        kind.textContent = 'flush'
        btnOpsi.style.display='none'
        el.appendChild(a)
        a.appendChild(img)
        a.appendChild(btnOpsi)
        btnOpsi.appendChild(buang)
        btnOpsi.appendChild(seri)
        btnOpsi.appendChild(kind)
    })
}

let pair = []
const elSeri = document.querySelector('.seri')
const cek=(i)=>{
    const elOpsi = document.querySelector('.btnopsi'+i)
    elOpsi.style.display='flex'
    elOpsi.style.position='absolute'
    elOpsi.style.flex_direction='columns'
}

const buang =(i)=>{
    if([...Object.values(kartuYangSudahJadi)].flat().length === 7){console.log('winner')}
    pair=myCards[i]
    myCards.splice(i,1)
    handCardViews()
    socket.emit('buang',pair)
}

 socket.on('buang',(cards,currentId)=>{
    updateTurnUI(currentId)
    const meja = document.querySelector('.meja')
    meja.innerHTML=''
    cards.map((v,i)=>{
        let img = document.createElement('img')
        img.src = `/cards/${v.id}.png`
        img.style.width = '50px'
        img.style.height = 'auto'
        meja.appendChild(img)
    })
 })

const gameView = (players) => {
    players?.map((p) => {
        const item = document.createElement('div');
        item.textContent = p
        playersview.appendChild(item)
    });
}

const shortCard=(cards)=>{
    cards.sort((a,b)=>{
        let x = (a.suit < b.suit)? -1:(a.suit > b.suit)? 1: 0
        return x
    })
}



const menang = () =>{

}


const kartuYangSudahJadi = {}
const seriCard = {}
const strike = document.querySelector('.strike')
const tris = document.querySelector('.kind')
const seri =(i)=>{
    const suit = myCards[i].suit
    const rank = myCards[i].rank
    if(!seriCard[suit])seriCard[suit] = []
    seriCard[suit].push(myCards[i])
    myCards.splice(i,1)
    handCardViews()

    strike.innerHTML=''
    for(let x in seriCard){
        const newbtnopsi = document.createElement('div')
        const btnCancel = document.createElement('button')
        btnCancel.setAttribute('onclick','cancelSeri(\''+x+'\')')
        newbtnopsi.setAttribute('class','sericard'+x)
        newbtnopsi.appendChild(btnCancel)
        strike.appendChild(newbtnopsi)
        seriCard[x].map((a,b)=>{
        const img = document.createElement('img')
        img.src='/cards/'+a.id+'.png'
        img.style.width='50px'
        btnCancel.textContent = 'Cancel'
        newbtnopsi.appendChild(img)
        })

    }
    if(seriCard[suit].length >= 3 && !isNaN(rank)){

        if(seriCard[suit].filter(a=>a.suit === suit).sort((a,b)=>parseInt(a.rank) - parseInt(b.rank)).every((a,b,c)=>b === 0 || parseInt(a.rank)-1 === parseInt(c[b-1].rank))){
            if(!kartuYangSudahJadi[suit]){
                kartuYangSudahJadi[suit] = []
                seriCard[suit].map((a)=>kartuYangSudahJadi[suit].push(a))
            }else{

                kartuYangSudahJadi[suit].push(seriCard[suit][seriCard[suit].length-1])  
            }
        }
    }
    if(seriCard[suit].length === 3 && seriCard[suit].every((a)=>isNaN(parseInt(a.rank)))){
        if(!kartuYangSudahJadi[suit]){
                kartuYangSudahJadi[suit] = []
                seriCard[suit].map((a)=>kartuYangSudahJadi[suit].push(a))
            }else{

                kartuYangSudahJadi[suit].push(seriCard[suit][seriCard[suit].length-1])  
            }
    }

}

const flush = {}
const kind =(i)=>{
    const rank = myCards[i].rank
    if(!flush[rank])flush[rank] = []
    flush[rank].push(myCards[i])
    myCards.splice(i,1)
    handCardViews()
   console.log(flush)
    tris.innerHTML=''
    for(let x in flush){
        const newbtnopsi = document.createElement('div')
        const btnCancel = document.createElement('button')
        btnCancel.setAttribute('onclick','cancelSeri('+x+')')
        newbtnopsi.setAttribute('class','flush'+x)
        newbtnopsi.appendChild(btnCancel)
        tris.appendChild(newbtnopsi)
        flush[x].map((a,b)=>{
        const img = document.createElement('img')
        img.src='/cards/'+a.id+'.png'
        img.style.width='50px'
        btnCancel.textContent = 'Cancel'
        newbtnopsi.appendChild(img)
        })

    }
    if(flush[rank].length === 3){
        if(!kartuYangSudahJadi[rank]){
                kartuYangSudahJadi[rank] = []
                flush[rank].map((a)=>kartuYangSudahJadi[rank].push(a))
            }else{

                kartuYangSudahJadi[rank].push(seriCard[rank][seriCard[rank].length-1])  
            }
    }

}

const cancelSeri=(i)=>{
    console.log(seriCard[i])
    seriCard[i].map(a=>myCards.push(a))
    seriCard[i]=[]
    console.log(kartuYangSudahJadi)
    delete kartuYangSudahJadi[i]
    handCardViews()
    document.querySelector('.sericard'+i).innerHTML=''
    console.log(kartuYangSudahJadi)
}
const cancelflush=(i)=>{
    myCards.push(flush[i].splice(i,1))
}







// socket.on('player card',(cards)=>console.log(cards))

// const role =()=>{
//     const seri = Object.values(
//     myCards.reduce((acc, item) => {
//         const letter = item.suit; 
//         if (!acc[letter]) acc[letter] = [];
//         acc[letter].sort((a,b)=>a.rank - b.rank).push(item);
//         return acc;
//         }, {})
//     );
//     for(let x of seri){
//         x.sort((a,b)=>a.rank -b.rank)
//         if(x.length === 3){
//             if(x.every((a,b,c)=> b === 0 || parseInt(a.rank)-1 === parseInt(c[b-1].rank))){
//                 console.log(x.every((a,b,c)=> b === 0 || parseInt(a.rank)-1 === parseInt(c[b-1].rank)))
//             }
//             console.log(x.filter((a)=>a.rank === NaN))
//         }
//         if(x.length > 3){
//             if(x.every((a,b,c)=> b === 0 || parseInt(a.rank)-1 === parseInt(c[b-1].rank))){
//                 console.log('seri')
//             }
//         }
        
//     }

//     const trisport = Object.values(
//     myCards.reduce((acc, item) => {
//         const letter = item.rank; 
//         if (!acc[letter]) acc[letter] = [];
//         acc[letter].sort((a,b)=>a.rank - b.rank).push(item);
//         return acc;
//         }, {})
//     );
    
//     for( let x of trisport){
//         console.log(x.length === 3?'tris':x.length === 4?'port':null)
//     }
// }

