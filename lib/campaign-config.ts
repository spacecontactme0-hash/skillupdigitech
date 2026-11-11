import {
  buildDefaultCampaignConfig,
  campaignConfigSchema,
  DEFAULT_CAMPAIGN_CONFIG,
  type CampaignConfig,
} from "@/lib/campaign-shared"
import { isPostgresBackend } from "@/lib/db"
import { getPostgresDatabase } from "@/lib/postgres-db"

const SETTINGS_DOC_ID = "campaign_promptcare_academy_settings"

type GlobalSettings = typeof globalThis & {
  _campaignConfigCache?: CampaignConfig
}

const globalWithSettings = globalThis as GlobalSettings

async function loadFromDb(): Promise<CampaignConfig | null> {
  if (isPostgresBackend()) {
    const pg = getPostgresDatabase()
    const data = await pg.getAppSettings<CampaignConfig>(SETTINGS_DOC_ID)
    if (!data) return null
    const parsed = campaignConfigSchema.safeParse({ ...buildDefaultCampaignConfig(), ...data })
    return parsed.success ? parsed.data : null
  }

  return null
}

async function saveToDb(settings: CampaignConfig): Promise<void> {
  if (isPostgresBackend()) {
    const pg = getPostgresDatabase()
    await pg.setAppSettings(SETTINGS_DOC_ID, settings)
    return
  }
}

export async function getCampaignConfig(): Promise<CampaignConfig> {
  try {
    const dbSettings = await loadFromDb()
    if (dbSettings) {
      globalWithSettings._campaignConfigCache = dbSettings
      return dbSettings
    }
  } catch {
    // Fall back to in-memory/default settings.
  }

  if (!globalWithSettings._campaignConfigCache) {
    globalWithSettings._campaignConfigCache = { ...DEFAULT_CAMPAIGN_CONFIG }
  }

  return globalWithSettings._campaignConfigCache
}

export async function updateCampaignConfig(nextSettings: CampaignConfig): Promise<CampaignConfig> {
  const parsed = campaignConfigSchema.parse(nextSettings)
  globalWithSettings._campaignConfigCache = parsed

  try {
    await saveToDb(parsed)
  } catch {
    // Keep in-memory value even if persistence fails.
  }

  return parsed
}
