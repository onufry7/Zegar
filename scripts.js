function setClock() {
	const secondHand = document.querySelector('.seconds');
	const minuteHand = document.querySelector('.minutes');
	const hourHand = document.querySelector('.hours');
	const timeDay = document.querySelector('.carousel');
	const now = new Date();

	const secs = now.getSeconds();
	const mins = now.getMinutes() * 60 + secs;
	const hours = now.getHours() * 3600 + mins + secs;

	secondHand.style.animationDelay = `-${secs}s`;
	minuteHand.style.animationDelay = `-${mins}s`;
	hourHand.style.animationDelay = `-${hours}s`;
	timeDay.style.animationDelay = `-${hours}s`;
}


function playSound() {
	const { value: sound } = document.querySelector('#sound');
	const melody = `audio/${sound}.mp3`;
	const audio = new Audio(melody);
	audio.play();
}


function shouldPlayMelody() {
	const { value: mute } = document.querySelector('#volume');
	if (mute == 0) return false;

	const now = new Date();
	const minutes = now.getMinutes();
	const seconds = now.getSeconds();

	if (minutes == 0 && seconds == 0) playSound();
}


function setIconWeather(icon = null) {
	let iconWeather;

	if (icon == null) iconWeather = 'img/undefined-weather.png';
	else iconWeather = `https://openweathermap.org/img/wn/${icon}.png`;

	const img = document.querySelector('.weather img');

	img.classList.remove("transit");

	requestAnimationFrame(() => {
		img.src = iconWeather;
		img.classList.add("transit");
	});
}


async function setWether(data) {
	const { cod, weather, coord, main } = await data;
	let err;

	switch (cod) {
		case 200: {
			setTooltip('Pogoda dla: dłu. ' + coord.lon + ' szer. ' + coord.lat + "\u000A" + 'Temp. ' + main.temp + "\u2103");
			const { icon } = weather[0];
			setIconWeather(icon);
			return true;
		}

		case 110:
			err = "Błąd: Przekroczono czas połączenia.";
			break;

		case 301:
			err = "Błąd: Trwale przeniesiony.";
			break;

		case 400:
			err = "Błąd: 	Nieprawidłowe zapytanie.";
			break;

		case 401:
		case '401':
			err = "Błąd: Brak autoryzacji.";
			break;

		case 402:
			err = "Błąd: Wymagana opłata.";
			break;

		case 403:
			err = "Błąd: Dostęp zabroniony.";
			break;

		case 404:
			err = "Błąd: Żądany adres nie istnieje.";
			break;

		case 407:
			err = "Błąd: Wymagane uwierzytelnienie.";
			break;

		case 413:
		case 414:
			err = "Błąd: Zadługa encja lub URI.";
			break;

		case 500:
			err = "Błąd: Wewnętrzny błąd serwera.";
			break;

		case 503:
			err = "Błąd: Usługa niedostępna.";
			break;

		case 505:
			err = "Błąd: Nieobsługiwana wersja HTTP.";
			break;

		case 509:
			err = "Błąd: Serwer jest tymczasowo niedostępny.";
			break;

		default:
			err = "Wystąpił nieokreślony błąd.";
	}

	setTooltip(err);
	console.log(err);
	setIconWeather();
	return false;
}


async function getWhether(params) {
	const { lon, lat, units, lang, appid } = params;
	const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&lang=${lang}&appid=${appid}`;
	const response = await fetch(url);
	const data = await response.json();
	return data;
}


async function getApiKey() {
	const response = await fetch("api_key.json");

	if (response.status == 404) {
		throw new Error("Brak pliku, utwórz plik api_key.json z kluczem API.");
	} else if (!response.ok) {
		throw new Error(`Nie udało się załadować pliku. HTTP status: ${response.status}`);
	}

	const data = await response.json();
	if (!data.api_key) throw new Error("Brak klucza API w pliku JSON!");

	return data.api_key;
}


function runWhether({ coords }) {
	getApiKey()
		.then(apiKey => {
			const params = {
				lon: coords.longitude,
				lat: coords.latitude,
				units: 'metric',
				lang: 'pl',
				appid: apiKey,
			};

			return getWhether(params);
		})
		.then(data => {
			return setWether(data);
		})
		.catch(error => {
			console.error(error);
			setTooltip(error);
		});
}


function setTooltip(message) {
	const tooltip = document.querySelector('.weather');
	tooltip.setAttribute("data-info", message);
}


function locationErr(err) {
	console.log('błędy lokalizacji: ', err);
	setTooltip('Błąd: Nie udało się ustawić lokalizacji.');
}


function setCookie(event) {
	if (navigator.cookieEnabled) {
		const { name, value } = event.target;
		let cookieText = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
		const date = new Date();

		date.setTime(date.getTime() + (24 * 60 * 60 * 1000));
		cookieText += `; expires=${date.toGMTString()}`;

		document.cookie = cookieText;
	}
}


function getCookie(name) {
	if (document.cookie) {
		const cookies = document.cookie.split(/; */);

		const cookie = cookies.find(cookie => {
			const [cookieName] = cookie.split("=");
			return cookieName.trim() === decodeURIComponent(name);
		});

		if (cookie) {
			return decodeURIComponent(cookie.split("=")[1]);
		}
	}
	return null;
}


function setConfigs() {
	const volume = getCookie('volume');
	const sound = getCookie('sound');

	if (volume) document.querySelector('#volume').value = volume;
	if (sound) document.querySelector('#sound').value = sound;
}



document.addEventListener('DOMContentLoaded', function (event) {
	setClock(); // Ustawiamy godzinę
	setConfigs(); // Ustawienia aplikacji
	setInterval(shouldPlayMelody, 1000); // = 1s - sprawdza czy uruchomić dźwięk

	if (!navigator.geolocation) {
		setTooltip('Błąd: Brak wsparcia dla lokalizacji.');
	} else {
		navigator.geolocation.getCurrentPosition(runWhether, locationErr);
		setInterval(() => {
			navigator.geolocation.getCurrentPosition(runWhether, locationErr);
		}, 2700000); // 45 minut
	}

	document.querySelector('.config').addEventListener("change", setCookie, false);

}, false);

