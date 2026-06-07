import axios from 'axios';
import { config } from '../config/index.js';

export class MuleRunService {
  private static readonly BASE_URL = 'https://api.mulerun.com/v1'; // Standard platform gateway

  /**
   * Executes or registers an action via the MuleRun Agent network
   */
  public static async triggerAgentWorkflow(
    agentId: string,
    action: string,
    payload: Record<string, any>
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${this.BASE_URL}/agents/${agentId}/execute`,
        {
          action,
          payload,
          timestamp: Date.now()
        },
        {
          headers: {
            'Authorization': `Bearer ${config.MULERUN_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        return response.data;
      }
      throw new Error('Empty response received from MuleRun Gateway');
    } catch (error: any) {
      console.error('[MuleRun Engine Error]:', error.response?.data || error.message);
      throw error;
    }
  }
}