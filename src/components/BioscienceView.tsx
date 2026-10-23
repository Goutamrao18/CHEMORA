import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { playSoftClick, playSuccessChime } from '../utils/soundEffects';

interface BioscienceViewProps {
  onAskAI?: (topic: string) => void;
  initialQuery?: string;
  isStandaloneFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export type MoleculeCategory = 'protein' | 'drug' | 'metabolite' | 'nucleic';

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
    clinicalSignificance: 'Over 50% of human cancers feature somatic missense mutations in TP53 core DNA-binding domain (Li-Fraumeni syndrome).'
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
    clinicalSignificance: 'Pathogenic germline variants drastically elevate lifetime risk for hereditary breast and ovarian cancer (HBOC).'
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
    clinicalSignificance: 'Key target for targeted oncology inhibitors (Erlotinib, Gefitinib, Osimertinib) in non-small cell lung carcinoma.'
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
    clinicalSignificance: 'Essential therapy for Type 1 Diabetes Mellitus and advanced Type 2 Diabetes; historical landmark in structural biology.'
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
    clinicalSignificance: 'Glu6Val substitution causes Sickle Cell Anemia (HbS) polymerizing under hypoxia; locus of beta-thalassemia variants.'
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
    clinicalSignificance: 'Revolutionized chronic myeloid leukemia (CML) and gastrointestinal stromal tumors (GIST) prognosis.'
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
    clinicalSignificance: 'Cardioprotective secondary prophylaxis for myocardial infarction and ischemic stroke.'
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
    clinicalSignificance: 'Most widely consumed psychoactive substance globally; used clinically for neonatal apnea.'
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
    clinicalSignificance: 'Golden-standard antimicrobial for Treponema pallidum (syphilis), Streptococcus pneumoniae, and Listeria monocytogenes.'
  }
];

export const BioscienceView: React.FC<BioscienceViewProps> = ({
  onAskAI,
  initialQuery = 'TP53',
  isStandaloneFullscreen = false,
  onToggleFullscreen
}) => {
  const [selectedTarget, setSelectedTarget] = useState<BioscienceTarget>(PRESET_TARGETS[0]);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'overview' | 'structure3d' | 'sequence' | 'properties' | 'literature'>('structure3d');
  
  // 3Dmol viewer state
  const viewerContainerRef = useRef<HTMLDivElement | null>(null);
  const viewer3DRef = useRef<any>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [renderStyle, setRenderStyle] = useState<'cartoon' | 'stick' | 'sphere' | 'surface'>('cartoon');
  const [colorScheme, setColorScheme] = useState<'plddt' | 'spectrum' | 'chain' | 'secondary'>('plddt');
  const [isSpinning, setIsSpinning] = useState(false);
  const [canvasBgDark, setCanvasBgDark] = useState(true);
  
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

  // Initialize or re-render 3Dmol viewer
  const render3DStructure = useCallback(async (target: BioscienceTarget) => {
    if (!viewerContainerRef.current) return;
    setViewerLoading(true);
    setViewerError(null);

    try {
      const $3Dmol = await import('3dmol');
      
      // Clean previous viewer if any
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

      let structureLoaded = false;

      // 1. If target is a small molecule with PubChem CID, fetch 3D SDF conformer
      if (target.pubchemCid) {
        try {
          const sdfUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${target.pubchemCid}/SDF?record_type=3d`;
          const res = await fetch(sdfUrl);
          if (res.ok) {
            const sdfData = await res.text();
            viewer.addModel(sdfData, 'sdf');
            viewer.setStyle({}, {
              stick: { radius: 0.22, colorscheme: 'Jmol' },
              sphere: { scale: 0.28, colorscheme: 'Jmol' }
            });
            viewer.zoomTo();
            viewer.render();
            structureLoaded = true;
          }
        } catch (cidErr) {
          console.warn('PubChem 3D conformer fetch error:', cidErr);
        }
      }

      // 2. If target has PDB ID, fetch high-resolution mmCIF coordinate
      if (!structureLoaded && target.pdbId) {
        try {
          const cifUrl = `https://files.rcsb.org/download/${target.pdbId.toUpperCase()}.cif`;
          const res = await fetch(cifUrl);
          if (res.ok) {
            const cifData = await res.text();
            viewer.addModel(cifData, 'cif');
            applyViewerStyle(viewer, renderStyle, colorScheme);
            viewer.zoomTo();
            viewer.render();
            structureLoaded = true;
          }
        } catch (pdbErr) {
          console.warn('RCSB mmCIF fetch note:', pdbErr);
        }
      }

      // 3. If target has UniProt ID and PDB was not loaded, fetch AlphaFold DB prediction
      if (!structureLoaded && target.uniprotId) {
        try {
          const metaRes = await fetch(`https://alphafold.ebi.ac.uk/api/prediction/${target.uniprotId.toUpperCase()}`);
          let cifUrl = `https://alphafold.ebi.ac.uk/files/AF-${target.uniprotId.toUpperCase()}-F1-model_v6.cif`;
          if (metaRes.ok) {
            const meta = await metaRes.json();
            if (meta?.[0]?.cifUrl) {
              cifUrl = meta[0].cifUrl;
            }
          }

          const cifRes = await fetch(cifUrl);
          if (cifRes.ok) {
            const cifData = await cifRes.text();
            viewer.addModel(cifData, 'cif');
            applyViewerStyle(viewer, renderStyle, colorScheme);
            viewer.zoomTo();
            viewer.render();
            structureLoaded = true;
          }
        } catch (afErr) {
          console.warn('AlphaFold DB fetch note:', afErr);
        }
      }

      if (!structureLoaded) {
        setViewerError(`3D Coordinates temporarily streaming or cached locally. Check the 2D Chemical Diagram or Overview panel.`);
      }
    } catch (err: any) {
      console.error('3Dmol render error:', err);
      setViewerError(err?.message || 'Unable to initialize WebGL 3Dmol viewer.');
    } finally {
      setViewerLoading(false);
    }
  }, [canvasBgDark, renderStyle, colorScheme]);

  // Apply styling and color functions
  const applyViewerStyle = (viewer: any, style: string, color: string) => {
    if (!viewer) return;

    // AlphaFold pLDDT Confidence Color Function (Section 1.3 of SKILL.md)
    const plddtColorFunc = (atom: any) => {
      const b = atom.b !== undefined ? atom.b : 80;
      if (b > 90) return '#0053D6'; // Very high (>90): Deep Blue
      if (b > 70) return '#65CBF3'; // Confident (70-90): Light Blue
      if (b > 50) return '#FFDB13'; // Low (50-70): Yellow
      return '#FF7D45';             // Very low (<50): Orange
    };

    let styleObj: any = {};
    if (style === 'cartoon') {
      if (color === 'plddt') {
        styleObj = { cartoon: { colorfunc: plddtColorFunc, thickness: 0.4 } };
      } else if (color === 'spectrum') {
        styleObj = { cartoon: { color: 'spectrum' } };
      } else if (color === 'chain') {
        styleObj = { cartoon: { colorscheme: 'chain' } };
      } else {
        styleObj = { cartoon: { colorscheme: 'ssPyMOL' } };
      }
    } else if (style === 'stick') {
      styleObj = { stick: { radius: 0.2, colorscheme: 'Jmol' } };
    } else if (style === 'sphere') {
      styleObj = { sphere: { scale: 0.8, colorscheme: 'Jmol' } };
    } else if (style === 'surface') {
      styleObj = { cartoon: { color: '#38bdf8', opacity: 0.6 } };
    }

    viewer.setStyle({}, styleObj);

    // If surface selected, generate transparent surface
    if (style === 'surface') {
      try {
        viewer.removeAllSurfaces();
        viewer.addSurface('MS', { opacity: 0.75, color: '#0ea5e9' });
      } catch {}
    } else {
      try {
        viewer.removeAllSurfaces();
      } catch {}
    }

    viewer.render();
  };

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
        const pdbRes = await fetch(`https://data.rcsb.org/rest/v1/core/entry/${pdbId.toLowerCase()}`);
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
              <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-900/90 border border-cyan-900/80 text-xs font-mono text-slate-300 flex items-start gap-2 z-10">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>{viewerError}</span>
              </div>
            )}

            {/* In-Canvas Provenance Watermark */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-cyan-900/50 text-[10px] font-mono text-cyan-300 pointer-events-none">
              {selectedTarget.pdbId ? `PDB: ${selectedTarget.pdbId}` : `AFDB: ${selectedTarget.uniprotId || 'SMILES'}`}
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
                        applyViewerStyle(viewer3DRef.current, style, colorScheme);
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
                  { id: 'plddt', label: 'pLDDT' },
                  { id: 'spectrum', label: 'Spectrum' },
                  { id: 'chain', label: 'Chain' },
                  { id: 'secondary', label: 'Sec. Struct' }
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setColorScheme(c.id as any);
                      if (viewer3DRef.current) {
                        applyViewerStyle(viewer3DRef.current, renderStyle, c.id);
                      }
                      playSoftClick();
                    }}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-mono transition ${
                      colorScheme === c.id
                        ? 'bg-cyan-500 text-slate-950 font-black'
                        : 'bg-slate-900 text-slate-400 border border-cyan-950 hover:text-white'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AlphaFold Canonical 4-Band Confidence Scale (Mandatory Section 1.3 & 3.1 in SKILL.md) */}
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
