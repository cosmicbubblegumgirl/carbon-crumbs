function summariseActivities(activities, weeklyGoal = 35) {
  let weeklyTotal = 0;
  let streak = 0;
  
  // Calculate streak — convert loggedAt Dates to YYYY-MM-DD strings first
  const daySet = new Set(activities.map(a => new Date(a.loggedAt).toISOString().slice(0, 10)));

  let cursorDate = new Date();
  while (daySet.has(cursorDate.toISOString().slice(0, 10))) {
    streak++;
    cursorDate.setDate(cursorDate.getDate() - 1);
  }

  // Calculate this week's total
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  
  activities.forEach(activity => {
    if (new Date(activity.loggedAt) >= weekStart) {
      weeklyTotal += activity.emission;
    }
  });

  // --- CREATIVE FEATURE: Eco-Titles ---
  let ecoTitle = "Curious Seedling 🌱";
  if (streak >= 3) ecoTitle = "Dedicated Sapling 🌿";
  if (streak >= 7) ecoTitle = "Steady Tree 🌳";
  if (streak >= 14) ecoTitle = "Forest Guardian 🦌";
  if (streak >= 30) ecoTitle = "Captain Planet 🌍";

  return {
    weeklyTotal,
    streak,
    ecoTitle,
    goalProgress: {
      used: weeklyTotal,
      remaining: Math.max(weeklyGoal - weeklyTotal, 0),
    }
  };
}

module.exports = { summariseActivities };