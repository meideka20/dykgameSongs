import { pictoSongs } from './pictosongs.js';
import { games } from './gameslist.js';

let gamesList = [];
let songs = pictoSongs;

// let sammiSubmitUrl = 'https://forms.gle/gsQeNaso6pXGTLkQ7';

let song;

let songsParse = {};
let score;
let gameScore;
let songsCalled;
let list;
let timerId;
let seconds = 0;
let achievement;
async function loadDataFromCSV() {
    const response = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vTEGevegI0bo7OLkuGHKVeWEJl2LvwVzxc4_1ESHC_6oWgOB-dv2koP4Fb2Fj1sFDA9otuW0x_GPr54/pub?gid=447240131&single=true&gid=0&range=H2:H2&output=csv", {}) // type: Promise<Response>
    if (!response.ok) {
      throw Error(response.statusText)
    }
    let cleanedData = (await response.text()).toString();
    cleanedData = cleanedData.replace(/""/g, '"'); // Remove all double quotes
    cleanedData = cleanedData.replace(/"`/g, ''); // Remove all double quotes
    cleanedData = cleanedData.replace(/},}`"/g, '}}'); // Remove all double quotes
    songsParse = JSON.parse(cleanedData);
    return songsParse;
  }
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
    console.log(gamesList);
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

    let playButton = document.querySelector("#play-button");
    let stopButton = document.querySelector("#stop-button");

    stopButton.addEventListener("click", () => {
        controlVideo('stopVideo')
        stopTimer();
    }
    );

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

    let skip = document.querySelector("#skip");
    skip.addEventListener("click", () => {
        stopTimer();
        toggleHidden();
    })

    let guessGameBtn = document.querySelector("#guess-game")
    guessGameBtn.addEventListener("click", () => {
        stopTimer();
        controlVideo("pauseVideo");
        playButton.innerHTML = `<i class="fa fa-solid fa-play"></i>`
        document.querySelector("#guess-controls").style["display"] = "block";
        document.querySelector("#guess-controls-2").style["display"] = "none";
        document.querySelector("#track-guess").value = "";
    })
    // Get the input field
    let gameGuessInput = document.getElementById("game-guess");
    let trackGuessInput = document.getElementById("track-guess");

    // Execute a function when the user presses a key on the keyboard
    gameGuessInput.addEventListener("keypress", function (event) {
        // If the user presses the "Enter" key on the keyboard
        if (event.key === "Enter") {
            // Cancel the default action, if needed
            event.preventDefault();
            // Trigger the button element with a click
            if (document.querySelector("#guess-controls-2").style["display"] == "none") {
                document.querySelector("#submit-guess").click();
            }
        }
    });
    trackGuessInput.addEventListener("keypress", function (event) {
        // If the user presses the "Enter" key on the keyboard
        if (event.key === "Enter") {
            // Cancel the default action, if needed
            event.preventDefault();
            // Trigger the button element with a click
            document.querySelector("#submit-guess").click();
        }
    });

    let guessTrackBtn = document.querySelector("#guess-all");
    guessTrackBtn.addEventListener("click", () => {
        stopTimer();
        controlVideo("pauseVideo");
        playButton.innerHTML = `<i class="fa fa-solid fa-play"></i>`
        document.querySelector("#guess-controls").style["display"] = "block";
        document.querySelector("#guess-controls-2").style["display"] = "block";
    })

    let submitButton = document.querySelector("#submit-guess");
    submitButton.addEventListener("click", submitGuess);

    document.querySelector("#next").addEventListener("click", () => {
        document.querySelector("#copypaste").innerHTML = "";
        toggleHidden();
        repopulate();
    })

    achievement = document.querySelector("#copypaste");
    getTheme();
    repopulate();
    document.querySelectorAll("button").forEach(div => {
        div.style.cursor = 'pointer';
    });
}
window.onload = () => {
    load();
};

const getTheme = () => {
    const htmlTag = document.getElementsByTagName("html")[0]
    let radioButtons = document.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radioButton => {
        radioButton.addEventListener('change', () => {
            const selectedValue = document.querySelector('input[type="radio"]:checked').value;

            // Do something with the selected value
            if (htmlTag.hasAttribute("data-theme")) {
                htmlTag.removeAttribute("data-theme")
            } htmlTag.setAttribute("data-theme", selectedValue);
        });

    });
}

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
    let name = list[Math.ceil(Math.random() * list.length) - 1];
    song = songsParse[name];
    // if (song == undefined) {
    //     alert("The game is over!");
    // }
    let grab = document.querySelector("iframe");
    grab.src = song.url;
    document.querySelector("#game-reveal").innerHTML = `From: ${song.game}`;
    document.querySelector("#track-reveal").innerHTML = `Track Name: ${song.track}`;
    delete songsParse[name];


}
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

const submitGuess = () => {
    controlVideo("playVideo")
    document.querySelector("#play-button").innerHTML = `<i class="fa fa-solid fa-pause"></i>`
    let guess = document.querySelector("#game-guess");
    let trackGuess = document.querySelector("#track-guess");
    achievement.onmouseover = function () {
        this.style.cursor = 'pointer';
    };
    achievement.onclick = function () {
        document.execCommand("copy");
    }
    if (guess.value.toString().trim() === song.game.toString()) {
        if (trackGuess.value.toString().trim().toLowerCase() === song.track.toString().trim().toLowerCase()) {
            extraCorrect();
        }
        else if (findCommonCharacters(trackGuess.value.toString().trim().toLowerCase(), song.track.toString().trim().toLowerCase())) {
            extraCorrect();
        }
        else {
            if (trackGuess.value.toString().trim() != "") {
                let bsButton = document.querySelector("#bs-detector");
                bsButton.style["display"] = "block";
                bsButton.addEventListener('click', () => {
                    extraCorrect();
                    bsButton.style["display"] = "none";
                })
            }
            if (document.querySelector("#sound-on").checked) {
                playAudio(document.querySelector("#correct"));
            }
            if (document.querySelector("#confetti-on").checked) {
                confetti()
            }
            if (seconds == 1) {
                achievement.textContent = `You recognized ${song.track.toString()} was from ${song.game.toString()} in ${seconds} second!`
            }
            else {
                achievement.textContent = `You recognized ${song.track.toString()} was from ${song.game.toString()} in ${seconds} seconds!`
            }

        }
        let tooltip = document.createElement("span");
        tooltip.className = "tooltiptext";
        tooltip.innerHTML = "Click to copy!"
        document.querySelector("#copypaste").appendChild(tooltip);
        achievement.addEventListener("copy", function (event) {
            event.preventDefault();
            if (event.clipboardData) {
                let copied = achievement.textContent;
                copied = copied.replace("You", "I");
                copied = copied.replace("Click to copy!", " website link")
                event.clipboardData.setData("text/plain", copied);
            }
        });
        score++;
        gameScore++;
        setScoreOnPage();
        toggleHidden();
    }
    else {
        achievement.innerHTML = "";
        toggleHidden();
    }
}
function playAudio(audio) {
    audio.play();
}

function startTimer() {
    timerId = setInterval(() => {
        seconds++;
    }, 1000);
}
function stopTimer() {
    clearTimeout(timerId);
    return seconds;
}
function resetTimer() {
    if (timerId) {
        clearInterval(timerId); // Reset if already running
    }
    seconds = 0;
}

const alphabetizeString = (str) => {
    return str.split('').sort().join('');
}
function findCommonCharacters(str1, str2) {
    let result = [];
    str1 = alphabetizeString(str1).trim();
    str2 = alphabetizeString(str2).trim();
    for (let char of str1) {
        if (str2.includes(char) && !result.includes(char)) {
            result.push(char);
        }
    }
    if (str2.length < 5) {
        return (result.length > (str2.length * 0.9));
    }
    return (result.length > (str2.length * 0.65));
}

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

const setScoreOnPage = () => {
    document.querySelector("#score").innerHTML = `Score: ${score}`
    document.querySelector("#correct-counter").innerHTML = `Games Known: ${gameScore}/${songsCalled}`;
}

