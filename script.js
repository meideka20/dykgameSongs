import { pictoSongs } from './src/pictosongs.js';
import { games } from './src/gameslist.js';
import { slGGsongs } from './src/slggsongs.js';

let gamesList = [];
let songs = `{"Yoga": {"track": "Yoga", "game": "Wii Fit", "url": "https://www.youtube.com/embed/RZFhVs6OGAcrel=0&enablejsapi=1"}}`

// let sammiSubmitUrl = 'https://forms.gle/gsQeNaso6pXGTLkQ7';

const songsParse = JSON.parse(songs);

// const id = "z7k7pzyddfxmgm1xqdwaau7nzvvdcc";
// const secret = "7pv4r3cftsevz6ybqc17jh6b1s8y16";
// let accessToken;

// let postURL = `https://id.twitch.tv/oauth2/token?client_id=${id}&client_secret=${secret}&grant_type=client_credentials`
let song;
let score;
let gameScore;
let songsCalled;
let list;
let timerId;
let seconds = 0;
let achievement;
window.onload = () => {
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
    //IGDB CODE (CORS REQUEST 401)
    //need to set up proxy to get direct access to api
    // fetch(
    //     "https://id.twitch.tv/oauth2/token?client_id=z7k7pzyddfxmgm1xqdwaau7nzvvdcc&client_secret=7pv4r3cftsevz6ybqc17jh6b1s8y16&grant_type=client_credentials",
    //     {
    //         method: "POST",
    //         headers: {
    //             "Content-type": "application/json; charset=UTF-8"
    //         },
    //         body: JSON.stringify({
    //             client_id: 'z7k7pzyddfxmgm1xqdwaau7nzvvdcc',
    //             client_secret: '7pv4r3cftsevz6ybqc17jh6b1s8y16',
    //             grant_type: 'client_credentials'
    //         })
    //     })
    //         .then(response => response.json())
    //         .then(data => {
    //             accessToken = data.access_token;
    //         })
    //         .catch(error => {
    //             console.error('Error fetching data:', error);
    //         })

    // fetch(
    //     "https://api.igdb.com/v4/games",
    //     {
    //         method: 'POST',
    //         headers: {
    //             'Accept': 'application/json',
    //             'Client-ID': 'z7k7pzyddfxmgm1xqdwaau7nzvvdcc',
    //             'Authorization': 'Bearer ' + accessToken,
    //             'Access-Control-Allow-Origin': '*'
    //         },
    //         body: "name"
    //     })
    //     .then(response => {
    //         console.log(response.json());
    //     })
    //     .catch(err => {
    //         console.error(err);
    //     });
    document.querySelectorAll("button").forEach(div => {
        div.style.cursor = 'pointer';
    });
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
    if (song == undefined) {
        alert("The game is over!");
    }
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
