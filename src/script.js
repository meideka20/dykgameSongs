import { pictoSongs } from './pictosongs.js';
import { games } from './gameslist.js';

//some global variables
let gamesList = [];
let song;
let songsParse = {};
let score;
let gameScore;
let songsCalled;
let list;
let timerId;
let seconds = 0;
let achievement;
let volume;

//async function to get the submission data
async function loadDataFromCSV() {
    //fetch the cell in the google sheet
    const response = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vTEGevegI0bo7OLkuGHKVeWEJl2LvwVzxc4_1ESHC_6oWgOB-dv2koP4Fb2Fj1sFDA9otuW0x_GPr54/pub?gid=447240131&single=true&gid=0&range=H2:H3&output=csv", {}) // type: Promise<Response>
    if (!response.ok) {
        throw Error(response.statusText)
    }

    //sanitizing input
    let cleanedData = (await response.text()).toString();
    cleanedData = cleanedData.replace(/"""/g, '"');
    cleanedData = cleanedData.replace(/""/g, '"');
    cleanedData = cleanedData.replace(/"`/g, '');
    cleanedData = cleanedData.replace(/END"/g, '');
    cleanedData = cleanedData.replace(/"},"/g, '"}}');
    // cleanedData = cleanedData.replace(/'/g, '"').replace(/(\w+):/g, '"$1":');
    songsParse = JSON.parse(cleanedData);
    return songsParse;
}
//onload functionality
async function load() {
    const songsParse = await loadDataFromCSV();
    document.querySelector('form').reset();
    score = 0;
    songsCalled = 0;
    gameScore = 0;

    //makes sure all the games listed in the json array of songs are guessable
    for (const [key, val] of Object.entries(songsParse)) {
        gamesList.push(val.game)
    }

    //add the megalist
    gamesList = gamesList.concat(games);

    //alphabetize
    gamesList.sort();

    //remove any duplicates
    var uniq = gamesList.reduce(function (a, b) {
        if (a.indexOf(b) < 0) a.push(b);
        return a;
    }, []);

    //populate the html datalist w all guessable games
    let datalist = document.querySelector('#games');
    uniq.forEach(function (item) {
        var option = document.createElement('option');
        option.value = item;
        datalist.appendChild(option);
    });

    //get references to music controls
    let playButton = document.querySelector("#play-button");
    let stopButton = document.querySelector("#stop-button");

    stopButton.addEventListener("click", () => {
        controlVideo('stopVideo')
        stopTimer();
    }
    );
    //get volume slider
    volume = document.getElementById('volume-slider');

    playButton.addEventListener("click", () => {
        if (playButton.innerHTML == `<i class="fa fa-solid fa-play"></i>`) {
            controlVideo("playVideo")
            startTimer();
            playButton.innerHTML = `<i class="fa fa-solid fa-pause"></i>`
            if (document.querySelector("#hidden").style["display"] == "none") {
                document.querySelector("#options").style["display"] = "block"
            };
        }
        else {
            playButton.innerHTML = `<i class="fa fa-solid fa-play"></i>`
            stopTimer();
            controlVideo("pauseVideo")
        }
    }
    );

    //skip the game button
    let skip = document.querySelector("#skip");
    skip.addEventListener("click", () => {
        stopTimer();
        toggleHidden();
    })

    //guess the game, shows only the first input
    let guessGameBtn = document.querySelector("#guess-game")
    guessGameBtn.addEventListener("click", () => {
        stopTimer();
        controlVideo("pauseVideo");
        playButton.innerHTML = `<i class="fa fa-solid fa-play"></i>`
        document.querySelector("#guess-controls").style["display"] = "block";
        document.querySelector("#guess-controls-2").style["display"] = "none";
        //clear 
        document.querySelector("#track-guess").value = "";
    })
    // Get the input field
    let gameGuessInput = document.getElementById("game-guess");
    let trackGuessInput = document.getElementById("track-guess");

    //Submit guess if enter is pressed (game guess only)
    gameGuessInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            if (document.querySelector("#guess-controls-2").style["display"] == "none") {
                document.querySelector("#submit-guess").click();
            }
        }
    });
    //Submit guess if enter is pressed (track guess)
    trackGuessInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            document.querySelector("#submit-guess").click();
        }
    });

    //Guess game and track
    let guessTrackBtn = document.querySelector("#guess-all");
    guessTrackBtn.addEventListener("click", () => {
        stopTimer();
        controlVideo("pauseVideo");
        playButton.innerHTML = `<i class="fa fa-solid fa-play"></i>`
        document.querySelector("#guess-controls").style["display"] = "block";
        document.querySelector("#guess-controls-2").style["display"] = "block";
    })

    //get reference to the guess button
    let submitButton = document.querySelector("#submit-guess");
    submitButton.addEventListener("click", submitGuess);

    //reference to next track button
    document.querySelector("#next").addEventListener("click", () => {
        document.querySelector("#copypaste").innerHTML = "";
        toggleHidden();
        repopulate();
    })

    //reference to the copyable text
    achievement = document.querySelector("#copypaste");

    getTheme();
    repopulate();

    //make buttons look clickable
    document.querySelectorAll("button").forEach(div => {
        div.style.cursor = 'pointer';
    });
}
window.onload = () => {
    load();
    
};

//checks radio buttons for the selected theme
const getTheme = () => {
    const htmlTag = document.getElementsByTagName("html")[0]
    let radioButtons = document.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radioButton => {
        radioButton.addEventListener('change', () => {
            const selectedValue = document.querySelector('input[type="radio"]:checked').value;
            //clear current data theme and set new one
            if (htmlTag.hasAttribute("data-theme")) {
                htmlTag.removeAttribute("data-theme")
            } htmlTag.setAttribute("data-theme", selectedValue);
        });

    });
}

//video controls
const controlVideo = (vidFunc) => {
    let iframe = document.getElementsByTagName("iframe")[0].contentWindow;
    if (vidFunc == "stopVideo") {
        document.querySelector("#play-button").innerHTML = `<i class="fa fa-solid fa-play"></i>`
    }
    iframe.postMessage(
        '{"event":"command","func":"' + vidFunc + '","args":""}',
        "*"
    );
}
const videoVolume = (vol) => {
    console.log(`called, vol set to ${vol}`);
    let iframe = document.getElementsByTagName("iframe")[0].contentWindow;
    iframe.postMessage(
        `{"event":"command","func": "setVolume","args": [${vol}]}`,
        "*"
    );
}

//repopulation for a new track
const repopulate = () => {
    resetTimer();
    document.querySelector("#bs-detector").style["display"] = "none"
    document.querySelector("#options").style["display"] = "none";
    document.querySelector("#guess-controls").style["display"] = "none";
    document.querySelector("#guess-controls-2").style["display"] = "none";
    document.querySelector("#game-guess").value = "";
    document.querySelector("#track-guess").value = "";
    document.querySelector("#play-button").innerHTML = `<i class="fa fa-solid fa-play"></i>`

    setScoreOnPage();
    songsCalled++;

    list = Object.keys(songsParse);
    //pick a new song
    let name = list[Math.ceil(Math.random() * list.length) - 1];
    //find the song based on the generated value
    song = songsParse[name];
    //if we're out of songs, no more game!
    if (song == undefined) {
        alert("The game is over!");
    }
    //put the url of the song into the page's player
    let grab = document.querySelector("iframe");
    grab.src = song.url;
    document.querySelector("#game-reveal").innerHTML = `From: ${song.game}`;
    document.querySelector("#track-reveal").innerHTML = `Track Name: ${song.track}`;
    volume.addEventListener("change", function (e) {
        videoVolume(e.currentTarget.value)
    })
    //remove it from the list so no repeats
    delete songsParse[name];
}

//shows/hides elements
const toggleHidden = () => {
    if (document.querySelector("#hidden").style["display"] == "none") {
        document.querySelector("#hidden").style["display"] = "block";
        document.querySelector("#options").style["display"] = "none";
        document.querySelector("#guess-controls").style["display"] = "none";
        document.querySelector("#guess-controls-2").style["display"] = "none";
    }
    else {
        document.querySelector("#hidden").style["display"] = "none"
    }
}

//validation for player input
const submitGuess = () => {
    //plays the song
    controlVideo("playVideo")
    document.querySelector("#play-button").innerHTML = `<i class="fa fa-solid fa-pause"></i>`

    //grabs user input
    let guess = document.querySelector("#game-guess");
    let trackGuess = document.querySelector("#track-guess");

    //show that the text is clickable
    achievement.onmouseover = function () {
        this.style.cursor = 'pointer';
    };
    achievement.onclick = function () {
        document.execCommand("copy");
    }
    //if the game is correct, continue
    if (guess.value.toString().trim() === song.game.toString()) {
        //if the TRACK is an exact match, 3 points
        if (trackGuess.value.toString().trim().toLowerCase() === song.track.toString().trim().toLowerCase()) {
            extraCorrect();
        }
        //if enough characters match, give it to them anyway
        else if (findCommonCharacters(trackGuess.value.toString().trim().toLowerCase(), song.track.toString().trim().toLowerCase())) {
            extraCorrect();
        }
        //if a track was guessed but wasn't correct, add a button to let players get points for unfair calls by the game
        else {
            if (trackGuess.value.toString().trim() != "") {
                let bsButton = document.querySelector("#bs-detector");
                bsButton.style["display"] = "block";
                bsButton.addEventListener('click', () => {
                    extraCorrect();
                    bsButton.style["display"] = "none";
                })
            }
            //play sound effect
            if (document.querySelector("#sound-on").checked) {
                playAudio(document.querySelector("#correct"));
            }
            //show confetti
            if (document.querySelector("#confetti-on").checked) {
                confetti()
            }
            //update the achievement text
            if (seconds == 1) {
                achievement.textContent = `You recognized ${song.track.toString()} was from ${song.game.toString()} in ${seconds} second!`
            }
            else {
                achievement.textContent = `You recognized ${song.track.toString()} was from ${song.game.toString()} in ${seconds} seconds!`
            }

        }
        //create click to copy tooltip
        let tooltip = document.createElement("span");
        tooltip.className = "tooltiptext";
        tooltip.innerHTML = "Click to copy!"
        document.querySelector("#copypaste").appendChild(tooltip);
        achievement.addEventListener("copy", function (event) {
            event.preventDefault();
            if (event.clipboardData) {
                let copied = achievement.textContent;
                //change it to say I and add a link to the website
                copied = copied.replace("You", "I");
                copied = copied.replace("Click to copy!", " https://peachgels.github.io/dykgameSongs/")
                event.clipboardData.setData("text/plain", copied);
            }
        });
        score++;
        gameScore++;
        setScoreOnPage();
        toggleHidden();
    }
    //WRONG
    else {
        achievement.innerHTML = "";
        toggleHidden();
    }
}

//plays sfx
const playAudio = (audio) =>{
    audio.play();
}

//timer for how long it takes player to guess song.
//timer only runs while track is playing, and song/timer pause automatically when a guess begins
const startTimer = () =>{
    timerId = setInterval(() => {
        seconds++;
    }, 1000);
}
const stopTimer = () =>{
    clearTimeout(timerId);
    return seconds;
}
const resetTimer = () =>{
    if (timerId) {
        clearInterval(timerId); // Reset if already running
    }
    seconds = 0;
}

//alphabetize strings for character matching when validating track guesses
const alphabetizeString = (str) => {
    return str.split('').sort().join('');
}
//function to find common characters between two strings
const findCommonCharacters = (str1, str2) =>{
    let result = [];
    str1 = alphabetizeString(str1).trim();
    str2 = alphabetizeString(str2).trim();
    for (let char of str1) {
        if (str2.includes(char) && !result.includes(char)) {
            result.push(char);
        }
    }
    let compareStr;
    if (str1.length > str2.length){
        compareStr = str1.length;
    }
    else{
        compareStr = str2.length;
    }
    if (str2.length < 5) {
        return (result.length > (compareStr * 0.9));
    }
    return (result.length > (compareStr * 0.75));
}

//function for when a player gets track and game
const extraCorrect = () => {
    if (document.querySelector("#sound-on").checked) {
        playAudio(document.querySelector("#extracorrect"));
    }
    if (document.querySelector("#confetti-on").checked) {
        confetti({
            particleCount: 350,
            spread: 180
        });
    }
    score += 2;
    if (seconds == 1) {
        achievement.textContent = `You recognized ${song.track.toString()} in ${seconds} second!`
    }
    else {
        achievement.textContent = `You recognized ${song.track.toString()} in ${seconds} seconds!`
    }
    setScoreOnPage();
}

//updates DOM with score values
const setScoreOnPage = () => {
    document.querySelector("#score").innerHTML = `Score: ${score}`
    document.querySelector("#correct-counter").innerHTML = `Games Known: ${gameScore}/${songsCalled}`;
}

