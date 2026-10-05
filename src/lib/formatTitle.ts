interface TitleParams {
  status: string;
  serviceType?: string;
  isCensito?: boolean;
  accountCode?: string;
  contractCode?: string;
  clientName: string;
}

export function generateDynamicTitle({
  status,
  serviceType,
  accountCode,
  contractCode,
  clientName,
}: TitleParams): string {
  // 1. Prefisso per tipo pratica
  let typePrefix = '';
  if (serviceType === 'NUOVO_CONTRATTO') typePrefix = 'NUOVO';
  else if (serviceType === 'RINEGOZIAZIONE') typePrefix = 'RINEGO';
  else if (serviceType === 'DISDETTA') typePrefix = 'DISDETTA';

  // 2. Prefisso per stato (es. WON / COMPLETATO)
  let statusPrefix = '';
  if (status === 'WON') statusPrefix = '[WON] ';
  else if (status === 'COMPLETED') statusPrefix = '[OK] ';

  // 3. Codice di riferimento (Contratto o Account)
  const codeStr = contractCode ? ` (${contractCode})` : accountCode ? ` [Acc: ${accountCode}]` : '';

  // Esempio risultato: "[WON] RINEGO - Condominio Roma 15 (10161874)"
  const mainTag = typePrefix ? `${typePrefix} - ` : '';
  return `${statusPrefix}${mainTag}${clientName}${codeStr}`;
}