window.APP_CONFIG = {
  // When served by Express the API lives on the same origin; override for production.
  apiBase: "",
  assetBase: "./assets/",
  storageKeys: {
    activities: "carboncrumbs.activities",
    goal: "carboncrumbs.goal",
    animal: "carboncrumbs.animal",
    authUser: "carboncrumbs.authUser",
    users: "carboncrumbs.users",
    streak: "carboncrumbs.streak",
    token: "carboncrumbs.token"
  },
  communityAverageWeekly: 22.4,
  defaultGoal: 35,
  presets: [
    {
      title: "Car commute",
      category: "transport",
      quantity: 10,
      co2: 0.21,
      note: "Average petrol car trip"
    },
    {
      title: "Bus ride",
      category: "transport",
      quantity: 10,
      co2: 0.08,
      note: "Public transport alternative"
    },
    {
      title: "Short flight",
      category: "transport",
      quantity: 1,
      co2: 90,
      note: "A high-impact activity"
    },
    {
      title: "Beef-based meal",
      category: "food",
      quantity: 1,
      co2: 5.0,
      note: "Red meat usually carries a higher footprint"
    },
    {
      title: "Vegetarian meal",
      category: "food",
      quantity: 1,
      co2: 1.5,
      note: "A lighter meal choice"
    },
    {
      title: "Home electricity use",
      category: "energy",
      quantity: 5,
      co2: 0.5,
      note: "Estimated kWh-related impact"
    },
    {
      title: "Air conditioner use",
      category: "energy",
      quantity: 4,
      co2: 0.9,
      note: "Cooling can add up quickly"
    }
  ],
  animals: [
    {
      id: "deer",
      name: "Deer",
      emoji: "🦌",
      story: "A graceful forest guide for mindful daily choices."
    },
    {
      id: "fox",
      name: "Fox",
      emoji: "🦊",
      story: "Quick, clever, and always looking for lighter paths."
    },
    {
      id: "otter",
      name: "Otter",
      emoji: "🦦",
      story: "A playful river companion who loves cleaner waters."
    },
    {
      id: "owl",
      name: "Owl",
      emoji: "🦉",
      story: "A watchful keeper of the night and wiser habits."
    },
    {
      id: "rabbit",
      name: "Rabbit",
      emoji: "🐇",
      story: "Soft-footed and gentle, a symbol of tender choices."
    },
    {
      id: "turtle",
      name: "Turtle",
      emoji: "🐢",
      story: "Slow, steady, and deeply connected to fragile ecosystems."
    }
  ],
  shadeLegend: [
    { label: "Fresh moss", max: 2, color: "#d8ead3" },
    { label: "Soft fern", max: 5, color: "#b8d4b0" },
    { label: "Weathered sage", max: 10, color: "#94b38c" },
    { label: "Heavy earth", max: 20, color: "#7f8f6e" },
    { label: "Deep ember", max: Infinity, color: "#7d5a50" }
  ]
};
