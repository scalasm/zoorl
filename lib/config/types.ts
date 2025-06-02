/**
 * Supported environment stages.
 */
export const enum Stage {
  develop = 'develop',
  staging = 'staging',
  prod = 'prod'
}

/**
 * Convert the stage name to a known stage.
 * If the stage is not known, that we assume it will be an ephemeral environment
 * @param stage input stage name (usually from the environment variable STAGE)
 * @returns the stage name
 */
export function getStage(stage: string): string {
  switch (stage) {
    case Stage.prod:
      return Stage.prod;
    case Stage.staging:
      return Stage.staging;
    default:
      return stage; // return the ephemeral environment if not known (i.e. pr-123)
  }
}

/**
 * Supported AWS regions for the application.
 */
export const enum Region {
  dublin = 'eu-west-1',
  london = 'eu-west-2',
  frankfurt = 'eu-central-1',
}
