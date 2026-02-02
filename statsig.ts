import Statsig from "statsig-node";
import { TeladocUser } from "./teladoc-user";
import { DataStore } from "./statsig/dataStore";

export interface ITeladocRolloutOptions {
  token: string;
  environment?: { tier: string };
  localMode?: boolean;
}

export class TeladocStatsig {
  private defaultUserInstance: TeladocUser | null = null;
  public ready: Promise<any>;

  constructor(options: ITeladocRolloutOptions, cache?: any) {
    const statsigOptions: any = {
      environment: options.environment,
      localMode: options.localMode || false,
    };

    if (cache) {
      statsigOptions.dataAdapter = new DataStore(cache);
    }

    this.ready = Statsig.initialize(options.token, statsigOptions);
  }

  /**
   * Dynamic Config / Param Store
   * @param configName - The ID of the config in Statsig console
   * @param user - The user object
   * @param parameterKey - (Optional) Specific key to fetch from the config
   */
  public async getConfig(configName: string, user?: any, parameterKey?: string): Promise<any> {
    await this.ready;

    const sUser = this.getStatsigUser(user);
    const config = await Statsig.getConfig(sUser, configName);

    // 🔍 DEBUGGING: Print what Statsig actually returned for this user
    console.log(`[Statsig Debug] Config: ${configName} | User: ${sUser.userID}`);
    console.log(`[Statsig Debug] Full Value:`, config.value);

    if (parameterKey) {
      // If 'config.value' is empty {}, this will safely return null
      const val = config.get(parameterKey, null);
      if (val === null) {
        console.warn(`⚠️ Key '${parameterKey}' not found in config '${configName}'`);
      }
      return val;
    }

    return config.value;
  }

  /**
   * Feature Gate
   */
  public async checkGate(gateName: string, user?: any): Promise<boolean> {
    await this.ready;
    const sUser = this.getStatsigUser(user);
    return Statsig.checkGate(sUser, gateName);
  }

  private getStatsigUser(user?: any) {
    if (user) {
      return TeladocUser.build(user).toStatsig();
    }
    return this.defaultUser.toStatsig();
  }

  private get defaultUser(): TeladocUser {
    if (!this.defaultUserInstance) {
      this.defaultUserInstance = new TeladocUser();
    }
    return this.defaultUserInstance;
  }
}
