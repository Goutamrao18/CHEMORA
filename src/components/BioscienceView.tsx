import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Dna,
  Search,
  RotateCw,
  Maximize2,
  Minimize2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  Eye,
  Layers,
  FlaskConical,
  BookOpen,
  Share2,
  Copy,
  Check,
  ChevronRight,
  AlertTriangle,
  Atom,
  Activity,
  GitFork,
  Calculator,
  Sliders,
  X,
  Scale
} from 'lucide-react';
import { playSoftClick, playSuccessChime } from '../utils/soundEffects';

interface BioscienceViewProps {
  onAskAI?: (topic: string) => void;
  initialQuery?: string;
  isStandaloneFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export type MoleculeCategory = 'protein' | 'drug' | 'metabolite' | 'nucleic';

export interface BiologicalDomain {
  name: string;
  range?: string;
  description: string;
}

export interface PathwayStep {
  title: string;
  detail: string;
}

export interface PathwayInfo {
  name: string;
  category: string;
  description: string;
  steps: PathwayStep[];
  reactomeId?: string;
}

export interface InspectedAtom {
  chain: string;
  resi: number;
  resn: string;
  atom: string;
  elem: string;
  b?: number;
  x?: number;
  y?: number;
  z?: number;
}

export interface BioscienceTarget {
  id: string;
  name: string;
  geneOrSymbol: string;
  category: MoleculeCategory;
  uniprotId?: string;
  pdbId?: string;
  pubchemCid?: number;
  smiles?: string;
  formula?: string;
  molecularWeight?: number;
  organism?: string;
  functionSummary: string;
  provenance: 'experimental_pdb' | 'predicted_alphafold' | 'curated_pubchem';
  experimentalMethod?: string;
  resolution?: string;
  alphafoldPlddtAvg?: number;
  lipinski?: {
    mwPass: boolean;
    logP: number;
    logPPass: boolean;
    hbd: number;
    hbdPass: boolean;
    hba: number;
    hbaPass: boolean;
    compliant: boolean;
  };
  sampleSequence?: string;
  activeSites?: string[];
  clinicalSignificance?: string;
  domains?: BiologicalDomain[];
  pathway?: PathwayInfo;
}

// Curated benchmark targets from Google DeepMind Science Skill catalog
const PRESET_TARGETS: BioscienceTarget[] = [
  {
    id: 'tp53',
    name: 'Cellular Tumor Antigen p53',
    geneOrSymbol: 'TP53',
    category: 'protein',
    uniprotId: 'P04637',
    pdbId: '1TUP',
    organism: 'Homo sapiens (Human)',
    functionSummary: 'Crucial tumor suppressor and "guardian of the genome". Coordinates cell cycle arrest, DNA repair, and apoptosis in response to cellular stress and genomic DNA damage.',
    provenance: 'experimental_pdb',
    experimentalMethod: 'X-ray Crystallography',
    resolution: '2.20 Å',
    alphafoldPlddtAvg: 89.4,
    sampleSequence: 'MEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPDDIEQWFTEDPGPDEAPRMPEAAPPVAPAPAAPTPAAPAPAPSWPLSSSVPSQKTYQGSYGFRLGFLHSGTAKSVTCTYSPALNKMFCQLAKTCPVQLWVDSTPPPGTRVRAMAIYKQSQHMTEVVRRCPHHERCSDSDGLAPPQHLIRVEGNLRVEYLDDRNTFRHSVVVPYEPPEVGSDCTTIHYNYMCNSSCMGGMNRRPILTIITLEDSSGNLLGRNSFEVRVCACPGRDRRTEEENLRKKGEPHHELPPGSTKRALPNNTSSSPQPKKKPLDGEYFTLQIRGRERFEMFRELNEALELKDAQAGKEPGGSRAHSSHLKSKKGQSTSRHKKLMFKTEGPDSD',
    activeSites: ['Cys176 (Zinc binding)', 'His179 (Zinc binding)', 'Cys238 (Zinc binding)', 'Cys242 (Zinc binding)', 'Arg248 (DNA contact)', 'Arg273 (DNA contact)'],
    clinicalSignificance: 'Over 50% of human cancers feature somatic missense mutations in TP53 core DNA-binding domain (Li-Fraumeni syndrome).',
    domains: [
      { name: 'Transactivation Domain (TAD)', range: 'Residues 1-61', description: 'Acidic domain recruiting histone acetyltransferases (p300/CBP) and basal transcription machinery.' },
      { name: 'Proline-Rich Domain (PRD)', range: 'Residues 63-97', description: 'Flexible regulatory linker required for efficient apoptotic signaling.' },
      { name: 'Core DNA-Binding Domain (DBD)', range: 'Residues 102-292', description: 'Central immunoglobulin-like beta-sandwich with zinc coordination and loop-sheet-helix motif binding DNA major/minor grooves.' },
      { name: 'Tetramerization Domain (TD)', range: 'Residues 325-356', description: 'Forms a stable dimer-of-dimers four-helix bundle essential for sequence-specific promoter binding.' }
    ],
    pathway: {
      name: 'p53 DNA Damage Checkpoint & Apoptotic Cascade',
      category: 'Genome Maintenance & Tumor Suppression',
      description: 'Activates transcriptional programs arresting the cell cycle at G1/S for DNA excision repair, or triggers intrinsic mitochondrial apoptosis via BAX/PUMA.',
      steps: [
        { title: 'Genotoxic Stress Sensing', detail: 'Double-strand breaks activate ATM/ATR kinase cascades, which phosphorylate p53 at Ser15 and Ser20.' },
        { title: 'E3 Ligase Dissociation', detail: 'Phosphorylation blocks MDM2 ubiquitin-ligase binding, halting 26S proteasomal degradation and stabilizing p53 levels.' },
        { title: 'Tetrameric DNA Binding', detail: 'p53 tetramers bind consensus DNA response elements (5\'-PuPuPuC(A/T)(T/A)GPyPyPy-3\') across targeted gene promoters.' },
        { title: 'Cell Fate Induction', detail: 'Transactivates p21 (CDKN1A) for cyclin-CDK inhibition, or PUMA/NOXA to trigger cytochrome c release and caspase-mediated apoptosis.' }
      ]
    }
  },
  {
    id: 'cas9',
    name: 'CRISPR-Cas9 Endonuclease with sgRNA & DNA',
    geneOrSymbol: 'SpCas9',
    category: 'nucleic',
    uniprotId: 'Q99ZW2',
    pdbId: '4OO8',
    organism: 'Streptococcus pyogenes',
    functionSummary: 'Landmark RNA-guided endonuclease from bacterial adaptive immunity. Forms a ribonucleoprotein surveillance complex with single guide RNA (sgRNA) to recognize and cleave target genomic DNA with atomic precision.',
    provenance: 'experimental_pdb',
    experimentalMethod: 'X-ray Crystallography (Doudna & Charpentier)',
    resolution: '2.50 Å',
    sampleSequence: 'MDKKYSIGLDIGTNSVGWAVITDEYKVPSKKFKVLGNTDRHSIKKNLIGALLFDSGETAEATRLKRTARRRYTRRKNRICYLQEIFSNEMAKVDDSFFHRLEESFLVEEDKKHERHPIFGNIVDEVAYHEKYPTIYHLRKKLVDSTDKADLRLIYLALAHMIKFRGHFLIEGDLNPDNSDVDKLFIQLVQTYNQLFEENPINASGVDAKAILSARLSKSRRLENLIAQLPGEKKNGLFGNLIALSLGLTPNFKSNFDLAEDAKLQLSKDTYDDDLDNLLAQIGDQYADLFLAAKNLSDAILLSDILRVNTEITKAPLSASMIKRYDEHHQDLTLLKALVRQQLPEKYKEIFFDQSKNGYAGYIDGGASQEEFYKFIKPILEKMDGTEELLVKLNREDLLRKQRTFDNGSIPHQIHLGELHAILRRQEDFYPFLKDNREKIEKILTFRIPYYVGPLARGNSRFAWMTRKSEETITPWNFEEVVDKGASAQSFIERMTNFDKNLPNEKVLPKHSLLYEYFTVYNELTKVKYVTEGMRKPAFLSGEQKKAIVDLLFKTNRKVTVKQLKEDYFKKIECFDSVEISGVEDRFNASLGTYHDLLKIIKDKDFLDNEENEDILEDIVLTLTLFEDREMIEERLKTYAHLFDDKVMKQLKRRRYTGWGRLSRKLINGIRDKQSGKTILDFLKSDGFANRNFMQLIHDDSLTFKEDIQKAQVSGQGDSLHEHIANLAGSPAIKKGILQTVKVVDELVKVMGRHKPENIVIEMARENQTTQKGQKNSRERMKRIEEGIKELGSQILKEHPVENTQLQNEKLYLYYLQNGRDMYVDQELDINRLSDYDVDHIVPQSFLKDDSIDNKVLTRSDKNRGKSDNVPSEEVVKKMKNYWRQLLNAKLITQRKFDNLTKAERGGLSELDKAGFIKRQLVETRQITKHVAQILDSRMNTKYDENDKLIREVKVITLKSKLVSDFRKDFQFYKVREINNYHHAHDAYLNAVVGTALIKKYPKLESEFVYGDYKVYDVRKMIAKSEQEIGKATAKYFFYSNIMNFFKTEITLANGEIRKRPLIETNGETGEIVWDKGRDFATVRKVLSMPQVNIVKKTEVQTGGFSKESILPKRNSDKLIARKKDWDPKKYGGFDSPTVAYSVLVVAKVEKGKSKKLKSVKELLGITIMERSSFEKNPIDFLEAKGYKEVKKDLIIKLPKYSLFELENGRKRMLASAGELQKGNELALPSKYVNFLYLASHYEKLKGSPEDNEQKQLFVEQHKHYLDEIIEQISEFSKRVILADANLDKVLSAYNKHRDKPIREQAENIIHLFTLTNLGAPAAFKYFDTTIDRKRYTSTKEVLDATLIHQSITGLYETRIDLSQLGGD',
    activeSites: ['Asp10 (RuvC catalytic site)', 'Glu762 (RuvC catalytic)', 'His840 (HNH catalytic site)', 'Asn863 (HNH catalytic)', 'Arg1333 (PAM interaction)', 'Arg1335 (PAM interaction)'],
    clinicalSignificance: 'Underpins revolutionary CRISPR therapeutics (e.g. Casgevy for Sickle Cell Disease and beta-Thalassemia); 2020 Nobel Prize in Chemistry.',
    domains: [
      { name: 'Recognition Lobe (REC)', range: 'Residues 60-717', description: 'Binds the sgRNA repeat-antirepeat stem-loop and holds the RNA:DNA hybrid duplex in the central channel.' },
      { name: 'HNH Nuclease Domain', range: 'Residues 775-909', description: 'Cleaves the target DNA strand that is Watson-Crick base-paired with the guide RNA.' },
      { name: 'RuvC Nuclease Domain', range: 'Residues 1-59, 718-774, 910-1098', description: 'Cleaves the displaced non-target DNA strand to generate a blunt double-strand break.' },
      { name: 'PAM-Interacting Domain (PI)', range: 'Residues 1099-1368', description: 'Interrogates the DNA major groove to recognize the canonical 5\'-NGG-3\' protospacer adjacent motif.' }
    ],
    pathway: {
      name: 'Type II-A CRISPR-Cas Adaptive Immunity & Gene Editing',
      category: 'Bacterial Adaptive Defense & Genome Engineering',
      description: 'Searches foreign bacteriophage or cellular chromosomal DNA, unzips the duplex, and introduces targeted double-strand breaks.',
      steps: [
        { title: 'Ribonucleoprotein Assembly', detail: 'Apo-Cas9 associates with single guide RNA (sgRNA) forming an active surveillance complex.' },
        { title: 'PAM Surveillance & Docking', detail: 'The PI domain scans genomic DNA for 5\'-NGG-3\' motifs, destabilizing the adjacent double helix.' },
        { title: 'R-Loop Formation', detail: 'Guide RNA base pairs with the target DNA strand over 20 nucleotides, forming a stable RNA:DNA heteroduplex.' },
        { title: 'Concerted Cleavage', detail: 'HNH and RuvC active sites coordinate Mg2+ ions to cleave both DNA strands 3 bp upstream of the PAM.' }
      ]
    }
  },
  {
    id: 'gfp',
    name: 'Green Fluorescent Protein (GFP)',
    geneOrSymbol: 'GFP',
    category: 'protein',
    uniprotId: 'P42212',
    pdbId: '1EMA',
    organism: 'Aequorea victoria (Crystal Jellyfish)',
    functionSummary: 'Landmark 11-stranded beta-can fluorophore. Undergoes spontaneous, post-translational cyclization and aerobic oxidation of Ser65-Tyr66-Gly67 to emit brilliant green bioluminescence (509 nm).',
    provenance: 'experimental_pdb',
    experimentalMethod: 'X-ray Crystallography (Remington et al.)',
    resolution: '1.90 Å',
    alphafoldPlddtAvg: 94.2,
    sampleSequence: 'MSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGDATYGKLTLKFICTTGKLPVPWPTLVTTFSYGVQCFSRYPDHMKQHDFFKSAMPEGYVQERTIFFKDDGNYKTRAEVKFEGDTLVNRIELKGIDFKEDGNILGHKLEYNYNSHNVYIMADKQKNGIKVNFKIRHNIEDGSVQLADHYQQNTPIGDGPVLLPDNHYLSTQSALSKDPNEKRDHMVLLEFVTAAGITHGMDELYK',
    activeSites: ['Thr65-Tyr66-Gly67 (Autocatalytic chromophore)', 'Arg96 (Chromophore stabilization)', 'Glu222 (Catalytic proton relay)', 'His148 (Phenolate hydrogen bonding)'],
    clinicalSignificance: 'Transformed molecular biology, enabling non-invasive live-cell imaging and tracking of protein dynamics; 2008 Nobel Prize in Chemistry.',
    domains: [
      { name: '11-Stranded Beta-Can', range: 'Residues 1-229', description: 'Rigid antiparallel cylindrical beta-barrel shielding the sensitive fluorophore from quenching by water or oxygen.' },
      { name: 'Central Axial Alpha-Helix', range: 'Residues 57-73', description: 'Coaxial alpha-helix threading down the interior of the barrel containing the chromophore tripeptide.' },
      { name: 'Chromophore Tripeptide', range: 'Residues 65-67 (Thr-Tyr-Gly)', description: 'Cyclizes and oxidizes spontaneously into a 4-(p-hydroxybenzylidene)imidazolidin-5-one fluorophore.' }
    ],
    pathway: {
      name: 'Fluorophore Maturation & Bioluminescent Energy Transfer',
      category: 'Photobiology & Molecular Probes',
      description: 'In crystal jellyfish, calcium-activated aequorin transfers blue energy to GFP via radiationless Förster Resonance Energy Transfer (FRET).',
      steps: [
        { title: 'Ribosomal Synthesis & Folding', detail: 'Synthesized as an inactive 238-amino-acid monomer that folds into an 11-stranded beta-barrel.' },
        { title: 'Autocatalytic Cyclization', detail: 'Torsional compression inside the barrel forces the Gly67 amide nitrogen to attack the carbonyl of Thr65.' },
        { title: 'Aerobic Dehydrogenation', detail: 'Molecular oxygen oxidizes the alpha-beta bond of Tyr66, forming the conjugated aromatic pi-system.' },
        { title: 'Photon Emission', detail: 'Optical excitation promotes electrons to the S1 state; radiative relaxation emits bright green light at 509 nm.' }
      ]
    }
  },
  {
    id: 'atp_synthase',
    name: 'ATP Synthase F1 Catalytic Core',
    geneOrSymbol: 'ATP5F1A',
    category: 'protein',
    uniprotId: 'P00846',
    pdbId: '1BMF',
    organism: 'Bos taurus (Mitochondrial)',
    functionSummary: 'Historic crystal structure of John Walker\'s rotary nanomachine. The alpha3-beta3 hexamer drives mechanical ATP synthesis from ADP and inorganic phosphate via Boyer\'s binding change mechanism.',
    provenance: 'experimental_pdb',
    experimentalMethod: 'X-ray Crystallography (John Walker)',
    resolution: '2.80 Å',
    alphafoldPlddtAvg: 93.8,
    sampleSequence: 'MLSVRVAAAVARALPRRAGLVSKNALGSSFVGTRNLHASNTRLQKTGTAEMSSILEERILGADTSVDLEETGRVLSIGDGIARVHGLRNVQAEEMVEFSSGLKGMSLNLEPDNVGVVVFGNDKLIKEGDIVKRTGAIVDVPVGEELLGRVVDALGNAIDGKGPIGSKTRRRVGLKAPGIIPRISVREPMQTGIKAVDSLVPIGRGQRELIIGDRQTGKTSIAIDTIINQKRFNDGSDEKKKLYCIYVAIGQKRSTVAQLVKRLTDADAMKYTIVVSATASDAAPLQYLAPYSGCSMGEYFRDNGKHALIIYDDLSKQAVAYRQMSLLLRRPPGREAYPGDVFYLHSRLLERAAKMNDAFGGGSLTALPVIETQAGDVSAYIPTNVISITDGQIFLETELFYKGIRPAINVGLSVSRVGSAAQTRAMKQVAGTMKLELAQYREVAAFAQFGSDLDAATQLLNRGVRLTELLKQGQYSPMAIEEQVAVIYAGVRGYLDKLEPSKITKFENAFLSHVVSQHQALLGTIRADGKISEQSDAKLKEIVTNFLAGFEA',
    activeSites: ['Lys162 (Walker A / P-loop)', 'Thr163 (Mg2+ coordination)', 'Asp256 (Walker B motif)', 'Glu188 (Catalytic water activation)'],
    clinicalSignificance: 'Central bioenergetic engine generating over 50 kg of ATP daily in an adult human; 1997 Nobel Prize in Chemistry (Walker & Boyer).',
    domains: [
      { name: 'Alpha3-Beta3 Hexameric Head', range: 'Residues 1-510 x6', description: 'Alternating arrangement of catalytic beta and structural alpha subunits surrounding the central shaft.' },
      { name: 'Nucleotide Catalytic Pockets', range: 'Walker A & B motifs', description: 'Three catalytic beta sites cycling through Open (empty), Loose (ADP+Pi), and Tight (ATP) conformations.' },
      { name: 'Central Gamma Spindle Axle', range: 'Asymmetric rotor stalk', description: 'Rotates 360 degrees in discrete 120-degree power strokes driven by proton flux through the Fo stator.' }
    ],
    pathway: {
      name: 'Chemiosmotic Oxidative Phosphorylation',
      category: 'Mitochondrial Bioenergetics',
      description: 'Converts the electrochemical proton gradient generated by the respiratory electron transport chain into covalent ATP bond energy.',
      steps: [
        { title: 'Proton-Motive Force Generation', detail: 'Mitochondrial complexes I, III, and IV pump protons into the intermembrane space creating Delta-pH and Delta-Psi.' },
        { title: 'Stator-Rotor Rotation', detail: 'Protons flux through the Fo membrane channel, turning the central gamma stalk at over 6,000 RPM.' },
        { title: 'Conformational Cycling', detail: 'The rotating asymmetric stalk forces beta subunits sequentially through Open -> Loose -> Tight conformations.' },
        { title: 'ATP Synthesis & Ejection', detail: 'Substrates condense into ATP without input of energy; mechanical torque drives the release of ATP into the matrix.' }
      ]
    }
  },
  {
    id: 'myoglobin',
    name: 'Sperm Whale Myoglobin (Kendrew 1st Protein)',
    geneOrSymbol: 'MB',
    category: 'protein',
    uniprotId: 'P02144',
    pdbId: '1MBN',
    organism: 'Physeter catodon (Sperm Whale)',
    functionSummary: 'The first macromolecular structure ever solved by X-ray crystallography (John Kendrew, 1958). Monomeric 8-helix heme protein facilitating cellular oxygen storage and diffusion in muscle.',
    provenance: 'experimental_pdb',
    experimentalMethod: 'X-ray Crystallography (John Kendrew)',
    resolution: '2.00 Å',
    alphafoldPlddtAvg: 95.1,
    sampleSequence: 'VLSEGEWQLVLHVWAKVEADVAGHGQDILIRLFKSHPETLEKFDRFKHLKTEAEMKASEDLKKHGVTVLTALGAILKKKGHHEAELKPLAQSHATKHKIPIKYLEFISEAIIHVLHSRHPGDFGADAQGAMNKALELFRKDIAAKYKELGYQG',
    activeSites: ['His64 (Distal histidine E7)', 'His93 (Proximal histidine F8, Fe2+ coordination)', 'Heme b (Protoporphyrin IX)'],
    clinicalSignificance: 'Key biomarker of acute myocardial injury and rhabdomyolysis; seminal foundation of modern structural biology (1962 Nobel Prize).',
    domains: [
      { name: '8 Alpha-Helices (A to H)', range: 'Residues 1-153', description: 'Canonical globin fold with tight non-polar core packing and minimal connecting loop segments.' },
      { name: 'Heme Crevice Pocket', range: 'Between Helices E and F', description: 'Hydrophobic pocket stabilizing ferrous iron (Fe2+) against water-induced oxidation to ferric metmyoglobin.' }
    ],
    pathway: {
      name: 'Intracellular Myocyte Oxygen Buffering',
      category: 'Gas Exchange & Muscle Metabolism',
      description: 'Binds molecular oxygen with hyperbolic saturation kinetics to sustain aerobic ATP production during sustained muscle exertion.',
      steps: [
        { title: 'Oxygen Influx', detail: 'Molecular O2 diffuses across the muscle cell sarcolemma from capillary red blood cells.' },
        { title: 'Heme Coordination', detail: 'O2 coordinates reversibly to ferrous iron (Fe2+) at the 6th octahedral coordination site opposite His93.' },
        { title: 'Hydrogen Bond Stabilization', detail: 'Distal His64 forms a stabilizing hydrogen bond with coordinated O2, suppressing carbon monoxide affinity.' },
        { title: 'Oxygen Delivery', detail: 'Releases oxygen during peak muscle contraction when intracellular pO2 falls below 5 mmHg, feeding cytochrome oxidase.' }
      ]
    }
  },
  {
    id: 'aquaporin',
    name: 'Human Aquaporin-1 Water Channel',
    geneOrSymbol: 'AQP1',
    category: 'protein',
    uniprotId: 'P29972',
    pdbId: '1FQY',
    organism: 'Homo sapiens (Human)',
    functionSummary: 'Nobel-winning tetrameric channel conducting 3 billion water molecules per second per monomer while strictly blocking protons (H3O+) to preserve cellular membrane potential.',
    provenance: 'experimental_pdb',
    experimentalMethod: 'Electron Crystallography / Cryo-EM (Peter Agre)',
    resolution: '3.80 Å',
    alphafoldPlddtAvg: 88.6,
    sampleSequence: 'MASEFKKKLFWRAVVAEFLATTLFVFISIGSALGFKYPVGNNQTAVQDNVKVSLAFGLSIATLAQSVGHISGAHLNPAVTLGLLLSCQISIFRALMYIIAQCVGAIVATAILSGITSSLTGNSLGRNDLADGVNSGQGLGIEIIGTLQLVLCVLATTDRRRRDLGGSAPLAIGLSVALGHLLAIDYTGCGINPARSFGSAVITHNFSNHWIFWVGPFIGGALAVLIYDFILAPRSSDLTDRVKVWTSGQVEEYDLDADDINSRVEMKPK',
    activeSites: ['Asn76 (NPA motif 1)', 'Asn192 (NPA motif 2)', 'Arg195 (Aromatic/Arginine selectivity filter)', 'His180 (ar/R filter)'],
    clinicalSignificance: 'Critical for renal urine concentration and pulmonary fluid clearance; 2003 Nobel Prize in Chemistry (Peter Agre).',
    domains: [
      { name: '6 Transmembrane Helices', range: 'TM1 to TM6', description: 'Right-handed alpha-helical bundle spanning the hydrophobic lipid bilayer.' },
      { name: 'Twin Re-entrant Loops B and E', range: 'NPA Motifs', description: 'Dual short hemihelices dipping into the membrane center from opposite sides, meeting at the channel midpoint.' },
      { name: 'ar/R Constriction Bottleneck', range: '2.8 Å pore', description: 'Steric filter matching the exact van der Waals diameter of a single water molecule.' }
    ],
    pathway: {
      name: 'Epithelial Transcellular Osmotic Water Transport',
      category: 'Membrane Transport & Renal Physiology',
      description: 'Drives rapid single-file water flux along osmotic gradients without dissipating the proton-motive force.',
      steps: [
        { title: 'Osmotic Driving Force', detail: 'Transepithelial hyperosmolarity draws water molecules into the extracellular vestibule.' },
        { title: 'Steric & Charge Sieve', detail: 'The 2.8 Å constriction pore (Arg195, His180) rejects hydrated ions and larger polar solutes.' },
        { title: 'Dipole Inversion', detail: 'Twin Asn residues (Asn76, Asn192) force water oxygen to reorient, breaking the continuous hydrogen-bonded proton wire.' },
        { title: 'Single-File Ejection', detail: 'Water emerges on the cytoplasmic side at diffusion-limited rates (~3 x 10^9 molecules/sec).' }
      ]
    }
  },
  {
    id: 'lysozyme',
    name: 'Hen Egg-White Lysozyme',
    geneOrSymbol: 'LYZ',
    category: 'protein',
    uniprotId: 'P00698',
    pdbId: '1LYZ',
    organism: 'Gallus gallus (Chicken)',
    functionSummary: 'First enzyme structure solved with an atomic catalytic mechanism (David Phillips, 1965). Hydrolyzes peptidoglycan beta-1,4-glycosidic bonds in bacterial cell walls.',
    provenance: 'experimental_pdb',
    experimentalMethod: 'X-ray Crystallography (David Phillips)',
    resolution: '2.00 Å',
    alphafoldPlddtAvg: 96.0,
    sampleSequence: 'KVFGRCELAAAMKRHGLDNYRGYSLGNWVCAAKFESNFNTQATNRNTDGSTDYGILQINSRWWCNDGRTPGSRNLCNIPCSALLSSDITASVNCAKKIVSDGNGMNAWVAWRNRCKGTDVQAWIRGCRL',
    activeSites: ['Glu35 (General acid catalyst)', 'Asp52 (Nucleophilic stabilization of oxocarbenium)', '4 Disulfide bonds (Cys6-127, 30-115, 64-80, 76-94)'],
    clinicalSignificance: 'Foundational benchmark in enzymology and protein biophysics; essential component of innate immunity in tears, saliva, and mucus.',
    domains: [
      { name: 'Alpha-Domain', range: 'Residues 1-39, 85-129', description: 'Four alpha-helices providing structural framework and hosting the general acid Glu35.' },
      { name: 'Beta-Domain', range: 'Residues 40-84', description: 'Triple-stranded antiparallel beta-sheet and flexible loop hosting the catalytic base Asp52.' },
      { name: 'Substrate Binding Cleft', range: 'Subsites A to F', description: 'Accommodates alternating NAM-NAG hexasaccharide chains of the bacterial cell wall.' }
    ],
    pathway: {
      name: 'Bacterial Peptidoglycan Cell Wall Lysis (Innate Immunity)',
      category: 'Enzymology & Antimicrobial Defense',
      description: 'Enzymatic cleavage of bacterial cell wall polysaccharide triggering osmotic lysis.',
      steps: [
        { title: 'Substrate Engagement', detail: 'Alternating NAG-NAM hexasaccharide docks into active site cleft across subsites A through F.' },
        { title: 'Conformational Distortion', detail: 'NAM residue at subsite D is distorted from chair into strained half-chair conformation.' },
        { title: 'General Acid Cleavage', detail: 'Glu35 protonates the bridging glycosidic oxygen, cleaving the beta-1,4 glycosidic bond.' },
        { title: 'Water Hydrolysis', detail: 'Asp52 stabilizes the oxocarbenium intermediate until attack by an activated water molecule completes turnover.' }
      ]
    }
  },
  {
    id: 'nucleosome',
    name: 'Nucleosome Core Particle (DNA-Histone Complex)',
    geneOrSymbol: 'Histone-DNA',
    category: 'nucleic',
    pdbId: '1AOI',
    organism: 'Xenopus laevis (Eukaryotic Chromatin)',
    functionSummary: 'Atomic landmark (2.8 Å) of the fundamental repeating packaging unit of eukaryotic genomes. 146 base pairs of DNA wrapped in 1.67 left-handed superhelical turns around a histone octamer.',
    provenance: 'experimental_pdb',
    experimentalMethod: 'X-ray Crystallography (Richmond et al.)',
    resolution: '2.80 Å',
    activeSites: ['Lys/Arg-rich basic surface contacts', '142 direct hydrogen bonds to DNA phosphate backbone'],
    clinicalSignificance: 'Central platform for epigenetic regulation, histone post-translational modifications (acetylation, methylation), and cancer chromatin therapeutics.',
    domains: [
      { name: 'Histone Octamer Core', range: '2x (H2A, H2B, H3, H4)', description: 'Protein spool formed by two H2A-H2B heterodimers and one H3-H4 tetramer.' },
      { name: '146 bp Superhelical DNA', range: 'Palindromic DNA duplex', description: 'B-form double helix wrapped 1.67 times around the octamer.' },
      { name: 'Basic N-Terminal Tails', range: 'Lysine-rich projections', description: 'Extend outward through DNA gyres, undergoing epigenetic acetylation and methylation.' }
    ],
    pathway: {
      name: 'Chromatin Packaging & Epigenetic Gene Regulation',
      category: 'Epigenomics & Genome Architecture',
      description: 'Regulates access to genomic DNA for transcription, replication, and repair.',
      steps: [
        { title: 'Electrostatic Condensation', detail: 'Basic histone residues neutralize negative charge of the DNA phosphate backbone.' },
        { title: 'Superhelical Wrapping', detail: 'DNA is forced into sharp bends around the protein spool, achieving 6-fold linear compression.' },
        { title: 'Epigenetic Tagging', detail: 'Histone acetyltransferases (HATs) neutralize lysine charges, loosening DNA wrapping.' },
        { title: 'Chromatin Remodeling', detail: 'SWI/SNF complexes slide or eject nucleosomes to expose promoters for RNA Polymerase II.' }
      ]
    }
  },
  {
    id: 'collagen',
    name: 'Collagen Triple Helix Peptide Model',
    geneOrSymbol: 'COL1A1',
    category: 'protein',
    pdbId: '1BKV',
    organism: 'Synthetic Mimetic',
    functionSummary: 'High-resolution model of the most abundant protein in mammals. Features three polyproline-II strands coiled into a right-handed superhelical rope with Gly-Pro-Hyp repeats.',
    provenance: 'experimental_pdb',
    experimentalMethod: 'X-ray Crystallography',
    resolution: '1.85 Å',
    sampleSequence: 'PPGPPGPPGPPGPPGPPGPPG',
    activeSites: ['Glycine at every 3rd position (Gly-X-Y)', '4-Hydroxyproline (Hyp) ring puckering', 'Inter-strand N-H...O=C hydrogen bonds'],
    clinicalSignificance: 'Structural basis of osteogenesis imperfecta, Ehlers-Danlos syndrome, and scurvy (vitamin C deficiency impairing prolyl hydroxylase).',
    domains: [
      { name: 'Polyproline-II Left-Handed Helices', range: 'Strands A, B, C', description: 'Extended 3.3 residues-per-turn conformation.' },
      { name: 'Right-Handed Superhelical Rope', range: 'Triple Helix', description: 'Staggered 1-residue axial offset with interior-facing glycine hydrogen bonds.' }
    ],
    pathway: {
      name: 'Extracellular Matrix Assembly & Biosynthesis',
      category: 'Structural Biomechanics & Connective Tissue',
      description: 'Provides tensile scaffolding for bones, tendons, skin, cartilage, and vascular walls.',
      steps: [
        { title: 'Procollagen Translation', detail: 'Synthesized on rough ER with Gly-X-Y repeating tripeptide motifs.' },
        { title: 'Vitamin C-Dependent Hydroxylation', detail: 'Prolyl and lysyl hydroxylases modify residues, essential for triple-helix thermal stability.' },
        { title: 'Triple-Helix Propagation', detail: 'C-terminal propeptides initiate zipper-like folding into triple-helical procollagen.' },
        { title: 'Extracellular Fibrillogenesis', detail: 'Propeptides are cleaved by proteases; tropocollagen self-assembles into staggered fibrils cross-linked by lysyl oxidase.' }
      ]
    }
  },
  {
    id: 'brca1',
    name: 'Breast Cancer Type 1 Susceptibility Protein',
    geneOrSymbol: 'BRCA1',
    category: 'protein',
    uniprotId: 'P38398',
    pdbId: '1JM7',
    organism: 'Homo sapiens (Human)',
    functionSummary: 'E3 ubiquitin-protein ligase playing a central role in DNA repair by facilitating homologous recombination repair of double-strand DNA breaks.',
    provenance: 'predicted_alphafold',
    experimentalMethod: 'AlphaFold DB Prediction (Monomer v2)',
    resolution: 'pLDDT High-Confidence',
    alphafoldPlddtAvg: 74.8,
    sampleSequence: 'MDLSALRVEEVQNVINAMQKILECPICLELIKEPVSTKCDHIFCKFCMLKLLNQKKGPSQCPLCKNDITKRSLQESTRFSQLVEELLKIICAFQLDTGLEYANSYNFAKKENNSPEHLKDEVSIIQSMGYRNRAKRLLQSEPENPSLQETSLSVQLSNLGTVRTLRTKQRIQPQKTSVYIELGSDSSEDTVNKATYCSVGDQELLQITPQGTRDEISLDS',
    activeSites: ['Cys24 (RING zinc finger)', 'Cys27 (RING zinc finger)', 'His41 (Zinc binding)', 'Cys44 (Zinc binding)'],
    clinicalSignificance: 'Pathogenic germline variants drastically elevate lifetime risk for hereditary breast and ovarian cancer (HBOC).',
    domains: [
      { name: 'N-Terminal RING Finger Domain', range: 'Residues 1-102', description: 'Binds BARD1 to form active E3 ubiquitin ligase coordinating double-strand break repair.' },
      { name: 'Nuclear Localization Signals', range: 'Residues 503-606', description: 'Directs nuclear import following DNA damage detection.' },
      { name: 'Tandem BRCT Repeats', range: 'Residues 1650-1863', description: 'Phosphopeptide recognition module binding phosphorylated ABRAXAS, CtIP, and BACH1.' }
    ],
    pathway: {
      name: 'Homologous Recombination DNA Double-Strand Break Repair',
      category: 'Genome Integrity & Cancer Prevention',
      description: 'Promotes error-free template-dependent repair of catastrophic DNA double-strand breaks.',
      steps: [
        { title: 'Break Detection', detail: 'ATM and ATR kinases phosphorylate histone H2AX forming gamma-H2AX foci at break sites.' },
        { title: 'Foci Assembly', detail: 'BRCA1 BRCT repeats dock at damage foci, recruiting the MRN complex.' },
        { title: 'End Resection', detail: 'BRCA1 promotes CtIP-mediated DNA end resection, generating 3\'-single-stranded overhangs.' },
        { title: 'RAD51 Nucleofilament Loading', detail: 'Facilitates loading of RAD51 onto single-stranded DNA to execute homologous strand invasion.' }
      ]
    }
  },
  {
    id: 'egfr',
    name: 'Epidermal Growth Factor Receptor (Tyrosine Kinase)',
    geneOrSymbol: 'EGFR',
    category: 'protein',
    uniprotId: 'P00533',
    pdbId: '1M17',
    organism: 'Homo sapiens (Human)',
    functionSummary: 'Receptor tyrosine kinase binding EGF ligands. Activates MAPK, Akt, and JNK signal transduction pathways promoting cell proliferation and survival.',
    provenance: 'experimental_pdb',
    experimentalMethod: 'X-ray Crystallography',
    resolution: '2.60 Å',
    alphafoldPlddtAvg: 85.2,
    sampleSequence: 'MRPSGTAGAALLALLAALCPASRALEEKKVCQGTSNKLTQLGTFEDHFLSLQRMFNNCEVVLGNLEITYVQRNYDLSFLKTIQEVAGYVLIALNTVERIPLENLQIIRGNMYYENSYALAVLSNYDANKTGLKELPMRNLQEILHGAVRFSNNPALCNVESIQWRDIVSSDFLSNMSMDFQNHLGSCQKCDPSCPNGSCWGAGEENCQKLTKIICAQQCS',
    activeSites: ['Lys745 (ATP binding)', 'Asp837 (Catalytic loop)', 'Asp855 (DFG motif)'],
    clinicalSignificance: 'Key target for targeted oncology inhibitors (Erlotinib, Gefitinib, Osimertinib) in non-small cell lung carcinoma.',
    domains: [
      { name: 'Extracellular Ectodomain', range: 'Domains I to IV', description: 'Binds EGF ligand, inducing a conformational transition from tethered to extended dimer form.' },
      { name: 'Transmembrane Helix', range: 'Residues 622-644', description: 'Single-pass alpha-helix transmitting dimerization across the plasma membrane.' },
      { name: 'Tyrosine Kinase Domain', range: 'Residues 690-955', description: 'Bichain kinase with N- and C-lobes forming an asymmetric dimer where the activator activates the receiver.' }
    ],
    pathway: {
      name: 'Receptor Tyrosine Kinase MAPK/ERK & PI3K/Akt Proliferation Signaling',
      category: 'Signal Transduction & Oncogenesis',
      description: 'Transduces extracellular growth factor cues into intracellular survival and mitogenic transcriptional programs.',
      steps: [
        { title: 'Ligand Binding & Dimerization', detail: 'EGF ligand docks onto domains I and III, stabilizing an active receptor dimer.' },
        { title: 'Asymmetric Kinase Trans-Activation', detail: 'The C-lobe of the activator monomer contacts the N-lobe of the receiver, activating its kinase pocket.' },
        { title: 'Tail Trans-Phosphorylation', detail: 'Multiple tyrosine residues on the disordered C-terminal tail are phosphorylated, forming SH2 docking sites.' },
        { title: 'Downstream Cascade', detail: 'Recruits Grb2-SOS to trigger the Ras-Raf-MEK-ERK mitogen cascade driving cell cycle progression.' }
      ]
    }
  },
  {
    id: 'ins',
    name: 'Human Insulin Hormone',
    geneOrSymbol: 'INS',
    category: 'protein',
    uniprotId: 'P01308',
    pdbId: '4INS',
    organism: 'Homo sapiens (Human)',
    functionSummary: 'Pancreatic endocrine peptide hormone regulating cellular uptake of glucose, amino acids, and fatty acids; drives glycogen and protein synthesis.',
    provenance: 'experimental_pdb',
    experimentalMethod: 'X-ray Crystallography (Dorothy Hodgkin)',
    resolution: '1.50 Å',
    alphafoldPlddtAvg: 93.1,
    sampleSequence: 'MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKTRREAEDLQVGQVELGGGPGAGSLQPLALEGSLQKRGIVEQCCTSICSLYQLENYCN',
    activeSites: ['Cys7-Cys67 (Inter-chain disulfide)', 'Cys19-Cys80 (Inter-chain disulfide)', 'Cys66-Cys71 (Intra-chain A disulfide)'],
    clinicalSignificance: 'Essential therapy for Type 1 Diabetes Mellitus and advanced Type 2 Diabetes; historical landmark in structural biology.',
    domains: [
      { name: 'Chain A (21 residues)', range: 'GIVEQCCTSICSLYQLENYCN', description: 'Contains the intra-chain disulfide loop (Cys6-Cys11) crucial for receptor recognition.' },
      { name: 'Chain B (30 residues)', range: 'FVNQHLCGSHLVEALYLVCGERGFFYTPKT', description: 'Forms central alpha-helix and beta-strand linked to Chain A via two inter-chain disulfides.' },
      { name: 'Zinc-Coordinated Hexamer', range: 'R6 Assembly', description: 'Storage form in pancreatic beta-cell dense-core secretory granules coordinating two central Zn2+ ions.' }
    ],
    pathway: {
      name: 'Insulin Receptor Signaling & GLUT4 Glucose Translocation',
      category: 'Endocrine Metabolic Homeostasis',
      description: 'Coordinates cellular uptake of circulating glucose into skeletal muscle and adipose tissue.',
      steps: [
        { title: 'Pancreatic Exocytosis', detail: 'Elevated postprandial blood glucose triggers ATP-sensitive K+ channel closure, depolarizing beta cells and releasing insulin.' },
        { title: 'Receptor Dimer Activation', detail: 'Circulating insulin binds the alpha-subunits of the tetrameric insulin receptor (IR).' },
        { title: 'IRS-1 / PI3K Phosphorylation', detail: 'Activated beta-subunits trans-autophosphorylate, recruiting and activating IRS-1 and PI3-kinase.' },
        { title: 'GLUT4 Translocation', detail: 'Akt/PKB kinase activation stimulates exocytic trafficking of GLUT4 glucose transporter vesicles to the plasma membrane.' }
      ]
    }
  },
  {
    id: 'hbb',
    name: 'Hemoglobin Subunit Beta',
    geneOrSymbol: 'HBB',
    category: 'protein',
    uniprotId: 'P68871',
    pdbId: '4HHB',
    organism: 'Homo sapiens (Human)',
    functionSummary: 'Tetrameric oxygen transport metalloprotein in erythrocytes. Undergoes cooperative allosteric transition between T (deoxygenated) and R (oxygenated) states.',
    provenance: 'experimental_pdb',
    experimentalMethod: 'X-ray Crystallography (Max Perutz)',
    resolution: '1.74 Å',
    alphafoldPlddtAvg: 96.5,
    sampleSequence: 'MVHLTPEEKSAVTALWGKVNVDEVGGEALGRLLVVYPWTQRFFESFGDLSTPDAVMGNPKVKAHGKKVLGAFSDGLAHLDNLKGTFATLSELHCDKLHVDPENFRLLGNVLVCVLAHHFGKEFTPPVQAAYQKVVAGVANALAHKYH',
    activeSites: ['His63 (Distal histidine E7)', 'His92 (Proximal histidine F8, Fe2+ coordination)'],
    clinicalSignificance: 'Glu6Val substitution causes Sickle Cell Anemia (HbS) polymerizing under hypoxia; locus of beta-thalassemia variants.',
    domains: [
      { name: 'Alpha2-Beta2 Heterotetramer', range: 'Dimer of Dimers', description: 'Two alpha and two beta chains held together by salt bridges in the deoxygenated T-state.' },
      { name: 'Heme Coordination Pocket', range: 'Protoporphyrin IX', description: 'Porphyrin ring with coordinated Fe2+ iron held between proximal and distal histidines.' },
      { name: 'Allosteric Interface (Alpha1-Beta2)', range: 'Sliding Switch', description: 'Rotates 15 degrees during T-to-R transition, mediating allosteric cooperative oxygen binding.' }
    ],
    pathway: {
      name: 'Allosteric Cooperative Oxygen Transport & Bohr Effect',
      category: 'Respiratory Physiology & Gas Exchange',
      description: 'Delivers oxygen from high-affinity pulmonary capillary environments to low-affinity peripheral metabolizing tissues.',
      steps: [
        { title: 'Pulmonary Oxygen Binding', detail: 'In alveolar capillaries (pO2 ~100 mmHg), O2 binds low-affinity T-state hemoglobin.' },
        { title: 'Iron In-Plane Shift', detail: 'Binding pulls Fe2+ 0.4 Å into the heme plane, tilting proximal His92 and moving the F-helix.' },
        { title: 'Quaternary Allosteric Switch', detail: 'Triggers a 15-degree rotation between alpha-beta dimers, breaking salt bridges and converting all subunits to high-affinity R-state.' },
        { title: 'Peripheral Unloading (Bohr Effect)', detail: 'In tissues with high H+ and CO2 (low pH), protons stabilize the T-state, promoting cooperative oxygen release.' }
      ]
    }
  },
  {
    id: '1bna',
    name: 'B-DNA Dodecamer (Dickerson-Drew)',
    geneOrSymbol: '1BNA (DNA)',
    category: 'nucleic',
    pdbId: '1BNA',
    organism: 'Synthetic DNA Duplex',
    functionSummary: 'Landmark atomic-resolution (1.9 Å) single-crystal structure of right-handed double-helical B-DNA duplex (CGCGAATTCGCG). Demonstrates Watson-Crick base-pairing, helical twist, and minor/major groove architecture.',
    provenance: 'experimental_pdb',
    experimentalMethod: 'X-ray Crystallography',
    resolution: '1.90 Å',
    domains: [
      { name: 'Antiparallel Complementary Strands', range: '5\'-CGCGAATTCGCG-3\'', description: 'Dual deoxyribose-phosphate backbones running in opposite 5\'-to-3\' directions.' },
      { name: 'Major Groove', range: 'Width ~12 Å', description: 'Wide groove displaying sequence-specific hydrogen-bonding donor and acceptor patterns.' },
      { name: 'Minor Groove', range: 'Width ~6 Å', description: 'Narrow groove lined with an ordered spine of hydration stabilizing the B-form duplex.' },
      { name: 'Watson-Crick Base-Pair Core', range: '12 Base Pairs', description: 'Planar A-T (2 H-bonds) and G-C (3 H-bonds) stacked at 3.4 Å intervals with 36-degree helical twist.' }
    ],
    pathway: {
      name: 'Watson-Crick Double-Helical Architecture & Genetic Fidelity',
      category: 'Molecular Genetics & Information Storage',
      description: 'The structural archetype of genomic information storage and semiconservative replication.',
      steps: [
        { title: 'Backbone Condensation', detail: 'Phosphodiester bonds link 3\'-carbon of one sugar to the 5\'-carbon of the next, orienting negative charges outward.' },
        { title: 'Base Stacking & Pi-Pi Overlap', detail: 'Hydrophobic heterocyclic bases stack perpendicular to the helical axis, excluding water.' },
        { title: 'Complementary Hydrogen Bonding', detail: 'Purine-pyrimidine complementarity (A=T, G=C) enforces strict 10.8 Å C1\'-C1\' distance across every rung.' },
        { title: 'Template Replication', detail: 'Helicases unwind the duplex to expose single strands as templates for high-fidelity DNA polymerase copying.' }
      ]
    }
  },
  {
    id: '1ehz',
    name: 'Yeast Phenylalanine Transfer RNA (tRNA-Phe)',
    geneOrSymbol: '1EHZ (RNA)',
    category: 'nucleic',
    pdbId: '1EHZ',
    organism: 'Saccharomyces cerevisiae (Yeast)',
    functionSummary: 'Atomic resolution (1.93 Å) structure of canonical transfer RNA. Displays the characteristic cloverleaf secondary structure folded into a 3D L-shaped tertiary architecture with post-transcriptionally modified nucleosides.',
    provenance: 'experimental_pdb',
    experimentalMethod: 'X-ray Crystallography',
    resolution: '1.93 Å',
    domains: [
      { name: 'Acceptor Stem', range: '3\'-Terminal CCA', description: 'Where phenylalanine amino acid is covalently esterified by aminoacyl-tRNA synthetase.' },
      { name: 'Anticodon Loop', range: '5\'-GAA-3\' Triplet', description: 'Binds complementary mRNA codons (5\'-UUU-3\' or 5\'-UUC-3\') in the ribosomal decoding center.' },
      { name: 'D and T-Psi-C Loops', range: 'Tertiary Core', description: 'Contain modified bases (pseudouridine, dihydrouridine) forming non-canonical base triples in the L-fold elbow.' }
    ],
    pathway: {
      name: 'Ribosomal Translation & Codon-Anticodon Decoding',
      category: 'Protein Biosynthesis & Translation',
      description: 'Translates messenger RNA nucleotide sequences into polypeptide amino acid chains.',
      steps: [
        { title: 'Aminoacylation', detail: 'Phenylalanyl-tRNA synthetase charges the 3\'-terminal adenosine with phenylalanine using ATP.' },
        { title: 'EF-Tu Delivery', detail: 'Elongation factor EF-Tu-GTP binds aminoacyl-tRNA and escorts it into the ribosomal A-site.' },
        { title: 'Anticodon Verification', detail: 'Anticodon loop bases form Watson-Crick pairs with the mRNA codon; cognate pairing triggers GTP hydrolysis.' },
        { title: 'Peptide Bond Synthesis', detail: 'The ribosomal peptidyl transferase center transfers the nascent polypeptide chain onto the amino acid.' }
      ]
    }
  },
  {
    id: 'atp',
    name: 'Adenosine Triphosphate (Cellular Energy Currency)',
    geneOrSymbol: 'ATP',
    category: 'metabolite',
    pubchemCid: 5957,
    smiles: 'C1=NC(=C2C(=N1)N(C=N2)C3C(C(C(O3)COP(=O)(O)OP(=O)(O)OP(=O)(O)O)O)O)N',
    formula: 'C10H16N5O13P3',
    molecularWeight: 507.18,
    functionSummary: 'The universal currency of intracellular chemical energy. High-energy phosphoanhydride bonds drive macromolecular biosynthesis, active membrane transport (Na+/K+ ATPase), and muscle contraction.',
    provenance: 'curated_pubchem',
    lipinski: {
      mwPass: false,
      logP: -3.8,
      logPPass: true,
      hbd: 6,
      hbdPass: false,
      hba: 14,
      hbaPass: false,
      compliant: false
    },
    clinicalSignificance: 'Central substrate of kinases and ATPases; target of purinergic signaling receptors (P2X, P2Y) in cardiovascular and neural systems.',
    domains: [
      { name: 'Adenine Nucleobase', range: 'Purine Ring', description: 'Binds specificity pockets of kinases and dehydrogenases.' },
      { name: 'Ribose Sugar', range: 'Furanose Core', description: 'Coordinates active site residues in 2\'- and 3\'-endo conformations.' },
      { name: 'Triphosphate Tail', range: 'Alpha, Beta, Gamma Phosphates', description: 'Carries 4 negative charges shielded by Mg2+; terminal phosphoanhydride hydrolysis releases 30.5 kJ/mol.' }
    ],
    pathway: {
      name: 'Cellular Bioenergetic Coupling & Kinase Signaling',
      category: 'Intermediary Metabolism',
      description: 'Couples exergonic phosphate hydrolysis to drive energetically unfavorable biochemical processes.',
      steps: [
        { title: 'Biosynthesis', detail: 'Generated by ATP synthase in mitochondria and phosphoglycerate kinase / pyruvate kinase in glycolysis.' },
        { title: 'Magnesium Chelation', detail: 'Forms Mg-ATP2- complex, neutralizing negative charge for nucleophilic enzymatic attack.' },
        { title: 'Group Transfer', detail: 'Kinases transfer the gamma-phosphate onto hydroxyl groups of Ser/Thr/Tyr or metabolic intermediates.' },
        { title: 'ADP Recycling', detail: 'Adenylate kinase and ATP synthase rapidly re-phosphorylate ADP to maintain high cellular energy charge.' }
      ]
    }
  },
  {
    id: 'glucose',
    name: 'D-Glucose (Dextrose / Blood Sugar)',
    geneOrSymbol: 'GLC',
    category: 'metabolite',
    pubchemCid: 5793,
    smiles: 'C(C1C(C(C(C(O1)O)O)O)O)O',
    formula: 'C6H12O6',
    molecularWeight: 180.16,
    functionSummary: 'Primary fuel for human cellular metabolism, particularly obligate in brain and erythrocytes. Enters glycolysis yielding pyruvate, ATP, and reducing equivalents (NADH).',
    provenance: 'curated_pubchem',
    lipinski: {
      mwPass: true,
      logP: -3.24,
      logPPass: true,
      hbd: 5,
      hbdPass: true,
      hba: 6,
      hbaPass: true,
      compliant: true
    },
    clinicalSignificance: 'Central metabolite in Diabetes Mellitus, hyper/hypoglycemia, and cancer aerobic glycolysis (Warburg effect).',
    domains: [
      { name: 'Pyranose Ring', range: 'Six-Membered Ring', description: 'Adopts low-energy 4C1 chair conformation with bulky hydroxyls in equatorial positions.' },
      { name: 'Anomeric Carbon (C1)', range: 'Alpha/Beta Hemiacetal', description: 'Mutarotates in aqueous solution (~64% beta-D-glucopyranose, 36% alpha).' }
    ],
    pathway: {
      name: 'Glycolysis (Embden-Meyerhof-Parnas Pathway)',
      category: 'Carbohydrate Metabolism',
      description: 'Ten-step cytosolic catabolism converting 1 glucose into 2 pyruvate, 2 ATP, and 2 NADH.',
      steps: [
        { title: 'Cellular Uptake', detail: 'Facilitated diffusion through GLUT transporters into cytoplasm.' },
        { title: 'Hexokinase Priming', detail: 'Hexokinase phosphorylates glucose to glucose-6-phosphate, trapping it inside the cell.' },
        { title: 'Cleavage to Trioses', detail: 'Phosphofructokinase-1 and aldolase cleave fructose-1,6-bisphosphate into GAP and DHAP.' },
        { title: 'Energy Harvest', detail: 'Substrate-level phosphorylation produces net 2 ATP and 2 NADH per glucose.' }
      ]
    }
  },
  {
    id: 'cholesterol',
    name: 'Cholesterol (Membrane Sterol)',
    geneOrSymbol: 'CLR',
    category: 'metabolite',
    pubchemCid: 5997,
    smiles: 'CC(C)CCCC(C)C1CCC2C1(CCC3C2CC=C4C3(CCC(C4)O)C)C',
    formula: 'C27H46O',
    molecularWeight: 386.65,
    functionSummary: 'Principal sterol of eukaryotic animal cell membranes. Regulates phospholipid membrane fluidity, forms lipid raft signaling microdomains, and serves as precursor to steroid hormones and bile acids.',
    provenance: 'curated_pubchem',
    lipinski: {
      mwPass: true,
      logP: 7.11,
      logPPass: false,
      hbd: 1,
      hbdPass: true,
      hba: 1,
      hbaPass: true,
      compliant: false
    },
    clinicalSignificance: 'Atherosclerosis and coronary artery disease risk driver; primary target of HMG-CoA reductase inhibitor therapy (statins).',
    domains: [
      { name: 'Four-Ring Steroid Nucleus', range: 'Rings A, B, C, D', description: 'Planar, rigid trans-fused cyclopentanoperhydrophenanthrene core.' },
      { name: '3-Beta Hydroxyl Head', range: 'Polar Head Group', description: 'Hydrogen-bonds with phospholipid ester carbonyls near membrane surface.' },
      { name: 'Isooctyl Hydrophobic Tail', range: 'Alkyl Chain at C17', description: 'Intercalates into the fatty acyl core of the bilayer.' }
    ],
    pathway: {
      name: 'Mevalonate Biosynthetic Pathway & Lipoprotein Transport',
      category: 'Lipid Metabolism',
      description: 'De novo synthesis and systemic transport in LDL and HDL lipoprotein complexes.',
      steps: [
        { title: 'HMG-CoA Reductase Commitment', detail: 'Condensation of acetyl-CoA units produces mevalonate via rate-limiting HMG-CoA reductase.' },
        { title: 'Isoprene Polymerization', detail: 'Isopentenyl pyrophosphate units polymerize into squalene (30 carbons).' },
        { title: 'Oxidosqualene Cyclization', detail: 'Lanosterol synthase cyclizes squalene into the four-ring steroid skeleton.' },
        { title: 'Lipoprotein Packaging', detail: 'Packaged into VLDL/LDL for delivery to peripheral tissues via receptor-mediated endocytosis.' }
      ]
    }
  },
  {
    id: 'imatinib',
    name: 'Imatinib (Gleevec)',
    geneOrSymbol: 'STI571',
    category: 'drug',
    pubchemCid: 5291,
    smiles: 'CC1=C(C=C(C=C1)NC(=O)C2=CC=C(C=C2)CN3CCN(CC3)C)NC4=NC=CC(=N4)C5=CN=CC=C5',
    formula: 'C29H31N7O',
    molecularWeight: 493.6,
    functionSummary: 'First-in-class selective 2-phenylaminopyrimidine tyrosine kinase inhibitor targeting BCR-ABL1, c-KIT, and PDGFR. Landmark in rational structure-based drug design.',
    provenance: 'curated_pubchem',
    lipinski: {
      mwPass: true,
      logP: 3.5,
      logPPass: true,
      hbd: 2,
      hbdPass: true,
      hba: 7,
      hbaPass: true,
      compliant: true
    },
    clinicalSignificance: 'Revolutionized chronic myeloid leukemia (CML) and gastrointestinal stromal tumors (GIST) prognosis.',
    domains: [
      { name: 'Pyrimido-Pyridine Pharmacophore', range: 'Heteroaromatic Core', description: 'Occupies the ATP-binding hinge region forming hydrogen bonds with Met318.' },
      { name: 'Hydrophobic Pocket Penetrator', range: 'Benzamide / Phenyl Ring', description: 'Slots into the adjacent allosteric pocket created by the DFG-out conformation.' },
      { name: 'N-Methylpiperazine Stalk', range: 'Solvent-Exposed Tail', description: 'Imparts aqueous solubility and oral bioavailability.' }
    ],
    pathway: {
      name: 'BCR-ABL1 Oncogenic Kinase Inhibition',
      category: 'Targeted Cancer Chemotherapy',
      description: 'Locks the BCR-ABL1 fusion tyrosine kinase into an inactive conformation, halting leukemic cell proliferation.',
      steps: [
        { title: 'DFG-Out Binding', detail: 'Imatinib selectively recognizes the inactive (DFG-out) conformation of BCR-ABL1 kinase.' },
        { title: 'Hinge Hydrogen Bonding', detail: 'Forms dual hydrogen bonds with the kinase backbone at Met318, displacing ATP.' },
        { title: 'Substrate Blockade', detail: 'Prevents auto-phosphorylation of Tyr393 in the activation loop, preventing substrate recruitment.' },
        { title: 'Apoptotic Induction', detail: 'Stops STAT5 and CrkL downstream phosphorylation, driving CML leukemic blasts into apoptosis.' }
      ]
    }
  },
  {
    id: 'aspirin',
    name: 'Aspirin (Acetylsalicylic Acid)',
    geneOrSymbol: 'ASA',
    category: 'drug',
    pubchemCid: 2244,
    smiles: 'CC(=O)OC1=CC=CC=C1C(=O)O',
    formula: 'C9H8O4',
    molecularWeight: 180.16,
    functionSummary: 'Non-steroidal anti-inflammatory drug (NSAID) and antiplatelet agent. Irreversibly acetylates Ser529 in COX-1 and Ser516 in COX-2, halting thromboxane A2 and prostaglandin synthesis.',
    provenance: 'curated_pubchem',
    lipinski: {
      mwPass: true,
      logP: 1.19,
      logPPass: true,
      hbd: 1,
      hbdPass: true,
      hba: 4,
      hbaPass: true,
      compliant: true
    },
    clinicalSignificance: 'Cardioprotective secondary prophylaxis for myocardial infarction and ischemic stroke.',
    domains: [
      { name: 'Salicylate Ring', range: 'Ortho-Substituted Benzene', description: 'Occupies the hydrophobic channel of cyclooxygenase enzymes.' },
      { name: 'Acetyl Ester Group', range: '-O-C(=O)CH3', description: 'Covalently transferred onto active-site serine residues.' }
    ],
    pathway: {
      name: 'Cyclooxygenase Inactivation & Prostanoid Suppression',
      category: 'Anti-Inflammatory & Antiplatelet Pharmacology',
      description: 'Irreversibly blocks the conversion of arachidonic acid into prostaglandin H2.',
      steps: [
        { title: 'Channel Binding', detail: 'Aspirin enters the long, narrow hydrophobic channel of platelet COX-1.' },
        { title: 'Covalent Serine Acetylation', detail: 'Transfers its acetyl group to Ser529 near the catalytic apex, creating permanent steric obstruction.' },
        { title: 'Substrate Exclusion', detail: 'Arachidonic acid is physically blocked from reaching the catalytic Tyr385 radical site.' },
        { title: 'Thromboxane Blockade', detail: 'Halts synthesis of platelet thromboxane A2 for the remaining 8-10 day lifespan of the anucleate platelet.' }
      ]
    }
  },
  {
    id: 'caffeine',
    name: 'Caffeine (1,3,7-Trimethylxanthine)',
    geneOrSymbol: 'CAF',
    category: 'metabolite',
    pubchemCid: 2519,
    smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
    formula: 'C8H10N4O2',
    molecularWeight: 194.19,
    functionSummary: 'Purine alkaloid and central nervous system stimulant. Competitive non-selective antagonist of adenosine A1 and A2A receptors; inhibits cyclic nucleotide phosphodiesterase.',
    provenance: 'curated_pubchem',
    lipinski: {
      mwPass: true,
      logP: -0.07,
      logPPass: true,
      hbd: 0,
      hbdPass: true,
      hba: 4,
      hbaPass: true,
      compliant: true
    },
    clinicalSignificance: 'Most widely consumed psychoactive substance globally; used clinically for neonatal apnea.',
    domains: [
      { name: 'Purinedione Heterocycle', range: 'Fused Pyrimidinedione-Imidazole', description: 'Sterically mimics the adenine ring of endogenous adenosine.' },
      { name: 'Three Methyl Substituents', range: 'N1, N3, N7 Methyls', description: 'Enhances lipophilicity and blood-brain barrier penetration.' }
    ],
    pathway: {
      name: 'Adenosine Receptor Antagonism & Neural Arousal',
      category: 'Neuropharmacology & Stimulants',
      description: 'Competitively blocks inhibitory adenosine signaling in the central nervous system.',
      steps: [
        { title: 'Blood-Brain Barrier Crossing', detail: 'Rapidly penetrates the blood-brain barrier due to favorable lipophilicity (LogP -0.07).' },
        { title: 'Receptor Occupancy', detail: 'Competitively binds adenosine A1 and A2A G-protein coupled receptors without activating them.' },
        { title: 'Disinhibition of Neurotransmitters', detail: 'Prevents endogenous adenosine from suppressing dopamine, glutamate, and acetylcholine release.' },
        { title: 'Alertness & Vigilance', detail: 'Elevates striatal dopamine D2 signaling and adrenergic tone, reducing perception of sleep fatigue.' }
      ]
    }
  },
  {
    id: 'penicillin_g',
    name: 'Penicillin G (Benzylpenicillin)',
    geneOrSymbol: 'PCG',
    category: 'drug',
    pubchemCid: 5904,
    smiles: 'CC1(C(N2C(S1)C(C2=O)NC(=O)CC3=CC=CC=C3)C(=O)O)C',
    formula: 'C16H18N2O4S',
    molecularWeight: 334.4,
    functionSummary: 'Beta-lactam antibiotic. Inhibits bacterial transpeptidases (penicillin-binding proteins, PBPs), preventing peptidoglycan cell wall cross-linking and triggering autolysis.',
    provenance: 'curated_pubchem',
    lipinski: {
      mwPass: true,
      logP: 1.83,
      logPPass: true,
      hbd: 2,
      hbdPass: true,
      hba: 5,
      hbaPass: true,
      compliant: true
    },
    clinicalSignificance: 'Golden-standard antimicrobial for Treponema pallidum (syphilis), Streptococcus pneumoniae, and Listeria monocytogenes.',
    domains: [
      { name: 'Beta-Lactam Ring', range: 'Four-Membered Cyclic Amide', description: 'High ring strain makes the carbonyl carbon extremely susceptible to nucleophilic serine attack.' },
      { name: 'Thiazolidine Ring', range: 'Sulfur-Containing Five-Membered Ring', description: 'Mimics the D-Ala-D-Ala dipeptide backbone of bacterial peptidoglycan precursors.' },
      { name: 'Benzyl Sidechain', range: 'Hydrophobic Moiety', description: 'Fits the specificity pocket of bacterial penicillin-binding proteins.' }
    ],
    pathway: {
      name: 'Bacterial Cell Wall Peptidoglycan Cross-Link Inhibition',
      category: 'Beta-Lactam Antimicrobial Chemotherapy',
      description: 'Covalently inactivates transpeptidase enzymes required for bacterial cell wall mechanical strength.',
      steps: [
        { title: 'PBP Active Site Mimicry', detail: 'The beta-lactam core sterically mimics the terminal D-Ala-D-Ala of cell wall precursors.' },
        { title: 'Covalent Acylation', detail: 'Active site serine of bacterial transpeptidase attacks the strained beta-lactam carbonyl.' },
        { title: 'Irreversible Inactivation', detail: 'Forms a long-lived penicilloyl-enzyme intermediate with an extraordinarily slow hydrolysis rate.' },
        { title: 'Bacterial Lysis', detail: 'Cross-linking failure causes uncrosslinked peptidoglycan to weaken; turgor pressure bursts the cell.' }
      ]
    }
  }
];

export type ViewerErrorType = 'network_blocked' | 'not_found' | 'webgl_unavailable' | 'generic';

export interface ViewerErrorInfo {
  type: ViewerErrorType;
  message: string;
  externalUrl?: string;
  externalLabel?: string;
}

export type StructureSource = 'rcsb' | 'alphafold' | 'pubchem' | null;

export type ColorSchemeType = 'plddt' | 'spectrum' | 'chain' | 'secondary' | 'bfactor';

export interface BasePair {
  res1Chain: string;
  res1Resi: number;
  res1Resn: string;
  c1A: { x: number; y: number; z: number };
  res2Chain: string;
  res2Resi: number;
  res2Resn: string;
  c1B: { x: number; y: number; z: number };
  dist: number;
}

export interface StructureMeta {
  hasProtein: boolean;
  proteinChains: string[];
  hasNucleic: boolean;
  nucleicChains: string[];
  nucleicType: 'DNA' | 'RNA' | 'DNA/RNA';
  hasLigands: boolean;
  hasIons: boolean;
  minB: number;
  maxB: number;
  basePairs: BasePair[];
}

// Nucleic acid classifications and styling constants
export const STANDARD_NUCLEIC_RESNS = new Set([
  'DA', 'DC', 'DG', 'DT', 'DU', 'DI',
  'A', 'C', 'G', 'U', 'I',
  'PSU', '5MC', 'OMC', 'OMG', '1MA', '2MG', '7MG', 'H2U', 'M2G', '5MU', '1MG', 'MIA', 'YYG', 'YG',
  'ADE', 'CYT', 'GUA', 'THY', 'URA', 'INO',
  'dAMP', 'dCMP', 'dGMP', 'dTMP', 'AMP', 'CMP', 'GMP', 'UMP'
]);

// Continuous phospho-diester backbone chain (excluded from stick selection)
export const NUCLEIC_EXCLUDED_BACKBONE_ATOMS = new Set([
  'P', 'OP1', 'OP2', 'OP3', 'O1P', 'O2P', 'O3P',
  "O5'", "C5'", "O3'",
  "O5*", "C5*", "O3*"
]);

// Sugar ring atoms (drawn as thin sticks, radius 0.08, colored with strand color)
export const NUCLEIC_SUGAR_ATOMS = new Set([
  "C1'", "C2'", "C3'", "C4'", "O4'",
  "C1*", "C2*", "C3*", "C4*", "O4*",
  "O2'", "O2*"
]);

export const WATER_RESNS = new Set(['HOH', 'WAT', 'H2O', 'DOD', 'TIP', 'TIP3']);

export const ION_ELEMENTS = new Set([
  'ZN', 'MG', 'CA', 'FE', 'NA', 'CL', 'K', 'MN', 'CU', 'CO', 'NI', 'CD', 'HG', 'PT', 'PB', 'BA'
]);

export const STANDARD_AMINO_ACIDS = new Set([
  'ALA', 'ARG', 'ASN', 'ASP', 'CYS', 'GLN', 'GLU', 'GLY', 'HIS', 'ILE',
  'LEU', 'LYS', 'MET', 'PHE', 'PRO', 'SER', 'THR', 'TRP', 'TYR', 'VAL',
  'MSE', 'SEC', 'PYL', 'ASX', 'GLX'
]);

// Distinct nucleic strand colors (Cyan, Amber, then other distinct hues)
export const NUCLEIC_STRAND_COLORS = [
  '#14a3c4', // Cyan (strand 1)
  '#f59e0b', // Amber (strand 2)
  '#ec4899', // Pink (strand 3)
  '#8b5cf6', // Violet (strand 4)
  '#06b6d4', // Sky (strand 5)
  '#eab308', // Gold (strand 6)
];

// Distinct protein chain colors - deliberately never using #14a3c4 or #f59e0b
export const PROTEIN_CHAIN_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#a855f7', // Purple
  '#f97316', // Orange-red
  '#6366f1', // Indigo
  '#84cc16', // Lime
  '#e11d48', // Rose
  '#0284c7', // Sky
  '#d946ef', // Fuchsia
  '#22c55e', // Green
];

// Base type colors: A/DA (Green), T/DT/U/DU (Red), G/DG (Gold), C/DC (Blue)
export function getBaseColor(resn: string | undefined): string {
  if (!resn) return '#94a3b8';
  const r = resn.trim().toUpperCase();
  if (r === 'A' || r === 'DA' || r === 'ADE' || r === 'dAMP' || r === 'AMP' || r === '1MA' || r === 'MIA') {
    return '#34d399'; // Emerald/Green
  }
  if (
    r === 'T' || r === 'DT' || r === 'THY' || r === 'dTMP' || r === '5MU' ||
    r === 'U' || r === 'DU' || r === 'URA' || r === 'UMP' || r === 'H2U' || r === 'PSU'
  ) {
    return '#f87171'; // Red/Coral
  }
  if (
    r === 'G' || r === 'DG' || r === 'GUA' || r === 'dGMP' || r === 'GMP' ||
    r === '2MG' || r === '7MG' || r === 'M2G' || r === '1MG' || r === 'YYG' || r === 'YG'
  ) {
    return '#fbbf24'; // Gold/Amber
  }
  if (r === 'C' || r === 'DC' || r === 'CYT' || r === 'dCMP' || r === 'CMP' || r === '5MC' || r === 'OMC') {
    return '#60a5fa'; // Blue/Sky
  }
  if (r === 'I' || r === 'DI' || r === 'INO') {
    return '#a78bfa'; // Violet
  }
  return '#94a3b8';
}

export function interpolateHex(hex1: string, hex2: string, factor: number): string {
  const f = Math.max(0, Math.min(1, factor));
  const c1 = parseInt(hex1.replace('#', ''), 16);
  const c2 = parseInt(hex2.replace('#', ''), 16);
  const r1 = (c1 >> 16) & 255;
  const g1 = (c1 >> 8) & 255;
  const b1 = c1 & 255;
  const r2 = (c2 >> 16) & 255;
  const g2 = (c2 >> 8) & 255;
  const b2 = c2 & 255;
  const r = Math.round(r1 + (r2 - r1) * f);
  const g = Math.round(g1 + (g2 - g1) * f);
  const b = Math.round(b1 + (b2 - b1) * f);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function isPurineRes(resn: string): boolean {
  const r = (resn || '').trim().toUpperCase();
  return ['A', 'DA', 'ADE', 'G', 'DG', 'GUA', 'AMP', 'GMP', 'dAMP', 'dGMP', '1MA', 'MIA', '2MG', '7MG', 'M2G', '1MG', 'YYG', 'YG'].includes(r);
}

export function isPyrimidineRes(resn: string): boolean {
  const r = (resn || '').trim().toUpperCase();
  return ['T', 'DT', 'THY', 'U', 'DU', 'URA', 'C', 'DC', 'CYT', 'TMP', 'UMP', 'CMP', 'dTMP', 'dCMP', '5MU', 'H2U', 'PSU', '5MC', 'OMC'].includes(r);
}

export function isWatsonCrickComplementary(r1: string, r2: string): boolean {
  const a = (r1 || '').trim().toUpperCase().replace(/^D/, '');
  const b = (r2 || '').trim().toUpperCase().replace(/^D/, '');
  
  const isA = a === 'A' || a === 'ADE' || a === 'AMP';
  const isT = b === 'T' || b === 'THY' || b === 'TMP' || b === 'U' || b === 'URA' || b === 'UMP';
  if (isA && isT) return true;

  const isB_A = b === 'A' || b === 'ADE' || b === 'AMP';
  const isB_T = a === 'T' || a === 'THY' || a === 'TMP' || a === 'U' || a === 'URA' || a === 'UMP';
  if (isB_A && isB_T) return true;

  const isG = a === 'G' || a === 'GUA' || a === 'GMP';
  const isC = b === 'C' || b === 'CYT' || b === 'CMP';
  if (isG && isC) return true;

  const isB_G = b === 'G' || b === 'GUA' || b === 'GMP';
  const isB_C = a === 'C' || a === 'CYT' || a === 'CMP';
  if (isB_G && isB_C) return true;

  return false;
}

export function getDistance3D(p1: { x: number; y: number; z: number }, p2: { x: number; y: number; z: number }): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Analyzes the loaded 3D structure once per load, classifying atoms into:
 * - Protein residues & chains
 * - Nucleic acid residues, backbone vs sugar vs base atoms, and chains
 * - Watson-Crick base pairs across strands
 * - Metal/monoatomic ions
 * - Small molecule ligands
 * - Water molecules
 * - Min/Max B-factor range for experimental crystallography
 */
export function analyzeStructure(viewer: any): StructureMeta {
  if (!viewer) {
    return {
      hasProtein: false,
      proteinChains: [],
      hasNucleic: false,
      nucleicChains: [],
      nucleicType: 'DNA',
      hasLigands: false,
      hasIons: false,
      minB: 0,
      maxB: 100,
      basePairs: [],
    };
  }

  const atoms: any[] = viewer.selectedAtoms ? viewer.selectedAtoms({}) : [];
  if (!atoms || atoms.length === 0) {
    return {
      hasProtein: false,
      proteinChains: [],
      hasNucleic: false,
      nucleicChains: [],
      nucleicType: 'DNA',
      hasLigands: false,
      hasIons: false,
      minB: 0,
      maxB: 100,
      basePairs: [],
    };
  }

  const resMap = new Map<string, { resn: string; chain: string; atoms: any[]; names: Set<string> }>();
  let minB = Infinity;
  let maxB = -Infinity;

  for (let i = 0; i < atoms.length; i++) {
    const a = atoms[i];
    const chain = (a.chain || 'A').trim();
    const resi = a.resi !== undefined ? a.resi : i;
    const icode = a.icode || '';
    const resn = (a.resn || '').trim().toUpperCase();
    const key = `${chain}:${resi}:${icode}:${resn}`;

    let entry = resMap.get(key);
    if (!entry) {
      entry = { resn, chain, atoms: [], names: new Set<string>() };
      resMap.set(key, entry);
    }
    entry.atoms.push(a);
    if (a.atom) {
      entry.names.add(a.atom.trim().toUpperCase());
    }

    if (typeof a.b === 'number' && !isNaN(a.b)) {
      if (a.b < minB) minB = a.b;
      if (a.b > maxB) maxB = a.b;
    }
  }

  if (!isFinite(minB) || !isFinite(maxB)) {
    minB = 0;
    maxB = 100;
  } else if (minB === maxB) {
    maxB = minB + 1;
  }

  let hasProtein = false;
  let hasNucleic = false;
  let hasLigands = false;
  let hasIons = false;
  let hasDna = false;
  let hasRna = false;

  const proteinChainsSet = new Set<string>();
  const nucleicChainsSet = new Set<string>();

  resMap.forEach((entry) => {
    const { resn, chain, atoms: rAtoms, names } = entry;

    const isResWater = WATER_RESNS.has(resn);
    let isResNucleic = false;
    let isResProtein = false;
    let isResIon = false;

    if (isResWater) {
      // water
    } else if (STANDARD_NUCLEIC_RESNS.has(resn)) {
      isResNucleic = true;
    } else if (
      (names.has('P') || names.has('P1')) &&
      (names.has("O3'") || names.has("O3*")) &&
      (names.has("C1'") || names.has("C1*")) &&
      !names.has('CA')
    ) {
      // Fallback required: any residue with P, O3' and C1' but no CA
      isResNucleic = true;
    } else if (STANDARD_AMINO_ACIDS.has(resn) || names.has('CA')) {
      isResProtein = true;
    } else if (rAtoms.length === 1) {
      const elem = (rAtoms[0].elem || rAtoms[0].atom || '').trim().toUpperCase();
      if (ION_ELEMENTS.has(elem)) {
        isResIon = true;
      }
    }

    if (isResProtein) {
      hasProtein = true;
      proteinChainsSet.add(chain);
    }
    if (isResNucleic) {
      hasNucleic = true;
      nucleicChainsSet.add(chain);

      if (names.has("O2'") || names.has("O2*") || ['U', 'DU', 'URA', 'UMP', 'H2U', 'PSU'].includes(resn)) {
        hasRna = true;
      }
      if (resn.startsWith('D') || ['DA', 'DT', 'DC', 'DG', 'THY', 'dTMP'].includes(resn)) {
        hasDna = true;
      }
    }
    if (isResIon) {
      hasIons = true;
    }
    const isResLigand = !isResWater && !isResNucleic && !isResProtein && !isResIon;
    if (isResLigand) {
      hasLigands = true;
    }

    // Separate nucleic atoms into:
    // 1. _isNucleicBackbone (phosphate and O3', O5', C5' chain - excluded from stick)
    // 2. _isNucleicSugar (sugar ring C1', C2', C3', C4', O4' - thin stick 0.08)
    // 3. _isNucleicBase (base ring atoms - stick 0.16)
    for (const a of rAtoms) {
      a._isWater = isResWater;
      a._isNucleic = isResNucleic;
      a._isProtein = isResProtein;
      a._isIon = isResIon;
      a._isLigand = isResLigand;
      if (isResNucleic) {
        const aName = (a.atom || '').trim().toUpperCase();
        a._isNucleicBackbone = NUCLEIC_EXCLUDED_BACKBONE_ATOMS.has(aName);
        a._isNucleicSugar = NUCLEIC_SUGAR_ATOMS.has(aName);
        a._isNucleicBase = !a._isNucleicBackbone && !a._isNucleicSugar;
      }
    }
  });

  // Calculate Watson-Crick base pairs across strands
  const basePairs: BasePair[] = [];
  if (nucleicChainsSet.size > 1) {
    const purines: { chain: string; resi: number; resn: string; n1: any; c1: any }[] = [];
    const pyrimidines: { chain: string; resi: number; resn: string; n3: any; c1: any }[] = [];

    resMap.forEach((entry) => {
      const { resn, chain, atoms: rAtoms } = entry;
      if (!STANDARD_NUCLEIC_RESNS.has(resn) && !nucleicChainsSet.has(chain)) return;

      let c1: any = null;
      let n1: any = null;
      let n3: any = null;

      for (const a of rAtoms) {
        const name = (a.atom || '').trim().toUpperCase();
        if (name === "C1'" || name === "C1*") c1 = a;
        if (name === 'N1' || name === "N1'") n1 = a;
        if (name === 'N3' || name === "N3'") n3 = a;
      }

      if (!c1 && rAtoms.length > 0) c1 = rAtoms[0];

      if (isPurineRes(resn) && n1 && c1) {
        purines.push({ chain, resi: entry.atoms[0].resi ?? 0, resn, n1, c1 });
      } else if (isPyrimidineRes(resn) && n3 && c1) {
        pyrimidines.push({ chain, resi: entry.atoms[0].resi ?? 0, resn, n3, c1 });
      }
    });

    const usedPyr = new Set<string>();

    for (const pur of purines) {
      let bestPyr: typeof pyrimidines[0] | null = null;
      let minDist = 3.5; // Watson-Crick threshold < 3.5 Å

      for (const pyr of pyrimidines) {
        if (pur.chain === pyr.chain) continue;
        const pyrKey = `${pyr.chain}:${pyr.resi}`;
        if (usedPyr.has(pyrKey)) continue;
        if (!isWatsonCrickComplementary(pur.resn, pyr.resn)) continue;

        const d = getDistance3D(pur.n1, pyr.n3);
        if (d < minDist) {
          minDist = d;
          bestPyr = pyr;
        }
      }

      if (bestPyr) {
        usedPyr.add(`${bestPyr.chain}:${bestPyr.resi}`);
        basePairs.push({
          res1Chain: pur.chain,
          res1Resi: pur.resi,
          res1Resn: pur.resn,
          c1A: { x: pur.c1.x, y: pur.c1.y, z: pur.c1.z },
          res2Chain: bestPyr.chain,
          res2Resi: bestPyr.resi,
          res2Resn: bestPyr.resn,
          c1B: { x: bestPyr.c1.x, y: bestPyr.c1.y, z: bestPyr.c1.z },
          dist: minDist,
        });
      }
    }
  }

  let nucleicType: 'DNA' | 'RNA' | 'DNA/RNA' = 'DNA';
  if (hasRna && hasDna) nucleicType = 'DNA/RNA';
  else if (hasRna) nucleicType = 'RNA';
  else nucleicType = 'DNA';

  return {
    hasProtein,
    proteinChains: Array.from(proteinChainsSet),
    hasNucleic,
    nucleicChains: Array.from(nucleicChainsSet),
    nucleicType,
    hasLigands,
    hasIons,
    minB,
    maxB,
    basePairs,
  };
}

// In-memory cache for downloaded 3D structures (keyed by structure identifier)
// Eliminates redundant network requests when switching representations or color schemes
const structureDataCache = new Map<string, { format: 'cif' | 'sdf'; data: string; source: StructureSource }>();

function getTargetCacheKey(target: BioscienceTarget): string {
  if (target.provenance === 'predicted_alphafold' && target.uniprotId) {
    return `af:${target.uniprotId.toUpperCase().trim()}`;
  }
  if (target.pdbId) {
    return `pdb:${target.pdbId.toUpperCase().trim()}`;
  }
  if (target.uniprotId) {
    return `af:${target.uniprotId.toUpperCase().trim()}`;
  }
  if (target.pubchemCid) {
    return `cid:${target.pubchemCid}`;
  }
  return `id:${target.id}`;
}

function getTargetExternalLink(target: BioscienceTarget): { url: string; label: string } | null {
  if (target.provenance === 'predicted_alphafold' && target.uniprotId) {
    return {
      url: `https://alphafold.ebi.ac.uk/entry/${encodeURIComponent(target.uniprotId.toUpperCase().trim())}`,
      label: `Open ${target.uniprotId.toUpperCase()} on AlphaFold DB`,
    };
  }
  if (target.pdbId) {
    return {
      url: `https://www.rcsb.org/structure/${encodeURIComponent(target.pdbId.toUpperCase().trim())}`,
      label: `Open ${target.pdbId.toUpperCase()} on RCSB PDB`,
    };
  }
  if (target.uniprotId) {
    return {
      url: `https://alphafold.ebi.ac.uk/entry/${encodeURIComponent(target.uniprotId.toUpperCase().trim())}`,
      label: `Open ${target.uniprotId.toUpperCase()} on AlphaFold DB`,
    };
  }
  if (target.pubchemCid) {
    return {
      url: `https://pubchem.ncbi.nlm.nih.gov/compound/${target.pubchemCid}`,
      label: `Open CID ${target.pubchemCid} on PubChem`,
    };
  }
  return null;
}

function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * Executes fetch with a 15-second AbortController timeout and logs failing URLs cleanly via console.warn
 */
async function fetchWithTimeout(url: string, signal: AbortSignal, timeoutMs = 15000): Promise<Response> {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort(new Error(`Request timed out after ${timeoutMs / 1000}s`));
  }, timeoutMs);

  const abortListener = () => timeoutController.abort();
  signal.addEventListener('abort', abortListener, { once: true });

  try {
    const res = await fetch(url, { signal: timeoutController.signal });
    return res;
  } catch (err: any) {
    if (!signal.aborted) {
      console.warn(`[BioscienceView] Fetch error for ${url}:`, err?.message || err);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    signal.removeEventListener('abort', abortListener);
  }
}

function classifyError(err: any, notFoundFlag: boolean): ViewerErrorType {
  if (notFoundFlag) return 'not_found';
  const msg = (err?.message || '').toLowerCase();
  const name = err?.name || '';
  if (
    name === 'AbortError' ||
    name === 'TimeoutError' ||
    msg.includes('timeout') ||
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('blocked') ||
    msg.includes('policy') ||
    msg.includes('cors')
  ) {
    return 'network_blocked';
  }
  return 'generic';
}

export interface ProteinBiophysics {
  length: number;
  mwKDa: number;
  pI: number;
  netCharge: number;
  composition: {
    hydrophobicPercent: number;
    polarPercent: number;
    acidicPercent: number;
    basicPercent: number;
  };
}

export interface NucleicBiophysics {
  length: number;
  gcPercent: number;
  tm: number;
  approxDuplexMwKDa: number;
  counts: { A: number; T: number; G: number; C: number };
  purinePyrimidineRatio: number;
}

export function calculateProteinBiophysics(sequence: string): ProteinBiophysics | null {
  const clean = sequence.toUpperCase().replace(/[^A-Z]/g, '');
  if (!clean) return null;

  const length = clean.length;
  const RESIDUE_WEIGHTS: Record<string, number> = {
    A: 71.08, R: 156.20, N: 114.11, D: 115.09, C: 103.14,
    E: 129.12, Q: 128.13, G: 57.05, H: 137.14, I: 113.17,
    L: 113.17, K: 128.18, M: 131.21, F: 147.18, P: 97.12,
    S: 87.08, T: 101.11, W: 186.21, Y: 163.18, V: 99.13
  };
  let mw = 18.015;
  let chargedBasic = 0;
  let chargedAcidic = 0;
  let hydrophobic = 0;
  let polar = 0;

  for (const aa of clean) {
    mw += RESIDUE_WEIGHTS[aa] || 110;
    if (aa === 'K' || aa === 'R' || aa === 'H') chargedBasic++;
    else if (aa === 'D' || aa === 'E') chargedAcidic++;
    else if (['A', 'I', 'L', 'M', 'F', 'W', 'V', 'P'].includes(aa)) hydrophobic++;
    else polar++;
  }

  const count = (aa: string) => (clean.match(new RegExp(aa, 'g')) || []).length;
  const netCharge =
    (1 / (1 + Math.pow(10, 7.4 - 9.6))) +
    count('K') * (1 / (1 + Math.pow(10, 7.4 - 10.5))) +
    count('R') * (1 / (1 + Math.pow(10, 7.4 - 12.4))) +
    count('H') * (1 / (1 + Math.pow(10, 7.4 - 6.0))) -
    (1 / (1 + Math.pow(10, 2.34 - 7.4))) -
    count('D') * (1 / (1 + Math.pow(10, 3.86 - 7.4))) -
    count('E') * (1 / (1 + Math.pow(10, 4.25 - 7.4))) -
    count('C') * (1 / (1 + Math.pow(10, 8.33 - 7.4)));

  let low = 2.0;
  let high = 14.0;
  let pI = 7.0;
  for (let iter = 0; iter < 15; iter++) {
    const mid = (low + high) / 2;
    const chargeAtMid =
      (1 / (1 + Math.pow(10, mid - 9.6))) +
      count('K') * (1 / (1 + Math.pow(10, mid - 10.5))) +
      count('R') * (1 / (1 + Math.pow(10, mid - 12.4))) +
      count('H') * (1 / (1 + Math.pow(10, mid - 6.0))) -
      (1 / (1 + Math.pow(10, 2.34 - mid))) -
      count('D') * (1 / (1 + Math.pow(10, 3.86 - mid))) -
      count('E') * (1 / (1 + Math.pow(10, 4.25 - mid))) -
      count('C') * (1 / (1 + Math.pow(10, 8.33 - mid)));

    if (chargeAtMid > 0) low = mid;
    else high = mid;
    pI = mid;
  }

  return {
    length,
    mwKDa: Number((mw / 1000).toFixed(2)),
    pI: Number(pI.toFixed(2)),
    netCharge: Number(netCharge.toFixed(2)),
    composition: {
      hydrophobicPercent: Math.round((hydrophobic / length) * 100),
      polarPercent: Math.round((polar / length) * 100),
      acidicPercent: Math.round((chargedAcidic / length) * 100),
      basicPercent: Math.round((chargedBasic / length) * 100),
    }
  };
}

export function calculateNucleicBiophysics(sequence: string): NucleicBiophysics | null {
  const clean = sequence.toUpperCase().replace(/[^ATGCU]/g, '');
  if (!clean) return null;
  const length = clean.length;
  const countA = (clean.match(/A/g) || []).length;
  const countT = (clean.match(/[TU]/g) || []).length;
  const countG = (clean.match(/G/g) || []).length;
  const countC = (clean.match(/C/g) || []).length;
  const gcPercent = Math.round(((countG + countC) / length) * 100);

  let tm = 0;
  if (length < 14) {
    tm = (countA + countT) * 2 + (countG + countC) * 4;
  } else {
    tm = Number((64.9 + 41 * (countG + countC - 16.4) / length).toFixed(1));
  }

  const approxDuplexMwKDa = Number(((length * 660) / 1000).toFixed(1));

  return {
    length,
    gcPercent,
    tm,
    approxDuplexMwKDa,
    counts: { A: countA, T: countT, G: countG, C: countC },
    purinePyrimidineRatio: Number(((countA + countG) / Math.max(1, countT + countC)).toFixed(2))
  };
}

export const BioscienceView: React.FC<BioscienceViewProps> = ({
  onAskAI,
  initialQuery = 'TP53',
  isStandaloneFullscreen = false,
  onToggleFullscreen
}) => {
  const [selectedTarget, setSelectedTarget] = useState<BioscienceTarget>(PRESET_TARGETS[0]);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [targetCategoryFilter, setTargetCategoryFilter] = useState<'all' | 'protein' | 'nucleic' | 'metabolite' | 'drug'>('all');
  const [activeInspectorTab, setActiveInspectorTab] = useState<'overview' | 'structure3d' | 'pathways' | 'sequence' | 'properties' | 'literature'>('structure3d');
  const [inspectedAtom, setInspectedAtom] = useState<InspectedAtom | null>(null);

  // Custom Sequence Sandbox State
  const [customCalcSeq, setCustomCalcSeq] = useState<string>('');
  const [customCalcType, setCustomCalcType] = useState<'protein' | 'nucleic'>('protein');

  const filteredPresets = useMemo(() => {
    if (targetCategoryFilter === 'all') return PRESET_TARGETS;
    if (targetCategoryFilter === 'protein') return PRESET_TARGETS.filter((t) => t.category === 'protein');
    if (targetCategoryFilter === 'nucleic') return PRESET_TARGETS.filter((t) => t.category === 'nucleic');
    if (targetCategoryFilter === 'metabolite') return PRESET_TARGETS.filter((t) => t.category === 'metabolite');
    if (targetCategoryFilter === 'drug') return PRESET_TARGETS.filter((t) => t.category === 'drug');
    return PRESET_TARGETS;
  }, [targetCategoryFilter]);
  
  // 3Dmol viewer state
  const viewerContainerRef = useRef<HTMLDivElement | null>(null);
  const viewer3DRef = useRef<any>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState<ViewerErrorInfo | null>(null);
  const [renderStyle, setRenderStyle] = useState<'cartoon' | 'stick' | 'sphere' | 'surface'>('cartoon');
  const [colorScheme, setColorScheme] = useState<ColorSchemeType>('chain');
  const [structureSource, setStructureSource] = useState<StructureSource>('rcsb');
  const [structureMeta, setStructureMeta] = useState<StructureMeta | null>(null);
  const currentStructureMetaRef = useRef<StructureMeta | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [canvasBgDark, setCanvasBgDark] = useState(true);
  
  // AbortController and active target ref to cancel previous requests & prevent race conditions
  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const currentLoadingTargetIdRef = useRef<string | null>(null);

  // SmilesDrawer canvas state
  const smilesCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Dynamic search / query state
  const [customLoading, setCustomLoading] = useState(false);

  // Auto-render 2D chemical structure when smiles target changes
  const renderSmiles = useCallback(async (smilesStr: string) => {
    if (!smilesCanvasRef.current || !smilesStr) return;
    try {
      const SmilesDrawerModule = await import('smiles-drawer');
      const SmilesDrawer = SmilesDrawerModule.default || SmilesDrawerModule;
      
      const options = {
        width: 320,
        height: 320,
        bondThickness: 2,
        bondLength: 20,
        themes: {
          dark: {
            C: '#e2e8f0',
            O: '#f87171',
            N: '#60a5fa',
            S: '#facc15',
            P: '#fb923c',
            Cl: '#4ade80',
            F: '#34d399',
            Br: '#c084fc',
            I: '#a855f7',
            BACKGROUND: 'transparent'
          }
        }
      };

      const drawer = new SmilesDrawer.Drawer(options);
      SmilesDrawer.parse(
        smilesStr,
        (tree: any) => {
          if (smilesCanvasRef.current) {
            drawer.draw(tree, smilesCanvasRef.current, 'dark', false);
          }
        },
        (err: any) => {
          console.warn('SmilesDrawer parse fallback:', err);
        }
      );
    } catch (err) {
      console.warn('SmilesDrawer failed to load:', err);
    }
  }, []);

  // Apply styling and color functions with separate selections
  const applyViewerStyle = useCallback((viewer: any, style: string, color: string, metaArg?: StructureMeta | null) => {
    if (!viewer) return;

    const meta = metaArg || currentStructureMetaRef.current || analyzeStructure(viewer);
    currentStructureMetaRef.current = meta;

    // AlphaFold pLDDT Confidence Color Function (Section 1.3 of SKILL.md)
    const plddtColorFunc = (atom: any) => {
      const b = typeof atom.b === 'number' ? atom.b : 80;
      if (b > 90) return '#0053D6'; // Very high (>90): Deep Blue
      if (b > 70) return '#65CBF3'; // Confident (70-90): Light Blue
      if (b > 50) return '#FFDB13'; // Low (50-70): Yellow
      return '#FF7D45';             // Very low (<50): Orange
    };

    // B-Factor color function for experimental crystallographic structures
    const minB = meta.minB;
    const maxB = meta.maxB;
    const bfactorColorFunc = (atom: any) => {
      const b = typeof atom.b === 'number' ? atom.b : minB;
      const t = Math.max(0, Math.min(1, (b - minB) / (maxB - minB || 1)));
      if (t < 0.25) {
        return interpolateHex('#2563eb', '#06b6d4', t / 0.25);
      } else if (t < 0.5) {
        return interpolateHex('#06b6d4', '#10b981', (t - 0.25) / 0.25);
      } else if (t < 0.75) {
        return interpolateHex('#10b981', '#f59e0b', (t - 0.5) / 0.25);
      } else {
        return interpolateHex('#f59e0b', '#ef4444', (t - 0.75) / 0.25);
      }
    };

    try {
      // Reset all styles, surfaces, and shapes first
      viewer.setStyle({}, {});
      viewer.removeAllSurfaces();
      viewer.removeAllShapes();

      // 1. Water molecules: hide completely
      viewer.setStyle({ predicate: (atom: any) => Boolean(atom._isWater) }, {});

      // 2. Small monoatomic / metal ions: spheres
      if (meta.hasIons) {
        viewer.setStyle(
          { predicate: (atom: any) => Boolean(atom._isIon) },
          { sphere: { scale: 0.35, colorscheme: 'Jmol' } }
        );
      }

      // 3. Ligands: sticks
      if (meta.hasLigands) {
        viewer.setStyle(
          { predicate: (atom: any) => Boolean(atom._isLigand) },
          { stick: { radius: 0.22, colorscheme: 'Jmol' } }
        );
      }

      // 4. Nucleic acids
      if (meta.hasNucleic) {
        if (style === 'cartoon') {
          // Backbone: thinner, flatter ribbon (thickness: 0.3) coloured by strand with helical twist
          if (meta.nucleicChains.length > 0) {
            meta.nucleicChains.forEach((ch, idx) => {
              const strandColor = NUCLEIC_STRAND_COLORS[idx % NUCLEIC_STRAND_COLORS.length];
              viewer.setStyle(
                { chain: ch, predicate: (atom: any) => Boolean(atom._isNucleic && atom._isNucleicBackbone) },
                { cartoon: { ribbon: true, thickness: 0.3, color: strandColor } }
              );

              // Sugar ring atoms (C1', C2', C3', C4', O4'): thin sticks (radius 0.08) coloured with strand colour
              // This physically links the nucleotide to the continuous backbone ribbon and draws the glycosidic bond to C1'
              viewer.setStyle(
                { chain: ch, predicate: (atom: any) => Boolean(atom._isNucleic && atom._isNucleicSugar) },
                { stick: { radius: 0.08, color: strandColor } }
              );
            });
          } else {
            viewer.setStyle(
              { predicate: (atom: any) => Boolean(atom._isNucleic && atom._isNucleicBackbone) },
              { cartoon: { ribbon: true, thickness: 0.3, color: NUCLEIC_STRAND_COLORS[0] } }
            );
            viewer.setStyle(
              { predicate: (atom: any) => Boolean(atom._isNucleic && atom._isNucleicSugar) },
              { stick: { radius: 0.08, color: NUCLEIC_STRAND_COLORS[0] } }
            );
          }

          // Bases: sticks (radius 0.16) coloured by base type, attached to C1' of sugar
          viewer.setStyle(
            { predicate: (atom: any) => Boolean(atom._isNucleic && atom._isNucleicBase) },
            { stick: { radius: 0.16, colorfunc: (atom: any) => getBaseColor(atom.resn) } }
          );

          // Draw real base pairs as ladder rungs (Requirement 2)
          if (meta.basePairs && meta.basePairs.length > 0) {
            meta.basePairs.forEach((pair) => {
              const mid = {
                x: (pair.c1A.x + pair.c1B.x) / 2,
                y: (pair.c1A.y + pair.c1B.y) / 2,
                z: (pair.c1A.z + pair.c1B.z) / 2,
              };
              const col1 = getBaseColor(pair.res1Resn);
              const col2 = getBaseColor(pair.res2Resn);

              // Two half-rungs meeting in the middle: each starts at C1' of its nucleotide and ends at midpoint
              viewer.addCylinder({
                start: pair.c1A,
                end: mid,
                radius: 0.18,
                color: col1,
                fromCap: 2,
                toCap: 0,
              });
              viewer.addCylinder({
                start: mid,
                end: pair.c1B,
                radius: 0.18,
                color: col2,
                fromCap: 0,
                toCap: 2,
              });
            });
          } else if (meta.nucleicChains.length > 1) {
            // Fallback (Requirement 4): if pair detection fails for double-stranded nucleic acid,
            // fall back to 3Dmol's native cartoon ladder coloured by strand
            meta.nucleicChains.forEach((ch, idx) => {
              const strandColor = NUCLEIC_STRAND_COLORS[idx % NUCLEIC_STRAND_COLORS.length];
              viewer.setStyle(
                {
                  chain: ch,
                  predicate: (atom: any) => {
                    const name = (atom.atom || '').trim().toUpperCase();
                    return atom._isNucleic && (name === 'N1' || name === 'N3');
                  },
                },
                { cartoon: { thickness: 0.3, color: strandColor } }
              );
            });
          }
        } else if (style === 'stick') {
          // 'stick' mode: connected nucleotide drawing (sugar + base)
          if (meta.nucleicChains.length > 0) {
            meta.nucleicChains.forEach((ch, idx) => {
              const strandColor = NUCLEIC_STRAND_COLORS[idx % NUCLEIC_STRAND_COLORS.length];
              viewer.setStyle(
                { chain: ch, predicate: (atom: any) => Boolean(atom._isNucleic && atom._isNucleicBackbone) },
                { stick: { radius: 0.14, color: strandColor } }
              );
              viewer.setStyle(
                { chain: ch, predicate: (atom: any) => Boolean(atom._isNucleic && atom._isNucleicSugar) },
                { stick: { radius: 0.12, color: strandColor } }
              );
            });
          } else {
            viewer.setStyle(
              { predicate: (atom: any) => Boolean(atom._isNucleic && (atom._isNucleicBackbone || atom._isNucleicSugar)) },
              { stick: { radius: 0.14, color: NUCLEIC_STRAND_COLORS[0] } }
            );
          }
          viewer.setStyle(
            { predicate: (atom: any) => Boolean(atom._isNucleic && atom._isNucleicBase) },
            { stick: { radius: 0.2, colorfunc: (atom: any) => getBaseColor(atom.resn) } }
          );
        } else if (style === 'sphere') {
          // 'sphere' mode: small spheres coloured by base type for bases only, elements for backbone/sugar
          viewer.setStyle(
            { predicate: (atom: any) => Boolean(atom._isNucleic && atom._isNucleicBase) },
            { sphere: { scale: 0.45, colorfunc: (atom: any) => getBaseColor(atom.resn) } }
          );
          viewer.setStyle(
            { predicate: (atom: any) => Boolean(atom._isNucleic && !atom._isNucleicBase) },
            { sphere: { scale: 0.7, colorscheme: 'Jmol' } }
          );
        } else if (style === 'surface') {
          // Under-surface scaffold for nucleic acid
          if (meta.nucleicChains.length > 0) {
            meta.nucleicChains.forEach((ch, idx) => {
              const strandColor = NUCLEIC_STRAND_COLORS[idx % NUCLEIC_STRAND_COLORS.length];
              viewer.setStyle(
                { chain: ch, predicate: (atom: any) => Boolean(atom._isNucleic && atom._isNucleicBackbone) },
                { cartoon: { ribbon: true, thickness: 0.3, color: strandColor, opacity: 0.6 } }
              );
              viewer.setStyle(
                { chain: ch, predicate: (atom: any) => Boolean(atom._isNucleic && atom._isNucleicSugar) },
                { stick: { radius: 0.08, color: strandColor, opacity: 0.6 } }
              );
            });
          } else {
            viewer.setStyle(
              { predicate: (atom: any) => Boolean(atom._isNucleic && atom._isNucleicBackbone) },
              { cartoon: { ribbon: true, thickness: 0.3, color: NUCLEIC_STRAND_COLORS[0], opacity: 0.6 } }
            );
            viewer.setStyle(
              { predicate: (atom: any) => Boolean(atom._isNucleic && atom._isNucleicSugar) },
              { stick: { radius: 0.08, color: NUCLEIC_STRAND_COLORS[0], opacity: 0.6 } }
            );
          }
          viewer.setStyle(
            { predicate: (atom: any) => Boolean(atom._isNucleic && atom._isNucleicBase) },
            { stick: { radius: 0.16, colorfunc: (atom: any) => getBaseColor(atom.resn), opacity: 0.6 } }
          );
        }
      }

      // 5. Protein
      if (meta.hasProtein) {
        if (style === 'cartoon') {
          if (color === 'plddt') {
            viewer.setStyle(
              { predicate: (atom: any) => Boolean(atom._isProtein) },
              { cartoon: { colorfunc: plddtColorFunc, thickness: 0.4 } }
            );
          } else if (color === 'spectrum') {
            viewer.setStyle(
              { predicate: (atom: any) => Boolean(atom._isProtein) },
              { cartoon: { color: 'spectrum', thickness: 0.4 } }
            );
          } else if (color === 'chain') {
            if (meta.proteinChains.length > 0) {
              meta.proteinChains.forEach((ch, idx) => {
                const protCol = PROTEIN_CHAIN_COLORS[idx % PROTEIN_CHAIN_COLORS.length];
                viewer.setStyle(
                  { chain: ch, predicate: (atom: any) => Boolean(atom._isProtein) },
                  { cartoon: { color: protCol, thickness: 0.4 } }
                );
              });
            } else {
              viewer.setStyle(
                { predicate: (atom: any) => Boolean(atom._isProtein) },
                { cartoon: { color: PROTEIN_CHAIN_COLORS[0], thickness: 0.4 } }
              );
            }
          } else if (color === 'bfactor') {
            viewer.setStyle(
              { predicate: (atom: any) => Boolean(atom._isProtein) },
              { cartoon: { colorfunc: bfactorColorFunc, thickness: 0.4 } }
            );
          } else {
            // secondary structure (pyMol scheme)
            viewer.setStyle(
              { predicate: (atom: any) => Boolean(atom._isProtein) },
              { cartoon: { colorscheme: 'ssPyMOL', thickness: 0.4 } }
            );
          }
        } else if (style === 'stick') {
          // Element colours for protein
          viewer.setStyle(
            { predicate: (atom: any) => Boolean(atom._isProtein) },
            { stick: { radius: 0.2, colorscheme: 'Jmol' } }
          );
        } else if (style === 'sphere') {
          // Element colours for protein
          viewer.setStyle(
            { predicate: (atom: any) => Boolean(atom._isProtein) },
            { sphere: { scale: 0.8, colorscheme: 'Jmol' } }
          );
        } else if (style === 'surface') {
          viewer.setStyle(
            { predicate: (atom: any) => Boolean(atom._isProtein) },
            { cartoon: { color: '#38bdf8', opacity: 0.5 } }
          );
        }
      }

      // 6. Surface generation (Requirement 5)
      if (style === 'surface') {
        if (meta.hasProtein) {
          // Translucent cyan/blue surface for protein
          viewer.addSurface('MS', { opacity: 0.65, color: '#0ea5e9' }, { predicate: (atom: any) => Boolean(atom._isProtein) });
        }
        if (meta.hasNucleic) {
          // Separate contrasting amber surface for nucleic acid
          viewer.addSurface('MS', { opacity: 0.75, color: '#f59e0b' }, { predicate: (atom: any) => Boolean(atom._isNucleic) });
        }
        if (!meta.hasProtein && !meta.hasNucleic) {
          viewer.addSurface('MS', { opacity: 0.75, color: '#0ea5e9' });
        }
      }

      viewer.render();
    } catch (err) {
      console.warn('[BioscienceView] Style application note:', err);
    }
  }, []);

  // Initialize or render 3Dmol viewer
  const render3DStructure = useCallback(async (target: BioscienceTarget) => {
    if (!viewerContainerRef.current) return;

    // Check WebGL availability
    if (!isWebGLSupported()) {
      const extLink = getTargetExternalLink(target);
      setViewerError({
        type: 'webgl_unavailable',
        message: 'WebGL is not supported or hardware acceleration is disabled in your browser. 3D molecular visualization requires WebGL support.',
        externalUrl: extLink?.url,
        externalLabel: extLink?.label,
      });
      setViewerLoading(false);
      return;
    }

    setViewerLoading(true);
    setViewerError(null);

    // Cancel any previous in-flight fetch to prevent race conditions
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    activeAbortControllerRef.current = controller;
    currentLoadingTargetIdRef.current = target.id;

    try {
      const $3Dmol = await import('3dmol');

      if (controller.signal.aborted || currentLoadingTargetIdRef.current !== target.id) {
        return;
      }

      if (viewer3DRef.current) {
        try {
          viewer3DRef.current.clear();
        } catch {}
      } else {
        const bg = canvasBgDark ? '#050b18' : '#f8fafc';
        viewer3DRef.current = $3Dmol.createViewer(viewerContainerRef.current, {
          defaultcolors: $3Dmol.rasmolElementColors,
          backgroundColor: bg,
        });
      }

      const viewer = viewer3DRef.current;
      viewer.setBackgroundColor(canvasBgDark ? '#050b18' : '#f8fafc');
      viewer.clear();

      const cacheKey = getTargetCacheKey(target);

      // Check in-memory cache first: instant render without network
      const cached = structureDataCache.get(cacheKey);
      if (cached) {
        setStructureSource(cached.source);
        viewer.addModel(cached.data, cached.format);
        if (cached.format === 'sdf') {
          setStructureMeta(null);
          currentStructureMetaRef.current = null;
          viewer.setStyle({}, {
            stick: { radius: 0.22, colorscheme: 'Jmol' },
            sphere: { scale: 0.28, colorscheme: 'Jmol' }
          });
        } else {
          const meta = analyzeStructure(viewer);
          currentStructureMetaRef.current = meta;
          setStructureMeta(meta);

          let effectiveColor = colorScheme;
          if (cached.source === 'rcsb' && colorScheme === 'plddt') {
            effectiveColor = 'chain';
            setColorScheme('chain');
          }
          applyViewerStyle(viewer, renderStyle, effectiveColor, meta);
        }
        try {
          viewer.setClickable({}, true, (atom: any) => {
            if (!atom) return;
            setInspectedAtom({
              chain: String(atom.chain || 'A'),
              resi: Number(atom.resi || 0),
              resn: String(atom.resn || '').trim(),
              atom: String(atom.atom || '').trim(),
              elem: String(atom.elem || '').trim().toUpperCase(),
              b: typeof atom.b === 'number' ? Number(atom.b.toFixed(2)) : undefined,
              x: typeof atom.x === 'number' ? Number(atom.x.toFixed(2)) : undefined,
              y: typeof atom.y === 'number' ? Number(atom.y.toFixed(2)) : undefined,
              z: typeof atom.z === 'number' ? Number(atom.z.toFixed(2)) : undefined,
            });
          });
        } catch {}
        viewer.zoomTo();
        viewer.render();
        setViewerLoading(false);
        return;
      }

      let structureLoaded = false;
      let lastError: any = null;
      let isNotFound = false;

      // 1. If target is a small molecule with PubChem CID, fetch 3D SDF conformer
      if (target.pubchemCid) {
        const sdfUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${target.pubchemCid}/SDF?record_type=3d`;
        try {
          const res = await fetchWithTimeout(sdfUrl, controller.signal, 15000);
          if (res.status === 404) {
            isNotFound = true;
            throw new Error(`3D conformer not found (HTTP 404) on PubChem for CID ${target.pubchemCid}`);
          }
          if (!res.ok) {
            throw new Error(`PubChem returned HTTP ${res.status}`);
          }
          const sdfData = await res.text();
          if (controller.signal.aborted || currentLoadingTargetIdRef.current !== target.id) return;

          structureDataCache.set(cacheKey, { format: 'sdf', data: sdfData, source: 'pubchem' });
          setStructureSource('pubchem');
          setStructureMeta(null);
          currentStructureMetaRef.current = null;
          viewer.addModel(sdfData, 'sdf');
          viewer.setStyle({}, {
            stick: { radius: 0.22, colorscheme: 'Jmol' },
            sphere: { scale: 0.28, colorscheme: 'Jmol' }
          });
          viewer.zoomTo();
          viewer.render();
          structureLoaded = true;
        } catch (cidErr: any) {
          if (controller.signal.aborted) return;
          console.warn(`[BioscienceView] PubChem 3D conformer fetch error for CID ${target.pubchemCid}:`, cidErr?.message || cidErr);
          lastError = cidErr;
        }
      }

      // If predicted_alphafold is preferred and uniprotId is present, resolve AlphaFold DB first
      const preferAlphaFold = target.provenance === 'predicted_alphafold' && Boolean(target.uniprotId);

      if (!structureLoaded && preferAlphaFold && target.uniprotId) {
        const uniprot = target.uniprotId.toUpperCase().trim();
        const predApiUrl = `https://alphafold.ebi.ac.uk/api/prediction/${uniprot}`;
        try {
          const metaRes = await fetchWithTimeout(predApiUrl, controller.signal, 15000);
          if (metaRes.status === 404) {
            isNotFound = true;
            throw new Error(`AlphaFold prediction not found (HTTP 404) for UniProt ${uniprot}`);
          }
          if (!metaRes.ok) {
            throw new Error(`AlphaFold prediction API returned HTTP ${metaRes.status}`);
          }
          const meta = await metaRes.json();
          const cifUrl = meta?.[0]?.cifUrl;
          if (!cifUrl || typeof cifUrl !== 'string') {
            isNotFound = true;
            throw new Error(`No AlphaFold structure CIF URL returned for UniProt ${uniprot}`);
          }

          const cifRes = await fetchWithTimeout(cifUrl, controller.signal, 15000);
          if (cifRes.status === 404) {
            isNotFound = true;
            throw new Error(`AlphaFold CIF coordinate file not found (HTTP 404) at ${cifUrl}`);
          }
          if (!cifRes.ok) {
            throw new Error(`Failed to download AlphaFold CIF file (HTTP ${cifRes.status})`);
          }

          const cifData = await cifRes.text();
          if (controller.signal.aborted || currentLoadingTargetIdRef.current !== target.id) return;

          structureDataCache.set(cacheKey, { format: 'cif', data: cifData, source: 'alphafold' });
          setStructureSource('alphafold');
          viewer.addModel(cifData, 'cif');

          const sMeta = analyzeStructure(viewer);
          currentStructureMetaRef.current = sMeta;
          setStructureMeta(sMeta);

          applyViewerStyle(viewer, renderStyle, colorScheme, sMeta);
          viewer.zoomTo();
          viewer.render();
          structureLoaded = true;
        } catch (afErr: any) {
          if (controller.signal.aborted) return;
          console.warn(`[BioscienceView] AlphaFold prediction fetch error for ${uniprot}:`, afErr?.message || afErr);
          lastError = afErr;
        }
      }

      // 2. RCSB PDB mmCIF coordinate
      if (!structureLoaded && target.pdbId) {
        const pdbId = target.pdbId.toUpperCase().trim();
        const cifUrl = `https://files.rcsb.org/download/${pdbId}.cif`;
        try {
          const res = await fetchWithTimeout(cifUrl, controller.signal, 15000);
          if (res.status === 404) {
            isNotFound = true;
            throw new Error(`Structure coordinate not found (HTTP 404) in RCSB PDB for ${pdbId}`);
          }
          if (!res.ok) {
            throw new Error(`RCSB PDB returned HTTP ${res.status}`);
          }
          const cifData = await res.text();
          if (controller.signal.aborted || currentLoadingTargetIdRef.current !== target.id) return;

          structureDataCache.set(cacheKey, { format: 'cif', data: cifData, source: 'rcsb' });
          setStructureSource('rcsb');
          viewer.addModel(cifData, 'cif');

          const sMeta = analyzeStructure(viewer);
          currentStructureMetaRef.current = sMeta;
          setStructureMeta(sMeta);

          let effectiveColor = colorScheme;
          if (colorScheme === 'plddt') {
            effectiveColor = 'chain';
            setColorScheme('chain');
          }

          applyViewerStyle(viewer, renderStyle, effectiveColor, sMeta);
          viewer.zoomTo();
          viewer.render();
          structureLoaded = true;
        } catch (pdbErr: any) {
          if (controller.signal.aborted) return;
          console.warn(`[BioscienceView] RCSB mmCIF fetch error for PDB ${pdbId}:`, pdbErr?.message || pdbErr);
          lastError = pdbErr;
        }
      }

      // 3. Fallback to AlphaFold if not preferred initially and PDB was not loaded
      if (!structureLoaded && !preferAlphaFold && target.uniprotId) {
        const uniprot = target.uniprotId.toUpperCase().trim();
        const predApiUrl = `https://alphafold.ebi.ac.uk/api/prediction/${uniprot}`;
        try {
          const metaRes = await fetchWithTimeout(predApiUrl, controller.signal, 15000);
          if (metaRes.status === 404) {
            isNotFound = true;
            throw new Error(`AlphaFold prediction not found (HTTP 404) for UniProt ${uniprot}`);
          }
          if (!metaRes.ok) {
            throw new Error(`AlphaFold prediction API returned HTTP ${metaRes.status}`);
          }
          const meta = await metaRes.json();
          const cifUrl = meta?.[0]?.cifUrl;
          if (!cifUrl || typeof cifUrl !== 'string') {
            isNotFound = true;
            throw new Error(`No AlphaFold structure CIF URL returned for UniProt ${uniprot}`);
          }

          const cifRes = await fetchWithTimeout(cifUrl, controller.signal, 15000);
          if (cifRes.status === 404) {
            isNotFound = true;
            throw new Error(`AlphaFold CIF coordinate file not found (HTTP 404) at ${cifUrl}`);
          }
          if (!cifRes.ok) {
            throw new Error(`Failed to download AlphaFold CIF file (HTTP ${cifRes.status})`);
          }

          const cifData = await cifRes.text();
          if (controller.signal.aborted || currentLoadingTargetIdRef.current !== target.id) return;

          structureDataCache.set(cacheKey, { format: 'cif', data: cifData, source: 'alphafold' });
          setStructureSource('alphafold');
          viewer.addModel(cifData, 'cif');

          const sMeta = analyzeStructure(viewer);
          currentStructureMetaRef.current = sMeta;
          setStructureMeta(sMeta);

          applyViewerStyle(viewer, renderStyle, colorScheme, sMeta);
          viewer.zoomTo();
          viewer.render();
          structureLoaded = true;
        } catch (afErr: any) {
          if (controller.signal.aborted) return;
          console.warn(`[BioscienceView] AlphaFold prediction fetch error for ${uniprot}:`, afErr?.message || afErr);
          lastError = afErr;
        }
      }

      if (structureLoaded && viewer3DRef.current) {
        try {
          viewer3DRef.current.setClickable({}, true, (atom: any) => {
            if (!atom) return;
            setInspectedAtom({
              chain: String(atom.chain || 'A'),
              resi: Number(atom.resi || 0),
              resn: String(atom.resn || '').trim(),
              atom: String(atom.atom || '').trim(),
              elem: String(atom.elem || '').trim().toUpperCase(),
              b: typeof atom.b === 'number' ? Number(atom.b.toFixed(2)) : undefined,
              x: typeof atom.x === 'number' ? Number(atom.x.toFixed(2)) : undefined,
              y: typeof atom.y === 'number' ? Number(atom.y.toFixed(2)) : undefined,
              z: typeof atom.z === 'number' ? Number(atom.z.toFixed(2)) : undefined,
            });
          });
        } catch {}
      }

      if (!structureLoaded) {
        if (controller.signal.aborted || currentLoadingTargetIdRef.current !== target.id) return;
        const extLink = getTargetExternalLink(target);
        const errType = classifyError(lastError, isNotFound);
        let msg = '';
        if (errType === 'not_found') {
          msg = `Structure not found (HTTP 404) for ${target.geneOrSymbol || target.name}. Coordinates are not available in the public archive.`;
        } else if (errType === 'network_blocked') {
          msg = `Network or security policy blocked downloading 3D coordinates for ${target.geneOrSymbol || target.name}. Check your connection or Content-Security-Policy.`;
        } else {
          msg = lastError?.message || `Unable to download 3D coordinates for ${target.geneOrSymbol || target.name}.`;
        }

        setViewerError({
          type: errType,
          message: msg,
          externalUrl: extLink?.url,
          externalLabel: extLink?.label,
        });
      }
    } catch (err: any) {
      if (controller.signal.aborted || currentLoadingTargetIdRef.current !== target.id) return;
      console.error('[BioscienceView] 3Dmol render error:', err);
      const extLink = getTargetExternalLink(target);
      const isWebGL = err?.message?.toLowerCase().includes('webgl') || !isWebGLSupported();
      setViewerError({
        type: isWebGL ? 'webgl_unavailable' : 'generic',
        message: isWebGL
          ? 'WebGL is not supported or hardware acceleration is disabled in your browser. 3D rendering requires WebGL.'
          : (err?.message || 'Unable to initialize WebGL 3Dmol viewer.'),
        externalUrl: extLink?.url,
        externalLabel: extLink?.label,
      });
    } finally {
      if (currentLoadingTargetIdRef.current === target.id) {
        setViewerLoading(false);
      }
    }
  }, [canvasBgDark, renderStyle, colorScheme, applyViewerStyle]);

  // Re-render when selected target changes
  useEffect(() => {
    render3DStructure(selectedTarget);
    if (selectedTarget.smiles) {
      renderSmiles(selectedTarget.smiles);
    }
  }, [selectedTarget, render3DStructure, renderSmiles]);

  // Handle spin toggle
  useEffect(() => {
    if (!viewer3DRef.current) return;
    if (isSpinning) {
      viewer3DRef.current.spin('y', 1.0);
    } else {
      viewer3DRef.current.spin(false);
    }
  }, [isSpinning]);

  // Handle camera reset
  const handleResetCamera = () => {
    if (viewer3DRef.current) {
      viewer3DRef.current.zoomTo();
      viewer3DRef.current.render();
      playSoftClick();
    }
  };

  // Handle zoom in/out
  const handleZoom = (factor: number) => {
    if (viewer3DRef.current) {
      viewer3DRef.current.zoom(factor);
      viewer3DRef.current.render();
      playSoftClick();
    }
  };

  // Handle Quick Target Selection
  const handleSelectTarget = (target: BioscienceTarget) => {
    playSoftClick();
    setSelectedTarget(target);
    setSearchQuery(target.geneOrSymbol || target.name);
  };

  // Custom Search handler (search UniProt, PDB, or PubChem)
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    playSoftClick();

    // Check presets first
    const match = PRESET_TARGETS.find(
      (t) =>
        t.geneOrSymbol.toLowerCase() === q.toLowerCase() ||
        t.name.toLowerCase().includes(q.toLowerCase()) ||
        t.uniprotId?.toLowerCase() === q.toLowerCase() ||
        t.pdbId?.toLowerCase() === q.toLowerCase()
    );

    if (match) {
      setSelectedTarget(match);
      return;
    }

    setCustomLoading(true);
    try {
      // If 4 alphanumeric, try RCSB PDB
      if (/^[0-9][a-zA-Z0-9]{3}$/.test(q)) {
        const pdbId = q.toUpperCase();
        const pdbRes = await fetch(`https://data.rcsb.org/rest/v1/core/entry/${pdbId.toLowerCase()}`, {
          signal: AbortSignal.timeout(15000),
        });
        if (pdbRes.ok) {
          const pdbData = await pdbRes.json();
          const customTarget: BioscienceTarget = {
            id: pdbId.toLowerCase(),
            name: pdbData?.struct?.title || `PDB Entry ${pdbId}`,
            geneOrSymbol: pdbId,
            category: 'protein',
            pdbId,
            organism: pdbData?.rcsb_entry_info?.polymer_entity_count_protein ? 'Macromolecular Complex' : 'Biopolymer',
            functionSummary: pdbData?.struct?.title || `Experimentally determined 3D structure archived in the RCSB Protein Data Bank under ID ${pdbId}.`,
            provenance: 'experimental_pdb',
            experimentalMethod: pdbData?.rcsb_entry_info?.experimental_method?.[0] || 'X-ray Crystallography',
            resolution: pdbData?.rcsb_entry_info?.resolution_combined?.[0] ? `${pdbData.rcsb_entry_info.resolution_combined[0]} Å` : 'N/A',
          };
          setSelectedTarget(customTarget);
          setCustomLoading(false);
          return;
        }
      }

      // If UniProt accession format, try AlphaFold DB
      if (/^([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2})$/i.test(q)) {
        const uniprotId = q.toUpperCase();
        try {
          const afRes = await fetch(`https://alphafold.ebi.ac.uk/api/prediction/${uniprotId}`, {
            signal: AbortSignal.timeout(15000),
          });
          if (afRes.ok) {
            const afData = await afRes.json();
            const primary = afData?.[0];
            if (primary) {
              const customTarget: BioscienceTarget = {
                id: `af-${uniprotId.toLowerCase()}`,
                name: primary.gene ? `${primary.gene} (UniProt ${uniprotId})` : `AlphaFold Entry ${uniprotId}`,
                geneOrSymbol: primary.gene || uniprotId,
                category: 'protein',
                uniprotId,
                organism: primary.organismScientificName || 'Homo sapiens',
                functionSummary: `AlphaFold structure prediction for UniProt accession ${uniprotId}. Mean pLDDT confidence: ${typeof primary.globalMetricValue === 'number' ? primary.globalMetricValue.toFixed(1) : 'N/A'}.`,
                provenance: 'predicted_alphafold',
                experimentalMethod: 'AlphaFold DB Prediction',
                resolution: 'pLDDT High-Confidence',
                alphafoldPlddtAvg: primary.globalMetricValue,
              };
              setSelectedTarget(customTarget);
              setCustomLoading(false);
              return;
            }
          }
        } catch (afErr) {
          console.warn('[BioscienceView] UniProt search note:', afErr);
        }
      }

      // Try PubChem via local compound API proxy
      const pcRes = await fetch(`/api/science/compound?name=${encodeURIComponent(q)}`);
      if (pcRes.ok) {
        const pcData = await pcRes.json();
        const props = pcData?.properties || {};
        const cid = pcData?.cid;
        const mw = parseFloat(props.MolecularWeight || '0');
        const logp = parseFloat(props.XLogP || '0');
        const hbd = parseInt(props.HBondDonorCount || '0', 10);
        const hba = parseInt(props.HBondAcceptorCount || '0', 10);

        const customTarget: BioscienceTarget = {
          id: `pc-${cid}`,
          name: q.charAt(0).toUpperCase() + q.slice(1),
          geneOrSymbol: props.MolecularFormula || q.toUpperCase(),
          category: 'drug',
          pubchemCid: cid,
          smiles: props.CanonicalSMILES || '',
          formula: props.MolecularFormula || '',
          molecularWeight: mw,
          functionSummary: `Chemical compound resolved in PubChem PUG REST database (CID ${cid}, InChIKey ${props.InChIKey || 'N/A'}).`,
          provenance: 'curated_pubchem',
          lipinski: {
            mwPass: mw <= 500,
            logP: logp,
            logPPass: logp <= 5.0,
            hbd,
            hbdPass: hbd <= 5,
            hba,
            hbaPass: hba <= 10,
            compliant: mw <= 500 && logp <= 5.0 && hbd <= 5 && hba <= 10
          }
        };
        setSelectedTarget(customTarget);
        setCustomLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Dynamic query warning:', err);
    } finally {
      setCustomLoading(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#know`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    playSuccessChime();
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className={`space-y-6 ${isStandaloneFullscreen ? 'fixed inset-0 z-50 bg-[#020816] p-4 sm:p-8 overflow-y-auto' : ''}`}>
      {/* Top Banner & Science Skills Colophon */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#061834] via-[#041226] to-[#020816] border border-cyan-500/30 p-6 sm:p-8 shadow-2xl shadow-cyan-950/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                <Dna className="w-3.5 h-3.5 text-emerald-400" />
                Google DeepMind Science Skills Suite
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono bg-blue-950/60 border border-blue-500/30 text-blue-300">
                AlphaFold DB &bull; RCSB PDB &bull; PubChem &bull; UniProtKB
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Bioscience &amp; Molecular Biology Workbench
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Explore 3D macromolecular protein predictions, experimental X-ray/Cryo-EM structures, per-residue AlphaFold pLDDT confidence gradients, and Lipinski drug-likeness rules with zero-install WebGL.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-center">
            {onToggleFullscreen && (
              <button
                type="button"
                onClick={onToggleFullscreen}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-900/80 border border-cyan-900/60 text-slate-200 hover:text-white hover:border-cyan-400 text-xs font-mono transition"
                title={isStandaloneFullscreen ? 'Exit Fullscreen' : 'Expand Workbench'}
              >
                {isStandaloneFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                <span>{isStandaloneFullscreen ? 'Exit Fullscreen' : 'Standalone View'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-cyan-950/80 border border-cyan-600/50 text-cyan-300 hover:bg-cyan-900 text-xs font-mono font-bold transition"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied' : 'Share Workbench'}</span>
            </button>
          </div>
        </div>

        {/* Top Quick-Try Example Chip Bar (Mandatory Section 3.2 in SKILL.md) */}
        <div className="mt-6 pt-5 border-t border-cyan-950/80">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-mono text-cyan-400/90 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Quick-Try Benchmark Targets:
            </span>
            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
              Pre-loaded experimental PDB, AlphaFold predictions &amp; drugs
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {PRESET_TARGETS.map((target) => {
              const isSelected = selectedTarget.id === target.id;
              return (
                <button
                  key={target.id}
                  type="button"
                  onClick={() => handleSelectTarget(target)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all duration-200 active:scale-95 ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                      : 'bg-[#08152b] text-slate-300 hover:text-white hover:bg-[#0c1f3d] border border-cyan-900/60'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    target.category === 'protein' ? 'bg-cyan-400' : 'bg-amber-400'
                  }`} />
                  <span>{target.geneOrSymbol}</span>
                  <span className="text-[10px] opacity-75 hidden md:inline">({target.category})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Target Search and Resolver */}
      <div className="bg-[#061224]/80 border border-cyan-900/50 rounded-2xl p-4 shadow-xl">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Query Gene symbol, UniProt ID (P04637), PDB (1TUP), or Compound (Aspirin, Caffeine)..."
              className="w-full bg-[#030914] border border-cyan-900/80 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 font-mono"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="submit"
              disabled={customLoading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 min-h-[42px] rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs font-mono uppercase tracking-wider transition active:scale-95 disabled:opacity-50"
            >
              {customLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Resolve</span>
            </button>

            {onAskAI && (
              <button
                type="button"
                onClick={() => onAskAI(`Explain the molecular architecture and biochemical role of ${selectedTarget.name} (${selectedTarget.geneOrSymbol}).`)}
                className="flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-200 hover:text-white hover:bg-purple-900 text-xs font-mono font-bold transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Ask AI</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Main Multi-Pane Workbench (Section 3.2 in SKILL.md) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane (7 Cols): 3Dmol WebGL Viewer & 2D Canvas */}
        <div className="lg:col-span-7 bg-[#051124] border border-cyan-900/60 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
          {/* Viewport Header Controls */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-cyan-950">
            <div className="flex items-center gap-2.5">
              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider ${
                selectedTarget.category === 'protein'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                {selectedTarget.category === 'protein' ? '3D Macromolecule' : '3D Chemical Conformer'}
              </span>
              <span className="text-xs font-mono text-slate-300 font-bold truncate max-w-[200px] sm:max-w-[320px]">
                {selectedTarget.name}
              </span>
            </div>

            {/* Quick View Controls */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setIsSpinning((prev) => !prev)}
                className={`p-2 rounded-xl border transition ${
                  isSpinning
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                    : 'bg-slate-900/80 text-slate-300 border-cyan-950 hover:text-white'
                }`}
                title={isSpinning ? 'Pause Rotation' : 'Auto-Rotate'}
              >
                <RotateCw className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => handleZoom(1.2)}
                className="p-2 rounded-xl bg-slate-900/80 border border-cyan-950 text-slate-300 hover:text-white transition"
                title="Zoom In"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => handleZoom(0.8)}
                className="p-2 rounded-xl bg-slate-900/80 border border-cyan-950 text-slate-300 hover:text-white transition"
                title="Zoom Out"
              >
                -
              </button>
              <button
                type="button"
                onClick={handleResetCamera}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-cyan-950 text-slate-300 hover:text-white text-[11px] transition"
                title="Reset Camera"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setCanvasBgDark((prev) => !prev)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-cyan-950 text-slate-300 hover:text-white text-[11px] transition"
                title="Toggle Dark/Light Viewport"
              >
                {canvasBgDark ? 'Dark' : 'Light'}
              </button>
            </div>
          </div>

          {/* WebGL 3Dmol Container */}
          <div className="relative w-full h-[400px] sm:h-[480px] rounded-2xl overflow-hidden border border-cyan-950 bg-[#050b18]">
            <div
              ref={viewerContainerRef}
              className="w-full h-full cursor-grab active:cursor-grabbing"
              style={{ position: 'relative' }}
            />

            {viewerLoading && (
              <div className="absolute inset-0 bg-[#050b18]/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20">
                <div className="w-10 h-10 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
                <span className="text-xs font-mono text-cyan-300 font-bold">
                  Loading 3D Molecular Coordinates...
                </span>
              </div>
            )}

            {viewerError && (
              <div className="absolute inset-x-3 bottom-3 p-4 rounded-2xl bg-[#09152b]/95 border border-cyan-500/40 text-xs font-mono text-slate-200 shadow-2xl backdrop-blur-md z-30 flex flex-col gap-3">
                <div className="flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    viewerError.type === 'not_found'
                      ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                      : viewerError.type === 'webgl_unavailable'
                      ? 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                      : 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60'
                  }`}>
                    {viewerError.type === 'not_found' ? (
                      <HelpCircle className="w-4 h-4" />
                    ) : viewerError.type === 'webgl_unavailable' ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="font-bold text-white flex items-center justify-between">
                      <span>
                        {viewerError.type === 'not_found'
                          ? 'Structure Not Found (HTTP 404)'
                          : viewerError.type === 'webgl_unavailable'
                          ? 'WebGL Context Unavailable'
                          : viewerError.type === 'network_blocked'
                          ? 'Network or Security Policy Blocked'
                          : 'Structure Loading Notice'}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {viewerError.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-cyan-950/80 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      playSoftClick();
                      render3DStructure(selectedTarget);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry</span>
                  </button>

                  {viewerError.externalUrl && (
                    <a
                      href={viewerError.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-800/60 text-cyan-300 hover:text-white text-xs font-semibold transition"
                    >
                      <span>{viewerError.externalLabel || 'Open Source Entry'}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* In-Canvas Overlays Container (Requirement 5: top: 12px, left/right: 12px, pointer-events none, wrapping cleanly) */}
            <div className="absolute top-[12px] left-[12px] right-[12px] flex flex-wrap items-start justify-between gap-2 pointer-events-none z-10">
              <div className="px-2.5 py-1 rounded-lg bg-slate-950/90 border border-cyan-900/60 text-[10px] font-mono text-cyan-300 shadow backdrop-blur-sm shrink-0">
                {selectedTarget.pdbId ? `PDB: ${selectedTarget.pdbId}` : `AFDB: ${selectedTarget.uniprotId || 'SMILES'}`}
              </div>

              {structureMeta && (structureMeta.hasProtein || structureMeta.hasNucleic) && (
                <div className="flex flex-wrap items-center justify-end gap-1.5 max-w-full">
                  {structureMeta.hasProtein && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-950/90 border border-cyan-500/40 text-[10px] font-mono text-slate-200 backdrop-blur-sm shadow">
                      <span className="w-2 h-2 rounded-full bg-[#3b82f6] shrink-0" />
                      <span className="font-semibold">Protein</span>
                    </div>
                  )}

                  {structureMeta.hasNucleic && structureMeta.nucleicChains.map((chain, idx) => {
                    const strandCol = NUCLEIC_STRAND_COLORS[idx % NUCLEIC_STRAND_COLORS.length];
                    const typeLabel = structureMeta.nucleicType === 'RNA' ? 'RNA' : 'DNA';
                    return (
                      <div
                        key={chain}
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-950/90 border border-cyan-500/40 text-[10px] font-mono text-slate-200 backdrop-blur-sm shadow"
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: strandCol }} />
                        <span className="font-semibold">{typeLabel} strand {chain}</span>
                      </div>
                    );
                  })}

                  {structureMeta.hasNucleic && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-950/90 border border-cyan-500/40 text-[10px] font-mono text-slate-200 backdrop-blur-sm shadow">
                      <span className="font-semibold text-slate-300">Bases:</span>
                      <span className="flex items-center gap-0.5 text-emerald-400 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] inline-block mr-0.5" />A
                      </span>
                      {structureMeta.nucleicType === 'RNA' ? (
                        <span className="flex items-center gap-0.5 text-rose-400 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f87171] inline-block mr-0.5" />U
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-rose-400 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f87171] inline-block mr-0.5" />T
                        </span>
                      )}
                      <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] inline-block mr-0.5" />G
                      </span>
                      <span className="flex items-center gap-0.5 text-blue-400 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] inline-block mr-0.5" />C
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Style & Color Palette Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                Rendering Representation:
              </span>
              <div className="flex items-center gap-1.5">
                {(['cartoon', 'stick', 'sphere', 'surface'] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => {
                      setRenderStyle(style);
                      if (viewer3DRef.current) {
                        applyViewerStyle(viewer3DRef.current, style, colorScheme, currentStructureMetaRef.current);
                      }
                      playSoftClick();
                    }}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-mono capitalize transition ${
                      renderStyle === style
                        ? 'bg-cyan-500 text-slate-950 font-black'
                        : 'bg-slate-900 text-slate-400 border border-cyan-950 hover:text-white'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                Color Scheme:
              </span>
              <div className="flex items-center gap-1.5">
                {[
                  {
                    id: 'plddt' as ColorSchemeType,
                    label: 'pLDDT',
                    disabled: structureSource === 'rcsb',
                    tooltip: structureSource === 'rcsb' ? 'pLDDT is only available for AlphaFold predictions' : 'AlphaFold per-residue confidence (0-100)',
                  },
                  { id: 'spectrum' as ColorSchemeType, label: 'Spectrum', tooltip: 'Rainbow spectrum gradient' },
                  { id: 'chain' as ColorSchemeType, label: 'Chain', tooltip: 'Distinct hues for protein chains and nucleic strands' },
                  { id: 'secondary' as ColorSchemeType, label: 'Sec. Struct', tooltip: 'PyMOL secondary structure coloring' },
                  ...(structureSource === 'rcsb' ? [{ id: 'bfactor' as ColorSchemeType, label: 'B-Factor', tooltip: 'Crystallographic temperature factors' }] : []),
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={c.disabled}
                    title={c.tooltip}
                    onClick={() => {
                      if (c.disabled) return;
                      setColorScheme(c.id);
                      if (viewer3DRef.current) {
                        applyViewerStyle(viewer3DRef.current, renderStyle, c.id, currentStructureMetaRef.current);
                      }
                      playSoftClick();
                    }}
                    className={`flex-1 py-1.5 px-1.5 rounded-xl text-xs font-mono transition ${
                      c.disabled
                        ? 'opacity-35 cursor-not-allowed bg-slate-900/60 text-slate-500 border border-slate-900'
                        : colorScheme === c.id
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-sm shadow-cyan-500/20'
                        : 'bg-slate-900 text-slate-400 border border-cyan-950 hover:text-white'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Canonical Legend Area */}
          {structureSource === 'alphafold' && colorScheme === 'plddt' ? (
            <div className="p-3 rounded-2xl bg-[#030914] border border-cyan-950 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="font-bold text-slate-300">AlphaFold Per-Residue pLDDT Confidence Scale:</span>
                <span className="text-slate-400">0 &mdash; 100 Scale</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#0053D6]/20 border border-[#0053D6]/60 text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#0053D6] shrink-0" />
                  <span>&gt;90 Very High</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#65CBF3]/20 border border-[#65CBF3]/60 text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#65CBF3] shrink-0" />
                  <span>70-90 Confident</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#FFDB13]/20 border border-[#FFDB13]/60 text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#FFDB13] shrink-0 text-slate-950" />
                  <span>50-70 Low</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#FF7D45]/20 border border-[#FF7D45]/60 text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#FF7D45] shrink-0" />
                  <span>&lt;50 Disordered</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-[#030914] border border-cyan-950 space-y-2.5 text-xs font-mono">
              {/* Active Scheme Header & Chips */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-300">
                  {colorScheme === 'chain' && 'Active Scheme: Polymer Chain & Strand Coloring'}
                  {colorScheme === 'secondary' && 'Active Scheme: Secondary Structure (PyMOL Scheme)'}
                  {colorScheme === 'spectrum' && 'Active Scheme: Rainbow Spectrum (N- to C-Terminus)'}
                  {colorScheme === 'bfactor' && 'Active Scheme: Crystallographic Temperature Factor (B-Factor)'}
                  {colorScheme === 'plddt' && 'Active Scheme: Color Map'}
                </span>
                {colorScheme === 'bfactor' && structureMeta && (
                  <span className="text-[10px] text-slate-400">
                    Range: {structureMeta.minB.toFixed(1)} &mdash; {structureMeta.maxB.toFixed(1)} Å²
                  </span>
                )}
              </div>

              {/* Scheme Legend Elements */}
              {colorScheme === 'secondary' && (
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-950/40 border border-rose-500/40 text-slate-200">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#e11d48] shrink-0" />
                    <span>&alpha;-Helix</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-950/40 border border-amber-500/40 text-slate-200">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#eab308] shrink-0" />
                    <span>&beta;-Sheet</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-cyan-950/40 border border-cyan-500/40 text-slate-200">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#06b6d4] shrink-0" />
                    <span>Loop / Coil</span>
                  </div>
                </div>
              )}

              {colorScheme === 'spectrum' && (
                <div className="space-y-1">
                  <div className="h-3 w-full rounded-md bg-gradient-to-r from-[#3b82f6] via-[#06b6d4] via-[#22c55e] via-[#eab308] to-[#ef4444]" />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>N-Terminus (Blue)</span>
                    <span>Mid-Chain</span>
                    <span>C-Terminus (Red)</span>
                  </div>
                </div>
              )}

              {colorScheme === 'bfactor' && (
                <div className="space-y-1">
                  <div className="h-3 w-full rounded-md bg-gradient-to-r from-[#2563eb] via-[#06b6d4] via-[#10b981] via-[#f59e0b] to-[#ef4444]" />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Low B-factor / Rigid (Blue)</span>
                    <span>Average</span>
                    <span>High B-factor / Flexible (Red)</span>
                  </div>
                </div>
              )}

              {colorScheme === 'chain' && (
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  {structureMeta?.proteinChains.map((ch, idx) => (
                    <div key={`p-${ch}`} className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: PROTEIN_CHAIN_COLORS[idx % PROTEIN_CHAIN_COLORS.length] }}
                      />
                      <span>Protein Chain {ch}</span>
                    </div>
                  ))}
                  {structureMeta?.nucleicChains.map((ch, idx) => (
                    <div key={`n-${ch}`} className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: NUCLEIC_STRAND_COLORS[idx % NUCLEIC_STRAND_COLORS.length] }}
                      />
                      <span>{structureMeta.nucleicType} Strand {ch}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Macromolecular Key (Protein / DNA / RNA / Bases) */}
              <div className="pt-2 border-t border-cyan-950/80 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-400">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[9px]">Macromolecular Key:</span>
                {structureMeta?.hasProtein && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#3b82f6]" /> Protein Backbone
                  </span>
                )}
                {structureMeta?.hasNucleic && (
                  <>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#14a3c4]" /> {structureMeta.nucleicType} Strand
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" /> A
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f87171] ml-0.5" /> {structureMeta.nucleicType === 'RNA' ? 'U' : 'T'}
                      <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] ml-0.5" /> G
                      <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] ml-0.5" /> C (Base Rungs)
                    </span>
                  </>
                )}
                {structureMeta?.hasLigands && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-purple-400" /> Ligands (Sticks)
                  </span>
                )}
                {structureMeta?.hasIons && (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Ions (Spheres)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Pane (5 Cols): Synchronized Scientific Data Inspector */}
        <div className="lg:col-span-5 bg-[#051124] border border-cyan-900/60 rounded-3xl p-5 shadow-2xl space-y-5">
          {/* Inspector Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#030914] border border-cyan-950 text-xs font-mono">
            {[
              { id: 'structure3d', label: 'Structure' },
              { id: 'overview', label: 'Biology' },
              { id: 'sequence', label: 'Sequence' },
              { id: 'properties', label: 'Chemistry' },
              { id: 'literature', label: 'Citations' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveInspectorTab(tab.id as any);
                  playSoftClick();
                }}
                className={`flex-1 py-2 rounded-xl text-center font-bold transition ${
                  activeInspectorTab === tab.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Structure & Provenance */}
          {activeInspectorTab === 'structure3d' && (
            <div className="space-y-4 text-xs font-mono anim-slide-up">
              {/* Provenance Badge (Mandatory Section 3.2 in SKILL.md) */}
              <div className="p-3 rounded-2xl bg-[#06162f] border border-cyan-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-cyan-400 uppercase tracking-wider block font-bold">
                    Epistemic Provenance
                  </span>
                  <span className="font-bold text-slate-100">
                    {selectedTarget.provenance === 'experimental_pdb' && '🔬 Experimentally Determined (RCSB PDB)'}
                    {selectedTarget.provenance === 'predicted_alphafold' && '✦ AlphaFold DB Structure Prediction'}
                    {selectedTarget.provenance === 'curated_pubchem' && '⚗ PubChem Curated Chemical Record'}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700">
                  {selectedTarget.experimentalMethod || 'Computational'}
                </span>
              </div>

              {/* Resolution & Confidence Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#030914] border border-cyan-950">
                  <span className="text-[10px] text-slate-400 block">Experimental Resolution</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    {selectedTarget.resolution || 'N/A (Prediction)'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#030914] border border-cyan-950">
                  <span className="text-[10px] text-slate-400 block">Mean pLDDT Confidence</span>
                  <span className="text-sm font-bold text-cyan-400 font-mono">
                    {selectedTarget.alphafoldPlddtAvg ? `${selectedTarget.alphafoldPlddtAvg} / 100` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* 2D Chemical Canvas for small molecules */}
              {selectedTarget.smiles && (
                <div className="p-4 rounded-2xl bg-[#030914] border border-cyan-950 text-center space-y-2">
                  <span className="text-[11px] text-cyan-300 font-bold block">
                    2D Chemical Structure (SmilesDrawer Canvas)
                  </span>
                  <div className="flex justify-center items-center py-2">
                    <canvas
                      ref={smilesCanvasRef}
                      width={280}
                      height={240}
                      className="rounded-xl border border-cyan-950/80 bg-slate-950"
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono break-all px-2">
                    {selectedTarget.smiles}
                  </div>
                </div>
              )}

              {/* Active Sites / Functional Residues */}
              {selectedTarget.activeSites && selectedTarget.activeSites.length > 0 && (
                <div className="p-3 rounded-2xl bg-[#030914] border border-cyan-950 space-y-2">
                  <span className="text-[11px] text-cyan-300 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Key Catalytic &amp; Binding Residues:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTarget.activeSites.map((site, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-900 text-[11px] text-cyan-200">
                        {site}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Biological Function & Clinical Overview */}
          {activeInspectorTab === 'overview' && (
            <div className="space-y-4 text-xs font-mono anim-slide-up">
              <div className="p-4 rounded-2xl bg-[#030914] border border-cyan-950 space-y-2 leading-relaxed">
                <span className="text-[10px] text-cyan-400 uppercase tracking-wider block font-bold">
                  Biological &amp; Physiological Function
                </span>
                <p className="text-slate-300 font-sans text-sm">
                  {selectedTarget.functionSummary}
                </p>
              </div>

              {selectedTarget.organism && (
                <div className="p-3 rounded-xl bg-[#030914] border border-cyan-950 flex items-center justify-between">
                  <span className="text-slate-400">Host Organism:</span>
                  <span className="text-cyan-300 font-bold">{selectedTarget.organism}</span>
                </div>
              )}

              {selectedTarget.clinicalSignificance && (
                <div className="p-3 rounded-2xl bg-amber-950/20 border border-amber-900/40 space-y-1">
                  <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Pathology &amp; Clinical Significance
                  </span>
                  <p className="text-slate-300 font-sans text-xs">
                    {selectedTarget.clinicalSignificance}
                  </p>
                </div>
              )}

              {/* AlphaGenome Atlas Deep Link (Section 2.1 in SKILL.md) */}
              {selectedTarget.geneOrSymbol && (
                <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-400 font-bold block">
                      Google DeepMind AlphaGenome Atlas
                    </span>
                    <span className="text-slate-300 text-[11px]">
                      Inspect genomic variant impact and epigenomics for {selectedTarget.geneOrSymbol}
                    </span>
                  </div>
                  <a
                    href={`https://deepmind.google.com/science/alphagenome/atlas?q=${encodeURIComponent(selectedTarget.geneOrSymbol)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold transition"
                  >
                    <span>Atlas</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Amino Acid Sequence */}
          {activeInspectorTab === 'sequence' && (
            <div className="space-y-4 text-xs font-mono anim-slide-up">
              {selectedTarget.sampleSequence ? (
                <div className="p-4 rounded-2xl bg-[#030914] border border-cyan-950 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-300 font-bold">Canonical FASTA Sequence:</span>
                    <span className="text-slate-500">{selectedTarget.sampleSequence.length} Residues</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#02050e] border border-cyan-950/60 font-mono text-[11px] leading-relaxed text-slate-300 break-all max-h-64 overflow-y-auto select-all">
                    {selectedTarget.sampleSequence}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-normal">
                    * Amino acid residues can be queried for AlphaFold per-residue confidence scores. Click and select sequence to copy.
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-[#030914] border border-cyan-950 text-center text-slate-400">
                  This target is a small molecule ligand and does not have an amino acid sequence. See the Chemistry tab for SMILES and formula.
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Chemistry & Lipinski Drug-Likeness Rules (Section 3.1 in SKILL.md) */}
          {activeInspectorTab === 'properties' && (
            <div className="space-y-4 text-xs font-mono anim-slide-up">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#030914] border border-cyan-950">
                  <span className="text-[10px] text-slate-400 block">Molecular Weight</span>
                  <span className="text-sm font-bold text-cyan-300">
                    {selectedTarget.molecularWeight ? `${selectedTarget.molecularWeight.toFixed(2)} Da` : 'N/A'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#030914] border border-cyan-950">
                  <span className="text-[10px] text-slate-400 block">Chemical Formula</span>
                  <span className="text-sm font-bold text-emerald-300 font-mono">
                    {selectedTarget.formula || 'Biopolymer'}
                  </span>
                </div>
              </div>

              {selectedTarget.lipinski && (
                <div className="p-4 rounded-2xl bg-[#030914] border border-cyan-950 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300">Lipinski Rule of Five (Drug-Likeness):</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedTarget.lipinski.compliant ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-red-950 text-red-300'
                    }`}>
                      {selectedTarget.lipinski.compliant ? 'Rule-Compliant' : 'Violations'}
                    </span>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/60">
                      <span>Molecular Weight (&le; 500 Da)</span>
                      <span className={selectedTarget.lipinski.mwPass ? 'text-emerald-400' : 'text-red-400'}>
                        {selectedTarget.lipinski.mwPass ? 'PASS (< 500)' : 'FAIL'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/60">
                      <span>Lipophilicity LogP (&le; 5.0)</span>
                      <span className={selectedTarget.lipinski.logPPass ? 'text-emerald-400' : 'text-red-400'}>
                        {selectedTarget.lipinski.logP} ({selectedTarget.lipinski.logPPass ? 'PASS' : 'FAIL'})
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/60">
                      <span>Hydrogen Bond Donors (&le; 5)</span>
                      <span className={selectedTarget.lipinski.hbdPass ? 'text-emerald-400' : 'text-red-400'}>
                        {selectedTarget.lipinski.hbd} ({selectedTarget.lipinski.hbdPass ? 'PASS' : 'FAIL'})
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-slate-900/60">
                      <span>Hydrogen Bond Acceptors (&le; 10)</span>
                      <span className={selectedTarget.lipinski.hbaPass ? 'text-emerald-400' : 'text-red-400'}>
                        {selectedTarget.lipinski.hba} ({selectedTarget.lipinski.hbaPass ? 'PASS' : 'FAIL'})
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {selectedTarget.smiles && (
                <div className="p-3 rounded-2xl bg-[#030914] border border-cyan-950 space-y-1">
                  <span className="text-[10px] text-slate-400 block uppercase">Canonical SMILES String</span>
                  <div className="text-[11px] text-slate-300 font-mono break-all bg-slate-950 p-2 rounded border border-cyan-950 select-all">
                    {selectedTarget.smiles}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Direct Outbound Scientific Database Citations (Section 3.2 in SKILL.md) */}
          {activeInspectorTab === 'literature' && (
            <div className="space-y-3 text-xs font-mono anim-slide-up">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                Authoritative Database Records
              </span>

              {selectedTarget.pdbId && (
                <a
                  href={`https://www.rcsb.org/structure/${selectedTarget.pdbId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#030914] border border-cyan-950 hover:border-cyan-500 text-slate-200 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cyan-400">RCSB PDB</span>
                    <span className="text-slate-400">{selectedTarget.pdbId}</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                </a>
              )}

              {selectedTarget.uniprotId && (
                <a
                  href={`https://www.uniprot.org/uniprotkb/${selectedTarget.uniprotId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#030914] border border-cyan-950 hover:border-cyan-500 text-slate-200 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cyan-400">UniProtKB</span>
                    <span className="text-slate-400">{selectedTarget.uniprotId}</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                </a>
              )}

              {selectedTarget.uniprotId && (
                <a
                  href={`https://alphafold.ebi.ac.uk/entry/${selectedTarget.uniprotId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#030914] border border-cyan-950 hover:border-cyan-500 text-slate-200 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cyan-400">AlphaFold DB</span>
                    <span className="text-slate-400">AF-{selectedTarget.uniprotId}-F1</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                </a>
              )}

              {selectedTarget.pubchemCid && (
                <a
                  href={`https://pubchem.ncbi.nlm.nih.gov/compound/${selectedTarget.pubchemCid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#030914] border border-cyan-950 hover:border-cyan-500 text-slate-200 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cyan-400">PubChem Compound</span>
                    <span className="text-slate-400">CID: {selectedTarget.pubchemCid}</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                </a>
              )}

              <a
                href={`https://europepmc.org/search?query=${encodeURIComponent(selectedTarget.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-[#030914] border border-cyan-950 hover:border-cyan-500 text-slate-200 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-cyan-400">Europe PMC</span>
                  <span className="text-slate-400">Literature &amp; Preprints</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
