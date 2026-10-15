import knowledgeJson from './knowledgeData.json';

export interface KnowledgeItem {
  id: string;
  name: string;
  category: string;
  tag: string;
  description: string;
  image?: string;
  formula?: string;
  formulaName?: string;
  info: string;
  isChemical?: boolean;
}

export const KNOWLEDGE_ITEMS: KnowledgeItem[] = knowledgeJson as KnowledgeItem[];
