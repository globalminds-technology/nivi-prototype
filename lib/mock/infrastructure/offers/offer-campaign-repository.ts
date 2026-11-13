import type { OfferCampaign } from "../../core/domain/entities/offer-campaign";
import { MOCK_OFFER_CAMPAIGNS } from "../../data/mock-catalog";

class OfferCampaignRepository {
  private campaigns: OfferCampaign[] = [...MOCK_OFFER_CAMPAIGNS];

  async list(): Promise<OfferCampaign[]> {
    return [...this.campaigns];
  }

  async get(id: string): Promise<OfferCampaign | null> {
    return this.campaigns.find((c) => c.id === id) ?? null;
  }

  async getById(id: string): Promise<OfferCampaign | null> {
    return this.get(id);
  }

  async save(campaign: OfferCampaign): Promise<OfferCampaign> {
    const idx = this.campaigns.findIndex((c) => c.id === campaign.id);
    if (idx >= 0) {
      this.campaigns[idx] = campaign;
    } else {
      this.campaigns.push(campaign);
    }
    return campaign;
  }
}

export const offerCampaignRepository = new OfferCampaignRepository();
