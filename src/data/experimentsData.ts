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
  },
  {
    "id": "esterification-synthesis",
    "title": "Esterification: Organic Fragrance Synthesis",
    "emoji": "🍐",
    "level": "Intermediate",
    "topic": "Organic Chemistry",
    "summary": "Synthesize sweet-smelling ethyl ethanoate ester by heating ethanol with glacial ethanoic acid in the presence of concentrated sulfuric acid catalyst.",
    "equipment": [
      "Round bottom flask",
      "Water bath",
      "Reflux condenser",
      "Separating funnel",
      "Beaker"
    ],
    "chemicals": [
      "Glacial ethanoic acid",
      "Pure ethanol",
      "Concentrated sulfuric acid catalyst",
      "Sodium hydrogencarbonate solution",
      "Anhydrous sodium sulfate"
    ],
    "steps": [
      "Carefully add 10 cm³ of ethanol and 10 cm³ of glacial ethanoic acid to a round-bottom flask.",
      "Add 1 cm³ of concentrated sulfuric acid dropwise with continuous swirling under cooling.",
      "Fit a water-cooled reflux condenser and heat the mixture gently in a boiling water bath for 15 minutes.",
      "Allow the mixture to cool, then pour into a beaker containing cold aqueous sodium hydrogencarbonate to neutralize unreacted acid.",
      "Transfer the biphasic mixture to a separating funnel, discard the lower aqueous layer, and collect the sweet, pear-scented ester layer."
    ],
    "observations": [
      "Vigorous effervescence when pouring into hydrogencarbonate as CO₂ evolves",
      "Distinct immiscible organic layer forms above the aqueous phase",
      "Characteristic sweet fruity aroma (pear drops / nail polish remover)"
    ],
    "explanation": "Carboxylic acids and alcohols undergo Fisher esterification in a reversible condensation equilibrium. Concentrated sulfuric acid acts both as an acid catalyst (protonating the carbonyl oxygen) and as a dehydrating agent to pull equilibrium towards ester formation.",
    "equation": "CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O (conc. H₂SO₄ catalyst)",
    "conclusion": "Esterification demonstrates condensation polymer and flavor chemistry principles. Esters are less dense than water and possess characteristic volatile aromas.",
    "safety": "Concentrated sulfuric acid is severely dehydrating and corrosive. Glacial ethanoic acid is pungent and corrosive. Keep organic vapors away from open Bunsen flames — use a water bath."
  },
  {
    "id": "iodine-clock",
    "title": "Iodine Clock: Landolt Kinetics Reaction",
    "emoji": "⏱️",
    "level": "Intermediate",
    "topic": "Thermodynamics & Kinetics",
    "summary": "Investigate how reactant concentration affects chemical reaction velocity with a dramatic sudden color transition from clear to midnight blue.",
    "equipment": [
      "Volumetric pipettes",
      "Conical flasks",
      "Digital stopwatch",
      "White measuring tile",
      "Graduated cylinder"
    ],
    "chemicals": [
      "Potassium iodide solution",
      "Sodium thiosulfate solution",
      "Potassium persulfate (peroxydisulfate)",
      "Starch indicator solution",
      "Deionized water"
    ],
    "steps": [
      "Prepare Solution A: 25 cm³ potassium iodide, 5 cm³ sodium thiosulfate, and 2 cm³ freshly prepared starch solution in a conical flask.",
      "Prepare Solution B: 25 cm³ potassium persulfate in a measuring cylinder.",
      "Simultaneously pour Solution B into Solution A and start the digital timer immediately.",
      "Swirl continuously against a white background.",
      "Stop the timer the exact instant the entire solution switches instantaneously to deep blue-black.",
      "Repeat with varying iodide concentrations to establish reaction orders."
    ],
    "observations": [
      "Mixture remains crystal clear and transparent initially",
      "Sudden sharp transition (under 0.2s) across the entire flask to intense dark ink-blue",
      "Higher reactant concentration reduces reaction time substantially"
    ],
    "explanation": "Persulfate slowly oxidizes iodide to iodine: S₂O₈²⁻ + 2I⁻ → 2SO₄²⁻ + I₂. As soon as iodine forms, thiosulfate rapidly reduces it back to iodide: I₂ + 2S₂O₃²⁻ → 2I⁻ + S₄O₆²⁻. Only once all thiosulfate is completely consumed does free iodine accumulate and complex with starch to trigger the midnight blue color.",
    "equation": "S₂O₈²⁻ + 2I⁻ → 2SO₄²⁻ + I₂ (slow); I₂ + 2S₂O₃²⁻ → 2I⁻ + S₄O₆²⁻ (fast)",
    "conclusion": "Reaction rate is directly proportional to reactant concentrations, confirming collision theory kinetics.",
    "safety": "Potassium persulfate is a strong oxidizer. Wear eye protection and nitrile gloves. Rinse skin splashes with copious water."
  },
  {
    "id": "aspirin-synthesis",
    "title": "Synthesis of Aspirin (Acetylsalicylic Acid)",
    "emoji": "💊",
    "level": "Advanced",
    "topic": "Organic Chemistry",
    "summary": "Prepare the classical analgesic acetylsalicylic acid by esterifying salicylic acid with ethanoic anhydride using phosphoric acid catalyst, followed by recrystallization.",
    "equipment": [
      "Conical flask",
      "Buchner funnel and vacuum flask",
      "Ice bath",
      "Water bath",
      "Melting point capillary tubes",
      "Filter paper"
    ],
    "chemicals": [
      "Salicylic acid",
      "Ethanoic (acetic) anhydride",
      "Concentrated phosphoric acid (H₃PO₄)",
      "Chilled deionized water",
      "Ethanol"
    ],
    "steps": [
      "Weigh 2.0 g of salicylic acid and transfer to a dry 100 cm³ conical flask.",
      "Add 5.0 cm³ of ethanoic anhydride and 5 drops of 85% phosphoric acid.",
      "Warm the flask in a 60°C water bath for 15 minutes, swirling until all solid dissolves.",
      "Carefully add 20 cm³ of ice-cold water to hydrolyze excess ethanoic anhydride.",
      "Chill in an ice bath until shiny white needle crystals of crude aspirin precipitate.",
      "Filter using a Buchner funnel under vacuum, wash with cold water, and recrystallize from hot water/ethanol."
    ],
    "observations": [
      "Initial suspension dissolves to form a clear pale yellow liquid",
      "Rapid formation of white needle-like crystals upon cooling and scratching the flask",
      "Test with iron(III) chloride shows no purple coloration if purification is complete"
    ],
    "explanation": "The phenolic hydroxyl group of salicylic acid nucleophilically attacks the carbonyl carbon of ethanoic anhydride. Elimination of ethanoic acid yields acetylsalicylic acid. Iron(III) chloride test confirms absence of unreacted phenol groups.",
    "equation": "C₇H₆O₃ (salicylic acid) + (CH₃CO)₂O → C₉H₈O₄ (aspirin) + CH₃COOH",
    "conclusion": "Organic synthesis can be coupled with vacuum filtration and recrystallization to isolate pure medicinal compounds with high percentage yield.",
    "safety": "Ethanoic anhydride is a severe lacrimator and corrosive. Perform heating inside a fume hood. Crude product must not be ingested."
  },
  {
    "id": "le-chatelier-cobalt",
    "title": "Le Chatelier's Equilibrium: Cobalt(II) Complex Shift",
    "emoji": "🔄",
    "level": "Intermediate",
    "topic": "Solutions & Equilibrium",
    "summary": "Observe dynamic chemical equilibrium shifts between pink hexaquacobalt(II) and deep blue tetrachlorocobaltate(II) ions under temperature and concentration stresses.",
    "equipment": [
      "Test tubes in a rack",
      "Test tube holder",
      "Ice bath (0°C)",
      "Hot water bath (80°C)",
      "Dropping pipettes"
    ],
    "chemicals": [
      "Cobalt(II) chloride hexahydrate solution",
      "Concentrated hydrochloric acid",
      "Deionized water",
      "Acetone"
    ],
    "steps": [
      "Add 3 cm³ of pink aqueous cobalt(II) chloride to three separate test tubes.",
      "Keep Tube 1 as an unperturbed room-temperature control.",
      "To Tube 2, add concentrated HCl dropwise: observe the color change from pink to violet to intense cobalt blue.",
      "To the blue solution, add drops of deionized water: observe the reverse shift back to rose pink.",
      "Place Tube 3 (at an intermediate violet tint) into a boiling water bath: observe it turns dark blue.",
      "Transfer the hot blue Tube 3 directly into an ice-water bath: observe it returns to bright pink."
    ],
    "observations": [
      "Adding chloride ions shifts the pink solution to deep royal blue",
      "Dilution with water immediately restores the pink color",
      "Heating promotes the blue complex; cooling promotes the pink complex"
    ],
    "explanation": "The forward reaction forming [CoCl₄]²⁻ is endothermic (ΔH > 0): [Co(H₂O)₆]²⁺ (pink) + 4Cl⁻ ⇌ [CoCl₄]²⁻ (blue) + 6H₂O. Le Chatelier's Principle predicts increasing temperature shifts equilibrium right to absorb heat, while adding Cl⁻ shifts equilibrium right to consume added ions.",
    "equation": "[Co(H₂O)₆]²⁺ (pink) + 4Cl⁻ ⇌ [CoCl₄]²⁻ (blue) + 6H₂O (ΔH > 0)",
    "conclusion": "Dynamic chemical systems respond to external perturbations (temperature, concentration) in accordance with Le Chatelier's Principle.",
    "safety": "Cobalt compounds and concentrated HCl are toxic and corrosive. Wear gloves, handle in a fume cupboard, and dispose of cobalt waste in heavy metal collection containers."
  },
  {
    "id": "redox-titration-permanganate",
    "title": "Redox Titration: Potassium Permanganate vs Iron(II)",
    "emoji": "🧪",
    "level": "Advanced",
    "topic": "Redox & Electrochemistry",
    "summary": "Standardize iron(II) ammonium sulfate using potassium permanganate as a self-indicating oxidizing agent in acidic medium.",
    "equipment": [
      "Burette",
      "25 cm³ bulb pipette and safety filler",
      "Conical flask",
      "White tile",
      "Stand and clamp"
    ],
    "chemicals": [
      "Standardized potassium permanganate solution (0.02 mol/dm³)",
      "Unknown iron(II) sulfate solution",
      "Dilute sulfuric acid (1 mol/dm³)",
      "Deionized water"
    ],
    "steps": [
      "Pipette 25.0 cm³ of iron(II) solution into a clean conical flask.",
      "Add 20 cm³ of 1 mol/dm³ sulfuric acid to provide necessary H⁺ ions.",
      "Fill the burette with intense purple 0.02 mol/dm³ potassium permanganate.",
      "Titrate dropwise while constantly swirling the flask.",
      "The purple color discharges instantly as MnO₄⁻ is reduced to colorless Mn²⁺.",
      "The end-point is reached when one drop imparts a permanent faint pink tint persisting for 30 seconds."
    ],
    "observations": [
      "Burette solution is deep magenta/purple",
      "Color disappears completely upon entering the flask during titration",
      "Permanent faint blush pink signals the stoichiometric equivalence point"
    ],
    "explanation": "Permanganate ion (MnO₄⁻) is strongly reduced in acid: MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O. Iron(II) is oxidized: Fe²⁺ → Fe³⁺ + e⁻. Because MnO₄⁻ is deeply colored while Mn²⁺ and Fe³⁺ are virtually colorless at dilute concentrations, KMnO₄ acts as its own internal indicator.",
    "equation": "MnO₄⁻ + 5Fe²⁺ + 8H⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O",
    "conclusion": "Stoichiometric redox titrations allow precise quantification of transition metal ions without requiring an added dye indicator.",
    "safety": "Potassium permanganate stains skin and bench surfaces brown (MnO₂). Dilute sulfuric acid is corrosive. Wear eye protection."
  },
  {
    "id": "thermite-demonstration",
    "title": "Thermite Reaction: High-Exothermicity Metal Reduction",
    "emoji": "🔥",
    "level": "Advanced",
    "topic": "Thermodynamics & Kinetics",
    "summary": "Demonstrate extreme chemical energetics by reducing iron(III) oxide with aluminum powder to produce molten metallic iron.",
    "equipment": [
      "Unglazed clay crucible",
      "Sand bucket / safety pit",
      "Magnesium ribbon fuse",
      "Safety blast shield",
      "Tongs"
    ],
    "chemicals": [
      "Dry iron(III) oxide powder (Fe₂O₃)",
      "Fine aluminum powder (Al)",
      "Barium peroxide ignition mixture",
      "Magnesium ribbon"
    ],
    "steps": [
      "Mix 3 parts dry Fe₂O₃ with 1 part fine Al powder thoroughly in a crucible placed in a thick bed of dry sand.",
      "Place a small depression on top and add 1 g of barium peroxide ignition powder.",
      "Insert a 10 cm coiled magnesium ribbon into the center as an ignition fuse.",
      "Clear all personnel behind a safety blast shield with dark UV-rated goggles.",
      "Light the magnesium ribbon and immediately step back.",
      "Observe blinding white ignition, intense heat, and molten white-hot iron pouring through the bottom."
    ],
    "observations": [
      "Blinding white flash and fountain of incandescent orange sparks",
      "Crucible heats to over 2500°C within seconds",
      "Molten glowing bead of pure metallic iron settles in the sand bed"
    ],
    "explanation": "Aluminum possesses a much higher affinity for oxygen than iron due to the massive lattice energy of aluminum oxide: 2Al + Fe₂O₃ → Al₂O₃ + 2Fe. The reaction enthalpy (ΔH = -851 kJ/mol) is so intensely exothermic that temperatures exceed the melting points of both iron (1538°C) and aluminum oxide.",
    "equation": "2Al (s) + Fe₂O₃ (s) → Al₂O₃ (s) + 2Fe (l)  (ΔH° = -851.5 kJ/mol)",
    "conclusion": "Single displacement reactions driven by substantial thermodynamic driving forces can reach extreme pyrochemical temperatures.",
    "safety": "DANGEROUS: Professional demonstration only! Never conduct with moisture present (steam explosion hazard). Wear shade 5 welding goggles and maintain a 5-meter safety perimeter."
  },
  {
    "id": "daniell-galvanic-cell",
    "title": "Daniell Galvanic Cell: Chemical to Electrical Energy",
    "emoji": "⚡",
    "level": "Intermediate",
    "topic": "Redox & Electrochemistry",
    "summary": "Construct an electrochemical Daniell cell to generate electric potential from spontaneous zinc oxidation and copper reduction.",
    "equipment": [
      "Two 100 cm³ beakers",
      "High-impedance digital multimeter",
      "Alligator clip leads",
      "U-tube or filter paper salt bridge",
      "Zinc and copper electrode strips"
    ],
    "chemicals": [
      "1.0 mol/dm³ Zinc sulfate solution (ZnSO₄)",
      "1.0 mol/dm³ Copper(II) sulfate solution (CuSO₄)",
      "Saturated potassium nitrate solution (KNO₃)",
      "Emery paper"
    ],
    "steps": [
      "Clean the zinc and copper electrode strips with emery paper to remove surface oxides.",
      "Fill Beaker 1 with 1.0 mol/dm³ ZnSO₄ and immerse the zinc strip (anode).",
      "Fill Beaker 2 with 1.0 mol/dm³ CuSO₄ and immerse the copper strip (cathode).",
      "Soak a strip of filter paper in saturated KNO₃ and bridge it across both beakers.",
      "Connect the multimeter leads to the electrodes and record the electromotive force (cell voltage).",
      "Connect a small red LED to verify direct electrical power generation."
    ],
    "observations": [
      "Multimeter measures a stable potential of approximately +1.10 Volts",
      "Removing the salt bridge drops the measured voltage immediately to 0 V",
      "Dark copper deposit forms over time on the cathode"
    ],
    "explanation": "Zinc oxidizes spontaneously at the anode: Zn → Zn²⁺ + 2e⁻ (E° = +0.76 V). Electrons flow through the external circuit to the cathode, where copper ions reduce: Cu²⁺ + 2e⁻ → Cu (E° = +0.34 V). The cell potential E°cell = E°cathode - E°anode = +0.34 - (-0.76) = +1.10 V. The salt bridge maintains electroneutrality by ion migration.",
    "equation": "Zn (s) + Cu²⁺ (aq) → Zn²⁺ (aq) + Cu (s)  (E°cell = +1.10 V)",
    "conclusion": "Spontaneous redox reactions can be physically separated into half-cells to harness chemical energy directly as electric current.",
    "safety": "Copper sulfate is toxic to aquatic life. Potassium nitrate is an oxidizer. Avoid short-circuiting connections."
  },
  {
    "id": "nylon-rope-trick",
    "title": "Nylon 6,6: Interfacial Polymerization Synthesis",
    "emoji": "🧵",
    "level": "Intermediate",
    "topic": "Organic Chemistry",
    "summary": "Synthesize continuous filaments of Nylon 6,6 polymer at the immiscible liquid interface between diamine and diacid chloride solutions.",
    "equipment": [
      "50 cm³ glass beaker",
      "Metal tweezers / forceps",
      "Glass stirring rod",
      "Watch glass"
    ],
    "chemicals": [
      "Hexamethylenediamine (1,6-diaminohexane) in 0.5M NaOH",
      "Adipoyl chloride (hexanedioyl dichloride) in cyclohexane",
      "Deionized water",
      "Ethanol"
    ],
    "steps": [
      "Pour 10 cm³ of aqueous 1,6-diaminohexane with sodium hydroxide into a 50 cm³ beaker.",
      "Carefully layer 10 cm³ of adipoyl chloride in cyclohexane down the inside wall of the beaker without mixing.",
      "A shimmering opaque white film of nylon forms instantly at the liquid–liquid boundary.",
      "Using tweezers, pinch the center of the film and pull upward smoothly.",
      "Wind the continuous strand of nylon rope around a glass rod as the interface regenerates."
    ],
    "observations": [
      "Immediate polymer membrane forms at the liquid boundary",
      "Drawing the membrane out continuously generates an endless flexible plastic thread",
      "Beaker remains two distinct immiscible layers"
    ],
    "explanation": "Step-growth condensation polymerization occurs exclusively at the interface where diamine and diacyl chloride molecules meet. Amine groups attack carbonyl carbons, releasing HCl which is neutralized by NaOH: n H₂N(CH₂)₆NH₂ + n ClOC(CH₂)₄COCl → -[HN(CH₂)₆NHCO(CH₂)₄CO]-_n + 2n HCl.",
    "equation": "n H₂N(CH₂)₆NH₂ + n ClOC(CH₂)₄COCl → -[NH(CH₂)₆NHCO(CH₂)₄CO]-_n + 2n HCl",
    "conclusion": "Interfacial polymerization provides rapid room-temperature synthesis of synthetic polyamides without needing high pressure or melting.",
    "safety": "Adipoyl chloride releases corrosive HCl vapors. Perform in a well-ventilated fume hood. Wear nitrile gloves; do not touch fresh polymer until washed."
  },
  {
    "id": "gravimetric-barium-sulfate",
    "title": "Gravimetric Analysis: Sulfate Quantification",
    "emoji": "⚖️",
    "level": "Intermediate",
    "topic": "Solutions & Equilibrium",
    "summary": "Determine the exact sulfate concentration of an unknown sample through stoichiometric precipitation and ignition of barium sulfate.",
    "equipment": [
      "Analytical balance (0.1 mg precision)",
      "Porcelain crucible and lid",
      "Ashless filter paper",
      "Glass funnel",
      "Bunsen burner and pipeclay triangle",
      "Desiccator"
    ],
    "chemicals": [
      "Unknown sulfate salt solution",
      "0.2 mol/dm³ Barium chloride solution (BaCl₂)",
      "Concentrated hydrochloric acid",
      "Silver nitrate test solution"
    ],
    "steps": [
      "Pipette 25.0 cm³ of sulfate solution into a beaker and add 1 cm³ conc. HCl to prevent carbonate coprecipitation.",
      "Heat near boiling and add hot barium chloride solution slowly with vigorous stirring until no further cloudiness forms.",
      "Digest the precipitate on a warm water bath for 1 hour to promote crystal coarsening (Ostwald ripening).",
      "Filter through ashless Whatman 42 filter paper and wash with hot water until filtrate tests negative with AgNO₃.",
      "Transfer paper and precipitate to a pre-weighed porcelain crucible.",
      "Gently char the paper, ignite strongly over a Bunsen flame to constant mass, and cool in a desiccator before weighing."
    ],
    "observations": [
      "Immediate dense chalky white precipitate of barium sulfate forms",
      "Digestion transforms fine milky suspension into readily filterable granular crystals",
      "Precipitate remains completely white after strong ignition"
    ],
    "explanation": "Barium and sulfate ions form insoluble barium sulfate with an exceptionally low solubility product: Ba²⁺ + SO₄²⁻ → BaSO₄ (s). Because BaSO₄ is thermally stable and stoichiometric, its final ignited mass directly yields sulfate content: mass SO₄²⁻ = mass BaSO₄ × (96.06 / 233.39).",
    "equation": "Ba²⁺ (aq) + SO₄²⁻ (aq) → BaSO₄ (s)↓",
    "conclusion": "Gravimetry provides an absolute, primary analytical measurement without requiring standard calibration curves.",
    "safety": "Soluble barium salts are toxic. Hydrochloric acid is corrosive. Handle hot crucibles exclusively with clean metal tongs."
  },
  {
    "id": "calorimetry-neutralization",
    "title": "Enthalpy of Neutralization: Solution Calorimetry",
    "emoji": "🌡️",
    "level": "Intermediate",
    "topic": "Thermodynamics & Kinetics",
    "summary": "Measure the standard enthalpy change of neutralization between strong acid and strong base using an expanded polystyrene coffee-cup calorimeter.",
    "equipment": [
      "Polystyrene calorimeter with lid",
      "High-precision digital thermometer (0.01°C)",
      "Two 50 cm³ measuring cylinders",
      "Magnetic stirrer"
    ],
    "chemicals": [
      "1.00 mol/dm³ Hydrochloric acid (HCl)",
      "1.00 mol/dm³ Sodium hydroxide (NaOH)",
      "Deionized water"
    ],
    "steps": [
      "Measure 50.0 cm³ of 1.00 mol/dm³ HCl into the calorimeter and measure its initial temperature every 30 seconds for 3 minutes.",
      "Measure 50.0 cm³ of 1.00 mol/dm³ NaOH into a separate cylinder and ensure its temperature matches the acid.",
      "At exactly minute 4, pour the alkali rapidly into the calorimeter, replace the lid, and swirl gently.",
      "Record the temperature every 15 seconds for 5 minutes, noting the maximum temperature reached.",
      "Calculate heat released using q = m · c · ΔT and divide by moles of water formed to determine ΔH_neut."
    ],
    "observations": [
      "Temperature remains flat prior to mixing",
      "Rapid temperature surge of approximately 6.5°C to 6.8°C upon mixing",
      "Slow linear thermal cooling back towards room temperature"
    ],
    "explanation": "Strong acids and bases dissociate completely in aqueous solution. Neutralization is essentially the combination of aqueous hydronium and hydroxide ions to form water: H⁺(aq) + OH⁻(aq) → H₂O(l). The theoretical standard enthalpy of neutralization is -57.1 kJ/mol.",
    "equation": "H⁺ (aq) + OH⁻ (aq) → H₂O (l)  (ΔH°neut = -57.1 kJ/mol)",
    "conclusion": "Calorimetric temperature curves account for system heat losses and demonstrate that all strong acid–strong base reactions share an identical molar enthalpy of neutralization.",
    "safety": "Both 1M HCl and 1M NaOH are irritants to eyes and skin. Wear lab coat and splash goggles."
  },
  {
    "id": "saponification-soap",
    "title": "Saponification: Classical Soap Synthesis",
    "emoji": "🧼",
    "level": "Beginner",
    "topic": "Organic Chemistry",
    "summary": "Transform natural triglyceride vegetable oil into sodium carboxylate soap through alkaline ester hydrolysis followed by salting out.",
    "equipment": [
      "250 cm³ glass beaker",
      "Glass stirring rod",
      "Water bath / hotplate",
      "Buchner funnel or cheesecloth",
      "Soap mold"
    ],
    "chemicals": [
      "Vegetable oil (olive or coconut oil)",
      "Sodium hydroxide pellets (NaOH)",
      "Ethanol (solvent carrier)",
      "Saturated sodium chloride solution (brine)",
      "Essential oil (fragrance)"
    ],
    "steps": [
      "Dissolve 5.0 g of NaOH in 15 cm³ water and 15 cm³ ethanol in a beaker.",
      "Add 15 cm³ of vegetable oil and heat in a 70°C water bath with continuous stirring for 25 minutes.",
      "A thick, creamy homogeneous paste forms as triglycerides hydrolyze.",
      "Pour the hot mixture into 50 cm³ of chilled saturated NaCl solution ('salting out').",
      "Curds of raw soap precipitate out on top of the brine.",
      "Filter the solid curds, press into a mold, and test foaming capability with warm water."
    ],
    "observations": [
      "Separate oil and water layers emulsify into an opaque yellow emulsion",
      "Solution thickens significantly to paste consistency",
      "Immediate curdy solid precipitates when added to concentrated brine",
      "Produces dense rich foam when lathered"
    ],
    "explanation": "Triglycerides undergo base-catalyzed ester hydrolysis (saponification) into glycerol and three carboxylate anions (soap). Adding concentrated NaCl increases the ionic strength, reducing soap solubility and causing it to precipitate ('salting out') due to the common ion effect and hydrophobic repulsion.",
    "equation": "Triglyceride + 3 NaOH → Glycerol + 3 R-COO⁻ Na⁺ (Soap)",
    "conclusion": "Amphiphilic soap molecules possess a hydrophilic ionic carboxylate head and a long hydrophobic hydrocarbon tail that emulsifies grease into micelles.",
    "safety": "Sodium hydroxide is caustic and causes chemical burns. Wear gloves and eye protection. Cure soap before direct skin use."
  },
  {
    "id": "spectroscopy-flame-emission",
    "title": "Spectroscopy & Electronic Transition Flame Emission",
    "emoji": "🌈",
    "level": "Intermediate",
    "topic": "Atomic & Bonding",
    "summary": "Use a handheld diffraction grating spectroscope to analyze line emission spectra produced by thermally excited metal cations.",
    "equipment": [
      "Bunsen burner",
      "Nichrome or platinum loop wire",
      "Handheld diffraction grating spectroscope",
      "Cobalt blue glass",
      "Watch glass"
    ],
    "chemicals": [
      "Concentrated hydrochloric acid (cleaning)",
      "Lithium chloride (LiCl)",
      "Sodium chloride (NaCl)",
      "Potassium chloride (KCl)",
      "Barium chloride (BaCl₂)",
      "Strontium chloride (SrCl₂)"
    ],
    "steps": [
      "Clean the wire loop by dipping in conc. HCl and heating in the roaring blue flame until no color persists.",
      "Dip the clean moist loop into solid lithium chloride and hold in the non-luminous flame edge.",
      "View the brilliant carmine red flame directly and through a handheld spectroscope.",
      "Note the discrete spectral lines (e.g. sharp red line at 670.8 nm).",
      "Repeat for Strontium (crimson), Sodium (doublet yellow 589 nm), Potassium (lilac, use cobalt glass), and Barium (apple green).",
      "Record wavelength positions on the nanometer spectral scale."
    ],
    "observations": [
      "Lithium yields sharp crimson flame with a prominent red spectral line at 671 nm",
      "Sodium exhibits intense golden yellow doublet at 589 nm",
      "Potassium shows violet-lilac flame with lines in the deep violet and far red",
      "Strontium produces bright scarlet-red with multiple visible bands"
    ],
    "explanation": "Thermal energy from the flame promotes valence electrons to higher quantised energy levels (E₂). When returning to lower orbitals (E₁), energy is emitted as discrete photons according to Planck's equation: ΔE = E₂ - E₁ = hν = hc/λ. The line spectrum serves as an atomic optical fingerprint.",
    "equation": "ΔE = h · c / λ  (Planck-Einstein Relation)",
    "conclusion": "Quantized electronic transitions demonstrate atomic shell structures and form the physical basis for analytical flame photometry and astrophysical spectroscopy.",
    "safety": "Concentrated HCl releases acidic fumes; clean loops in a fume hood. Barium salts are toxic."
  }
];
