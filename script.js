
/*
    WEATHER NOW - BEGINNER VERSION

    This file controls the behaviour of the website.

    HTML = the structure
    CSS  = the design
    JavaScript = what the website DOES
*/


/* =========================================================
    1. GET IMPORTANT HTML ELEMENTS
========================================================= */

const unitsButton = document.getElementById("unitsButton");
const unitsMenu = document.getElementById("unitsMenu");

const retryButton = document.getElementById("retryButton");
const errorBox = document.getElementById("errorBox");
const app = document.getElementById("app");

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const suggestions = document.getElementById("suggestions");

const emptyMessage = document.getElementById("emptyMessage");

const weatherContent = document.getElementById("weatherContent");
const currentWeather = document.getElementById("currentWeather");
const weatherStats = document.getElementById("weatherStats");
const dailyForecast = document.getElementById("dailyForecast");

const dayButton = document.getElementById("dayButton");
const dayLabel = document.getElementById("dayLabel");
const dayMenu = document.getElementById("dayMenu");
const hourlyForecast = document.getElementById("hourlyForecast");


/* =========================================================
   2. OUR BASIC VARIABLES
   ========================================================= */

// These are the units we are currently using.
let units = {
    temperature: "celsius",
    wind: "kmh",
    rain: "mm"
};


// This is the place shown when the website first opens.
let place = {
    name: "Berlin",
    country: "Germany",
    latitude: 52.52,
    longitude: 13.41
};


// Weather information from the API will be stored here.
let weatherData = null;


// Which day are we showing in the hourly forecast?
let selectedDay = 0;


// We use this to remember the search results.
let searchResults = [];


/* =========================================================
   3. HELPER FUNCTIONS
   ========================================================= */


/*
    This function changes the screen.

    Example:
    showError() = show error message
    showWeather() = show weather
*/
function showScreen(screenName) {

    errorBox.classList.add("hidden");
    app.classList.remove("hidden");
    emptyMessage.classList.add("hidden");
    weatherContent.classList.remove("hidden");

    if (screenName === "error") {
        errorBox.classList.remove("hidden");
        app.classList.add("hidden");
    }

    if (screenName === "empty") {
        emptyMessage.classList.remove("hidden");
        weatherContent.classList.add("hidden");
    }
}


/*
    Convert Open-Meteo weather code to an emoji.
*/
function getWeatherIcon(code) {

    if (code === 0) return "☀️";
    if (code <= 2) return "⛅";
    if (code === 3) return "☁️";
    if (code <= 48) return "🌫️";
    if (code <= 57) return "🌦️";
    if (code <= 67) return "🌧️";
    if (code <= 77) return "🌨️";
    if (code <= 82) return "🌦️";
    if (code <= 86) return "🌨️";

    return "⛈️";
}


/*
    Round a number.

    Example:
    24.7 becomes 25
*/
function roundNumber(number) {
    return Math.round(number);
}


/*
    Turn a date like:

    2026-10-04

    into:

    Sunday
*/
function getDayName(dateText, short = false) {

    const date = new Date(dateText + "T00:00:00");

    return date.toLocaleDateString("en-US", {
        weekday: short ? "short" : "long"
    });
}


/*
    Change 14:00 into 2 PM.
*/
function getTime12Hour(timeText) {

    const hour = Number(timeText.substring(11, 13));

    const hour12 = hour % 12 || 12;

    const amOrPm = hour < 12 ? "AM" : "PM";

    return hour12 + " " + amOrPm;
}


/* =========================================================
   4. LOADING SCREEN
   ========================================================= */

function showLoading() {

    showScreen("weather");

    currentWeather.innerHTML = `
        <div>
            <h2>Loading...</h2>
            <p>Please wait</p>
        </div>

        <div class="temperature">
            <span class="weather-icon">⏳</span>
        </div>
    `;

    weatherStats.innerHTML = `
        <div class="stat-card"><span>Feels Like</span><strong>---</strong></div>
        <div class="stat-card"><span>Humidity</span><strong>---</strong></div>
        <div class="stat-card"><span>Wind</span><strong>---</strong></div>
        <div class="stat-card"><span>Precipitation</span><strong>---</strong></div>
    `;

    dailyForecast.innerHTML = "";
    hourlyForecast.innerHTML = "";
}


/* =========================================================
   5. GET WEATHER FROM OPEN-METEO
   ========================================================= */

async function loadWeather() {

    showLoading();

    /*
        URLSearchParams helps us create the API URL.

        We are telling Open-Meteo:
        - where we want weather
        - how many days
        - what information we need
        - which units we want
    */

    const parameters = new URLSearchParams({

        latitude: place.latitude,
        longitude: place.longitude,

        timezone: "auto",

        forecast_days: 7,

        current: "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",

        hourly: "temperature_2m,weather_code",

        daily: "weather_code,temperature_2m_max,temperature_2m_min",

        temperature_unit: units.temperature,

        wind_speed_unit: units.wind,

        precipitation_unit: units.rain
    });


    const apiUrl = "https://api.open-meteo.com/v1/forecast?" + parameters.toString();


    try {

        const response = await fetch(apiUrl);

        /*
            If the server gives an error,
            stop here.
        */
        if (!response.ok) {
            throw new Error("Weather request failed");
        }

        // Convert server response into JavaScript object.
        weatherData = await response.json();

        // Put the information on the page.
        displayWeather();

    } catch (error) {

        console.log(error);

        showScreen("error");
    }
}


/* =========================================================
   6. DISPLAY CURRENT WEATHER
========================================================= */

function displayWeather() {

    showScreen("weather");
    const current = weatherData.current;
    /*
        Format today's date.
    */
    const date = new Date(current.time);
    const dateText = date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    currentWeather.innerHTML = `

        <div>
            <h2>${place.name}, ${place.country}</h2>
            <p>${dateText}</p>
        </div>

        <div class="temperature">

            <span class="weather-icon">
                ${getWeatherIcon(current.weather_code)}
            </span>

            <strong class="temperature-number">
                ${roundNumber(current.temperature_2m)}°
            </strong>

        </div>
    `;
    displayWeatherStats();
    displayDailyForecast();
    createDayMenu();
    displayHourlyForecast();
}


/* =========================================================
   7. DISPLAY WEATHER DETAILS
   ========================================================= */

function displayWeatherStats() {

    const current = weatherData.current;


    let windUnit = "km/h";

    if (units.wind === "mph") {
        windUnit = "mph";
    }


    let rainUnit = "mm";

    if (units.rain === "inch") {
        rainUnit = "in";
    }
    weatherStats.innerHTML = `

        <div class="stat-card">
            <span>Feels Like</span>
            <strong>
                ${roundNumber(current.apparent_temperature)}°
            </strong>
        </div>

        <div class="stat-card">
            <span>Humidity</span>
            <strong>
                ${roundNumber(current.relative_humidity_2m)}%
            </strong>
        </div>

        <div class="stat-card">
            <span>Wind</span>
            <strong>
                ${roundNumber(current.wind_speed_10m)} ${windUnit}
            </strong>
        </div>

        <div class="stat-card">
            <span>Precipitation</span>
            <strong>
                ${current.precipitation} ${rainUnit}
            </strong>
        </div>
    `;
}


/* =========================================================
   8. DAILY FORECAST
   ========================================================= */

function displayDailyForecast() {

    const daily = weatherData.daily;
    let html = "";
    for (let i = 0; i < daily.time.length; i++) {

        html += `

            <div class="day-card">

                <span>
                    ${getDayName(daily.time[i], true)}
                </span>

                <span class="weather-icon">
                    ${getWeatherIcon(daily.weather_code[i])}
                </span>

                <div class="day-temperatures">

                    <span>
                        ${roundNumber(daily.temperature_2m_max[i])}°
                    </span>

                    <span>
                        ${roundNumber(daily.temperature_2m_min[i])}°
                    </span>

                </div>

            </div>
        `;
    }
    dailyForecast.innerHTML = html;
}


/* =========================================================
   9. DAY MENU
   ========================================================= */

function createDayMenu() {

    const daily = weatherData.daily;
    dayMenu.innerHTML = "";
    for (let i = 0; i < daily.time.length; i++) {

        const button = document.createElement("button");

        button.textContent = getDayName(daily.time[i]);

        button.addEventListener("click", function() {

            selectedDay = i;

            displayHourlyForecast();

            dayMenu.classList.add("hidden");

        });
        dayMenu.appendChild(button);
    }
}


/* =========================================================
   10. HOURLY FORECAST
   ========================================================= */

function displayHourlyForecast() {

    const hourly = weatherData.hourly;

    const selectedDate =
        weatherData.daily.time[selectedDay];


    dayLabel.textContent =
        getDayName(selectedDate);


    hourlyForecast.innerHTML = "";


    const currentHour =
        weatherData.current.time.substring(0, 13);


    for (let i = 0; i < hourly.time.length; i++) {

        const time = hourly.time[i];

        /*
            Only show hours belonging to
            the selected day.
        */
        if (!time.startsWith(selectedDate)) {
            continue;
        }

        /*
            On today's page, don't show
            hours that have already passed.
        */
        if (
            selectedDay === 0 &&
            time.substring(0, 13) < currentHour
        ) {
            continue;
        }

        const hour = document.createElement("div");

        hour.className = "hour";
        hour.innerHTML = `

            <span class="weather-icon">
                ${getWeatherIcon(hourly.weather_code[i])}
            </span>

            <span>
                ${getTime12Hour(time)}
            </span>

            <strong>
                ${roundNumber(hourly.temperature_2m[i])}°
            </strong>
        `;
        hourlyForecast.appendChild(hour);
    }
}


/* =========================================================
   11. UNITS MENU
   ========================================================= */

function showUnitsMenu() {

    let temperatureText = "Celsius (°C)";
    let windText = "km/h";
    let rainText = "Millimeters (mm)";


    if (units.temperature === "fahrenheit") {
        temperatureText = "Fahrenheit (°F)";
    }

    if (units.wind === "mph") {
        windText = "mph";
    }

    if (units.rain === "inch") {
        rainText = "Inches (in)";
    }


    unitsMenu.innerHTML = `

        <button id="switchUnits">
            Switch to
            ${units.temperature === "celsius" ? "Imperial" : "Metric"}
        </button>

        <div class="menu-title">Temperature</div>

        <button data-temperature="celsius">
            ${temperatureText}
        </button>

        <button data-temperature="fahrenheit">
            Fahrenheit (°F)
        </button>

        <hr>

        <div class="menu-title">Wind Speed</div>

        <button data-wind="kmh">
            km/h
        </button>

        <button data-wind="mph">
            mph
        </button>

        <hr>

        <div class="menu-title">Precipitation</div>

        <button data-rain="mm">
            Millimeters (mm)
        </button>

        <button data-rain="inch">
            Inches (in)
        </button>
    `;


    /*
        Switch everything at once.
    */
    document.getElementById("switchUnits").addEventListener("click", function() {

        if (units.temperature === "celsius") {

            units.temperature = "fahrenheit";
            units.wind = "mph";
            units.rain = "inch";

        } else {

            units.temperature = "celsius";
            units.wind = "kmh";
            units.rain = "mm";
        }

        unitsMenu.classList.add("hidden");

        loadWeather();
    });

    /*
        Temperature buttons.
    */
    const temperatureButtons = unitsMenu.querySelectorAll("[data-temperature]");

    temperatureButtons.forEach(function(button) {

        button.addEventListener("click", function() {

            units.temperature =
                button.dataset.temperature;

            loadWeather();

        });
    });


    /*
        Wind buttons.
    */
    const windButtons =
        unitsMenu.querySelectorAll("[data-wind]");

    windButtons.forEach(function(button) {

        button.addEventListener("click", function() {

            units.wind = button.dataset.wind;

            loadWeather();

        });
    });


    /*
        Rain buttons.
    */
    const rainButtons = unitsMenu.querySelectorAll("[data-rain]");

    rainButtons.forEach(function(button) {

        button.addEventListener("click", function() {

            units.rain = button.dataset.rain;

            loadWeather();

        });
    });
}


/* =========================================================
   12. SEARCH LOCATION
========================================================= */

async function searchLocation(searchText) {

    const url =
        "https://geocoding-api.open-meteo.com/v1/search" +
        "?count=5" +
        "&language=en" +
        "&name=" +
        encodeURIComponent(searchText);


    const response = await fetch(url);


    if (!response.ok) {
        throw new Error("Location search failed");
    }


    const result = await response.json();


    return result.results || [];
}


/* =========================================================
   13. SHOW SEARCH SUGGESTIONS
========================================================= */

function showSuggestions(results) {

    suggestions.innerHTML = "";


    for (let i = 0; i < results.length; i++) {

        const result = results[i];

        const button =
            document.createElement("button");


        button.textContent =
            [
                result.name,
                result.admin1,
                result.country
            ]
            .filter(Boolean)
            .join(", ");


        button.addEventListener("click", function() {

            choosePlace(result);

        });


        suggestions.appendChild(button);
    }


    suggestions.classList.remove("hidden");
}


/* =========================================================
   14. CHOOSE A PLACE
========================================================= */

function choosePlace(result) {

    place = {

        name: result.name,

        country: result.country || "",

        latitude: result.latitude,

        longitude: result.longitude
    };


    searchInput.value = "";

    suggestions.classList.add("hidden");

    loadWeather();
}


/* =========================================================
   15. SEARCH INPUT
========================================================= */

let searchTimer;


searchInput.addEventListener("input", function() {

    clearTimeout(searchTimer);


    const text =
        searchInput.value.trim();


    if (text.length < 2) {

        suggestions.classList.add("hidden");

        return;
    }


    suggestions.innerHTML = "<div style='padding:10px'>Searching...</div>";

    suggestions.classList.remove("hidden");


    /*
        Wait 300 milliseconds before searching.

        This prevents the website from sending
        a request for every single letter.
    */
    searchTimer = setTimeout(async function() {

        try {

            searchResults =
                await searchLocation(text);


            if (searchResults.length > 0) {

                showSuggestions(searchResults);

            } else {

                suggestions.innerHTML =
                    "<div style='padding:10px'>No place found</div>";
            }

        } catch (error) {

            suggestions.classList.add("hidden");

        }

    }, 300);
});


/* =========================================================
   16. SEARCH FORM
========================================================= */

searchForm.addEventListener("submit", async function(event) {

    event.preventDefault();


    const text =
        searchInput.value.trim();


    if (text === "") {
        return;
    }


    try {

        const results =
            await searchLocation(text);


        if (results.length === 0) {

            showScreen("empty");

            return;
        }

        choosePlace(results[0]);

    } catch (error) {

        showScreen("error");
    }
});


/* =========================================================
   17. BUTTON EVENTS
   ========================================================= */


// Open / close Units menu.
unitsButton.addEventListener("click", function() {

    showUnitsMenu();

    unitsMenu.classList.toggle("hidden");

    dayMenu.classList.add("hidden");
});


// Open / close Day menu.
dayButton.addEventListener("click", function() {

    if (!weatherData) {
        return;
    }

    dayMenu.classList.toggle("hidden");

    unitsMenu.classList.add("hidden");
});


// Retry weather request.
retryButton.addEventListener("click", function() {

    loadWeather();

});

// Click outside the menus = close menus.
document.addEventListener("click", function(event) {

    if (!event.target.closest(".menu-box")) {

        unitsMenu.classList.add("hidden");
        dayMenu.classList.add("hidden");
    }

});


/* =========================================================
   18. START THE WEBSITE
========================================================= */

showUnitsMenu();

loadWeather();
