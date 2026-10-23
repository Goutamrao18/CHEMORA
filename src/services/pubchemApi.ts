/**
 * PubChem Science Intelligence API Client
 * Proxied through /api/science/element with client fallback to PubChem PUG REST
 */

export interface PubChemCompoundData {
  cid: number;
  properties?: {
    MolecularFormula?: string;
    MolecularWeight?: string | number;
    CanonicalSMILES?: string;
    InChIKey?: string;
    Complexity?: number;
    XLogP?: number;
    TPSA?: number;
    HBondDonorCount?: number;
    HBondAcceptorCount?: number;
  };
  structure2DUrl?: string;
  pubchemUrl?: string;
}

export interface PubChemElementResponse {
  element?: Record<string, any>;
  pubchemCompound?: PubChemCompoundData | null;
  source: string;
}

const memoryCache = new Map<string, PubChemElementResponse>();

export async function fetchPubChemElementData(query: string | number): Promise<PubChemElementResponse> {
  const cacheKey = String(query).toLowerCase().trim();
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  // 1. Try local Express server proxy first
  try {
    const res = await fetch(`/api/science/element?q=${encodeURIComponent(cacheKey)}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = (await res.json()) as PubChemElementResponse;
      memoryCache.set(cacheKey, data);
      return data;
    }
  } catch (proxyErr) {
    console.warn(`Local PubChem proxy not available for ${query}, falling back to direct PUG REST:`, proxyErr);
  }

  // 2. Client-side fallback directly to PubChem PUG REST
  try {
    const cidRes = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(String(query))}/cids/JSON`,
      { signal: AbortSignal.timeout(6000) }
    );
    let cid: number | undefined;
    if (cidRes.ok) {
      const cidData = await cidRes.json();
      cid = cidData?.IdentifierList?.CID?.[0];
    }

    let pubchemCompound: PubChemCompoundData | null = null;
    if (cid) {
      const propRes = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,InChIKey,Complexity,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount/JSON`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (propRes.ok) {
        const propData = await propRes.json();
        pubchemCompound = {
          cid,
          properties: propData?.PropertyTable?.Properties?.[0],
          structure2DUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG?image_size=300x300`,
          pubchemUrl: `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`,
        };
      }
    }

    const fallbackResult: PubChemElementResponse = {
      element: { Name: String(query) },
      pubchemCompound,
      source: 'Direct PubChem PUG REST',
    };
    memoryCache.set(cacheKey, fallbackResult);
    return fallbackResult;
  } catch (directErr) {
    console.error('Direct PubChem lookup failed:', directErr);
    return {
      element: { Name: String(query) },
      pubchemCompound: null,
      source: 'Local Fallback',
    };
  }
}
