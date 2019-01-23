import {flags} from '@oclif/command'
import cli from 'cli-ux'

import {OptimizelyClientCommand} from '../OptimizelyClientCommand'

export default class Activate extends OptimizelyClientCommand {
  static description = 'activates an experiment impression'

  static flags = {
    ...OptimizelyClientCommand.flags,
    user: flags.string({
      char: 'u',
      required: true
    }),
    experiment: flags.string({
      char: 'x',
      required: true,
    }),
  }

  async run() {
    const {flags} = this.parse(Activate)

    const opti = await this.optimizelyClient()

    cli.action.start('Performing activate')

    const decision = opti.activate(
      flags.experiment,
      flags.user,
      this.userAttributes
    )

    cli.action.stop()

    cli.styledHeader('Result')
    cli.styledJSON(decision)
  }

  get userAttributes(): { [k: string]: string } {
    return {}
  }
}
