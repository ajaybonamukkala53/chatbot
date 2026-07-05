const API_URL = "https://chatbot-2-vfrj.onrender.com/chat";

const messages = document.getElementById("messages");
const input = document.getElementById("userInput");
const historyBox = document.getElementById("history");

let history = JSON.parse(localStorage.getItem("chatHistory")) || [];

/* -----------------------------
   Add Message
------------------------------*/

function addMessage(text, sender) {

    const div = document.createElement("div");

    div.className = `msg ${sender}`;

    messages.appendChild(div);

    if(sender==="bot"){

        typeWriter(div,text);

    }else{

        div.innerText=text;

    }

    messages.scrollTop=messages.scrollHeight;

}

/* -----------------------------
   Typing Animation
------------------------------*/

function typeWriter(element,text){

    let i=0;

    const speed=20;

    function typing(){

        if(i<text.length){

            element.innerHTML+=text.charAt(i);

            i++;

            messages.scrollTop=messages.scrollHeight;

            setTimeout(typing,speed);

        }

    }

    typing();

}

/* -----------------------------
   Send Message
------------------------------*/

async function sendMessage(){

    const message=input.value.trim();

    if(message==="") return;

    addMessage(message,"user");

    input.value="";

    const loading=document.createElement("div");

    loading.className="msg bot";

    loading.innerHTML="🤖 Thinking...";

    messages.appendChild(loading);

    messages.scrollTop=messages.scrollHeight;

    try{

        const res=await fetch(API_URL,{

            method:"POST",

            headers:{

                "Content-Type":"application/json"

            },

            body:JSON.stringify({

                message

            })

        });

        const data=await res.json();

        loading.remove();

        if(data.reply){

            addMessage(data.reply,"bot");

            history.push({

                user:message,

                bot:data.reply

            });

            renderHistory();

            saveChat();

        }

        else{

            addMessage("No response","bot");

        }

    }

    catch(err){

        loading.remove();

        addMessage("❌ "+err.message,"bot");

    }

}

/* -----------------------------
   History
------------------------------*/

function renderHistory(){

    historyBox.innerHTML="";

    history.forEach(chat=>{

        const item=document.createElement("div");

        item.className="history-item";

        item.innerText=chat.user;

        item.onclick=()=>{

            addMessage(chat.user,"user");

            addMessage(chat.bot,"bot");

        };

        historyBox.appendChild(item);

    });

}

/* -----------------------------
   Save
------------------------------*/

function saveChat(){

    localStorage.setItem(

        "chatHistory",

        JSON.stringify(history)

    );

}

/* -----------------------------
   Clear
------------------------------*/

function clearChat(){

    messages.innerHTML="";

    history=[];

    historyBox.innerHTML="";

    localStorage.removeItem("chatHistory");

}

/* -----------------------------
   Voice Recognition
------------------------------*/

function startVoice(){

    if(!('webkitSpeechRecognition' in window)){

        alert("Voice recognition not supported.");

        return;

    }

    const recognition=new webkitSpeechRecognition();

    recognition.lang="en-US";

    recognition.start();

    recognition.onresult=(e)=>{

        input.value=e.results[0][0].transcript;

        sendMessage();

    };

}

/* -----------------------------
   Download Chat
------------------------------*/

function downloadChat(){

    const text=JSON.stringify(history,null,2);

    const blob=new Blob([text],{

        type:"text/plain"

    });

    const link=document.createElement("a");

    link.href=URL.createObjectURL(blob);

    link.download="chat-history.txt";

    link.click();

}

/* -----------------------------
   Enter Key
------------------------------*/

input.addEventListener("keypress",(e)=>{

    if(e.key==="Enter"){

        sendMessage();

    }

});

/* -----------------------------
   Load History
------------------------------*/

window.onload=()=>{

    renderHistory();

};