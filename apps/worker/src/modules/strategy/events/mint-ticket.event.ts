export const TICKET_MINT_EVENT = 'TicketMint';

export type TicketMintEventPayload = {
  user: string;
  ticketIds: string[];
};
