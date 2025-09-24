document.addEventListener("DOMContentLoaded", () => {
  const randomFact = document.getElementById('random-facts');
  const newFactBtn = document.getElementById('new-fact');
  const Fact = document.getElementById('facts');

  const facts = [
    "Recycling 1 ton of paper saves 17 mature trees and 7,000 gallons of water.",
    "Recycling a single aluminum can saves enough energy to power a TV for 3 hours.",
    "Plastic bottles take up to 450 years to decompose in landfills.",
    "Recycling glass reduces related air pollution by 20% and water pollution by 50%.",
    "E-waste makes up only 2% of trash in landfills but contributes to 70% of toxic waste.",
    "Recycling 1 ton of steel conserves 2,500 pounds of iron ore, 1,400 pounds of coal, and 120 pounds of limestone.",
    "Every ton of recycled office paper saves 380 gallons of oil.",
    "Composting organic waste can reduce landfill contributions by up to 30%.",
    "The energy saved from recycling one glass bottle can power a 100-watt bulb for 4 hours.",
    "Recycling helps reduce greenhouse gas emissions—saving 1 metric ton of CO₂ per ton of recycled paper."
  ];

  function showRandomFact() {
    const randomIndex = Math.floor(Math.random() * facts.length);
    Fact.textContent = facts[randomIndex];
  }

  randomFact.addEventListener('click', showRandomFact);
  newFactBtn.addEventListener('click', showRandomFact);
});
