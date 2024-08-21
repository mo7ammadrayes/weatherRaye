

const weatherForm = document.querySelector(".weatherForm");
const cityInput = document.querySelector(".weatherInput");
const weatherCard = document.querySelector(".card");
const suggestionsContainer = document.querySelector(".suggestions-container");
const apiKey = process.env.API_KEY;
let timeInterval;
const favBtn=document.querySelector(".favBtn")
const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

weatherForm.addEventListener("submit", async event => {
    event.preventDefault();
    const city = cityInput.value;
    if (city) {
        try {
            const weatherData = await getWeatherData(city);
            displayWeatherInfo(weatherData);
            console.log(city);
            suggestionsContainer.style.display = 'none';
            // Save the last searched city to local storage
            localStorage.setItem('lastCity', city);

        } catch (error) {
            console.error(error);
            displayError(error.message);
        }
    } else {
        displayError("Enter a city");
    }
});

async function getWeatherData(city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
        throw new Error("couldn't fetch this city's weather");
    } else {
        return await response.json();
    }
}
function displayWeatherInfo(data) {
    weatherCard.textContent = "";
    weatherCard.style.display = "flex";

    const { name: city, sys: { country }, main: { temp, humidity }, weather: [{ description, id }], timezone } = data;

    const cityDisplay = document.createElement("h1");
    const tempDisplay = document.createElement("p");
    const humidityDisplay = document.createElement("p");
    const infoDisplay = document.createElement("p");
    const emojiDisplay = document.createElement("p");
    const timeDisplay = document.createElement("p");

    cityDisplay.textContent = `${city}, ${country}`;
    tempDisplay.textContent = `${(temp - 273.15).toFixed(1)}°C`;
    humidityDisplay.textContent = `Humidity: ${humidity}%`;
    infoDisplay.textContent = description;
    emojiDisplay.textContent = displayWeatherEmoji(id);
    localStorage.setItem('lastCity', city);

    function updateLocalTime() {
        const localTime = formatLocalTime(timezone);
        timeDisplay.textContent = `Local Time: ${localTime}`;
    }

    if (timeInterval) {
        clearInterval(timeInterval);
    }

    updateLocalTime();
    timeInterval = setInterval(updateLocalTime, 3000);

    cityDisplay.classList.add("cityName");
    tempDisplay.classList.add("temp");
    humidityDisplay.classList.add("humidity");
    infoDisplay.classList.add("info");
    emojiDisplay.classList.add("weatherEmoji");
    timeDisplay.classList.add("localTime");

    weatherCard.prepend(cityDisplay);
    weatherCard.append(tempDisplay, emojiDisplay, infoDisplay, humidityDisplay, timeDisplay);
        favBtn.style.display = 'block';
        favBtn.onclick = () => saveToFavorites(city);
    
}

function displayWeatherEmoji(id) {
    switch (true) {
        case (id >= 200 && id < 300):
            return "⛈"; // Thunderstorm
        case (id >= 300 && id < 400):
            return "🌦"; // Drizzle
        case (id >= 500 && id < 600):
            return "🌧"; // Rain
        case (id >= 600 && id < 700):
            return "❄️"; // Snow
        case (id >= 700 && id < 800):
            return "🌫"; // Atmosphere
        case (id === 800):
            return "☀️"; // Clear
        case (id === 801):
            return "🌤"; // Few clouds
        case (id === 802):
            return "⛅️"; // Scattered clouds
        case (id === 803):
            return "🌥"; // Broken clouds
        case (id === 804):
            return "☁️"; // Overcast clouds
        default:
            return "❓"; // Unknown condition
    }
}

function displayError(msg) {
    const errorDisplay = document.createElement("p");
    errorDisplay.textContent = msg;
    errorDisplay.classList.add("error");

    weatherCard.textContent = "";
    weatherCard.style.display = "flex";
    weatherCard.appendChild(errorDisplay);
}

function formatLocalTime(timezoneOffset) {
    const now = new Date();
    const localTime = new Date(now.getTime() + (timezoneOffset * 1000));
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
        timeZoneName: 'short'
    };
    return new Intl.DateTimeFormat('en-US', options).format(localTime);
}

weatherForm.addEventListener("input", async event => {
    const cityName = cityInput.value.trim();
    if (cityName.length > 2) {
        try {
            const suggestionData = await fetchCitySuggestions(cityName);
            console.log(suggestionData);
            displaySuggestions(suggestionData);
        } catch (error) {
            console.error(error);
        }
    } else {
        suggestionsContainer.textContent = "";
        suggestionsContainer.style.display = "none";
    }
});

async function fetchCitySuggestions(city) {
    const apiUrl = `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${city}&limit=10`;
    const response = await fetch(apiUrl, {
        headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,  // Use environment variable here
            'x-rapidapi-host': 'wft-geo-db.p.rapidapi.com'
        }
    });

    if (!response.ok) {
        throw new Error("Error fetching city suggestions");
    } else {
        const data = await response.json();
        return data.data.map(city => `${city.name}, ${city.countryCode}`);
    }
}

function displaySuggestions(suggestions) {
    suggestionsContainer.innerHTML = ''; // Clear previous suggestions
    if (suggestions.length > 0) {
        suggestionsContainer.style.display = 'block';
        suggestions.forEach(suggestion => {
            const suggestionItem = document.createElement("div");
            suggestionItem.textContent = suggestion;
            suggestionItem.classList.add("suggestion-item");
            suggestionItem.addEventListener("click", () => selectSuggestion(suggestion));
            suggestionsContainer.appendChild(suggestionItem);
        });
    } else {
        suggestionsContainer.style.display = 'none';
    }
}



function selectSuggestion(suggestion) {
    cityInput.value = suggestion;
    suggestionsContainer.innerHTML = '';
    suggestionsContainer.style.display = 'none';
}

function saveToFavorites(city) {
    try {
        let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        if (!favorites.includes(city)) {
            favorites.push(city);
            localStorage.setItem('favorites', JSON.stringify(favorites));
            alert(`${city} added to favorites!`);
        } else {
            alert(`${city} is already in your favorites.`);
        }
        loadFavorites();
    } catch (error) {
        console.error('Error saving to favorites:', error);
    }
}

function removeFromFavorites(city) {
    try {
        let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        favorites = favorites.filter(favCity => favCity !== city);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        loadFavorites(); // Refresh the favorites list display
    } catch (error) {
        console.error('Error removing from favorites:', error);
    }
}
function loadFavorites() {
    const favoritesList = document.getElementById('favorites');
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    favoritesList.innerHTML = ''; // Clear the list first
    favorites.forEach(city => {
        const li = document.createElement('li');
        li.textContent = city;
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => removeFromFavorites(city);
        li.appendChild(deleteButton);
        li.onclick = () => getWeatherData(city).then(displayWeatherInfo);
        favoritesList.appendChild(li);
    });
}


window.addEventListener('DOMContentLoaded', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
    } else {
        handleFallback(); // Fallback to last city or default behavior
    }
    loadFavorites();
});

function successCallback(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    getWeatherByCoordinates(lat, lon);
}

function errorCallback(error) {
    console.error("Error retrieving location: ", error);
    handleFallback(); // Fallback to last city or default behavior
}

function handleFallback() {
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        getWeatherData(lastCity).then(weatherData => {
            displayWeatherInfo(weatherData);
        }).catch(error => {
            console.error(error);
            displayError(error.message);
        });
    } else {
        console.log("No last city found, or geolocation not supported.");
        // Optionally, provide a default city or notify the user
    }
}

