import cli from 'cli-ux'

import {OptimizelyClientCommand} from '../OptimizelyClientCommand'

export default class Datafile extends OptimizelyClientCommand {
  static description = 'fetches datafile'

  static flags = {
    ...OptimizelyClientCommand.flags,
  }

  async run() {
    const datafile = await this.fetchDatafile()
    cli.styledJSON(datafile)

    const optimizely = await this.optimizelyClient()
  }
}
