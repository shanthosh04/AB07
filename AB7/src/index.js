import hh from "hyperscript-helpers";
import { h, diff, patch } from "virtual-dom";
import createElement from "virtual-dom/create-element";

const { div, button, input } = hh(h);

const MSGS = {
  SAVE_WEATHER: "SAVE_WEATHER",
  DELETE: "DELETE",
  TEXTFIELD: "TEXTFIELD",
};

const generateMessage = (msg, data) => ({
  type: msg,
  data,
});

const APIKEY = "IHR_OPENWEATHER_API_SCHLÜSSEL"; // Setzen Sie hier Ihren OpenWeather API-Schlüssel ein

const makeOpenWeatherAPICall = async (location) => {
  const URL = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${APIKEY}&units=metric`;
  try {
    const response = await fetch(URL);
    const data = await response.json();
    const { temp, temp_min, temp_max } = data.main;
    console.log(temp, temp_min, temp_max);
    return { name: data.name, temp, temp_min, temp_max, error: null };
  } catch (error) {
    console.error("Fehler bei der OpenWeather API-Anfrage:", error);
    return { name: "", temp: "", temp_min: "", temp_max: "", error: "Fehler bei der Anfrage" };
  }
};

function weatherRow(dispatch, className, weather) {
  return div({ className }, [
    div(`Location: ${weather.Location}`),
    div(`Temperature: ${weather.Temperature}°C`),
    div(`Max Temperature: ${weather.Temp_max}°C`),
    div(`Min Temperature: ${weather.Temp_min}°C`),
    div({ className: "text-right" }, [
      button(
        {
          className: "hover:bg-gray-200 p-2 rounded",
          onclick: () => dispatch({ type: MSGS.DELETE, id: weather.id }),
        },
        "🗑"
      ),
    ]),
  ]);
}

function view(dispatch, model) {
  const { loading, name, temp, temp_max, temp_min, error } = model;
  const btnStyle =
    "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded";

  return div({ className: "flex flex-col gap-4 items-center" }, [
    div({ className: "flex gap-4" }, [
      input({
        className: "Location",
        placeholder: "Location",
        oninput: (event) =>
          dispatch(generateMessage(MSGS.TEXTFIELD, event.target.value)),
      }),
      button(
        {
          className: btnStyle,
          onclick: async () => {
            dispatch(generateMessage(MSGS.SAVE_WEATHER));
            const data = await makeOpenWeatherAPICall(model.locationText);
            dispatch({ type: MSGS.SAVE_WEATHER, data });
          },
        },
        "SAVE"
      ),
    ]),
    loading ? div("Loading...") : error ? div(error) : null,
    !loading && !error
      ? div({ className: "search-result" }, [
          div(`Name: ${name}`),
          div(`Temp: ${temp}°C`),
          div(`Max Temp: ${temp_max}°C`),
          div(`Min Temp: ${temp_min}°C`),
        ])
      : null,
  ]);
}

function update(msg, model) {
  switch (msg.type) {
    case MSGS.SAVE_WEATHER:
      const { data } = msg;
      const newWeatherRow = {
        id: model.nextId,
        Location: data.name,
        Temperature: data.temp,
        Temp_max: data.temp_max,
        Temp_min: data.temp_min,
      };
      return {
        ...model,
        nextId: model.nextId + 1,
        weatherRow: [...model.weatherRow, newWeatherRow],
      };
    case MSGS.TEXTFIELD:
      return { ...model, locationText: msg.data };
    case MSGS.DELETE:
      const { id } = msg;
      const updatedWeatherRow = model.weatherRow.filter((weather) => weather.id !== id);
      return { ...model, weatherRow: updatedWeatherRow };
    default:
      return model;
  }
}

function app(initModel, update, view, node) {
  let model = initModel;
  let currentView = view(dispatch, model);
  let rootNode = createElement(currentView);
  node.appendChild(rootNode);

  function dispatch(msg) {
    model = update(msg, model);
    const updatedView = view(dispatch, model);
    const patches = diff(currentView, updatedView);
    rootNode = patch(rootNode, patches);
    currentView = updatedView;
  }
}

const initModel = {
  locationText: "",
  name: "",
  temp: "",
  temp_max: "",
  temp_min: "",
  loading: false,
  error: null,
  nextId: 2,
  weatherRow: [
    {
      id: 1,
      Location: "London",
      Temperature: 20,
      Temp_max: 20,
      Temp_min: 18,
    }],
};

const rootNode = document.getElementById("app");
app(initModel, update, view, rootNode);
