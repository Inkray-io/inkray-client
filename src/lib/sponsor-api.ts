/**
 * Sponsor API Client
 *
 * API client for Enoki sponsored transactions.
 * Allows users to create publications without paying gas fees.
 */

import { apiClient } from './api-client';

export interface CreateSponsoredTransactionRequest {
  /** Base64-encoded transaction kind bytes */
  transactionKindBytes: string;
  /** Sender wallet address */
  sender: string;
}

export interface CreateSponsoredTransactionResponse {
  /** Base64-encoded transaction bytes to sign */
  bytes: string;
  /** Transaction digest for execution */
  digest: string;
}

export interface ExecuteSponsoredTransactionRequest {
  /** Transaction digest from create step */
  digest: string;
  /** User signature of the transaction bytes */
  signature: string;
}

export interface ExecuteSponsoredTransactionResponse {
  /** Final transaction digest */
  digest: string;
  /** Transaction effects */
  effects: object;
  /** Object changes from the transaction */
  objectChanges: Array<{
    type: string;
    objectType?: string;
    objectId?: string;
    owner?: object;
  }>;
}

export interface SponsorStatusResponse {
  /** Whether sponsorship is available */
  available: boolean;
}

export const sponsorAPI = {
  /**
   * Check if sponsorship is available
   */
  getStatus: (): Promise<SponsorStatusResponse> => {
    return apiClient.get<SponsorStatusResponse>('/sponsor/status');
  },

  /**
   * Create a sponsored transaction for publication creation.
   * Requires authentication.
   */
  createSponsoredTransaction: (
    data: CreateSponsoredTransactionRequest
  ): Promise<CreateSponsoredTransactionResponse> => {
    return apiClient.post<CreateSponsoredTransactionResponse>(
      '/sponsor/publication/create',
      data
    );
  },

  /**
   * Execute a sponsored transaction.
   * Requires authentication.
   */
  executeSponsoredTransaction: (
    data: ExecuteSponsoredTransactionRequest
  ): Promise<ExecuteSponsoredTransactionResponse> => {
    return apiClient.post<ExecuteSponsoredTransactionResponse>(
      '/sponsor/publication/execute',
      data
    );
  },
};
