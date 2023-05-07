'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

//Application Architecture
//Classes
class App {
  workouts = [];
  #map;
  #mapE;
  constructor() {
    //get user position
    this.#getPosition();

    //loading stored workouts
    this.#loadStoredData();

    //deciding workout type
    inputType.addEventListener("change", this.#changeWorkoutType);

    //submitting form
    form.addEventListener("submit", this.#newWorkout.bind(this));

    //center workout
    containerWorkouts.addEventListener("click", this.#moveMap.bind(this));
  }
  #getPosition() {
    if(navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this.#loadMap.bind(this)
        ,
        function() {
        alert("Can't access your location");
      });
  }
  #loadMap(pos) {
    const {latitude} = pos.coords;
    const {longitude} = pos.coords;

    //loading map with current location
    this.#map = L.map('map').setView([latitude, longitude], 15);

    L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      {
        maxZoom: 20,
        subdomains:['mt0','mt1','mt2','mt3']
      }).addTo(this.#map);

    //Adding marker
    L.marker([latitude, longitude])
      .addTo(this.#map)
      .bindPopup('Current Location')
      .openPopup();

    //Like adding event listener
    this.#map.on("click", this.#showForm.bind(this)); 

    this.workouts.forEach(work => this.#addMarker(work));
  }
  #showForm(mapEvent) {
    this.#mapE = mapEvent;
    form.classList.remove("hidden");
    inputDistance.focus();
  }
  #changeWorkoutType() {
    inputElevation.parentElement.classList.toggle("form__row--hidden");
    inputCadence.parentElement.classList.toggle("form__row--hidden");
  }
  #newWorkout(e) {
    e.preventDefault();

    //validating Inputs
    const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    //getting data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapE.latlng;
    let workout;

    //check input type
    if(type === "running") {
      const cadence = +inputCadence.value;
      if(!validInputs(duration, distance, cadence) || !allPositive(duration, distance, cadence)) 
      return alert("Input must be positive number!");

      //creating new workout
      workout = new Running([lat, lng],duration, distance, cadence);
    }
    if(type === "cycling") {
      const elevation = +inputElevation.value;
      if(!validInputs(duration, distance, elevation) || !allPositive(duration, distance)) 
      return alert("Input must be positive number!");

      //creating new workout
      workout = new Cycling([lat, lng],duration, distance, elevation);
    }

    this.#addMarker(workout);

    this.workouts.push(workout);

    this.#renderWorkout(workout);

    this.#addToLocalStorage(workout);

    console.log(app.workouts);

    //hide form
    this.#hideForm();
  }
  //adding a marker
  #addMarker(workout) {
    L.marker(workout.coords)
    .addTo(this.#map)
    .bindPopup(
      L.popup({
        maxWidth: 200,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: `${workout.type}-popup`,
    })
    )
    .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
    .openPopup();
  }

  #renderWorkout(workout) {
    const contRun = 
    `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>`;
    const contCyc =
    `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevation}</span>
      <span class="workout__unit">m</span>
    </div>`;

    containerWorkouts.insertAdjacentHTML(
      "beforeend", 
      `<li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"}</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
      ${workout.type === "running"? contRun : contCyc}
    </li>`
  );}
  #hideForm() {
    form.classList.add("hidden");
    form.querySelectorAll("input").forEach(input => {
      input.value = " ";
    })
  }
  #moveMap(e) {
    const workoutDiv = e.target.closest(".workout");
    if(!workoutDiv) return;
    const workout = this.workouts.find(work => work.id === workoutDiv.dataset.id);
    this.#map.setView(workout.coords, 15, {
      animate: true,
      pan: {
        duration: 1
      }
    });
  }
  #addToLocalStorage() {
    localStorage.setItem("Workouts", JSON.stringify(this.workouts));
  }
  #loadStoredData() {
    const storedData = JSON.parse(localStorage.getItem("Workouts"));
    if(!storedData) return;
    this.workouts = storedData;
    this.workouts.forEach(work => this.#renderWorkout(work));
  }
}
const app = new App();


///////////////////////////////////////////////////////////////////////////////
class Workout { 
  date = new Date();
  id = (Date.now() + "").slice(-10);
  constructor(coords, duration, distance) {
    this.coords = coords;
    this.duration = duration;
    this.distance = distance;
  }
}

class Running extends Workout {
  type = "running";
  description = `Running on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  constructor(coords, duration, distance, cadence) {
    super(coords, duration, distance);
    this.cadence = cadence;
    this.calcPace();
  }
  calcPace() {
    this.pace = Math.round(((this.duration / this.distance) + Number.EPSILON) * 100) / 100;
    return this.pace;
  }
}

class Cycling extends Workout {
  type ="cycling";
  description = `Cycling on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  constructor(coords, duration, distance, elevation) {
    super(coords, duration, distance);
    this.elevation = elevation;
    this.calcSpeed();
  }
  calcSpeed() {
    this.speed = Math.round(((this.distance / (this.duration / 60)) + Number.EPSILON) * 100) / 100;
    return this.speed;
  }
}
console.log(app.workouts[2]);