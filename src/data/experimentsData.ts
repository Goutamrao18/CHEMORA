export interface Experiment {
  id: string;
  title: string;
  emoji: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  topic: string;
  summary: string;
  equipment: string[];
  chemicals: string[];
  steps: string[];
  observations: string[];
  explanation: string;
  equation: string;
  conclusion: string;
  safety: string;
}

export const EXPERIMENTS: Experiment[] = [
  {
    "id": "neutralisation",
    "title": "Acid–Base Neutralisation",
    "emoji": "⚖️",
    "level": "Beginner",
    "topic": "Acids & Bases",
    "summary": "Use an indicator to find the exact point where an acid cancels out an alkali.",
    "equipment": [
      "Conical flask",
      "Burette",
      "Pipette",
      "White tile",
      "Funnel"
    ],
    "chemicals": [
      "Hydrochloric acid",
      "Sodium hydroxide",
      "Phenolphthalein"
    ],
    "steps": [
      "Pipette 25 cm³ of sodium hydroxide into a conical flask.",
      "Add 3 drops of phenolphthalein — the solution turns pink.",
      "Fill the burette with hydrochloric acid and note the starting volume.",
      "Add acid slowly, swirling, until the pink colour just disappears.",
      "Record the final burette reading and calculate the volume used."
    ],
    "observations": [
      "Solution starts pink",
      "Colour fades near the end-point",
      "Becomes colourless at neutralisation",
      "Flask feels slightly warm"
    ],
    "explanation": "Hydrogen ions from the acid combine with hydroxide ions from the alkali to form water. Phenolphthalein is pink in alkali and colourless in neutral/acid solution, so it signals when all the OH⁻ has been used up.",
    "equation": "HCl + NaOH → NaCl + H₂O",
    "conclusion": "Neutralisation is exothermic and produces a salt and water. The volume of acid needed tells us the concentration of the alkali.",
    "safety": "Both reagents are corrosive — wear goggles throughout."
  },
  {
    "id": "displacement",
    "title": "Metal Displacement",
    "emoji": "🔩",
    "level": "Beginner",
    "topic": "Reactivity Series",
    "summary": "Drop zinc into blue copper sulfate and watch copper metal appear.",
    "equipment": [
      "Test tubes",
      "Test tube rack",
      "Spatula",
      "Thermometer"
    ],
    "chemicals": [
      "Copper(II) sulfate",
      "Zinc",
      "Iron",
      "Magnesium"
    ],
    "steps": [
      "Pour 5 cm³ of copper sulfate solution into three test tubes.",
      "Record the starting temperature.",
      "Add a spatula of zinc to the first, iron to the second, magnesium to the third.",
      "Observe for five minutes and record the highest temperature reached."
    ],
    "observations": [
      "Blue colour fades",
      "Brown/pink copper coats the metal",
      "Temperature rises — most with magnesium",
      "Iron solution turns pale green"
    ],
    "explanation": "A more reactive metal pushes a less reactive metal out of its compound. Zinc, iron and magnesium are all above copper in the reactivity series, so they take the sulfate and release copper atoms.",
    "equation": "Zn + CuSO₄ → ZnSO₄ + Cu",
    "conclusion": "The larger the gap in reactivity, the more vigorous and more exothermic the displacement reaction.",
    "safety": "Copper sulfate is harmful — wash hands after the experiment."
  },
  {
    "id": "co2-test",
    "title": "Making & Testing Carbon Dioxide",
    "emoji": "💨",
    "level": "Beginner",
    "topic": "Gases",
    "summary": "React a carbonate with acid and prove the gas is CO₂ with limewater.",
    "equipment": [
      "Boiling tube",
      "Delivery tube with bung",
      "Test tube",
      "Measuring cylinder"
    ],
    "chemicals": [
      "Sodium bicarbonate",
      "Hydrochloric acid",
      "Limewater"
    ],
    "steps": [
      "Place a spatula of sodium bicarbonate in a boiling tube.",
      "Add 10 cm³ of dilute hydrochloric acid and quickly fit the delivery tube.",
      "Bubble the gas through a test tube of limewater.",
      "Observe the limewater."
    ],
    "observations": [
      "Vigorous fizzing",
      "Limewater turns milky/cloudy",
      "Boiling tube feels cool"
    ],
    "explanation": "Acids react with carbonates and hydrogencarbonates to release carbon dioxide. CO₂ reacts with calcium hydroxide in limewater to form a fine white precipitate of calcium carbonate.",
    "equation": "NaHCO₃ + HCl → NaCl + H₂O + CO₂ ; CO₂ + Ca(OH)₂ → CaCO₃ + H₂O",
    "conclusion": "Limewater turning milky is the standard positive test for carbon dioxide.",
    "safety": "Keep the delivery tube out of the limewater before removing heat/pressure to avoid suck-back."
  },
  {
    "id": "elephant",
    "title": "Elephant Toothpaste",
    "emoji": "🐘",
    "level": "Intermediate",
    "topic": "Catalysis",
    "summary": "A catalyst makes hydrogen peroxide erupt into a tower of warm foam.",
    "equipment": [
      "Measuring cylinder (tall)",
      "Tray",
      "Measuring cylinder",
      "Safety screen"
    ],
    "chemicals": [
      "Hydrogen peroxide",
      "Potassium iodide",
      "Washing-up liquid"
    ],
    "steps": [
      "Stand a tall measuring cylinder in a tray.",
      "Add 50 cm³ of hydrogen peroxide and a squirt of washing-up liquid.",
      "Quickly pour in 10 cm³ of potassium iodide solution.",
      "Stand back and observe."
    ],
    "observations": [
      "Instant eruption of foam",
      "Foam is warm and may be tinged yellow",
      "A glowing splint relights in the foam"
    ],
    "explanation": "Iodide ions catalyse the decomposition of hydrogen peroxide into water and oxygen. The oxygen gas is trapped by the detergent as foam. The catalyst is not used up.",
    "equation": "2H₂O₂ → 2H₂O + O₂ (catalysed by I⁻)",
    "conclusion": "Catalysts speed up reactions without being consumed; the reaction is strongly exothermic.",
    "safety": "Peroxide bleaches skin — wear gloves and goggles."
  },
  {
    "id": "golden-rain",
    "title": "Golden Rain Precipitation",
    "emoji": "✨",
    "level": "Intermediate",
    "topic": "Precipitation",
    "summary": "Two colourless solutions combine into glittering gold crystals.",
    "equipment": [
      "Beakers",
      "Bunsen burner",
      "Tripod stand",
      "Wire gauze",
      "Stirring rod"
    ],
    "chemicals": [
      "Lead(II) nitrate",
      "Potassium iodide",
      "Distilled water"
    ],
    "steps": [
      "Mix equal volumes of lead nitrate and potassium iodide solutions.",
      "Observe the instant yellow precipitate.",
      "Heat gently until the precipitate dissolves.",
      "Allow to cool slowly in a dark place and observe."
    ],
    "observations": [
      "Instant bright yellow precipitate",
      "Precipitate dissolves on heating",
      "Shimmering gold hexagonal plates fall like rain on cooling"
    ],
    "explanation": "Lead ions and iodide ions form insoluble lead iodide. Its solubility increases with temperature, so slow cooling grows large, flat crystals that glint as they tumble.",
    "equation": "Pb(NO₃)₂ + 2KI → PbI₂ + 2KNO₃",
    "conclusion": "Precipitation reactions follow solubility rules; crystal size depends on how slowly the solution cools.",
    "safety": "Lead compounds are toxic. Gloves on; dispose of as hazardous waste."
  },
  {
    "id": "halide",
    "title": "Testing for Halide Ions",
    "emoji": "🧂",
    "level": "Intermediate",
    "topic": "Analysis",
    "summary": "Identify chloride, bromide and iodide by precipitate colour.",
    "equipment": [
      "Test tubes",
      "Dropping pipettes",
      "Test tube rack"
    ],
    "chemicals": [
      "Silver nitrate",
      "Sodium chloride",
      "Potassium iodide",
      "Dilute nitric acid"
    ],
    "steps": [
      "Add a few drops of dilute nitric acid to the unknown solution.",
      "Add silver nitrate solution drop by drop.",
      "Note the colour of any precipitate."
    ],
    "observations": [
      "Chloride → white precipitate",
      "Bromide → cream precipitate",
      "Iodide → yellow precipitate"
    ],
    "explanation": "Silver halides are insoluble in water. The precipitate colour deepens down the group as the halide ion becomes larger and more polarisable.",
    "equation": "Ag⁺ + Cl⁻ → AgCl ; Ag⁺ + I⁻ → AgI",
    "conclusion": "Silver nitrate is a reliable test for halide ions; nitric acid removes interfering carbonate ions.",
    "safety": "Silver nitrate stains skin black for days — gloves recommended."
  },
  {
    "id": "reactivity-acid",
    "title": "Metals in Acid",
    "emoji": "🫧",
    "level": "Beginner",
    "topic": "Reactivity Series",
    "summary": "Compare how fast different metals fizz in dilute acid.",
    "equipment": [
      "Test tubes",
      "Test tube rack",
      "Stopwatch",
      "Wooden splint"
    ],
    "chemicals": [
      "Hydrochloric acid",
      "Magnesium",
      "Zinc",
      "Iron"
    ],
    "steps": [
      "Add 5 cm³ of dilute acid to three test tubes.",
      "Add a small piece of each metal to its own tube.",
      "Rank the metals by rate of bubbling.",
      "Collect gas from the fastest tube and test with a lit splint."
    ],
    "observations": [
      "Magnesium: very fast bubbles, warm",
      "Zinc: steady bubbles",
      "Iron: slow bubbles",
      "Squeaky pop with a lit splint"
    ],
    "explanation": "Metals above hydrogen in the reactivity series displace hydrogen from acids. The more reactive the metal, the faster electrons are transferred and the faster the gas forms.",
    "equation": "Mg + 2HCl → MgCl₂ + H₂",
    "conclusion": "Order of reactivity: Mg > Zn > Fe. Hydrogen gas gives a squeaky pop.",
    "safety": "Keep flames away from the test tubes while gas is forming."
  },
  {
    "id": "ph-rainbow",
    "title": "pH Rainbow",
    "emoji": "🌈",
    "level": "Beginner",
    "topic": "Acids & Bases",
    "summary": "Build a full colour scale using universal indicator and household substances.",
    "equipment": [
      "Test tubes",
      "Test tube rack",
      "Dropping pipettes"
    ],
    "chemicals": [
      "Universal indicator",
      "Hydrochloric acid",
      "Ethanoic acid",
      "Distilled water",
      "Sodium bicarbonate",
      "Sodium hydroxide"
    ],
    "steps": [
      "Half fill five test tubes with each solution.",
      "Add three drops of universal indicator to each.",
      "Arrange in order of colour and estimate pH."
    ],
    "observations": [
      "HCl → red (pH 1)",
      "Vinegar → orange (pH 3)",
      "Water → green (pH 7)",
      "Baking soda → blue-green (pH 8–9)",
      "NaOH → purple (pH 14)"
    ],
    "explanation": "Universal indicator is a mixture of dyes that each change colour at a different pH, so the combined colour shifts gradually across the scale.",
    "equation": "HIn ⇌ H⁺ + In⁻",
    "conclusion": "Strong acids and alkalis sit at the ends of the scale; weak ones sit closer to neutral.",
    "safety": "Handle NaOH and HCl with goggles on."
  },
  {
    "id": "flame-test",
    "title": "Flame Tests",
    "emoji": "🔥",
    "level": "Beginner",
    "topic": "Qualitative Analysis",
    "summary": "Identify selected metal ions by the characteristic colour they give in a flame.",
    "equipment": [
      "Bunsen burner",
      "Nichrome wire loop",
      "Beaker",
      "Safety goggles"
    ],
    "chemicals": [
      "Sodium chloride",
      "Potassium chloride",
      "Calcium chloride",
      "Copper(II) chloride"
    ],
    "steps": [
      "Clean the wire loop with water and dilute acid as instructed by the teacher.",
      "Moisten the clean loop and pick up a small amount of the sample.",
      "Place the sample in the edge of the burner flame.",
      "Observe the flame colour against a suitable background.",
      "Compare the observation with known reference colours."
    ],
    "observations": [
      "Sodium compounds give a strong yellow flame",
      "Potassium compounds give a lilac flame",
      "Calcium compounds give an orange-red flame",
      "Copper compounds can give a blue-green flame"
    ],
    "explanation": "Heat excites electrons in metal ions. When the electrons return to lower energy levels, light of characteristic wavelengths is emitted.",
    "equation": "No single reaction equation; the test observes characteristic atomic emission.",
    "conclusion": "Flame colour can provide a preliminary identification of some metal ions.",
    "safety": "Use a supervised flame test and small samples; wear goggles and keep flammable materials away from the burner."
  },
  {
    "id": "rate-temperature",
    "title": "Effect of Temperature on Reaction Rate",
    "emoji": "🌡️",
    "level": "Beginner",
    "topic": "Rates of Reaction",
    "summary": "Compare how temperature changes the speed of a visible reaction.",
    "equipment": [
      "Test tubes",
      "Test tube rack",
      "Thermometer",
      "Stopwatch",
      "Water baths"
    ],
    "chemicals": [
      "Sodium thiosulfate solution",
      "Dilute hydrochloric acid"
    ],
    "steps": [
      "Prepare water baths at different temperatures.",
      "Place equal volumes of sodium thiosulfate solution into labelled test tubes.",
      "Allow each solution to reach its test temperature.",
      "Add the same volume of dilute acid and start the timer.",
      "Record the time for the marked cross beneath the flask to become obscured."
    ],
    "observations": [
      "The cross disappears faster at higher temperatures",
      "The measured reaction time decreases as temperature increases"
    ],
    "explanation": "Higher temperature gives particles more kinetic energy, increasing the frequency of successful collisions.",
    "equation": "Na₂S₂O₃ + 2HCl → 2NaCl + SO₂ + S + H₂O",
    "conclusion": "Within the tested range, increasing temperature increases the reaction rate.",
    "safety": "Use dilute reagents, avoid inhaling fumes, and perform the experiment with good ventilation and teacher supervision."
  },
  {
    "id": "surface-area",
    "title": "Effect of Surface Area on Reaction Rate",
    "emoji": "🧊",
    "level": "Beginner",
    "topic": "Rates of Reaction",
    "summary": "Compare powdered and larger pieces of a solid reacting with acid.",
    "equipment": [
      "Conical flasks",
      "Stopwatch",
      "Balance",
      "Delivery tubes"
    ],
    "chemicals": [
      "Calcium carbonate chips",
      "Calcium carbonate powder",
      "Dilute hydrochloric acid"
    ],
    "steps": [
      "Measure equal masses of chips and powder.",
      "Place each solid in a separate flask.",
      "Add equal volumes and concentrations of acid.",
      "Collect the gas using the same setup.",
      "Compare the gas production rate."
    ],
    "observations": [
      "Powder reacts more quickly",
      "Both samples ultimately produce carbon dioxide if enough acid is present"
    ],
    "explanation": "Powder has a larger total surface area exposed to the acid, giving more frequent successful collisions at the surface.",
    "equation": "CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂",
    "conclusion": "Increasing surface area increases reaction rate when other conditions are controlled.",
    "safety": "Use dilute acid and eye protection; avoid blocking a gas-producing apparatus."
  },
  {
    "id": "chromatography",
    "title": "Paper Chromatography",
    "emoji": "🧻",
    "level": "Beginner",
    "topic": "Separation Techniques",
    "summary": "Separate a mixture of dyes and compare components using their movement on paper.",
    "equipment": [
      "Chromatography paper",
      "Beaker",
      "Capillary tube",
      "Pencil",
      "Ruler"
    ],
    "chemicals": [
      "Water or suitable solvent",
      "Water-soluble ink samples"
    ],
    "steps": [
      "Draw a pencil baseline near the bottom of the paper.",
      "Place small spots of each sample on the baseline.",
      "Place the paper in a shallow solvent without covering the spots.",
      "Allow the solvent to rise up the paper.",
      "Remove the paper and mark the solvent front."
    ],
    "observations": [
      "Some samples separate into multiple coloured spots",
      "Different components travel different distances"
    ],
    "explanation": "Different substances have different attractions to the paper and the moving solvent, so they travel at different rates.",
    "equation": "No chemical reaction; this is a physical separation.",
    "conclusion": "Chromatography can reveal whether a sample contains one or several components.",
    "safety": "Use the solvent specified by the teacher and avoid skin or eye contact."
  },
  {
    "id": "distillation",
    "title": "Simple Distillation",
    "emoji": "💧",
    "level": "Intermediate",
    "topic": "Separation Techniques",
    "summary": "Separate a volatile liquid from a solution by boiling and condensing vapour.",
    "equipment": [
      "Distillation flask",
      "Thermometer",
      "Condenser",
      "Receiving flask",
      "Heat source"
    ],
    "chemicals": [
      "Salt solution",
      "Distilled water"
    ],
    "steps": [
      "Set up the distillation apparatus securely.",
      "Place the salt solution in the distillation flask.",
      "Heat gently while monitoring the thermometer.",
      "Allow vapour to pass through the condenser.",
      "Collect the condensed liquid in the receiving flask."
    ],
    "observations": [
      "Water vapour condenses in the cooler condenser",
      "Salt remains in the original flask",
      "The collected liquid is much less salty"
    ],
    "explanation": "Distillation separates substances using differences in volatility. The more volatile component vaporises first and is then condensed.",
    "equation": "No new chemical reaction; vaporisation and condensation are physical changes.",
    "conclusion": "Simple distillation can recover a solvent from a solution.",
    "safety": "Use heat-resistant apparatus and never seal a heated distillation system."
  },
  {
    "id": "solubility-crystals",
    "title": "Crystallisation of a Soluble Salt",
    "emoji": "💎",
    "level": "Intermediate",
    "topic": "Separation Techniques",
    "summary": "Recover crystals of a soluble salt from a solution by controlled evaporation and cooling.",
    "equipment": [
      "Evaporating basin",
      "Tripod stand",
      "Wire gauze",
      "Beaker",
      "Filter paper"
    ],
    "chemicals": [
      "Copper(II) sulfate solution",
      "Distilled water"
    ],
    "steps": [
      "Place the salt solution in an evaporating basin.",
      "Heat gently to remove some water.",
      "Stop heating before the solution is completely dry.",
      "Allow the concentrated solution to cool slowly.",
      "Collect and dry the crystals."
    ],
    "observations": [
      "The solution becomes more concentrated",
      "Blue crystals form during cooling",
      "Crystal size depends on cooling conditions"
    ],
    "explanation": "As water evaporates, the solution becomes saturated and excess dissolved salt forms crystals as solubility decreases.",
    "equation": "No new chemical reaction; crystallisation is a physical separation process.",
    "conclusion": "Controlled evaporation followed by cooling can produce relatively pure crystals.",
    "safety": "Use gentle heating and eye protection; handle hot glassware with appropriate equipment."
  },
  {
    "id": "conductivity",
    "title": "Electrical Conductivity of Solutions",
    "emoji": "⚡",
    "level": "Intermediate",
    "topic": "Ions & Solutions",
    "summary": "Compare the electrical conductivity of ionic, molecular and distilled-water samples.",
    "equipment": [
      "Low-voltage conductivity circuit",
      "Electrodes",
      "Beakers",
      "Connecting wires"
    ],
    "chemicals": [
      "Sodium chloride solution",
      "Sugar solution",
      "Dilute hydrochloric acid",
      "Distilled water"
    ],
    "steps": [
      "Place the electrodes into the first sample without touching them together.",
      "Record the indicator response.",
      "Rinse the electrodes between samples.",
      "Test each solution under the same conditions.",
      "Compare the observations."
    ],
    "observations": [
      "Ionic solutions conduct electricity",
      "Sugar solution conducts very weakly",
      "Distilled water has very low conductivity",
      "Conductivity depends on the concentration and mobility of ions"
    ],
    "explanation": "Solutions conduct when mobile charged particles are available to carry electric current.",
    "equation": "NaCl(aq) → Na⁺(aq) + Cl⁻(aq)",
    "conclusion": "The presence of mobile ions strongly affects electrical conductivity in aqueous solutions.",
    "safety": "Use only a safe low-voltage educational circuit and keep electrical connections away from mains electricity."
  },
  {
    "id": "titration-acid",
    "title": "Acid–Base Titration with an Indicator",
    "emoji": "🧪",
    "level": "Intermediate",
    "topic": "Acids & Bases",
    "summary": "Use measured volumes to determine the concentration of an unknown acid or alkali.",
    "equipment": [
      "Burette",
      "Pipette",
      "Conical flask",
      "White tile",
      "Funnel"
    ],
    "chemicals": [
      "Hydrochloric acid",
      "Sodium hydroxide",
      "Phenolphthalein"
    ],
    "steps": [
      "Pipette a measured volume of the unknown solution into a flask.",
      "Add a suitable indicator.",
      "Fill the burette with the standard solution and record the initial reading.",
      "Add the standard solution while swirling and slow down near the endpoint.",
      "Record the final reading and repeat for concordant results."
    ],
    "observations": [
      "The indicator changes colour near the endpoint",
      "Repeat titres can give closely agreeing volumes"
    ],
    "explanation": "Neutralisation occurs when hydrogen ions and hydroxide ions react in approximately stoichiometric amounts.",
    "equation": "HCl + NaOH → NaCl + H₂O",
    "conclusion": "Accurate titration volumes can be used with the balanced equation to calculate concentration.",
    "safety": "Wear goggles and use dilute solutions appropriate for school practical work."
  },
  {
    "id": "iodine-starch",
    "title": "Iodine Test for Starch",
    "emoji": "🔵",
    "level": "Beginner",
    "topic": "Food Tests",
    "summary": "Use iodine solution to test a sample for starch.",
    "equipment": [
      "Spotting tile",
      "Dropping pipette",
      "Test tube"
    ],
    "chemicals": [
      "Iodine solution",
      "Starch solution",
      "Food sample"
    ],
    "steps": [
      "Place a small portion of the sample on a spotting tile.",
      "Add a few drops of iodine solution.",
      "Observe any colour change.",
      "Compare with a known starch sample if required."
    ],
    "observations": [
      "A starch-containing sample turns blue-black",
      "Samples without detectable starch retain the iodine's brown/yellow appearance"
    ],
    "explanation": "Iodine associates with the helical structure of starch, producing the characteristic dark colour.",
    "equation": "No chemical equation is normally used for this qualitative food test.",
    "conclusion": "A blue-black colour is a positive test for starch.",
    "safety": "Iodine solutions can stain and irritate; wear gloves and goggles as directed."
  },
  {
    "id": "reducing-sugar",
    "title": "Benedict's Test for Reducing Sugars",
    "emoji": "🍬",
    "level": "Beginner",
    "topic": "Food Tests",
    "summary": "Use Benedict's reagent and controlled heating to test for reducing sugars.",
    "equipment": [
      "Test tubes",
      "Test tube rack",
      "Water bath",
      "Dropping pipette"
    ],
    "chemicals": [
      "Benedict's reagent",
      "Glucose solution",
      "Food sample"
    ],
    "steps": [
      "Place the sample in a test tube.",
      "Add Benedict's reagent.",
      "Heat the mixture in a hot water bath as instructed.",
      "Observe the final colour and precipitate.",
      "Compare with a suitable control."
    ],
    "observations": [
      "A positive test can change from blue through green/yellow/orange to red precipitate depending on amount",
      "A negative result remains blue"
    ],
    "explanation": "Reducing sugars reduce copper(II) ions in Benedict's reagent during heating, producing copper(I) oxide.",
    "equation": "Reducing sugar + Cu²⁺ → oxidised product + Cu₂O(s)",
    "conclusion": "The colour change provides a qualitative indication of reducing sugar.",
    "safety": "Use a water bath rather than direct heating of the reagent and wear eye protection."
  },
  {
    "id": "catalyst-manganese",
    "title": "Catalyst and Hydrogen Peroxide",
    "emoji": "⚗️",
    "level": "Intermediate",
    "topic": "Rates & Catalysis",
    "summary": "Observe how a catalyst changes the decomposition rate of hydrogen peroxide.",
    "equipment": [
      "Conical flask",
      "Gas collection setup",
      "Stopwatch",
      "Measuring cylinder"
    ],
    "chemicals": [
      "Hydrogen peroxide solution",
      "Manganese dioxide catalyst"
    ],
    "steps": [
      "Measure equal volumes of hydrogen peroxide into suitable flasks.",
      "Add the catalyst to one flask while keeping a control without catalyst.",
      "Collect or observe the oxygen produced under the same conditions.",
      "Compare the rate of gas production."
    ],
    "observations": [
      "The catalysed sample produces oxygen faster",
      "The catalyst remains after the reaction"
    ],
    "explanation": "A catalyst provides an alternative reaction pathway with lower activation energy, increasing the rate without being consumed overall.",
    "equation": "2H₂O₂ → 2H₂O + O₂ (MnO₂ catalyst)",
    "conclusion": "The presence of a suitable catalyst can greatly increase reaction rate.",
    "safety": "Use the concentration and quantities specified by the teacher; wear goggles and avoid contact with peroxide."
  },
  {
    "id": "electrolysis-copper",
    "title": "Electrolysis of Copper Sulfate",
    "emoji": "🔋",
    "level": "Advanced",
    "topic": "Electrochemistry",
    "summary": "Observe electrode changes when an aqueous ionic solution is electrolysed using an external power supply.",
    "equipment": [
      "Low-voltage DC supply",
      "Electrodes",
      "Beaker",
      "Connecting wires"
    ],
    "chemicals": [
      "Copper(II) sulfate solution"
    ],
    "steps": [
      "Set up two suitable electrodes in the solution without letting them touch.",
      "Connect them to a low-voltage DC supply.",
      "Switch on for a controlled period.",
      "Observe the electrode surfaces and solution.",
      "Switch off before changing the setup."
    ],
    "observations": [
      "Copper can be deposited at the cathode",
      "Gas may form at the anode depending on electrode material",
      "The solution composition can change depending on the electrodes"
    ],
    "explanation": "Electrical energy drives non-spontaneous redox processes. Copper ions can gain electrons at the cathode and form copper metal.",
    "equation": "Cu²⁺ + 2e⁻ → Cu",
    "conclusion": "Electrolysis demonstrates how electrical energy can drive chemical change.",
    "safety": "Use only a teacher-approved low-voltage supply; never use mains electricity and keep connections dry."
  }
];
