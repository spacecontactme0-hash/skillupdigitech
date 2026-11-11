import {
  DEFAULT_ONSITE_TRAINING_CONFIG,
  onsiteTrainingConfigSchema,
  type OnsiteTrainingConfig,
} from "@/lib/onsite-training-shared"
import { isPostgresBackend } from "@/lib/db"
import { getPostgresDatabase } from "@/lib/postgres-db"

const SETTINGS_DOC_ID = "onsite_training_settings"

type GlobalSettings = typeof globalThis & {
  _onsiteTrainingConfigCache?: OnsiteTrainingConfig
}

const globalWithSettings = globalThis as GlobalSettings

async function loadFromDb(): Promise<OnsiteTrainingConfig | null> {
  if (isPostgresBackend()) {
    const pg = getPostgresDatabase()
    const data = await pg.getAppSettings<OnsiteTrainingConfig>(SETTINGS_DOC_ID)
    if (!data) return null
    const parsed = onsiteTrainingConfigSchema.safeParse(data)
    return parsed.success ? parsed.data : null
  }

  return null
}

async function saveToDb(settings: OnsiteTrainingConfig): Promise<void> {
  if (isPostgresBackend()) {
    const pg = getPostgresDatabase()
    await pg.setAppSettings(SETTINGS_DOC_ID, settings)
    return
  }
}

export async function getOnsiteTrainingConfig(): Promise<OnsiteTrainingConfig> {
  try {
    const dbSettings = await loadFromDb()
    if (dbSettings) return dbSettings
  } catch {
    // Fall back to in-memory/default settings.
  }

  if (!globalWithSettings._onsiteTrainingConfigCache) {
    globalWithSettings._onsiteTrainingConfigCache = { ...DEFAULT_ONSITE_TRAINING_CONFIG }
  }

  return globalWithSettings._onsiteTrainingConfigCache
}

export async function updateOnsiteTrainingConfig(nextSettings: OnsiteTrainingConfig): Promise<OnsiteTrainingConfig> {
  const parsed = onsiteTrainingConfigSchema.parse(nextSettings)
  globalWithSettings._onsiteTrainingConfigCache = parsed

  try {
    await saveToDb(parsed)
  } catch {
    // Keep in-memory value even if persistence fails.
  }

  return parsed
}
